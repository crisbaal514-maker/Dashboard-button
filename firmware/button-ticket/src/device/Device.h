#pragma once

#include <Arduino.h>
#include <IPAddress.h>
#include <esp_system.h>
#include "Constants.h"

struct RegistrationInfo {
    bool isRegistered;
    char deviceId[32];
};

struct NetworkInfo {
    bool connected;
    char ssid[32];
    IPAddress localIP;
    IPAddress gateway;
    IPAddress dns;
    char mac[18];
    char hostname[64];
    int rssi;
};

struct DeviceInfo {
    char chipId[16];
    char macAddress[18];
    char model[32];
    char firmwareVersion[16];
    char manufacturer[32];
    char deviceName[32];
    char deviceType[16];
    char hardwareRevision[8];
    uint32_t protocolVersion;
    bool isRegistered;
};

class Device {
public:
    Device();
    ~Device();

    void setup();
    void loop();

    DeviceState getState() const;
    void setState(DeviceState newState);

    unsigned long getUptimeMs() const;
    const char* getStateString() const;

    const NetworkInfo& getNetworkInfo() const;
    void setNetworkInfo(const NetworkInfo& info);

    const DeviceInfo& getInfo() const;
    const RegistrationInfo& getRegistration() const;
    void setRegistration(const RegistrationInfo& reg);

    // RP-1001B.1: helper
    void markRegistered(const char* deviceId);
    void markUnregistered();

    // RP-1003K: Boot counter + reset reason
    void trackBoot();
    uint32_t getBootCount() const;
    const char* getLastResetReasonStr() const;
    bool isSafeMode() const;

private:
    DeviceState _state;
    unsigned long _bootTime;
    NetworkInfo _networkInfo;
    DeviceInfo _info;
    RegistrationInfo _registration;

    // Boot tracking
    uint32_t _bootCount;
    uint32_t _lastBootTimestamp;
    esp_reset_reason_t _resetReason;
    bool _safeMode;

    void logStateChange(DeviceState oldState, DeviceState newState);
    void clearNetworkInfo();
    void populateDeviceInfo();
};
