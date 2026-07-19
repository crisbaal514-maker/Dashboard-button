import type { AuthRequest } from '../../contracts/v1/provisioning/AuthRequest.js';
import type { AuthResponse } from '../../contracts/v1/provisioning/AuthResponse.js';
import type { StorageProvider } from '../../storage/StorageProvider.js';
import type { AuthProvider } from '../../auth/AuthProvider.js';
import type { IEventBus } from '../../core/IEventBus.js';
import type { Clock } from '../../core/Clock.js';
import { DeviceEventType } from '../../core/events/DeviceEventType.js';
import type { DomainEvent } from '../../core/events/DomainEvent.js';
import { logger } from '../../core/logger.js';

/**
 * AuthenticateDeviceUseCase — Re-authenticate a device using a refresh token.
 *
 * Flow:
 *  1. Validate refresh token via AuthProvider
 *  2. Issue new token pair (token rotation)
 *  3. Update device status (online, lastSeenAt)
 *  4. Emit device.authenticated event
 *  5. Return AuthResponse
 */
export class AuthenticateDeviceUseCase {
  constructor(
    private storage: StorageProvider,
    private auth: AuthProvider,
    private eventBus: IEventBus,
    private clock: Clock,
  ) {}

  async execute(request: AuthRequest): Promise<AuthResponse> {
    const now = this.clock.now();

    logger.info({ deviceId: request.deviceId }, 'AuthenticateDeviceUseCase: executing');

    // Verify device exists
    const device = this.storage.devices.findById(request.deviceId);
    if (!device) {
      throw new Error(`Device not found: ${request.deviceId}`);
    }

    // Refresh the token pair (validates + rotates)
    const tokenPair = await this.auth.refreshToken(request.refreshToken);

    // Update device online status inside a transaction
    // NOTE: better-sqlite3 is synchronous
    this.storage.transactionSync((tx) => {
      tx.devices.update(request.deviceId, {
        isOnline: true,
        lastSeenAt: now.toISOString(),
      });
    });

    // Emit event
    const event: DomainEvent<{ deviceId: string }> = {
      type: DeviceEventType.Authenticated,
      occurredAt: now,
      payload: { deviceId: request.deviceId },
    };

    this.eventBus.emit(event.type, event);

    logger.info({ deviceId: request.deviceId }, 'AuthenticateDeviceUseCase: completed');

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
    };
  }
}
