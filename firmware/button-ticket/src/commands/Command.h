#pragma once

#include <Arduino.h>
#include "commands/CommandStatus.h"

// ===========================================
// Command — Estructura genérica de comando
// ===========================================
// Representa un comando recibido del servidor.
// El payload es un string JSON que se pasa sin
// interpretar — cada tipo de comando lo parsea a su manera.
// ===========================================

struct Command {
    char id[40];                // UUID v4 del comando
    char type[32];              // "restart", "ping", etc.
    char payload[512];          // JSON payload (puede ser "{}")
    size_t payloadLength;       // Longitud real del payload

    // Resetear a valores por defecto
    void clear() {
        id[0] = '\0';
        type[0] = '\0';
        payload[0] = '\0';
        payloadLength = 0;
    }

    // Verificar si el comando está vacío
    bool isEmpty() const {
        return id[0] == '\0' || type[0] == '\0';
    }
};
