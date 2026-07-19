/**
 * Get current timestamp as ISO string.
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Get current Unix timestamp in milliseconds.
 */
export function nowMs(): number {
  return Date.now();
}

/**
 * Add milliseconds to a date.
 */
export function addMs(ms: number): Date {
  return new Date(Date.now() + ms);
}

/**
 * Check if a timestamp is expired.
 */
export function isExpired(isoTimestamp: string): boolean {
  return new Date(isoTimestamp) < new Date();
}

/**
 * Format duration in ms to human-readable string.
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
