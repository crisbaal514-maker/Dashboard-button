import Database from 'better-sqlite3';
import type { DatabaseWrapper } from './Database.js';
import type { IHeartbeatRepository, HeartbeatRow, CreateHeartbeatInput } from '../interfaces/IHeartbeatRepository.js';

/**
 * SQLite implementation of IHeartbeatRepository.
 */
export class HeartbeatRepository implements IHeartbeatRepository {
  private stmtCreate: Database.Statement;
  private stmtFindByDeviceId: Database.Statement;
  private stmtGetLatest: Database.Statement;
  private stmtDeleteOlderThan: Database.Statement;

  constructor(private db: DatabaseWrapper) {
    const raw = db.getRaw();
    this.stmtCreate = raw.prepare(
      `INSERT INTO heartbeats (id, device_id, sequence, rssi, ip, uptime, firmware_version)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    );
    this.stmtFindByDeviceId = raw.prepare(
      'SELECT * FROM heartbeats WHERE device_id = ? ORDER BY received_at DESC LIMIT ?',
    );
    this.stmtGetLatest = raw.prepare(
      'SELECT * FROM heartbeats WHERE device_id = ? ORDER BY received_at DESC LIMIT 1',
    );
    this.stmtDeleteOlderThan = raw.prepare('DELETE FROM heartbeats WHERE received_at < ?');
  }

  create(input: CreateHeartbeatInput): HeartbeatRow {
    const row = this.stmtCreate.get(
      input.id,
      input.deviceId,
      input.sequence,
      input.rssi ?? null,
      input.ip ?? null,
      input.uptime ?? null,
      input.firmwareVersion ?? null,
    ) as Record<string, unknown>;
    return this.mapRow(row);
  }

  findByDeviceId(deviceId: string, limit = 50): HeartbeatRow[] {
    const rows = this.stmtFindByDeviceId.all(deviceId, limit) as Record<string, unknown>[];
    return rows.map(this.mapRow);
  }

  getLatestForDevice(deviceId: string): HeartbeatRow | undefined {
    const row = this.stmtGetLatest.get(deviceId) as Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  deleteOlderThan(timestamp: string): number {
    const result = this.stmtDeleteOlderThan.run(timestamp);
    return result.changes;
  }

  private mapRow(row: Record<string, unknown>): HeartbeatRow {
    return {
      id: row.id as string,
      deviceId: row.device_id as string,
      sequence: row.sequence as number,
      rssi: (row.rssi as number | null) ?? null,
      ip: (row.ip as string | null) ?? null,
      uptime: (row.uptime as number | null) ?? null,
      firmwareVersion: (row.firmware_version as string | null) ?? null,
      receivedAt: row.received_at as string,
    };
  }
}
