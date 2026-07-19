/**
 * IEventBus — Interface for the internal event system.
 * Implementations: LocalEventBus (in-process), RabbitMQ, NATS, Kafka (future).
 */
export type EventHandler = (payload: unknown) => void | Promise<void>;

export interface IEventBus {
  /** Subscribe to an event */
  on(event: string, handler: EventHandler): void;

  /** Unsubscribe from an event */
  off(event: string, handler: EventHandler): void;

  /** Emit an event synchronously */
  emit(event: string, payload: unknown): void;

  /** Emit an event asynchronously */
  emitAsync(event: string, payload: unknown): Promise<void>;

  /** Remove all handlers for an event */
  clear(event?: string): void;
}
