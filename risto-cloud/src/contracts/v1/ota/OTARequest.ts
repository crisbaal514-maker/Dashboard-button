/**
 * POST /v1/devices/:deviceId/ota — Request
 * Device reports OTA status.
 */
export interface OTARequest {
  /** Current firmware version */
  currentVersion: string;

  /** Target firmware version (if update in progress) */
  targetVersion?: string;

  /** OTA status */
  status: 'idle' | 'downloading' | 'installing' | 'success' | 'failed' | 'rollback';

  /** Download progress percentage (0-100) */
  progress?: number;

  /** Error message if failed */
  error?: string;
}
