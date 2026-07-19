#include "ProvisioningManager.h"
#include "Logger.h"
#include <WiFi.h>

#define RETRY_DELAY_BASE 2000

ProvisioningManager::ProvisioningManager(Device& device, CloudClient* cloudClient)
    : _device(device)
    , _cloudClient(cloudClient)
    , _provisioned(false)
    , _retryTimer(0)
    , _retryCount(0)
    , _registrationPending(false)
    , _connectToCloudPending(false)
    , _setupStartTime(0) {
}

ProvisioningManager::~ProvisioningManager() {
}

void ProvisioningManager::setup() {
    _setupStartTime = millis();
    Logger log;

    log.info("Provisioning", "=================================");
    log.info("Provisioning", "ProvisioningManager::setup()");
    log.info("Provisioning", "=================================");

    // 1. Read state from NVS
    log.info("Provisioning", "Reading registration state from NVS...");
    loadFromStorage();

    // 2. Decide initial state
    if (_provisioned) {
        log.info("Provisioning", "Device already provisioned (tokens found in NVS)");
        _device.setState(DeviceState::REGISTERED);

        // Push credentials into CloudClient for direct heartbeat
        if (_cloudClient) {
            StorageManager& storage = StorageManager::getInstance();
            String devId = storage.getString(RISTO_STORAGE_KEY_DEVICE_ID, "");
            String accTok = storage.getString(RISTO_STORAGE_KEY_ACCESS_TOKEN, "");
            String refTok = storage.getString(RISTO_STORAGE_KEY_REFRESH_TOKEN, "");
            _cloudClient->setCredentials(devId.c_str(), accTok.c_str(), refTok.c_str());
            log.info("Provisioning", "Credentials pushed to CloudClient");
        }

        _device.markRegistered(_device.getRegistration().deviceId);
        log.info("Provisioning", "Skipping registration. Ready for heartbeat.");

        // Defer cloud connection until WiFi is actually connected (in loop())
        _connectToCloudPending = true;
        log.info("Provisioning", "Cloud connection deferred until WiFi is ready.");
    } else {
        log.info("Provisioning", "No registration found. Will register with cloud.");
        _device.setState(DeviceState::UNREGISTERED);
        _registrationPending = true;
    }

    unsigned long elapsed = millis() - _setupStartTime;
    char timeBuf[32];
    snprintf(timeBuf, sizeof(timeBuf), "ProvisioningManager ready (%lu ms)", elapsed);
    log.info("Provisioning", timeBuf);
}

void ProvisioningManager::loop() {
    // If provisioned but waiting for WiFi to connect to cloud
    if (_connectToCloudPending && WiFi.status() == WL_CONNECTED) {
        _connectToCloudPending = false;
        Logger log;
        log.info("Provisioning", "WiFi connected. Connecting to cloud...");
        if (_cloudClient) {
            _cloudClient->connectToCloud();
        }
    }

    if (_registrationPending && !_provisioned) {
        if (_retryTimer == 0) {
            _retryTimer = millis();
        }

        unsigned long now = millis();
        unsigned long delay = RETRY_DELAY_BASE * (_retryCount + 1);
        if (delay > 30000) delay = 30000;

        if (now - _retryTimer >= delay) {
            _retryTimer = now;
            attemptRegistration();
        }
    }
}

bool ProvisioningManager::isProvisioned() const {
    return _provisioned;
}

bool ProvisioningManager::startRegistration() {
    if (_provisioned) return true;

    Logger log;
    log.info("Provisioning", "=================================");
    log.info("Provisioning", "Starting real cloud registration...");
    log.info("Provisioning", "=================================");

    if (!_cloudClient) {
        log.error("Provisioning", "CloudClient not available — cannot register");
        return false;
    }

    // Connect to cloud — this triggers HTTP POST /v1/devices/register
    if (!_cloudClient->connectToCloud()) {
        log.error("Provisioning", "Cloud registration failed");
        return false;
    }

    // CloudClient now has deviceId, accessToken, refreshToken
    const char* deviceId = _cloudClient->getDeviceId();
    const char* accessToken = _cloudClient->getAccessToken();

    if (strlen(deviceId) == 0 || strlen(accessToken) == 0) {
        log.error("Provisioning", "Registration succeeded but tokens are empty");
        return false;
    }

    const CloudClientContext& ctx = _cloudClient->getContext();

    // Save to NVS
    log.info("Provisioning", "Saving registration to NVS...");
    saveToStorage(deviceId, ctx.accessToken, ctx.refreshToken);

    // Mark device as registered
    _device.markRegistered(deviceId);
    _device.setState(DeviceState::REGISTERED);
    _provisioned = true;
    _registrationPending = false;

    log.info("Provisioning", "Registration complete. Device is ONLINE.");
    log.info("Provisioning", "=================================");

    return true;
}

bool ProvisioningManager::resetRegistration() {
    Logger log;
    log.info("Provisioning", "Factory reset requested");

    clearStorage();
    if (_cloudClient) {
        _cloudClient->forceReRegistration();
    }
    _device.markUnregistered();
    _device.setState(DeviceState::FACTORY_RESET);
    _provisioned = false;
    _registrationPending = true;
    _retryCount = 0;
    _retryTimer = 0;

    log.info("Provisioning", "Registration cleared. Device reset.");
    return true;
}

const char* ProvisioningManager::getDeviceId() const {
    return _device.getRegistration().deviceId;
}

// ---- Private ----

void ProvisioningManager::loadFromStorage() {
    StorageManager& storage = StorageManager::getInstance();

    // Check if we have a registered deviceId + accessToken
    if (storage.exists(RISTO_STORAGE_KEY_REGISTERED)) {
        bool reg = storage.getBool(RISTO_STORAGE_KEY_REGISTERED, false);
        String devId = storage.getString(RISTO_STORAGE_KEY_DEVICE_ID, "");
        String accTok = storage.getString(RISTO_STORAGE_KEY_ACCESS_TOKEN, "");

        if (reg && devId.length() > 0 && accTok.length() > 0) {
            _provisioned = true;
            _device.markRegistered(devId.c_str());

            Logger log;
            char buf[64];
            snprintf(buf, sizeof(buf), "NVS: deviceId=%s, token len=%u",
                     devId.c_str(), accTok.length());
            log.info("Provisioning", buf);
        } else {
            Logger().warn("Provisioning", "NVS: partial registration data found, will re-register");
        }
    }
}

void ProvisioningManager::saveToStorage(const char* deviceId, const char* accessToken,
                                         const char* refreshToken) {
    StorageManager& storage = StorageManager::getInstance();
    storage.setBool(RISTO_STORAGE_KEY_REGISTERED, true);
    storage.setString(RISTO_STORAGE_KEY_DEVICE_ID, deviceId);
    storage.setString(RISTO_STORAGE_KEY_ACCESS_TOKEN, accessToken);
    if (refreshToken && strlen(refreshToken) > 0) {
        storage.setString(RISTO_STORAGE_KEY_REFRESH_TOKEN, refreshToken);
    }

    Logger log;
    char buf[64];
    snprintf(buf, sizeof(buf), "Saved to NVS: devId=%s, accTok=%u chars",
             deviceId, strlen(accessToken));
    log.info("Provisioning", buf);
}

void ProvisioningManager::clearStorage() {
    StorageManager& storage = StorageManager::getInstance();
    storage.setBool(RISTO_STORAGE_KEY_REGISTERED, false);
    storage.remove(RISTO_STORAGE_KEY_DEVICE_ID);
    storage.remove(RISTO_STORAGE_KEY_ACCESS_TOKEN);
    storage.remove(RISTO_STORAGE_KEY_REFRESH_TOKEN);

    Logger log;
    log.info("Provisioning", "Registration cleared from NVS");
}

void ProvisioningManager::attemptRegistration() {
    Logger log;

    char buf[56];

    if (_retryCount >= RISTO_MAX_RETRIES) {
        log.warn("Provisioning", "Max retries reached. Going OFFLINE.");
        _device.setState(DeviceState::OFFLINE);
        _registrationPending = false;
        return;
    }

    _retryCount++;
    _device.setState(DeviceState::REGISTERING);

    unsigned long t1 = millis();
    snprintf(buf, sizeof(buf), "Attempt #%d", _retryCount);
    log.info("Provisioning", buf);

    // Attempt real registration via CloudClient
    if (_cloudClient && startRegistration()) {
        log.info("Provisioning", "Registration successful! Device ONLINE.");
        _device.setState(DeviceState::ONLINE);
        _registrationPending = false;

        log.info("Provisioning", "Restarting ESP32 in 1 second to test NVS persistence...");
        log.info("Provisioning", "=================================");
        delay(1000);
        ESP.restart();
    } else {
        unsigned long waitTime = RETRY_DELAY_BASE * (_retryCount + 1);
        snprintf(buf, sizeof(buf), "Registration failed. Will retry in %lu ms...", waitTime);
        log.warn("Provisioning", buf);
    }
}
