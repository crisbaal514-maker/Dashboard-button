/**
 * POST /v1/devices/register — Response (201 Created)
 * Contains device identity and authentication material.
 * Matches the firmware ProvisioningResult struct.
 */
export interface RegisterResponse {
  /** Cloud-assigned device ID (UUID v4) */
  deviceId: string;

  /** API key for subsequent requests */
  apiKey: string;

  /** Authentication token (JWT or opaque) */
  token: string;

  /** Refresh token for re-authentication */
  refreshToken: string;

  /** Heartbeat interval in milliseconds */
  heartbeatInterval: number;

  /** Device-specific configuration */
  config: Record<string, unknown>;
}
