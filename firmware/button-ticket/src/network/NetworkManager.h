#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include "core/Constants.h"
#include "core/Logger.h"
#include "device/Device.h"

// ===========================================
// Risto Devices - NetworkManager
// ===========================================
// Manages WiFi connectivity and provides
// connection status to other modules.
// Handles connection lifecycle:
//   BOOT -> CONNECTING -> CONNECTED
//   BOOT -> CONNECTING -> DISCONNECTED
// ===========================================

class NetworkManager {
public:
    NetworkManager();
    ~NetworkManager();

    void setup();
    void loop();

    bool isConnected() const;
    NetworkState getState() const;
    int getSignalStrength() const;
    const char* getSsid() const;

    void setDevice(Device* device);

private:
    NetworkState _state;
    bool _connected;
    int _rssi;
    char _currentSsid[32];
    Device* _device;
    Logger _log;

    void connect();
    void updateSignalStrength();
    void logNetworkInfo();
    void updateDeviceInfo();
};
