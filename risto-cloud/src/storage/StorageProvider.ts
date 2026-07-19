import { DatabaseWrapper } from './sqlite/Database.js';
import { DeviceRepository } from './sqlite/DeviceRepository.js';
import { TokenRepository } from './sqlite/TokenRepository.js';
import { HeartbeatRepository } from './sqlite/HeartbeatRepository.js';
import { EventRepository } from './sqlite/EventRepository.js';
import { DiagnosticsRepository } from './sqlite/DiagnosticsRepository.js';
import { CommandRepository } from './sqlite/CommandRepository.js';
import { ScenarioRepository } from './sqlite/ScenarioRepository.js';
import type {
  IDeviceRepository,
  ITokenRepository,
  IHeartbeatRepository,
  IEventRepository,
  IDiagnosticsRepository,
  ICommandRepository,
  IScenarioRepository,
} from './interfaces/index.js';
import { logger } from '../core/logger.js';

/**
 * StorageProvider — Factory for all storage concerns.
 *
 * The application accesses repositories ONLY through this factory.
 * The constructor takes a database path and creates SQLite-backed implementations.
 * To switch to PostgreSQL, swap the implementation classes — the interfaces remain the same.
 */
export class StorageProvider {
  readonly devices: IDeviceRepository;
  readonly tokens: ITokenRepository;
  readonly heartbeats: IHeartbeatRepository;
  readonly events: IEventRepository;
  readonly diagnostics: IDiagnosticsRepository;
  readonly commands: ICommandRepository;
  readonly scenarios: IScenarioRepository;

  private db: DatabaseWrapper;

  constructor(dbPath: string) {
    this.db = new DatabaseWrapper(dbPath);

    // Run pending migrations on construction
    this.db.runMigrations();

    this.devices = new DeviceRepository(this.db);
    this.tokens = new TokenRepository(this.db);
    this.heartbeats = new HeartbeatRepository(this.db);
    this.events = new EventRepository(this.db);
    this.diagnostics = new DiagnosticsRepository(this.db);
    this.commands = new CommandRepository(this.db);
    this.scenarios = new ScenarioRepository(this.db);

    logger.info({ dbPath }, 'StorageProvider initialized');
  }

  /**
   * Execute operations inside a single database transaction.
   *
   * The callback receives a StorageProvider bound to the same transaction context.
   * This enables atomic cross-repository operations like:
   *
   *   storage.transaction(async (tx) => {
   *     const device = tx.devices.create(deviceInput);
   *     const token  = tx.tokens.create(tokenInput);
   *     return { device, token };
   *   });
   *
   * SQLite runs this synchronously internally.
   * PostgreSQL will run this as a real async transaction.
   * The API contract is the same — Use Cases never know the difference.
   */
  /**
   * Execute operations inside a synchronous transaction.
   * For use with better-sqlite3 (synchronous driver).
   * The callback receives a StorageProvider bound to the same transaction context.
   */
  transactionSync<T>(fn: (tx: StorageProvider) => T): T {
    return this.db.transactionInternal(() => fn(this));
  }

  /**
   * Execute operations inside a transaction, returning a Promise.
   * For async-compatible drivers (e.g., PostgreSQL).
   * NOTE: With better-sqlite3, do NOT use async/await inside the callback.
   */
  transaction<T>(fn: (tx: StorageProvider) => T | Promise<T>): Promise<T> {
    return Promise.resolve(this.db.transactionInternal(() => fn(this)));
  }

  /**
   * Close all database connections.
   */
  close(): void {
    this.db.close();
    logger.info('StorageProvider closed');
  }
}
