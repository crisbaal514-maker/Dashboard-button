import type { StorageProvider } from '../../storage/StorageProvider.js';
import { logger } from '../../core/logger.js';

/**
 * CleanupUseCase — Automated database maintenance.
 *
 * Responsibilities:
 * - Remove heartbeats older than 7 days
 * - Mark commands PENDING for > 24 hours as FAILED
 *
 * Designed to run periodically via the Scheduler (~1 hour interval).
 */
export class CleanupUseCase {
  private static readonly HEARTBEAT_RETENTION_DAYS = 7;
  private static readonly COMMAND_TIMEOUT_HOURS = 24;

  constructor(private storage: StorageProvider) {}

  async execute(): Promise<void> {
    try {
      const cutoffHeartbeats = new Date(
        Date.now() - CleanupUseCase.HEARTBEAT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();

      const cutoffCommands = new Date(
        Date.now() - CleanupUseCase.COMMAND_TIMEOUT_HOURS * 60 * 60 * 1000,
      ).toISOString();

      // 1. Clean old heartbeats
      const heartbeatsDeleted = this.storage.heartbeats.deleteOlderThan(cutoffHeartbeats);

      // 2. Delete stale commands (completed/failed/rejected older than retention)
      const commandsDeleted = this.storage.commands.deleteOlderThan(cutoffCommands);

      logger.info(
        {
          heartbeatsDeleted,
          commandsDeleted,
          cutoffHeartbeats,
          cutoffCommands,
        },
        'CleanupUseCase: maintenance run completed',
      );
    } catch (err: any) {
      logger.error({ err: err.message }, 'CleanupUseCase: maintenance run failed');
      throw err;
    }
  }
}

export interface CleanupResult {
  heartbeatsDeleted: number;
  commandsExpired: number;
  failedCommands: number;
}
