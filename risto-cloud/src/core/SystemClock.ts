import type { Clock } from './Clock.js';

/**
 * SystemClock — Real system time implementation.
 */
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
