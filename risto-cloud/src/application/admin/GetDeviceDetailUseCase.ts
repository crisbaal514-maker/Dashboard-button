import type { StorageProvider } from '../../storage/StorageProvider.js';
import type { DeviceRow } from '../../storage/interfaces/IDeviceRepository.js';
import type { HeartbeatRow } from '../../storage/interfaces/IHeartbeatRepository.js';

export interface DeviceDetail {
  id: string;
  hardwareId: string;
  model: string;
  firmwareVersion: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  lastIp: string | null;
  lastRssi: number | null;
  uptime: number | null;
  createdAt: string;
  updatedAt: string;
  recentHeartbeats: HeartbeatRow[];
}

/**
 * GetDeviceDetailUseCase — Información detallada de un dispositivo.
 */
export class GetDeviceDetailUseCase {
  constructor(private storage: StorageProvider) {}

  execute(deviceId: string): DeviceDetail | null {
    const device = this.storage.devices.findById(deviceId);
    if (!device) return null;

    const latestHb = this.storage.heartbeats.getLatestForDevice(deviceId);
    const recentHeartbeats = this.storage.heartbeats.findByDeviceId(deviceId, 10);

    return {
      id: device.id,
      hardwareId: device.hardwareId,
      model: device.model,
      firmwareVersion: device.firmwareVersion,
      isOnline: device.isOnline,
      lastSeenAt: device.lastSeenAt,
      lastIp: device.lastIp ?? latestHb?.ip ?? null,
      lastRssi: device.lastRssi ?? latestHb?.rssi ?? null,
      uptime: latestHb?.uptime ?? null,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
      recentHeartbeats,
    };
  }
}
