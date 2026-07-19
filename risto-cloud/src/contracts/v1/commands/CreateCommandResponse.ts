import type { CommandStatus } from './CommandStatus.js';

/**
 * POST /v1/devices/{deviceId}/commands — Response
 */
export interface CreateCommandResponse {
  id: string;
  deviceId: string;
  type: string;
  payload: Record<string, unknown>;
  status: CommandStatus;
  priority: number;
  createdAt: string;
}
