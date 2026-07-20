import type { RegisterRequest } from '../../contracts/v1/provisioning/RegisterRequest.js';
import type { RegisterResponse } from '../../contracts/v1/provisioning/RegisterResponse.js';
import type { StorageProvider } from '../../storage/StorageProvider.js';
import type { AuthProvider } from '../../auth/AuthProvider.js';
import type { IEventBus } from '../../core/IEventBus.js';
import type { Clock } from '../../core/Clock.js';
import { DeviceEventType } from '../../core/events/DeviceEventType.js';
import type { DomainEvent } from '../../core/events/DomainEvent.js';
import { generateId } from '../../core/utils/id-generator.js';
import { logger } from '../../core/logger.js';

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

/**
 * RegisterDeviceUseCase — First vertical slice of Risto Cloud.
 *
 * Flow:
 *  1. Check if hardwareId already exists → if so, re-register
 *  2. Create device record
 *  3. Issue token pair
 *  4. Emit device.registered event
 *  5. Return RegisterResponse
 *
 * All writes happen inside a single storage.transaction().
 */
export class RegisterDeviceUseCase {
  constructor(
    private storage: StorageProvider,
    private auth: AuthProvider,
    private eventBus: IEventBus,
    private clock: Clock,
  ) {}

  async execute(request: RegisterRequest): Promise<RegisterResponse> {
    const now = this.clock.now();

    // Check for existing device by hardwareId
    const existing = this.storage.devices.findByHardwareId(request.hardwareId);

    // Determine deviceId: reuse existing if found, otherwise generate new
    const deviceId = existing ? existing.id : generateId();

    logger.info(
      { hardwareId: request.hardwareId, deviceId, existing: !!existing },
      'RegisterDeviceUseCase: executing',
    );

    // Execute registration inside a transaction
    // NOTE: better-sqlite3 is synchronous — no async/await inside transaction()
    this.storage.transactionSync((tx: StorageProvider) => {
      if (existing) {
        // Device already exists — reuse it (preserve deviceId for stability)
        // Revoke old tokens so new ones can be issued
        tx.tokens.revokeAllForDevice(existing.id);

        // Update firmware version and mark online
        tx.devices.update(existing.id, {
          firmwareVersion: request.firmware,
          isOnline: true,
          lastSeenAt: now.toISOString(),
        });
      } else {
        // New device — create fresh record
        tx.devices.create({
          id: deviceId,
          hardwareId: request.hardwareId,
          model: request.model,
          firmwareVersion: request.firmware,
        });
      }
    });

    // Issue token pair (handles its own transaction internally)
    const tokenPair = await this.auth.issueTokenPair(deviceId);

    // Emit event with the full envelope
    const event: DomainEvent<{
      deviceId: string;
      hardwareId: string;
      model: string;
      firmwareVersion: string;
      reRegistered: boolean;
    }> = {
      type: DeviceEventType.Registered,
      occurredAt: now,
      payload: {
        deviceId,
        hardwareId: request.hardwareId,
        model: request.model,
        firmwareVersion: request.firmware,
        reRegistered: !!existing,
      },
    };

    this.eventBus.emit(event.type, event);

    logger.info({ deviceId, reRegistered: !!existing }, 'RegisterDeviceUseCase: completed');

    return {
      deviceId,
      apiKey: deviceId, // In v1, apiKey == deviceId for simplicity
      token: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      heartbeatInterval: DEFAULT_HEARTBEAT_INTERVAL_MS,
      config: {}, // Default empty config; will be populated in future RPs
    };
  }
}
