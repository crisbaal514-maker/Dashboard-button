import Database from 'better-sqlite3';
import type { DatabaseWrapper } from './Database.js';
import type {
  ICommandRepository,
  CommandRow,
  CreateCommandInput,
  MarkDeliveredInput,
  ProcessAckInput,
} from '../interfaces/ICommandRepository.js';

/**
 * SQLite implementation of ICommandRepository.
 * Soporta el ciclo de vida completo: pending → delivered → completed/failed/rejected.
 */
export class CommandRepository implements ICommandRepository {
  private stmtCreate: Database.Statement;
  private stmtFindById: Database.Statement;
  private stmtFindPending: Database.Statement;
  private stmtFindByDeviceId: Database.Statement;
  private stmtMarkDelivered: Database.Statement;
  private stmtProcessAck: Database.Statement;
  private stmtDeleteOlderThan: Database.Statement;

  constructor(private db: DatabaseWrapper) {
    const raw = db.getRaw();
    this.stmtCreate = raw.prepare(
      `INSERT INTO commands (id, device_id, type, payload, priority)
       VALUES (?, ?, ?, ?, ?) RETURNING *`,
    );
    this.stmtFindById = raw.prepare('SELECT * FROM commands WHERE id = ?');
    this.stmtFindPending = raw.prepare(
      `SELECT * FROM commands
       WHERE device_id = ? AND status = 'pending'
       ORDER BY priority DESC, created_at ASC`,
    );
    this.stmtFindByDeviceId = raw.prepare(
      'SELECT * FROM commands WHERE device_id = ? ORDER BY created_at DESC LIMIT ?',
    );
    this.stmtMarkDelivered = raw.prepare(
      `UPDATE commands SET status = 'delivered', delivered_at = ? WHERE id = ? AND status = 'pending'`,
    );
    this.stmtProcessAck = raw.prepare(
      `UPDATE commands
       SET status = ?,
           completed_at = ?,
           result = ?,
           error = ?
       WHERE id = ? AND status IN ('delivered', 'executing')`,
    );
    this.stmtDeleteOlderThan = raw.prepare(
      `DELETE FROM commands WHERE created_at < ?
       AND status IN ('completed', 'failed', 'rejected')`,
    );
  }

  create(input: CreateCommandInput): CommandRow {
    const row = this.stmtCreate.get(
      input.id,
      input.deviceId,
      input.type,
      JSON.stringify(input.payload ?? {}),
      input.priority ?? 0,
    ) as Record<string, unknown>;
    return this.mapRow(row);
  }

  findById(id: string): CommandRow | undefined {
    const row = this.stmtFindById.get(id) as Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  findPendingByDeviceId(deviceId: string): CommandRow[] {
    const rows = this.stmtFindPending.all(deviceId) as Record<string, unknown>[];
    return rows.map(this.mapRow);
  }

  findByDeviceId(deviceId: string, limit = 50): CommandRow[] {
    const rows = this.stmtFindByDeviceId.all(deviceId, limit) as Record<string, unknown>[];
    return rows.map(this.mapRow);
  }

  markDelivered(id: string, input: MarkDeliveredInput): boolean {
    const result = this.stmtMarkDelivered.run(input.deliveredAt, id);
    return result.changes > 0;
  }

  processAck(id: string, input: ProcessAckInput): boolean {
    const result = this.stmtProcessAck.run(
      input.status,
      input.completedAt,
      input.result ? JSON.stringify(input.result) : null,
      input.error ?? null,
      id,
    );
    return result.changes > 0;
  }

  deleteOlderThan(timestamp: string): number {
    const result = this.stmtDeleteOlderThan.run(timestamp);
    return result.changes;
  }

  private mapRow(row: Record<string, unknown>): CommandRow {
    return {
      id: row.id as string,
      deviceId: row.device_id as string,
      type: row.type as string,
      payload: JSON.parse(row.payload as string) as Record<string, unknown>,
      status: row.status as CommandRow['status'],
      priority: row.priority as number,
      error: (row.error as string | null) ?? null,
      result: row.result ? (JSON.parse(row.result as string) as Record<string, unknown>) : null,
      createdAt: row.created_at as string,
      deliveredAt: (row.delivered_at as string | null) ?? null,
      startedAt: (row.started_at as string | null) ?? null,
      completedAt: (row.completed_at as string | null) ?? null,
    };
  }
}
