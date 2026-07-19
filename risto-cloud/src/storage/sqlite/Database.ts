import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
import { logger } from '../../core/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface Migration {
  version: number;
  sql: string;
  checksum: string;
}

/**
 * Database — SQLite wrapper.
 * Manages connection, WAL mode, foreign keys, and auto-migrations.
 * All better-sqlite3 types remain encapsulated here — never exposed outside sqlite/.
 */
export class DatabaseWrapper {
  private db: Database.Database;
  private migrationsDir: string;

  constructor(dbPath: string) {
    this.migrationsDir = join(__dirname, 'migrations');

    this.db = new Database(dbPath);

    // WAL mode for concurrent reads — verify it actually took effect
    const journalMode = this.db.pragma('journal_mode = WAL') as string;
    if (journalMode !== 'wal') {
      logger.warn({ actualMode: journalMode, expected: 'wal' }, 'WAL journal mode NOT applied');
    } else {
      logger.debug('WAL journal mode enabled');
    }

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Busy timeout (ms) — prevents SQLITE_BUSY errors under WAL
    this.db.pragma('busy_timeout = 5000');

    logger.info({ dbPath, journalMode }, 'SQLite database opened');
  }

  /**
   * Execute a database operation with automatic retry on SQLITE_BUSY.
   * Uses exponential backoff: 50ms, 100ms, 200ms.
   * Throws if all retries are exhausted.
   */
  executeWithRetry<T>(fn: () => T, maxRetries = 3, baseDelayMs = 50): T {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return fn();
      } catch (err: any) {
        lastError = err;
        if (err?.code !== 'SQLITE_BUSY' && err?.message?.includes('BUSY') === false) {
          throw err; // Not a busy error — rethrow immediately
        }
        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          logger.warn({ attempt: attempt + 1, maxRetries, delay }, 'SQLITE_BUSY detected, retrying');
          // busy_timeout already handles this internally, but this wrapper
          // catches cases where the built-in timeout wasn't enough
          this.db.pragma(`busy_timeout = ${delay}`);
        }
      }
    }
    throw lastError ?? new Error('SQLITE_BUSY after all retries');
  }

  /**
   * Execute a callback inside a single SQLite transaction with retry support.
   */
  transaction<T>(fn: () => T): T {
    return this.executeWithRetry(() => this.transactionInternal(fn));
  }

  /**
   * Run all pending migrations inside a transaction.
   */
  runMigrations(): void {
    const applied = this.getAppliedVersions();
    const pending = this.loadMigrations();

    for (const migration of pending) {
      if (applied.has(migration.version)) {
        continue;
      }

      logger.info({ version: migration.version }, 'Running migration');

      this.transactionInternal(() => {
        this.db.exec(migration.sql);
        this.db
          .prepare(
            `INSERT INTO schema_version (version, checksum) VALUES (?, ?)`,
          )
          .run(migration.version, migration.checksum);
      });

      logger.info({ version: migration.version }, 'Migration applied');
    }
  }

  /**
   * Execute a callback inside a single SQLite transaction.
   * Returns the result of the callback.
   */
  transactionInternal<T>(fn: () => T): T {
    const tx = this.db.transaction(fn);
    return tx();
  }

  /**
   * Get the underlying better-sqlite3 Database instance.
   * WARNING: Only for use by repositories within this package.
   */
  getRaw(): Database.Database {
    return this.db;
  }

  /**
   * Close the database connection.
   */
  close(): void {
    this.db.close();
    logger.info('Database connection closed');
  }

  private getAppliedVersions(): Set<number> {
    try {
      const rows = this.db
        .prepare('SELECT version FROM schema_version ORDER BY version')
        .all() as { version: number }[];
      return new Set(rows.map((r) => r.version));
    } catch {
      return new Set();
    }
  }

  private loadMigrations(): Migration[] {
    const files = readdirSync(this.migrationsDir);
    const migrationFiles = files.filter((f) => f.endsWith('.sql')).sort();

    return migrationFiles.map((file) => {
      const content = readFileSync(join(this.migrationsDir, file), 'utf-8');
      const version = this.parseVersion(file);
      const checksum = createHash('sha256').update(content).digest('hex');
      return { version, sql: content, checksum };
    });
  }

  private parseVersion(filename: string): number {
    const match = filename.match(/^(\d+)_/);
    const versionStr = match?.[0];
    if (!versionStr) {
      throw new Error(`Invalid migration filename: ${filename}`);
    }
    return parseInt(versionStr, 10);
  }
}
