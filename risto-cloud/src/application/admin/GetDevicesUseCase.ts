import type { StorageProvider } from '../../storage/StorageProvider.js';
import type { DeviceRow } from '../../storage/interfaces/IDeviceRepository.js';
import type { HeartbeatRow } from '../../storage/interfaces/IHeartbeatRepository.js';

export interface DeviceListItem {
  id: string;
  hardwareId: string;
  model: string;
  firmwareVersion: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  lastIp: string | null;
  lastRssi: number | null;
  uptime: number | null;
}

/**
 * GetDevicesUseCase — Lista todos los dispositivos con su último heartbeat.
 */
export class GetDevicesUseCase {
  constructor(private storage: StorageProvider) {}

  execute(): DeviceListItem[] {
    const devices = this.storage.devices.listAll();
    return devices.map((d) => {
      const latestHb = this.storage.heartbeats.getLatestForDevice(d.id);
      return this.toListItem(d, latestHb);
    });
  }

  private toListItem(device: DeviceRow, latestHb: HeartbeatRow | undefined): DeviceListItem {
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
    };
  }
}
