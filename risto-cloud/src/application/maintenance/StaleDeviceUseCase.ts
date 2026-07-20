import type { StorageProvider } from '../../storage/StorageProvider.js';
import { logger } from '../../core/logger.js';

/**
 * StaleDeviceUseCase — Mark devices as OFFLINE when they stop sending heartbeats.
 *
 * A device is considered "stale" if its last_seen_at is older than STALE_TIMEOUT_MS.
 * Runs every ~30 seconds via the Scheduler.
 */
export class StaleDeviceUseCase {
  private static readonly STALE_TIMEOUT_MS = 150_000; // 2.5 minutes without heartbeat = OFFLINE

  constructor(private storage: StorageProvider) {}

  async execute(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - StaleDeviceUseCase.STALE_TIMEOUT_MS).toISOString();
      const markedOffline = this.storage.devices.markStaleOffline(cutoff);

      if (markedOffline > 0) {
        logger.info({ markedOffline, cutoff }, 'StaleDeviceUseCase: devices marked OFFLINE');
      }
    } catch (err: any) {
      logger.error({ err: err.message }, 'StaleDeviceUseCase: failed');
    }
  }
}
