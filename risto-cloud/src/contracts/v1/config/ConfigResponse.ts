/**
 * GET /v1/devices/:deviceId/config — Response (200 OK)
 * Device-specific configuration from the cloud.
 */
export interface ConfigResponse {
  /** Heartbeat interval in milliseconds */
  heartbeatInterval: number;

  /** Heartbeat timeout (ms without heartbeat = offline) */
  heartbeatTimeout: number;

  /** Maximum number of retry attempts */
  maxRetries: number;

  /** Base backoff in milliseconds for reconnection */
  backoffMinMs: number;

  /** Maximum backoff in milliseconds */
  backoffMaxMs: number;

  /** Device-specific feature flags / configuration */
  features: Record<string, boolean>;

  /** Custom configuration (opaque JSON) */
  custom?: Record<string, unknown>;

  /** Configuration version for cache invalidation */
  configVersion: number;
}
