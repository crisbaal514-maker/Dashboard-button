/**
 * POST /v1/devices/:deviceId/heartbeat — Request
 * Sent periodically by the device to indicate it's alive.
 */
export interface HeartbeatRequest {
  /** Monotonic heartbeat sequence number */
  sequence: number;

  /** WiFi RSSI in dBm */
  rssi?: number;

  /** Device IP address */
  ip?: string;

  /** Device uptime in milliseconds */
  uptime?: number;

  /** Current firmware version */
  firmware?: string;
}
