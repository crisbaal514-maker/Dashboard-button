import Database from 'better-sqlite3';
import type { DatabaseWrapper } from './Database.js';
import type { ITokenRepository, TokenRow, CreateTokenInput } from '../interfaces/ITokenRepository.js';

/**
 * SQLite implementation of ITokenRepository.
 */
export class TokenRepository implements ITokenRepository {
  private stmtCreate: Database.Statement;
  private stmtFindByTokenHash: Database.Statement;
  private stmtFindByRefreshHash: Database.Statement;
  private stmtFindByDeviceId: Database.Statement;
  private stmtRevoke: Database.Statement;
  private stmtRevokeAll: Database.Statement;
  private stmtDeleteExpired: Database.Statement;

  constructor(private db: DatabaseWrapper) {
    const raw = db.getRaw();
    this.stmtCreate = raw.prepare(
      `INSERT INTO tokens (id, device_id, token_hash, refresh_token_hash, token_type, expires_at)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
    );
    this.stmtFindByTokenHash = raw.prepare('SELECT * FROM tokens WHERE token_hash = ?');
    this.stmtFindByRefreshHash = raw.prepare('SELECT * FROM tokens WHERE refresh_token_hash = ?');
    this.stmtFindByDeviceId = raw.prepare(
      'SELECT * FROM tokens WHERE device_id = ? ORDER BY created_at DESC',
    );
    this.stmtRevoke = raw.prepare(
      `UPDATE tokens SET revoked = 1, updated_at = datetime('now') WHERE id = ?`,
    );
    this.stmtRevokeAll = raw.prepare(
      `UPDATE tokens SET revoked = 1, updated_at = datetime('now') WHERE device_id = ?`,
    );
    this.stmtDeleteExpired = raw.prepare(
      "DELETE FROM tokens WHERE expires_at < datetime('now')",
    );
  }

  create(input: CreateTokenInput): TokenRow {
    const row = this.stmtCreate.get(
      input.id,
      input.deviceId,
      input.tokenHash,
      input.refreshTokenHash ?? null,
      input.tokenType,
      input.expiresAt,
    ) as Record<string, unknown>;
    return this.mapRow(row);
  }

  findByTokenHash(tokenHash: string): TokenRow | undefined {
    const row = this.stmtFindByTokenHash.get(tokenHash) as Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  findByRefreshTokenHash(refreshTokenHash: string): TokenRow | undefined {
    const row = this.stmtFindByRefreshHash.get(refreshTokenHash) as Record<string, unknown> | undefined;
    return row ? this.mapRow(row) : undefined;
  }

  findByDeviceId(deviceId: string): TokenRow[] {
    const rows = this.stmtFindByDeviceId.all(deviceId) as Record<string, unknown>[];
    return rows.map(this.mapRow);
  }

  revoke(id: string): boolean {
    const result = this.stmtRevoke.run(id);
    return result.changes > 0;
  }

  revokeAllForDevice(deviceId: string): number {
    const result = this.stmtRevokeAll.run(deviceId);
    return result.changes;
  }

  deleteExpired(): number {
    const result = this.stmtDeleteExpired.run();
    return result.changes;
  }

  private mapRow(row: Record<string, unknown>): TokenRow {
    return {
      id: row.id as string,
      deviceId: row.device_id as string,
      tokenHash: row.token_hash as string,
      refreshTokenHash: (row.refresh_token_hash as string | null) ?? null,
      tokenType: row.token_type as 'access' | 'refresh',
      expiresAt: row.expires_at as string,
      revoked: (row.revoked as number) === 1,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }
}
