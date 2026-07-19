import type { HeartbeatRequest } from '../../contracts/v1/heartbeat/HeartbeatRequest.js';
import type { HeartbeatResponse } from '../../contracts/v1/heartbeat/HeartbeatResponse.js';
import type { StorageProvider } from '../../storage/StorageProvider.js';
import type { IEventBus } from '../../core/IEventBus.js';
import type { Clock } from '../../core/Clock.js';
import { DeviceEventType } from '../../core/events/DeviceEventType.js';
import type { DomainEvent } from '../../core/events/DomainEvent.js';
import { generateId } from '../../core/utils/id-generator.js';
import { GetPendingCommandsUseCase } from '../commands/GetPendingCommandsUseCase.js';
import { logger } from '../../core/logger.js';

const DEFAULT_HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds

/**
 * ProcessHeartbeatUseCase — Process a device heartbeat.
 *
 * Flow:
 *  1. Validate device exists
 *  2. Save heartbeat + update device status (inside transaction)
 *  3. Emit event (outside transaction)
 *  4. Check for pending commands via GetPendingCommandsUseCase
 *  5. Return HeartbeatResponse (always 200 with pendingCommands array)
 *
 * Token validation is NOT performed here — it belongs at the transport boundary
 * (HTTP middleware, MQTT interceptor, etc.).
 */
export class ProcessHeartbeatUseCase {
  private getPendingCommands: GetPendingCommandsUseCase;

  constructor(
    private storage: StorageProvider,
    private eventBus: IEventBus,
    private clock: Clock,
  ) {
    this.getPendingCommands = new GetPendingCommandsUseCase(storage);
  }

  async execute(
    deviceId: string,
    request: HeartbeatRequest,
  ): Promise<HeartbeatResponse> {
    const now = this.clock.now();

    // 1. Validate device exists
    const device = this.storage.devices.findById(deviceId);
    if (!device) {
      logger.warn({ deviceId }, 'ProcessHeartbeatUseCase: device not found');
      throw new Error(`Device not found: ${deviceId}`);
    }

    const wasOffline = !device.isOnline;
    const serverTime = now.toISOString();

    // 2. Save heartbeat + update device (inside transaction)
    // NOTE: better-sqlite3 is synchronous
    this.storage.transactionSync((tx: StorageProvider) => {
      tx.heartbeats.create({
        id: generateId(),
        deviceId,
        sequence: request.sequence,
        ...(request.rssi !== undefined && { rssi: request.rssi }),
        ...(request.ip !== undefined && { ip: request.ip }),
        ...(request.uptime !== undefined && { uptime: request.uptime }),
        ...(request.firmware !== undefined && { firmwareVersion: request.firmware }),
      });

      tx.devices.update(deviceId, {
        isOnline: true,
        lastSeenAt: serverTime,
        ...(request.ip !== undefined && { lastIp: request.ip }),
        ...(request.rssi !== undefined && { lastRssi: request.rssi }),
        ...(request.firmware !== undefined && { firmwareVersion: request.firmware }),
      });
    });

    // 3. Emit event (outside transaction)
    const event: DomainEvent<{
      deviceId: string;
      sequence: number;
      wasOffline: boolean;
    }> = {
      type: DeviceEventType.Heartbeat,
      occurredAt: now,
      payload: {
        deviceId,
        sequence: request.sequence,
        wasOffline,
      },
    };
    this.eventBus.emit(event.type, event);

    // 4. Check for pending commands (marks them as DELIVERED automatically)
    const pending = this.getPendingCommands.execute(deviceId);

    logger.info(
      { deviceId, sequence: request.sequence, wasOffline, pendingCommands: pending.length },
      'ProcessHeartbeatUseCase: completed',
    );

    // 5. Return response (always 200 with pendingCommands array)
    return {
      status: 'ok',
      nextHeartbeatIn: DEFAULT_HEARTBEAT_INTERVAL_MS,
      serverTime,
      pendingCommands: pending.map((cmd) => ({
        id: cmd.id,
        type: cmd.type,
        payload: cmd.payload,
      })),
    };
  }
}
