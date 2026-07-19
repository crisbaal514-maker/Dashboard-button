import { describe, it, expect } from 'vitest';
import { ProcessHeartbeatUseCase } from '../../../src/application/heartbeat/ProcessHeartbeatUseCase.js';
import { FakeStorageProvider } from '../../fakes/FakeStorageProvider.js';
import { FakeEventBus } from '../../fakes/FakeEventBus.js';
import { FakeClock } from '../../fakes/FakeClock.js';
import { DeviceEventType } from '../../../src/core/events/DeviceEventType.js';
import { generateId } from '../../../src/core/utils/id-generator.js';
import type { DomainEvent } from '../../../src/core/events/DomainEvent.js';

describe('ProcessHeartbeatUseCase', () => {
  let storage: FakeStorageProvider;
  let eventBus: FakeEventBus;
  let clock: FakeClock;
  let useCase: ProcessHeartbeatUseCase;
  const deviceId = 'test-device-001';

  beforeEach(() => {
    storage = new FakeStorageProvider();
    clock = new FakeClock();
    eventBus = new FakeEventBus();
    useCase = new ProcessHeartbeatUseCase(storage as any, eventBus, clock);

    // Create a device before each test
    storage.devices.create({
      id: deviceId,
      hardwareId: 'AA:BB:CC:DD:EE:FF',
      model: 'button-ticket',
      firmwareVersion: '0.1.0',
    });
  });

  it('should process a new heartbeat and return valid response', async () => {
    const response = await useCase.execute(deviceId, {
      sequence: 1,
      rssi: -65,
      ip: '192.168.1.100',
      uptime: 3600000,
      firmware: '0.1.0',
    });

    // Response shape
    expect(response.status).toBe('ok');
    expect(response.nextHeartbeatIn).toBe(30_000);
    expect(response.serverTime).toBeDefined();
    expect(response.pendingCommands).toBeUndefined();

    // Heartbeat was persisted
    const heartbeats = storage.heartbeats.findByDeviceId(deviceId);
    expect(heartbeats.length).toBe(1);
    expect(heartbeats[0].sequence).toBe(1);
    expect(heartbeats[0].rssi).toBe(-65);
    expect(heartbeats[0].ip).toBe('192.168.1.100');
    expect(heartbeats[0].uptime).toBe(3600000);

    // Device was updated
    const device = storage.devices.findById(deviceId);
    expect(device).toBeDefined();
    expect(device!.isOnline).toBe(true);
    expect(device!.lastIp).toBe('192.168.1.100');
    expect(device!.lastRssi).toBe(-65);
    expect(device!.lastSeenAt).toBeDefined();
    expect(device!.firmwareVersion).toBe('0.1.0');

    // Event was emitted
    expect(eventBus.emitted.length).toBe(1);
    const event = eventBus.emitted[0] as DomainEvent<{
      deviceId: string;
      sequence: number;
      wasOffline: boolean;
    }>;
    expect(event.type).toBe(DeviceEventType.Heartbeat);
    expect(event.payload.deviceId).toBe(deviceId);
    expect(event.payload.sequence).toBe(1);
    expect(event.payload.wasOffline).toBe(true);
  });

  it('should throw when device does not exist', async () => {
    await expect(
      useCase.execute('nonexistent-device', { sequence: 1 }),
    ).rejects.toThrow('Device not found: nonexistent-device');

    // No heartbeat should be persisted
    expect(storage.heartbeats.findByDeviceId('nonexistent-device').length).toBe(0);
    expect(eventBus.emitted.length).toBe(0);
  });

  it('should handle two consecutive heartbeats', async () => {
    // First heartbeat
    await useCase.execute(deviceId, { sequence: 1 });
    const firstTimestamp = storage.devices.findById(deviceId)!.lastSeenAt;

    clock.advance(30_000); // advance 30s

    // Second heartbeat
    const response = await useCase.execute(deviceId, { sequence: 2 });
    const secondTimestamp = storage.devices.findById(deviceId)!.lastSeenAt;

    // Two heartbeats persisted
    const heartbeats = storage.heartbeats.findByDeviceId(deviceId);
    expect(heartbeats.length).toBe(2);

    // lastSeenAt updated
    expect(firstTimestamp).toBeDefined();
    expect(secondTimestamp).toBeDefined();
    expect(secondTimestamp).not.toBe(firstTimestamp);

    // Only one device record
    const allDevices = storage.devices.listAll();
    expect(allDevices.length).toBe(1);

    // Response is ok
    expect(response.status).toBe('ok');

    // Two events emitted
    expect(eventBus.emitted.length).toBe(2);
    const secondEvent = eventBus.emitted[1] as DomainEvent<{
      wasOffline: boolean;
    }>;
    // Device was already online, so wasOffline should be false
    expect(secondEvent.payload.wasOffline).toBe(false);
  });

  it('should return pending commands in response', async () => {
    // Create a pending command for the device
    storage.commands.create({
      id: generateId(),
      deviceId,
      type: 'ota_update',
      payload: { version: '0.2.0' },
    });

    const response = await useCase.execute(deviceId, { sequence: 3 });

    expect(response.pendingCommands).toBe(1);
  });

  it('should revive an offline device', async () => {
    // Manually mark device as offline
    storage.devices.update(deviceId, { isOnline: false });
    expect(storage.devices.findById(deviceId)!.isOnline).toBe(false);

    const response = await useCase.execute(deviceId, {
      sequence: 5,
      rssi: -70,
    });

    // Device is now online
    const device = storage.devices.findById(deviceId);
    expect(device!.isOnline).toBe(true);
    expect(device!.lastRssi).toBe(-70);

    // Response is ok
    expect(response.status).toBe('ok');

    // Event has wasOffline = true
    const event = eventBus.emitted[0] as DomainEvent<{
      wasOffline: boolean;
    }>;
    expect(event.payload.wasOffline).toBe(true);
  });
});
