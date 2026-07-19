/**
 * POST /v1/devices/heartbeat — Response (200 OK)
 *
 * Siempre devuelve 200 OK con pendingCommands (puede ser array vacío).
 * El dispositivo usa pendingCommands para recibir órdenes de la nube.
 */
export interface HeartbeatResponse {
  /** Server status */
  status: 'ok' | 'stale' | 'unknown';

  /** Suggested next heartbeat interval in milliseconds */
  nextHeartbeatIn: number;

  /** Server timestamp (ISO 8601) */
  serverTime: string;

  /** Comandos pendientes para el dispositivo (array vacío si no hay) */
  pendingCommands: HeartbeatCommand[];
}

/**
 * Comando pendiente incluido en el heartbeat.
 */
export interface HeartbeatCommand {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}
