import type { Clock } from '../../src/core/Clock.js';

/**
 * FakeClock — Deterministic clock for tests.
 * Defaults to 2024-01-15T12:00:00.000Z unless set() is called.
 */
export class FakeClock implements Clock {
  private current: Date = new Date('2024-01-15T12:00:00.000Z');

  now(): Date {
    return new Date(this.current);
  }

  set(iso: string): void {
    this.current = new Date(iso);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}
