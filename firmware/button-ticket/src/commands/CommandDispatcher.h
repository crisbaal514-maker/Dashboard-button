#pragma once

#include <Arduino.h>
#include "commands/Command.h"
#include "commands/CommandStatus.h"
#include "cloud/Transport.h"

// ===========================================
// CommandDispatcher — Ejecuta comandos remotos
// ===========================================
// CloudClient no conoce tipos de comandos.
// Solo pasa el JSON a CommandDispatcher.
//
// Handlers conocidos hoy:
//   restart        → ESP.restart()
//   ping           → ACK con uptime
//   factoryReset   → Borra NVS + restart
//   displayMessage → Reservado
//   setBrightness  → Reservado
//   *              → REJECTED
// ===========================================

class CommandDispatcher {
public:
    CommandDispatcher();

    /**
     * Ejecutar un comando.
     * @param cmd  Comando a ejecutar
     * @param result  Buffer para resultado (JSON)
     * @param resultSize  Tamaño del buffer
     * @return CommandStatus final (COMPLETED, FAILED o REJECTED)
     */
    CommandStatus execute(const Command& cmd, char* result, size_t resultSize);

    /**
     * Generar body JSON para el ACK.
     * @param commandId  ID del comando
     * @param status  Estado final
     * @param result  Resultado (JSON string) o nullptr
     * @param error  Mensaje de error o nullptr
     * @param buffer  Buffer de salida
     * @param bufsize  Tamaño del buffer
     */
    static void buildAckPayload(
        const char* commandId,
        CommandStatus status,
        const char* result,
        const char* error,
        char* buffer,
        size_t bufsize
    );

private:
    // Handlers individuales
    CommandStatus handleRestart(const Command& cmd, char* result, size_t resultSize);
    CommandStatus handlePing(const Command& cmd, char* result, size_t resultSize);
    CommandStatus handleFactoryReset(const Command& cmd, char* result, size_t resultSize);
    CommandStatus handleUnknown(const Command& cmd, char* result, size_t resultSize);

    // Helper: buscar handler por tipo
    typedef CommandStatus (CommandDispatcher::*CommandHandler)(
        const Command& cmd, char* result, size_t resultSize);

    struct CommandEntry {
        const char* type;
        CommandHandler handler;
    };

    static const CommandEntry _handlers[];
    static const size_t _handlerCount;
};
