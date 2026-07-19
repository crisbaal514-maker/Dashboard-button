export interface TokenRow {
  id: string;
  deviceId: string;
  tokenHash: string;
  refreshTokenHash: string | null;
  tokenType: 'access' | 'refresh';
  expiresAt: string;
  revoked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTokenInput {
  id: string;
  deviceId: string;
  tokenHash: string;
  refreshTokenHash?: string;
  tokenType: 'access' | 'refresh';
  expiresAt: string;
}

export interface ITokenRepository {
  create(input: CreateTokenInput): TokenRow;
  findByTokenHash(tokenHash: string): TokenRow | undefined;
  findByRefreshTokenHash(refreshTokenHash: string): TokenRow | undefined;
  findByDeviceId(deviceId: string): TokenRow[];
  revoke(id: string): boolean;
  revokeAllForDevice(deviceId: string): number;
  deleteExpired(): number;
}
