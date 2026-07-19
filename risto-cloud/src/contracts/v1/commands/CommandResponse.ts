/**
 * POST /v1/devices/:deviceId/commands — Response (200 OK)
 * Lists pending commands for the device.
 */
export interface CommandResponse {
  /** Array of pending commands */
  commands: PendingCommand[];
}

export interface PendingCommand {
  /** Command unique identifier */
  commandId: string;

  /** Command type (e.g., "reboot", "update_config", "ota_update") */
  type: string;

  /** Command payload */
  payload: Record<string, unknown>;

  /** Command creation timestamp */
  createdAt: string;

  /** Command priority (higher = more urgent) */
  priority: number;
}
