import { ConfigProvider } from './ConfigProvider.js';
import dotenv from 'dotenv';

/**
 * EnvProvider — Loads configuration from environment variables.
 * Supports .env file via dotenv.
 */
export class EnvProvider implements ConfigProvider {
  constructor() {
    dotenv.config();
  }

  get<T = string>(key: string, defaultValue?: T): T {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Missing configuration key: ${key}`);
    }
    return value as unknown as T;
  }

  getNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Missing configuration key: ${key}`);
    }
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Invalid number for configuration key: ${key} = ${value}`);
    }
    return num;
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) return defaultValue;
      throw new Error(`Missing configuration key: ${key}`);
    }
    return value === 'true' || value === '1' || value === 'yes';
  }

  has(key: string): boolean {
    return process.env[key] !== undefined;
  }
}
