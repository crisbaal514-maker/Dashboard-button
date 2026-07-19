import {
  FakeDeviceRepository,
  FakeTokenRepository,
  FakeHeartbeatRepository,
  FakeCommandRepository,
} from './FakeRepositories.js';

/**
 * FakeStorageProvider — In-memory replacement for StorageProvider.
 *
 * Implements:
 *  - .devices
 *  - .tokens
 *  - .heartbeats
 *  - .commands
 *  - .transaction<T>(fn)
 *
 * Does NOT require SQLite. All data lives in Maps.
 */
export class FakeStorageProvider {
  readonly devices: FakeDeviceRepository;
  readonly tokens: FakeTokenRepository;
  readonly heartbeats: FakeHeartbeatRepository;
  readonly commands: FakeCommandRepository;

  constructor() {
    this.devices = new FakeDeviceRepository();
    this.tokens = new FakeTokenRepository();
    this.heartbeats = new FakeHeartbeatRepository();
    this.commands = new FakeCommandRepository();
  }

  async transaction<T>(fn: (tx: FakeStorageProvider) => T | Promise<T>): Promise<T> {
    return await fn(this);
  }

  reset(): void {
    this.devices.reset();
    this.tokens.reset();
    this.heartbeats.reset();
    this.commands.reset();
  }
}
