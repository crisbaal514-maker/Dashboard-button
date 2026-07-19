/**
 * POST /v1/devices/commands/{commandId}/ack — Request
 *
 * El dispositivo envía el ACK después de ejecutar (o intentar ejecutar) un comando.
 *
 * Ejemplos:
 *   { "status": "completed", "result": { "pong": true, "uptime": 123456 } }
 *   { "status": "failed",    "error": "Unable to restart" }
 *   { "status": "rejected",  "error": "Unknown command" }
 */
export interface AckCommandRequest {
  /** Estado final del comando */
  status: 'completed' | 'failed' | 'rejected';

  /** Resultado opcional (JSON) — por ejemplo ping response */
  result?: Record<string, unknown>;

  /** Mensaje de error (requerido si status = failed o rejected) */
  error?: string;
}
