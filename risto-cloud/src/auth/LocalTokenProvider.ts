import { randomBytes, createHash } from 'crypto';
import type { AuthProvider } from './AuthProvider.js';
import type { TokenPair } from './TokenPair.js';
import type { StorageProvider } from '../storage/StorageProvider.js';
import type { Clock } from '../core/Clock.js';
import { generateId } from '../core/utils/id-generator.js';

const ACCESS_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * LocalTokenProvider — Opaque token implementation.
 *
 * Tokens are:
 *  - Random UUIDs (256-bit entropy via randomBytes)
 *  - Stored as SHA-256 hashes (tokens table never stores plaintext)
 *  - Revocable
 *  - Never expire automatically unless the device re-registers
 *
 * Not JWT. Not self-encoded. Just hashed UUIDs stored in SQLite.
 * Suitable for embedded/edge devices that would need to parse JWT locally.
 */
export class LocalTokenProvider implements AuthProvider {
  constructor(
    private storage: StorageProvider,
    private clock: Clock,
  ) {}

  async issueTokenPair(deviceId: string): Promise<TokenPair> {
    const accessToken = this.generateToken();
    const refreshToken = this.generateToken();
    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + ACCESS_TOKEN_EXPIRY_MS).toISOString();
    const refreshExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_EXPIRY_MS).toISOString();

    const accessHash = this.hashToken(accessToken);
    const refreshHash = this.hashToken(refreshToken);

    // Revoke any existing tokens for this device (re-registration)
    // NOTE: better-sqlite3 is synchronous — no async/await inside transactionSync()
    this.storage.transactionSync((tx) => {
      tx.tokens.revokeAllForDevice(deviceId);

      tx.tokens.create({
        id: generateId(),
        deviceId,
        tokenHash: accessHash,
        refreshTokenHash: refreshHash,
        tokenType: 'access',
        expiresAt,
      });

      tx.tokens.create({
        id: generateId(),
        deviceId,
        tokenHash: refreshHash,
        tokenType: 'refresh',
        expiresAt: refreshExpiresAt,
      });
    });

    return { accessToken, refreshToken, expiresAt };
  }

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const refreshHash = this.hashToken(refreshToken);
    const stored = this.storage.tokens.findByRefreshTokenHash(refreshHash);

    if (!stored || stored.revoked || stored.tokenType !== 'refresh') {
      throw new Error('Invalid or revoked refresh token');
    }

    const now = this.clock.now();
    const expiresAt = new Date(now.getTime() + ACCESS_TOKEN_EXPIRY_MS).toISOString();
    const newAccessToken = this.generateToken();
    const newRefreshToken = this.generateToken();
    const accessHash = this.hashToken(newAccessToken);
    const newRefreshHash = this.hashToken(newRefreshToken);

    // NOTE: better-sqlite3 is synchronous — no async/await inside transactionSync()
    this.storage.transactionSync((tx) => {
      // Revoke old refresh token (rotation)
      tx.tokens.revoke(stored.id);

      tx.tokens.create({
        id: generateId(),
        deviceId: stored.deviceId,
        tokenHash: accessHash,
        refreshTokenHash: newRefreshHash,
        tokenType: 'access',
        expiresAt,
      });

      tx.tokens.create({
        id: generateId(),
        deviceId: stored.deviceId,
        tokenHash: newRefreshHash,
        tokenType: 'refresh',
        expiresAt: new Date(now.getTime() + REFRESH_TOKEN_EXPIRY_MS).toISOString(),
      });
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken, expiresAt };
  }

  async revokeToken(tokenHash: string): Promise<boolean> {
    // tokenHash here is the hash of the token to revoke
    const stored = this.storage.tokens.findByTokenHash(tokenHash);
    if (!stored) return false;
    return this.storage.tokens.revoke(stored.id);
  }

  async verifyAccessToken(accessToken: string): Promise<{ deviceId: string } | null> {
    const hash = this.hashToken(accessToken);
    const stored = this.storage.tokens.findByTokenHash(hash);

    if (!stored || stored.revoked || stored.tokenType !== 'access') {
      return null;
    }

    // Check expiry
    const now = this.clock.now();
    const expires = new Date(stored.expiresAt);
    if (now > expires) return null;

    return { deviceId: stored.deviceId };
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
