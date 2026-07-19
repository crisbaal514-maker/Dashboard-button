/**
 * TokenPair — Result of issuing or refreshing authentication tokens.
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** ISO-8601 timestamp when the access token expires */
  expiresAt: string;
}
