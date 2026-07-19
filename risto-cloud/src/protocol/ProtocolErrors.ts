/**
 * Protocol error types.
 */
export enum ProtocolErrorType {
  /** Version number is invalid (not a positive integer) */
  INVALID_VERSION = 'INVALID_VERSION',
  /** Client version is below minimum supported */
  VERSION_TOO_LOW = 'VERSION_TOO_LOW',
  /** Client version is above maximum supported */
  VERSION_TOO_HIGH = 'VERSION_TOO_HIGH',
  /** Required header is missing */
  MISSING_HEADER = 'MISSING_HEADER',
  /** Header value is invalid */
  INVALID_HEADER = 'INVALID_HEADER',
}

/**
 * Protocol error structure.
 */
export interface ProtocolError {
  type: ProtocolErrorType;
  message: string;
  minVersion?: number;
  maxVersion?: number;
}

/**
 * HTTP status codes for protocol errors.
 */
export const PROTOCOL_ERROR_STATUS: Record<ProtocolErrorType, number> = {
  [ProtocolErrorType.INVALID_VERSION]: 400,
  [ProtocolErrorType.VERSION_TOO_LOW]: 426, // Upgrade Required
  [ProtocolErrorType.VERSION_TOO_HIGH]: 426, // Upgrade Required
  [ProtocolErrorType.MISSING_HEADER]: 400,
  [ProtocolErrorType.INVALID_HEADER]: 400,
};

/**
 * Create a 426 Upgrade Required response body.
 */
export function createUpgradeRequiredResponse(error: ProtocolError): Record<string, unknown> {
  return {
    error: 'upgrade_required',
    message: error.message,
    minVersion: error.minVersion,
    maxVersion: error.maxVersion,
  };
}
