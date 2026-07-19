/**
 * DeviceEventType — All device-related event types.
 * Using an enum prevents string typos and enables IDE autocompletion.
 */
export enum DeviceEventType {
  Registered = 'device.registered',
  Authenticated = 'device.authenticated',
  Heartbeat = 'device.heartbeat',
  Disconnected = 'device.disconnected',
  Diagnostics = 'device.diagnostics',
  CommandAcknowledged = 'device.command.acknowledged',
  CommandFailed = 'device.command.failed',
}
