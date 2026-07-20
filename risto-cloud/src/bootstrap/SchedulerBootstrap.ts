import { Scheduler } from '../core/Scheduler.js';
import { CleanupUseCase } from '../application/maintenance/CleanupUseCase.js';
import { StaleDeviceUseCase } from '../application/maintenance/StaleDeviceUseCase.js';
import { logger } from '../core/logger.js';

/**
 * SchedulerBootstrap — Register and start background maintenance jobs.
 *
 * Called from Bootstrap.ts after all use cases are initialized.
 */
export function bootstrapScheduler(
  cleanupUseCase: CleanupUseCase,
  staleDeviceUseCase: StaleDeviceUseCase,
): Scheduler {
  const scheduler = new Scheduler();

  // ── Cleanup: every 60 minutes ─────────────────────────────
  scheduler.register({
    name: 'cleanup',
    intervalMs: 60 * 60 * 1000, // 1 hour
    fn: (): Promise<void> => cleanupUseCase.execute(),
    runOnStart: true, // Run once immediately on boot
  });

  // ── Stale device detection: every 30 seconds ──────────────
  scheduler.register({
    name: 'stale-device-detection',
    intervalMs: 30_000, // 30 seconds
    fn: (): Promise<void> => staleDeviceUseCase.execute(),
    runOnStart: true,
  });

  logger.info('Scheduler bootstrapped with 2 jobs');

  return scheduler;
}
