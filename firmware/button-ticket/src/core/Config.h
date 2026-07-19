#pragma once

#include <Arduino.h>

// ===========================================
// Risto Devices - Config
// ===========================================
// Stores runtime configuration for the device.
// Configuration values can be updated remotely
// via cloud commands in future versions.
// ===========================================

struct DeviceConfig {
    String deviceId;
    String deviceType;
    String firmwareVersion;
    String wifiSsid;
    String wifiPassword;
    String apiBaseUrl;
    String apiKey;
    unsigned long heartbeatIntervalMs;
    unsigned long buttonDebounceMs;
    unsigned long printerTimeoutMs;
    bool isOfflineMode;
};

class Config {
public:
    Config();
    ~Config();

    void setup();
    void loop();

    const DeviceConfig& get() const;
    void setWifiCredentials(const String& ssid, const String& password);
    void setApiConfig(const String& baseUrl, const String& apiKey);

private:
    DeviceConfig _config;

    void loadDefaults();
};
