import {
  MIN_PROTOCOL_VERSION,
  MAX_PROTOCOL_VERSION,
} from './ProtocolDefinitions.js';
import { getSupportedVersions } from './ProtocolCapabilities.js';
import { ProtocolError, ProtocolErrorType } from './ProtocolErrors.js';

/**
 * Result of protocol version negotiation.
 */
export interface NegotiationResult {
  /** The negotiated protocol version */
  version: number;
  /** Whether the negotiation was successful */
  success: boolean;
  /** Error if negotiation failed */
  error?: ProtocolError;
}

/**
 * Negotiate protocol version between client and server.
 *
 * @param clientVersion - The protocol version sent by the client
 * @returns NegotiationResult with the agreed version or error
 */
export function negotiateVersion(clientVersion: number): NegotiationResult {
  // Validate client version is a number
  if (!Number.isInteger(clientVersion) || clientVersion < 1) {
    return {
      version: 0,
      success: false,
      error: {
        type: ProtocolErrorType.INVALID_VERSION,
        message: `Invalid protocol version: ${clientVersion}`,
        minVersion: MIN_PROTOCOL_VERSION,
        maxVersion: MAX_PROTOCOL_VERSION,
      },
    };
  }

  // Check if client version is supported
  const supported = getSupportedVersions();
  const isSupported = supported.includes(clientVersion);

  if (!isSupported) {
    if (clientVersion < MIN_PROTOCOL_VERSION) {
      return {
        version: MIN_PROTOCOL_VERSION,
        success: false,
        error: {
          type: ProtocolErrorType.VERSION_TOO_LOW,
          message: `Protocol version ${clientVersion} is too low. Minimum: ${MIN_PROTOCOL_VERSION}`,
          minVersion: MIN_PROTOCOL_VERSION,
          maxVersion: MAX_PROTOCOL_VERSION,
        },
      };
    }
    if (clientVersion > MAX_PROTOCOL_VERSION) {
      return {
        version: MAX_PROTOCOL_VERSION,
        success: false,
        error: {
          type: ProtocolErrorType.VERSION_TOO_HIGH,
          message: `Protocol version ${clientVersion} is too high. Maximum: ${MAX_PROTOCOL_VERSION}`,
          minVersion: MIN_PROTOCOL_VERSION,
          maxVersion: MAX_PROTOCOL_VERSION,
        },
      };
    }
  }

  return {
    version: clientVersion,
    success: true,
  };
}

/**
 * Extract protocol version from a header value.
 * Returns null if header is missing or invalid.
 */
export function parseProtocolVersion(headerValue: string | undefined): number | null {
  if (!headerValue) return null;
  const num = Number(headerValue);
  return Number.isInteger(num) ? num : null;
}
