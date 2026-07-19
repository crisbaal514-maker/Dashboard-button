import type { CommandStatus } from '../../contracts/v1/commands/CommandStatus.js';

/**
 * CommandStatus como tipo literal para la DB.
 * Mapea 1:1 con CommandStatus enum.
 */
export type CommandStatusType = `${CommandStatus}`;

export interface CommandRow {
  id: string;
  deviceId: string;
  type: string;
  payload: Record<string, unknown>;
  status: CommandStatusType;
  priority: number;
  error: string | null;
  result: Record<string, unknown> | null;
  createdAt: string;
  deliveredAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CreateCommandInput {
  id: string;
  deviceId: string;
  type: string;
  payload?: Record<string, unknown>;
  priority?: number;
}

/**
 * Input para marcar un comando como entregado.
 */
export interface MarkDeliveredInput {
  deliveredAt: string;
}

/**
 * Input para procesar un ACK del dispositivo.
 */
export interface ProcessAckInput {
  status: 'completed' | 'failed' | 'rejected';
  result?: Record<string, unknown> | null;
  error?: string | null;
  completedAt: string;
}

export interface ICommandRepository {
  create(input: CreateCommandInput): CommandRow;
  findById(id: string): CommandRow | undefined;
  findPendingByDeviceId(deviceId: string): CommandRow[];
  findByDeviceId(deviceId: string, limit?: number): CommandRow[];
  markDelivered(id: string, input: MarkDeliveredInput): boolean;
  processAck(id: string, input: ProcessAckInput): boolean;
  deleteOlderThan(timestamp: string): number;
}
