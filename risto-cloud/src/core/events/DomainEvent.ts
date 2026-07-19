import type { DeviceEventType } from './DeviceEventType.js';

/**
 * DomainEvent — Base envelope for all domain events.
 *
 * Every event carries:
 *  - type:       The event type (enum, not string)
 *  - occurredAt: When the event happened (from Clock, not Date.now())
 *  - payload:    The event-specific data
 *
 * Consumers (Metrics, Scheduler, Simulator) all receive the same shape.
 */
export interface DomainEvent<T = unknown> {
  type: DeviceEventType;
  occurredAt: Date;
  payload: T;
}
