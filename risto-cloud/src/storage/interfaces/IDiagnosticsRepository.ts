export interface DiagnosticsRow {
  id: string;
  deviceId: string;
  uptimeMs: number;
  freeHeap: number;
  wifiRssi: number;
  wifiSsid: string | null;
  firmwareVersion: string;
  hardwareRevision: string | null;
  lastError: string | null;
  rebootCount: number | null;
  receivedAt: string;
}

export interface CreateDiagnosticsInput {
  id: string;
  deviceId: string;
  uptimeMs: number;
  freeHeap: number;
  wifiRssi: number;
  wifiSsid?: string;
  firmwareVersion: string;
  hardwareRevision?: string;
  lastError?: string;
  rebootCount?: number;
}

export interface IDiagnosticsRepository {
  create(input: CreateDiagnosticsInput): DiagnosticsRow;
  findByDeviceId(deviceId: string, limit?: number): DiagnosticsRow[];
  getLatestForDevice(deviceId: string): DiagnosticsRow | undefined;
  deleteOlderThan(timestamp: string): number;
}
