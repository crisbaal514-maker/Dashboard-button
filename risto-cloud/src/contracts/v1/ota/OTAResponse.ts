/**
 * POST /v1/devices/:deviceId/ota — Response (200 OK)
 * If an update is available, the server will include it here.
 */
export interface OTAResponse {
  /** Whether an update is available */
  updateAvailable: boolean;

  /** Target firmware version */
  targetVersion?: string;

  /** Firmware download URL */
  firmwareUrl?: string;

  /** Firmware file checksum (SHA-256) */
  checksum?: string;

  /** Firmware file size in bytes */
  size?: number;

  /** Changelog / release notes */
  changelog?: string;
}
