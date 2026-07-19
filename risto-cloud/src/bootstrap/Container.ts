/**
 * Container — Simple dependency injection container.
 * No external dependencies, no decorators, no magic.
 */
export class Container {
  private instances = new Map<string, unknown>();

  /**
   * Register a singleton instance in the container.
   */
  register<T>(key: string, instance: T): void {
    if (this.instances.has(key)) {
      throw new Error(`Container already has an instance registered for: ${key}`);
    }
    this.instances.set(key, instance);
  }

  /**
   * Resolve a registered instance.
   */
  resolve<T>(key: string): T {
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`No instance registered for: ${key}`);
    }
    return instance as T;
  }

  /**
   * Check if a key is registered.
   */
  has(key: string): boolean {
    return this.instances.has(key);
  }

  /**
   * Get all registered keys.
   */
  keys(): string[] {
    return Array.from(this.instances.keys());
  }
}
