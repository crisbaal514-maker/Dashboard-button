/**
 * POST /v1/devices/:deviceId/events — Request
 * Used to report device-level events (button press, error, etc.).
 */
export interface EventRequest {
  /** Event type identifier */
  eventType: string;

  /** Event payload (opaque JSON) */
  payload?: Record<string, unknown>;

  /** Event timestamp (ISO 8601). Server uses received_at if omitted. */
  timestamp?: string;
}

/**
 * Known event types
 */
export const EventTypes = {
  BUTTON_PRESS: 'button_press',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  STARTUP: 'startup',
  SHUTDOWN: 'shutdown',
} as const;
