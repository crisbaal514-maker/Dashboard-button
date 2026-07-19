/**
 * POST /v1/devices/register — Request
 * Sent by the device during initial provisioning.
 * Matches the firmware ProvisioningClient::registerDevice payload.
 */
export interface RegisterRequest {
  /** Unique hardware identifier (MAC address) */
  hardwareId: string;

  /** Firmware version string (e.g., "0.0.2") */
  firmware: string;

  /** Device model/type (e.g., "button-ticket", "kitchen-display") */
  model: string;
}
