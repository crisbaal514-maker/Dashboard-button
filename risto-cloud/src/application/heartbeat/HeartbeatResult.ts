/**
 * HeartbeatResult — Domain result of processing a heartbeat.
 *
 * Independent of any transport contract (HTTP/MQTT).
 * Used by Metrics, Scheduler, Simulator without modifying the ESP32 contract.
 */
export interface HeartbeatResult {
  deviceId: string;
  receivedAt: Date;
  wasOffline: boolean;
  pendingCommands: number;
}
