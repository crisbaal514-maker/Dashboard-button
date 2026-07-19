/**
 * Clock — Abstraction over time.
 * Enables deterministic testing via FakeClock, FrozenClock, etc.
 */
export interface Clock {
  now(): Date;
}
