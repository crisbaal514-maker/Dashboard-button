/**
 * POST /v1/devices/:deviceId/commands — Request
 * Sent by the device to acknowledge or request pending commands.
 */
export interface CommandRequest {
  /** Acknowledge a specific command by ID */
  ackCommandId?: string;

  /** Command result/status */
  commandResult?: {
    commandId: string;
    status: 'success' | 'failure' | 'timeout';
    message?: string;
  };
}
