import type { TokenPair } from './TokenPair.js';

/**
 * AuthProvider — Authentication contract for the provisioning layer.
 *
 * Methods:
 *  - issueTokenPair:   Create new access + refresh tokens for a device
 *  - refreshToken:     Issue a new access token using a valid refresh token
 *  - revokeToken:      Invalidate a specific token
 *  - verifyAccessToken:Validate and decode an access token (noop in LocalTokenProvider)
 *
 * The implementation (LocalTokenProvider) uses SHA-256 hashing + UUID tokens.
 * A future JwtTokenProvider would implement the same interface.
 */
export interface AuthProvider {
  issueTokenPair(deviceId: string): Promise<TokenPair>;
  refreshToken(refreshToken: string): Promise<TokenPair>;
  revokeToken(tokenHash: string): Promise<boolean>;
  verifyAccessToken(accessToken: string): Promise<{ deviceId: string } | null>;
}
