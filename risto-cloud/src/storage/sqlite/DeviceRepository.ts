import Database from 'better-sqlite3';
import type { DatabaseWrapper } from './Database.js';
import type { IDeviceRepository, DeviceRow, CreateDeviceInput, UpdateDeviceInput } from '../interfaces/IDeviceRepository.js';

/**
 * SQLite implementation of IDeviceRepository.
 * Uses prepared statements for performance — statements are compiled once in the constructor.
 */
export class DeviceRepository implements IDeviceRepository {
  private stmtCreate: Database.Statement;
  private stmtFindById: Database.Statement;
  private stmtFindByHardwareId: Database.Statement;
  private stmtUpdate: Database.Statement;
  private stmtDelete: Database.Statement;
  private stmtListOnline: Database.Statement;
  private stmtListAll: Database.Statement;

  constructor(private db: DatabaseWrapper) {
    const raw = db.getRaw();
    this.stmtCreate = raw.prepare(
      `INSERT INTO devices (id, hardware_id, model, firmware_version, api_key_hash)
       VALUES (?, ?, ?, ?, ?) RETURNING *`,
    );
    this.stmtFindById = raw.prepare('SELECT * FROM devices WHERE id = ?');
    this.stmtFindByHardwareId = raw.prepare('SELECT * FROM devices WHERE hardware_id = ?');
    this.stmtUpdate = raw.prepare(
      `UPDATE devices SET firmware_version = ?, last_ip = ?, last_rssi = ?,
       is_online = ?, last_seen_at = ?, config = ?, config_version = ?,
       updated_at = datetime('now') WHERE id = ? RETURNING *`,
    );
    this.stmtDelete = raw.prepare('DELETE FROM devices WHERE id = ?');
    this.stmtListOnline = raw.prepare(
      'SELECT * FROM devices WHERE is_online = 1 ORDER BY updated_at DESC',
    );
    this.stmtListAll = raw.prepare('SELECT * FROM devices ORDER BY created_at DESC');
  }

  create(input: CreateDeviceInput): DeviceRow {
    const row = this.stmtCreate.get(
      input.id,
      input.hardwareId,
      input.model,
      input.firmwareVersion,
      input.apiKeyHash ?? null,
    ) as Record<string, unknown>;
    return this.mapRow(row);
  }

  findById(id: string): DeviceRow | undefined {
    const row = this.stmtFindById.get(id) as Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  findByHardwareId(hardwareId: string): DeviceRow | undefined {
    const row = this.stmtFindByHardwareId.get(hardwareId) as Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  update(id: string, input: UpdateDeviceInput): DeviceRow | undefined {
    const current = this.findById(id);
    if (!current) return undefined;

    const merged = {
      firmwareVersion: input.firmwareVersion ?? current.firmwareVersion,
      lastIp: input.lastIp ?? current.lastIp,
      lastRssi: input.lastRssi ?? current.lastRssi,
      isOnline: input.isOnline ?? current.isOnline,
      lastSeenAt: input.lastSeenAt ?? current.lastSeenAt,
      config: input.config ?? current.config,
      configVersion: input.configVersion ?? current.configVersion,
    };

    const row = this.stmtUpdate.get(
      merged.firmwareVersion,
      merged.lastIp,
      merged.lastRssi,
      merged.isOnline ? 1 : 0,
      merged.lastSeenAt,
      JSON.stringify(merged.config),
      merged.configVersion,
      id,
    ) as Record<string, unknown> | undefined;

    return row ? this.mapRow(row) : undefined;
  }

  delete(id: string): boolean {
    const result = this.stmtDelete.run(id);
    return result.changes > 0;
  }

  listOnline(): DeviceRow[] {
    const rows = this.stmtListOnline.all() as Record<string, unknown>[];
    return rows.map(this.mapRow);
  }

  listAll(): DeviceRow[] {
    const rows = this.stmtListAll.all() as Record<string, unknown>[];
    return rows.map(this.mapRow);
  }

  private mapRow(row: Record<string, unknown>): DeviceRow {
    return {
      id: row.id as string,
      hardwareId: row.hardware_id as string,
      model: row.model as string,
      firmwareVersion: row.firmware_version as string,
      apiKeyHash: (row.api_key_hash as string | null) ?? null,
      lastIp: (row.last_ip as string | null) ?? null,
      lastRssi: (row.last_rssi as number | null) ?? null,
      isOnline: (row.is_online as number) === 1,
      lastSeenAt: (row.last_seen_at as string | null) ?? null,
      config: JSON.parse(row.config as string) as Record<string, unknown>,
      configVersion: row.config_version as number,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
