import { randomBytes } from 'crypto';

/**
 * Generate a secure random API key.
 * Format: risto_<random hex>
 */
export function generateApiKey(): string {
  const random = randomBytes(24).toString('hex');
  return `risto_${random}`;
}

/**
 * Generate a secure random token.
 * Format: <random hex>
 */
export function generateToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Generate a refresh token.
 * Format: rt_<random hex>
 */
export function generateRefreshToken(): string {
  const random = randomBytes(24).toString('hex');
  return `rt_${random}`;
}

/**
 * Compute expiration timestamp from now.
 */
export function computeExpiration(hoursFromNow: number): Date {
  const date = new Date();
  date.setHours(date.getHours() + hoursFromNow);
  return date;
}
