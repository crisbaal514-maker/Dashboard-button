import Database from 'better-sqlite3';
import type { DatabaseWrapper } from './Database.js';
import type { IDiagnosticsRepository, DiagnosticsRow, CreateDiagnosticsInput } from '../interfaces/IDiagnosticsRepository.js';

/**
 * SQLite implementation of IDiagnosticsRepository.
 */
export class DiagnosticsRepository implements IDiagnosticsRepository {
  private stmtCreate: Database.Statement;
  private stmtFindByDeviceId: Database.Statement;
  private stmtGetLatest: Database.Statement;
  private stmtDeleteOlderThan: Database.Statement;

  constructor(private db: DatabaseWrapper) {
    const raw = db.getRaw();
    this.stmtCreate = raw.prepare(
      `INSERT INTO diagnostics
         (id, device_id, uptime_ms, free_heap, wifi_rssi, wifi_ssid,
          firmware_version, hardware_revision, last_error, reboot_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    );
    this.stmtFindByDeviceId = raw.prepare(
      'SELECT * FROM diagnostics WHERE device_id = ? ORDER BY received_at DESC LIMIT ?',
    );
    this.stmtGetLatest = raw.prepare(
      'SELECT * FROM diagnostics WHERE device_id = ? ORDER BY received_at DESC LIMIT 1',
    );
    this.stmtDeleteOlderThan = raw.prepare('DELETE FROM diagnostics WHERE received_at < ?');
  }

  create(input: CreateDiagnosticsInput): DiagnosticsRow {
    const row = this.stmtCreate.get(
      input.id,
      input.deviceId,
      input.uptimeMs,
      input.freeHeap,
      input.wifiRssi,
      input.wifiSsid ?? null,
      input.firmwareVersion,
      input.hardwareRevision ?? null,
      input.lastError ?? null,
      input.rebootCount ?? null,
    ) as Record<string, unknown>;
    return this.mapRow(row);
  }

  findByDeviceId(deviceId: string, limit = 20): DiagnosticsRow[] {
    const rows = this.stmtFindByDeviceId.all(deviceId, limit) as Record<string, unknown>[];
    return rows.map(this.mapRow);
  }

  getLatestForDevice(deviceId: string): DiagnosticsRow | undefined {
    const row = this.stmtGetLatest.get(deviceId) as Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  deleteOlderThan(timestamp: string): number {
    const result = this.stmtDeleteOlderThan.run(timestamp);
    return result.changes;
  }

  private mapRow(row: Record<string, unknown>): DiagnosticsRow {
    return {
      id: row.id as string,
      deviceId: row.device_id as string,
      uptimeMs: row.uptime_ms as number,
      freeHeap: row.free_heap as number,
      wifiRssi: row.wifi_rssi as number,
      wifiSsid: (row.wifi_ssid as string | null) ?? null,
      firmwareVersion: row.firmware_version as string,
      hardwareRevision: (row.hardware_revision as string | null) ?? null,
      lastError: (row.last_error as string | null) ?? null,
      rebootCount: (row.reboot_count as number | null) ?? null,
      receivedAt: row.received_at as string,
    };
  }
}
