export interface EventRow {
  id: string;
  deviceId: string;
  eventType: string;
  payload: Record<string, unknown> | null;
  timestamp: string | null;
  receivedAt: string;
}

export interface CreateEventInput {
  id: string;
  deviceId: string;
  eventType: string;
  payload?: Record<string, unknown>;
  timestamp?: string;
}

export interface IEventRepository {
  create(input: CreateEventInput): EventRow;
  findByDeviceId(
    deviceId: string,
    options?: { eventType?: string; limit?: number },
  ): EventRow[];
  deleteOlderThan(timestamp: string): number;
}
