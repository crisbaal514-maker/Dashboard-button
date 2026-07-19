import type { DeviceRow, CreateDeviceInput, UpdateDeviceInput } from '../../src/storage/interfaces/IDeviceRepository.js';
import type { TokenRow, CreateTokenInput } from '../../src/storage/interfaces/ITokenRepository.js';
import type { HeartbeatRow, CreateHeartbeatInput } from '../../src/storage/interfaces/IHeartbeatRepository.js';
import type { CommandRow, CreateCommandInput } from '../../src/storage/interfaces/ICommandRepository.js';

/**
 * In-memory fake that mimics ITokenRepository for testing.
 */
export class FakeTokenRepository {
  tokens = new Map<string, TokenRow>();

  create(input: CreateTokenInput): TokenRow {
    const row: TokenRow = {
      id: input.id,
      deviceId: input.deviceId,
      tokenHash: input.tokenHash,
      refreshTokenHash: input.refreshTokenHash ?? null,
      tokenType: input.tokenType,
      expiresAt: input.expiresAt,
      revoked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tokens.set(row.id, row);
    return row;
  }

  findByTokenHash(tokenHash: string): TokenRow | undefined {
    return Array.from(this.tokens.values()).find((t) => t.tokenHash === tokenHash);
  }

  findByRefreshTokenHash(refreshTokenHash: string): TokenRow | undefined {
    return Array.from(this.tokens.values()).find(
      (t) => t.refreshTokenHash === refreshTokenHash,
    );
  }

  findByDeviceId(deviceId: string): TokenRow[] {
    return Array.from(this.tokens.values()).filter((t) => t.deviceId === deviceId);
  }

  revoke(id: string): boolean {
    const token = this.tokens.get(id);
    if (!token) return false;
    token.revoked = true;
    return true;
  }

  revokeAllForDevice(deviceId: string): number {
    let count = 0;
    for (const token of this.tokens.values()) {
      if (token.deviceId === deviceId) {
        token.revoked = true;
        count++;
      }
    }
    return count;
  }

  deleteExpired(): number {
    let count = 0;
    const now = new Date();
    for (const [id, token] of this.tokens) {
      if (new Date(token.expiresAt) < now) {
        this.tokens.delete(id);
        count++;
      }
    }
    return count;
  }

  reset(): void {
    this.tokens.clear();
  }
}

/**
 * In-memory fake that mimics IDeviceRepository for testing.
 */
export class FakeDeviceRepository {
  devices = new Map<string, DeviceRow>();

  create(input: CreateDeviceInput): DeviceRow {
    const now = new Date().toISOString();
    const row: DeviceRow = {
      id: input.id,
      hardwareId: input.hardwareId,
      model: input.model,
      firmwareVersion: input.firmwareVersion,
      apiKeyHash: input.apiKeyHash ?? null,
      lastIp: null,
      lastRssi: null,
      isOnline: false,
      lastSeenAt: null,
      config: {},
      configVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.devices.set(row.id, row);
    return row;
  }

  findById(id: string): DeviceRow | undefined {
    return this.devices.get(id);
  }

  findByHardwareId(hardwareId: string): DeviceRow | undefined {
    return Array.from(this.devices.values()).find((d) => d.hardwareId === hardwareId);
  }

  update(id: string, input: UpdateDeviceInput): DeviceRow | undefined {
    const device = this.devices.get(id);
    if (!device) return undefined;

    if (input.firmwareVersion !== undefined) device.firmwareVersion = input.firmwareVersion;
    if (input.lastIp !== undefined) device.lastIp = input.lastIp;
    if (input.lastRssi !== undefined) device.lastRssi = input.lastRssi;
    if (input.isOnline !== undefined) device.isOnline = input.isOnline;
    if (input.lastSeenAt !== undefined) device.lastSeenAt = input.lastSeenAt;
    if (input.config !== undefined) device.config = input.config;
    if (input.configVersion !== undefined) device.configVersion = input.configVersion;
    device.updatedAt = new Date().toISOString();

    return device;
  }

  delete(id: string): boolean {
    return this.devices.delete(id);
  }

  listOnline(): DeviceRow[] {
    return Array.from(this.devices.values()).filter((d) => d.isOnline);
  }

  listAll(): DeviceRow[] {
    return Array.from(this.devices.values());
  }

  reset(): void {
    this.devices.clear();
  }
}

/**
 * In-memory fake that mimics IHeartbeatRepository for testing.
 */
export class FakeHeartbeatRepository {
  heartbeats = new Map<string, HeartbeatRow>();

  create(input: CreateHeartbeatInput): HeartbeatRow {
    const row: HeartbeatRow = {
      id: input.id,
      deviceId: input.deviceId,
      sequence: input.sequence,
      rssi: input.rssi ?? null,
      ip: input.ip ?? null,
      uptime: input.uptime ?? null,
      firmwareVersion: input.firmwareVersion ?? null,
      receivedAt: new Date().toISOString(),
    };
    this.heartbeats.set(row.id, row);
    return row;
  }

  findByDeviceId(deviceId: string, limit?: number): HeartbeatRow[] {
    const results = Array.from(this.heartbeats.values())
      .filter((h) => h.deviceId === deviceId)
      .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));
    return limit ? results.slice(0, limit) : results;
  }

  getLatestForDevice(deviceId: string): HeartbeatRow | undefined {
    return this.findByDeviceId(deviceId, 1)[0];
  }

  deleteOlderThan(timestamp: string): number {
    let count = 0;
    for (const [id, row] of this.heartbeats) {
      if (row.receivedAt < timestamp) {
        this.heartbeats.delete(id);
        count++;
      }
    }
    return count;
  }

  reset(): void {
    this.heartbeats.clear();
  }
}

/**
 * In-memory fake that mimics ICommandRepository for testing.
 */
export class FakeCommandRepository {
  commands = new Map<string, CommandRow>();

  create(input: CreateCommandInput): CommandRow {
    const row: CommandRow = {
      id: input.id,
      deviceId: input.deviceId,
      type: input.type,
      payload: input.payload ?? {},
      status: 'pending',
      priority: input.priority ?? 0,
      resultMessage: null,
      createdAt: new Date().toISOString(),
      sentAt: null,
      acknowledgedAt: null,
    };
    this.commands.set(row.id, row);
    return row;
  }

  findById(id: string): CommandRow | undefined {
    return this.commands.get(id);
  }

  findPendingByDeviceId(deviceId: string): CommandRow[] {
    return Array.from(this.commands.values()).filter(
      (c) => c.deviceId === deviceId && c.status === 'pending',
    );
  }

  findByDeviceId(deviceId: string, limit?: number): CommandRow[] {
    const results = Array.from(this.commands.values())
      .filter((c) => c.deviceId === deviceId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return limit ? results.slice(0, limit) : results;
  }

  markSent(id: string): boolean {
    const cmd = this.commands.get(id);
    if (!cmd || cmd.status !== 'pending') return false;
    cmd.status = 'sent';
    cmd.sentAt = new Date().toISOString();
    return true;
  }

  markAcknowledged(id: string, message?: string): boolean {
    const cmd = this.commands.get(id);
    if (!cmd) return false;
    cmd.status = 'acknowledged';
    cmd.acknowledgedAt = new Date().toISOString();
    if (message) cmd.resultMessage = message;
    return true;
  }

  markFailed(id: string, message?: string): boolean {
    const cmd = this.commands.get(id);
    if (!cmd) return false;
    cmd.status = 'failed';
    if (message) cmd.resultMessage = message;
    return true;
  }

  deleteOlderThan(timestamp: string): number {
    let count = 0;
    for (const [id, row] of this.commands) {
      if (row.createdAt < timestamp) {
        this.commands.delete(id);
        count++;
      }
    }
    return count;
  }

  reset(): void {
    this.commands.clear();
  }
}
