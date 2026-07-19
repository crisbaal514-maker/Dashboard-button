import type { IEventBus, EventHandler } from '../../src/core/IEventBus.js';
import type { DomainEvent } from '../../src/core/events/DomainEvent.js';

/**
 * FakeEventBus — Records emitted events for test assertions.
 * Implements IEventBus fully.
 */
export class FakeEventBus implements IEventBus {
  /** All emitted events in order */
  emitted: DomainEvent[] = [];

  private handlers = new Map<string, EventHandler[]>();

  on(event: string, handler: EventHandler): void {
    const existing = this.handlers.get(event);
    if (existing) {
      existing.push(handler);
    } else {
      this.handlers.set(event, [handler]);
    }
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  emit(event: string, payload: unknown): void {
    this.emitted.push(payload as DomainEvent);
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(payload);
    }
  }

  async emitAsync(event: string, payload: unknown): Promise<void> {
    this.emit(event, payload);
  }

  clear(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }

  reset(): void {
    this.emitted = [];
    this.handlers.clear();
  }
}
