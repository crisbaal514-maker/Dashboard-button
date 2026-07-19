import { logger } from './logger.js';

export interface ScheduledJob {
  name: string;
  intervalMs: number;
  fn: () => Promise<void> | void;
  runOnStart?: boolean;
}

/**
 * Scheduler — Lightweight job scheduler for background maintenance tasks.
 *
 * Features:
 * - Jobs run sequentially (no overlap)
 * - Each job logs start/end/error
 * - Graceful shutdown via stop()
 * - Extensible: add jobs by calling register()
 *
 * Usage:
 *   const scheduler = new Scheduler();
 *   scheduler.register({ name: 'cleanup', intervalMs: 3600000, fn: cleanupUseCase.execute });
 *   scheduler.start();
 *   // ... later
 *   await scheduler.stop();
 */
export class Scheduler {
  private jobs: ScheduledJob[] = [];
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private running = false;

  register(job: ScheduledJob): void {
    this.jobs.push(job);
    logger.info({ jobName: job.name, intervalMs: job.intervalMs }, 'Scheduler: job registered');
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info({ jobCount: this.jobs.length }, 'Scheduler: starting');

    for (const job of this.jobs) {
      if (job.runOnStart) {
        this.runJob(job);
      }
      const timer = setInterval(() => this.runJob(job), job.intervalMs);
      this.timers.set(job.name, timer);
    }
  }

  stop(): void {
    this.running = false;
    for (const [name, timer] of this.timers) {
      clearInterval(timer);
      logger.info({ jobName: name }, 'Scheduler: job stopped');
    }
    this.timers.clear();
  }

  private async runJob(job: ScheduledJob): Promise<void> {
    logger.info({ jobName: job.name }, 'Scheduler: job started');
    const start = Date.now();
    try {
      await job.fn();
    } catch (err: any) {
      logger.error({ jobName: job.name, err: err.message }, 'Scheduler: job failed');
    }
    const elapsed = Date.now() - start;
    logger.info({ jobName: job.name, elapsedMs: elapsed }, 'Scheduler: job completed');
  }
}
