import { Scheduler } from '../core/Scheduler.js';
import { CleanupUseCase } from '../application/maintenance/CleanupUseCase.js';
import { logger } from '../core/logger.js';

/**
 * SchedulerBootstrap — Register and start background maintenance jobs.
 *
 * Called from Bootstrap.ts after all use cases are initialized.
 */
export function bootstrapScheduler(cleanupUseCase: CleanupUseCase): Scheduler {
  const scheduler = new Scheduler();

  // ── Cleanup: every 60 minutes ─────────────────────────────
  scheduler.register({
    name: 'cleanup',
    intervalMs: 60 * 60 * 1000, // 1 hour
    fn: (): Promise<void> => cleanupUseCase.execute(),
    runOnStart: true, // Run once immediately on boot
  });

  logger.info('Scheduler bootstrapped with 1 job');

  return scheduler;
}
