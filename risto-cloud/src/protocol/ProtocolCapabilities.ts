/**
 * ProtocolCapabilities — Feature flags per protocol version.
 * Defines what features are available at each version level.
 */
export interface ProtocolCapability {
  version: number;
  features: string[];
}

const CAPABILITIES: ProtocolCapability[] = [
  {
    version: 1,
    features: [
      'register',
      'auth',
      'heartbeat',
      'diagnostics',
      'events',
      'config',
      'commands',
      'ota-status',
    ],
  },
];

/**
 * Get capabilities for a specific protocol version.
 */
export function getCapabilities(version: number): ProtocolCapability | undefined {
  return CAPABILITIES.find((c) => c.version === version);
}

/**
 * Check if a feature is supported in a given protocol version.
 */
export function supportsFeature(version: number, feature: string): boolean {
  const caps = getCapabilities(version);
  return caps ? caps.features.includes(feature) : false;
}

/**
 * Get all supported protocol versions.
 */
export function getSupportedVersions(): number[] {
  return CAPABILITIES.map((c) => c.version);
}
