/**
 * POST /v1/devices/{deviceId}/commands — Request
 *
 * Crea un nuevo comando para un dispositivo.
 *
 * Ejemplos:
 *   { "type": "restart", "payload": {} }
 *   { "type": "ping", "payload": {} }
 *   { "type": "displayMessage", "payload": { "text": "Hola" } }
 *   { "type": "setBrightness", "payload": { "value": 80 } }
 */
export interface CreateCommandRequest {
  /** Tipo de comando (ej: "restart", "ping", "displayMessage") */
  type: string;

  /** Payload genérico — cada tipo de comando define su propio schema */
  payload?: Record<string, unknown>;

  /** Prioridad (mayor número = mayor prioridad) */
  priority?: number;
}
