/**
 * POST /v1/devices/auth — Response (200 OK)
 */
export interface AuthResponse {
  /** New access token */
  accessToken: string;

  /** Optional new refresh token (rotation) */
  refreshToken?: string;
}
