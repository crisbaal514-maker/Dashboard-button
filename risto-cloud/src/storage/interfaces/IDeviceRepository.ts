export interface DeviceRow {
  id: string;
  hardwareId: string;
  model: string;
  firmwareVersion: string;
  apiKeyHash: string | null;
  lastIp: string | null;
  lastRssi: number | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  config: Record<string, unknown>;
  configVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeviceInput {
  id: string;
  hardwareId: string;
  model: string;
  firmwareVersion: string;
  apiKeyHash?: string;
}

export interface UpdateDeviceInput {
  firmwareVersion?: string;
  lastIp?: string;
  lastRssi?: number;
  isOnline?: boolean;
  lastSeenAt?: string;
  config?: Record<string, unknown>;
  configVersion?: number;
}

export interface IDeviceRepository {
  create(input: CreateDeviceInput): DeviceRow;
  findById(id: string): DeviceRow | undefined;
  findByHardwareId(hardwareId: string): DeviceRow | undefined;
  update(id: string, input: UpdateDeviceInput): DeviceRow | undefined;
  delete(id: string): boolean;
  listOnline(): DeviceRow[];
  listAll(): DeviceRow[];
}
