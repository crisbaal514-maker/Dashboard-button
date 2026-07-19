#pragma once

// ===========================================
// CommandStatus — Enum compartido con backend
// ===========================================
// Debe coincidir EXACTAMENTE con CommandStatus en TypeScript.
//
// Ciclo de vida:
//   PENDING    → Creado en el servidor
//   DELIVERED  → Recibido por el dispositivo
//   EXECUTING  → El dispositivo empezó a ejecutar
//   COMPLETED  → Ejecución exitosa
//   FAILED     → Error al ejecutar
//   REJECTED   → Tipo de comando desconocido
// ===========================================

enum class CommandStatus {
    PENDING    = 0,
    DELIVERED  = 1,
    EXECUTING  = 2,
    COMPLETED  = 3,
    FAILED     = 4,
    REJECTED   = 5
};

// Helper: convertir CommandStatus a string para JSON
inline const char* commandStatusToString(CommandStatus status) {
    switch (status) {
        case CommandStatus::PENDING:    return "pending";
        case CommandStatus::DELIVERED:  return "delivered";
        case CommandStatus::EXECUTING:  return "executing";
        case CommandStatus::COMPLETED:  return "completed";
        case CommandStatus::FAILED:     return "failed";
        case CommandStatus::REJECTED:   return "rejected";
        default:                        return "unknown";
    }
}
