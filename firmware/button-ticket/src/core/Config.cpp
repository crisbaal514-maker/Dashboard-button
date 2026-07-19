#include "Config.h"
#include "Constants.h"

// ===========================================
// Config Implementation
// ===========================================

Config::Config() {
    loadDefaults();
}

Config::~Config() {
}

void Config::setup() {
    // Future: load persisted config from NVS or LittleFS
}

void Config::loop() {
    // Config loop is idle; could watch for remote config updates.
}

void Config::loadDefaults() {
    _config.deviceId = "bt-001";
    _config.deviceType = RISTO_DEVICE_NAME;
    _config.firmwareVersion = RISTO_FIRMWARE_VERSION;
    _config.wifiSsid = WIFI_SSID;
    _config.wifiPassword = WIFI_PASSWORD;
    _config.apiBaseUrl = "";
    _config.apiKey = "";
    _config.heartbeatIntervalMs = RISTO_HEARTBEAT_INTERVAL_MS;
    _config.buttonDebounceMs = RISTO_BUTTON_DEBOUNCE_MS;
    _config.printerTimeoutMs = 5000;
    _config.isOfflineMode = true;
}

const DeviceConfig& Config::get() const {
    return _config;
}

void Config::setWifiCredentials(const String& ssid, const String& password) {
    _config.wifiSsid = ssid;
    _config.wifiPassword = password;
}

void Config::setApiConfig(const String& baseUrl, const String& apiKey) {
    _config.apiBaseUrl = baseUrl;
    _config.apiKey = apiKey;
}
