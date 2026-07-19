import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a UUID v4 string.
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate a short device-friendly ID (first 8 chars of UUID).
 */
export function generateShortId(): string {
  return uuidv4().split('-')[0] ?? uuidv4();
}

/**
 * Generate a correlation ID with timestamp prefix for traceability.
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `risto-${timestamp}-${random}`;
}
