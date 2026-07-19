import Database from 'better-sqlite3';
import type { DatabaseWrapper } from './Database.js';
import type { IEventRepository, EventRow, CreateEventInput } from '../interfaces/IEventRepository.js';

/**
 * SQLite implementation of IEventRepository.
 */
export class EventRepository implements IEventRepository {
  private stmtCreate: Database.Statement;
  private stmtFindByDeviceId: Database.Statement;
  private stmtFindByDeviceIdAndType: Database.Statement;
  private stmtDeleteOlderThan: Database.Statement;

  constructor(private db: DatabaseWrapper) {
    const raw = db.getRaw();
    this.stmtCreate = raw.prepare(
      `INSERT INTO events (id, device_id, event_type, payload, timestamp)
       VALUES (?, ?, ?, ?, ?) RETURNING *`,
    );
    this.stmtFindByDeviceId = raw.prepare(
      'SELECT * FROM events WHERE device_id = ? ORDER BY received_at DESC LIMIT ?',
    );
    this.stmtFindByDeviceIdAndType = raw.prepare(
      'SELECT * FROM events WHERE device_id = ? AND event_type = ? ORDER BY received_at DESC LIMIT ?',
    );
    this.stmtDeleteOlderThan = raw.prepare('DELETE FROM events WHERE received_at < ?');
  }

  create(input: CreateEventInput): EventRow {
    const row = this.stmtCreate.get(
      input.id,
      input.deviceId,
      input.eventType,
      input.payload ? JSON.stringify(input.payload) : null,
      input.timestamp ?? null,
    ) as Record<string, unknown>;
    return this.mapRow(row);
  }

  findByDeviceId(
    deviceId: string,
    options?: { eventType?: string; limit?: number },
  ): EventRow[] {
    const limit = options?.limit ?? 100;

    if (options?.eventType) {
      const rows = this.stmtFindByDeviceIdAndType.all(
        deviceId,
        options.eventType,
        limit,
      ) as Record<string, unknown>[];
      return rows.map(this.mapRow);
    }

    const rows = this.stmtFindByDeviceId.all(deviceId, limit) as Record<string, unknown>[];
    return rows.map(this.mapRow);
  }

  deleteOlderThan(timestamp: string): number {
    const result = this.stmtDeleteOlderThan.run(timestamp);
    return result.changes;
  }

  private mapRow(row: Record<string, unknown>): EventRow {
    return {
      id: row.id as string,
      deviceId: row.device_id as string,
      eventType: row.event_type as string,
      payload: row.payload
        ? (JSON.parse(row.payload as string) as Record<string, unknown>)
        : null,
      timestamp: (row.timestamp as string | null) ?? null,
      receivedAt: row.received_at as string,
    };
  }
}
