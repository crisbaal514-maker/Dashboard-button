#include "CommandDispatcher.h"
#include "core/Logger.h"
#include "core/Constants.h"
#include "storage/StorageManager.h"

#include <esp_system.h>
#include <esp_heap_caps.h>
#include <nvs_flash.h>

// Tabla de handlers — ordenada por tipo
// Agregar nuevos comandos aquí sin modificar CloudClient
const CommandDispatcher::CommandEntry CommandDispatcher::_handlers[] = {
    { "restart",        &CommandDispatcher::handleRestart },
    { "ping",           &CommandDispatcher::handlePing },
    { "factoryReset",   &CommandDispatcher::handleFactoryReset },
    // Futuros comandos se agregan aquí:
    // { "displayMessage", &CommandDispatcher::handleDisplayMessage },
    // { "setBrightness",  &CommandDispatcher::handleSetBrightness },
};

const size_t CommandDispatcher::_handlerCount =
    sizeof(CommandDispatcher::_handlers) / sizeof(CommandDispatcher::_handlers[0]);

CommandDispatcher::CommandDispatcher() {
}

CommandStatus CommandDispatcher::execute(const Command& cmd, char* result, size_t resultSize) {
    Logger log;

    char buf[96];
    snprintf(buf, sizeof(buf), "Executing command: type=%s id=%s", cmd.type, cmd.id);
    log.info("CmdDisp", buf);

    // Buscar handler por tipo
    for (size_t i = 0; i < _handlerCount; i++) {
        if (strcmp(cmd.type, _handlers[i].type) == 0) {
            CommandHandler handler = _handlers[i].handler;
            return (this->*handler)(cmd, result, resultSize);
        }
    }

    // Tipo desconocido
    return handleUnknown(cmd, result, resultSize);
}

CommandStatus CommandDispatcher::handleRestart(const Command& cmd, char* result, size_t resultSize) {
    (void)cmd;
    Logger log;
    log.info("CmdDisp", "RESTART command received — rebooting in 1s");

    // Preparar resultado
    snprintf(result, resultSize, "{\"rebooting\":true}");

    // Retraso para que el ACK pueda enviarse antes de reiniciar
    delay(1000);

    // Reiniciar ESP32
    ESP.restart();

    // No debería llegar aquí, pero por si acaso
    return CommandStatus::COMPLETED;
}

CommandStatus CommandDispatcher::handlePing(const Command& cmd, char* result, size_t resultSize) {
    (void)cmd;
    unsigned long uptime = millis() / 1000;  // segundos
    uint32_t freeHeap = esp_get_free_heap_size();

    snprintf(result, resultSize,
        "{\"pong\":true,\"uptime\":%lu,\"freeHeap\":%lu}",
        (unsigned long)uptime,
        (unsigned long)freeHeap);

    Logger log;
    char buf[64];
    snprintf(buf, sizeof(buf), "PING -> pong uptime=%lu", (unsigned long)uptime);
    log.info("CmdDisp", buf);

    return CommandStatus::COMPLETED;
}

CommandStatus CommandDispatcher::handleFactoryReset(const Command& cmd, char* result, size_t resultSize) {
    (void)cmd;
    Logger log;
    log.warn("CmdDisp", "FACTORY RESET command received");

    // Limpiar NVS
    StorageManager::getInstance().clear();
    nvs_flash_erase();
    nvs_flash_init();

    snprintf(result, resultSize, "{\"factoryReset\":true}");

    delay(500);

    ESP.restart();

    return CommandStatus::COMPLETED;
}

CommandStatus CommandDispatcher::handleUnknown(const Command& cmd, char* result, size_t resultSize) {
    Logger log;

    char buf[64];
    snprintf(buf, sizeof(buf), "Unknown command type: %s", cmd.type);
    log.warn("CmdDisp", buf);

    snprintf(result, resultSize, "{\"error\":\"Unknown command type: %s\"}", cmd.type);

    return CommandStatus::REJECTED;
}

void CommandDispatcher::buildAckPayload(
    const char* commandId,
    CommandStatus status,
    const char* result,
    const char* error,
    char* buffer,
    size_t bufsize
) {
    const char* statusStr = commandStatusToString(status);

    if (error != nullptr && strlen(error) > 0) {
        // Con error (FAILED o REJECTED)
        snprintf(buffer, bufsize,
            "{\"commandId\":\"%s\",\"status\":\"%s\",\"result\":null,\"error\":\"%s\"}",
            commandId, statusStr, error);
    } else if (result != nullptr && strlen(result) > 0) {
        // Con resultado (COMPLETED)
        snprintf(buffer, bufsize,
            "{\"commandId\":\"%s\",\"status\":\"%s\",\"result\":%s,\"error\":null}",
            commandId, statusStr, result);
    } else {
        // Sin resultado ni error
        snprintf(buffer, bufsize,
            "{\"commandId\":\"%s\",\"status\":\"%s\",\"result\":null,\"error\":null}",
            commandId, statusStr);
    }
}
