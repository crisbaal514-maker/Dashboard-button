import { IEventBus, EventHandler } from './IEventBus.js';
import { logger } from './logger.js';

/**
 * LocalEventBus — In-process event bus implementation.
 * All handlers run synchronously in the same process.
 */
export class LocalEventBus implements IEventBus {
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
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.length === 0) return;

    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (error) {
        logger.error({ event, error }, `EventBus handler error for event: ${event}`);
      }
    }
  }

  async emitAsync(event: string, payload: unknown): Promise<void> {
    const handlers = this.handlers.get(event);
    if (!handlers || handlers.length === 0) return;

    const promises = handlers.map((handler) => {
      try {
        const result = handler(payload);
        return result instanceof Promise ? result : Promise.resolve();
      } catch (error) {
        logger.error({ event, error }, `EventBus handler error for event: ${event}`);
        return Promise.resolve();
      }
    });

    await Promise.all(promises);
  }

  clear(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }
}
