/**
 * POST /v1/devices/auth — Request
 * Sent by the device to re-authenticate using a refresh token.
 */
export interface AuthRequest {
  /** Device ID assigned during registration */
  deviceId: string;

  /** Refresh token obtained during registration */
  refreshToken: string;
}
