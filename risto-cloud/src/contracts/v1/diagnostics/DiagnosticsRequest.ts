/**
 * POST /v1/devices/:deviceId/diagnostics — Request
 */
export interface DiagnosticsRequest {
  /** Device uptime in milliseconds */
  uptimeMs: number;

  /** Free heap memory in bytes */
  freeHeap: number;

  /** WiFi RSSI */
  wifiRssi: number;

  /** Connected WiFi SSID */
  wifiSsid?: string;

  /** Firmware version */
  firmwareVersion: string;

  /** Hardware revision */
  hardwareRevision?: string;

  /** Last error message (if any) */
  lastError?: string;

  /** Number of reboots since last report */
  rebootCount?: number;
}
