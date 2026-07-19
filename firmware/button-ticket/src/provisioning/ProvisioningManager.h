#pragma once

#include <Arduino.h>
#include "Constants.h"
#include "device/Device.h"
#include "storage/StorageManager.h"
#include "cloud/CloudClient.h"

class ProvisioningManager {
public:
    ProvisioningManager(Device& device, CloudClient* cloudClient);
    ~ProvisioningManager();

    void setup();
    void loop();

    bool isProvisioned() const;
    bool startRegistration();
    bool resetRegistration();
    const char* getDeviceId() const;
    void loadFromStorage();

private:
    Device& _device;
    CloudClient* _cloudClient;
    bool _provisioned;
    unsigned long _retryTimer;
    int _retryCount;
    bool _registrationPending;
    bool _connectToCloudPending;
    unsigned long _setupStartTime;

    void saveToStorage(const char* deviceId, const char* accessToken, const char* refreshToken);
    void clearStorage();
    void attemptRegistration();
};
