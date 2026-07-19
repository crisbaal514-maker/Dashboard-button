export interface HeartbeatRow {
  id: string;
  deviceId: string;
  sequence: number;
  rssi: number | null;
  ip: string | null;
  uptime: number | null;
  firmwareVersion: string | null;
  receivedAt: string;
}

export interface CreateHeartbeatInput {
  id: string;
  deviceId: string;
  sequence: number;
  rssi?: number;
  ip?: string;
  uptime?: number;
  firmwareVersion?: string;
}

export interface IHeartbeatRepository {
  create(input: CreateHeartbeatInput): HeartbeatRow;
  findByDeviceId(deviceId: string, limit?: number): HeartbeatRow[];
  getLatestForDevice(deviceId: string): HeartbeatRow | undefined;
  deleteOlderThan(timestamp: string): number;
}
