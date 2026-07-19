#pragma once

// ===========================================
// Risto Devices — Build Information
// ===========================================
// Auto-populated by platformio.ini build flags.
// Provides version, build time, and compile metadata
// that can be reported in heartbeats and logs.
// ===========================================

#ifndef FIRMWARE_VERSION
#define FIRMWARE_VERSION RISTO_FIRMWARE_VERSION
#endif

#ifndef BUILD_TIME
#define BUILD_TIME __DATE__ " " __TIME__
#endif

#ifndef BUILD_COMMIT
#define BUILD_COMMIT "unknown"
#endif

/**
 * BuildInfo — compile-time metadata accessor.
 * Usage:  log.info("Build", BuildInfo::version);
 *         log.info("Build", BuildInfo::buildTime);
 */
struct BuildInfo {
    static constexpr const char* version   = FIRMWARE_VERSION;
    static constexpr const char* buildTime = BUILD_TIME;
    static constexpr const char* commit    = BUILD_COMMIT;
    static constexpr const char* deviceType = DEVICE_TYPE;
};
