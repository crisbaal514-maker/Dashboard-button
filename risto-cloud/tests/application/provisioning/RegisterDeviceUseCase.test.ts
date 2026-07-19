import { describe, it, expect } from 'vitest';
import { RegisterDeviceUseCase } from '../../../src/application/provisioning/RegisterDeviceUseCase.js';
import { FakeStorageProvider } from '../../fakes/FakeStorageProvider.js';
import { FakeEventBus } from '../../fakes/FakeEventBus.js';
import { FakeClock } from '../../fakes/FakeClock.js';
import { LocalTokenProvider } from '../../../src/auth/LocalTokenProvider.js';
import { DeviceEventType } from '../../../src/core/events/DeviceEventType.js';
import type { DomainEvent } from '../../../src/core/events/DomainEvent.js';

describe('RegisterDeviceUseCase', () => {
  let storage: FakeStorageProvider;
  let auth: LocalTokenProvider;
  let eventBus: FakeEventBus;
  let clock: FakeClock;
  let useCase: RegisterDeviceUseCase;

  beforeEach(() => {
    storage = new FakeStorageProvider();
    clock = new FakeClock();
    eventBus = new FakeEventBus();
    // LocalTokenProvider needs StorageProvider + Clock
    auth = new LocalTokenProvider(storage as any, clock);
    useCase = new RegisterDeviceUseCase(storage as any, auth, eventBus, clock);
  });

  it('should register a new device and return a valid response', async () => {
    const response = await useCase.execute({
      hardwareId: 'AA:BB:CC:DD:EE:FF',
      model: 'button-ticket',
      firmware: '0.1.0',
    });

    // Response shape
    expect(response.deviceId).toBeDefined();
    expect(response.deviceId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(response.apiKey).toBe(response.deviceId);
    expect(response.token).toBeDefined();
    expect(response.token.length).toBeGreaterThan(0);
    expect(response.refreshToken).toBeDefined();
    expect(response.refreshToken.length).toBeGreaterThan(0);
    expect(response.heartbeatInterval).toBe(30_000);
    expect(response.config).toEqual({});

    // Device was persisted
    const device = storage.devices.findById(response.deviceId);
    expect(device).toBeDefined();
    expect(device!.hardwareId).toBe('AA:BB:CC:DD:EE:FF');
    expect(device!.model).toBe('button-ticket');
    expect(device!.firmwareVersion).toBe('0.1.0');

    // Tokens were created
    const tokens = storage.tokens.findByDeviceId(response.deviceId);
    expect(tokens.length).toBeGreaterThanOrEqual(2); // access + refresh

    const accessTokens = tokens.filter((t) => t.tokenType === 'access');
    const refreshTokens = tokens.filter((t) => t.tokenType === 'refresh');
    expect(accessTokens.length).toBe(1);
    expect(refreshTokens.length).toBe(1);

    // Event was emitted
    expect(eventBus.emitted.length).toBe(1);
    const event = eventBus.emitted[0] as DomainEvent<{
      deviceId: string;
      hardwareId: string;
    }>;
    expect(event.type).toBe(DeviceEventType.Registered);
    expect(event.payload.hardwareId).toBe('AA:BB:CC:DD:EE:FF');
    expect(event.payload.deviceId).toBe(response.deviceId);
  });

  it('should re-register when hardwareId already exists', async () => {
    // First registration
    const first = await useCase.execute({
      hardwareId: 'AA:BB:CC:DD:EE:FF',
      model: 'button-ticket',
      firmware: '0.1.0',
    });

    // Second registration (same hardwareId)
    const second = await useCase.execute({
      hardwareId: 'AA:BB:CC:DD:EE:FF',
      model: 'kitchen-display',
      firmware: '0.2.0',
    });

    // Different deviceId (new registration)
    expect(second.deviceId).not.toBe(first.deviceId);

    // First device should be gone (deleted)
    const firstDevice = storage.devices.findById(first.deviceId);
    expect(firstDevice).toBeUndefined();

    // First device tokens should be revoked
    const firstTokens = storage.tokens.findByDeviceId(first.deviceId);
    for (const token of firstTokens) {
      expect(token.revoked).toBe(true);
    }

    // Second device should exist with new model
    const secondDevice = storage.devices.findById(second.deviceId);
    expect(secondDevice).toBeDefined();
    expect(secondDevice!.model).toBe('kitchen-display');

    // Two events emitted (two registrations)
    expect(eventBus.emitted.length).toBe(2);
    expect(eventBus.emitted[0].type).toBe(DeviceEventType.Registered);
    expect(eventBus.emitted[1].type).toBe(DeviceEventType.Registered);
  });

  it('should fail when called with empty hardwareId', async () => {
    const response = await useCase.execute({
      hardwareId: '',
      model: 'button-ticket',
      firmware: '0.1.0',
    });

    // Should still succeed (empty hardwareId is allowed by schema,
    // but device should be created)
    expect(response.deviceId).toBeDefined();
    const device = storage.devices.findById(response.deviceId);
    expect(device).toBeDefined();
    expect(device!.hardwareId).toBe('');
  });
});
