#include "Device.h"
#include "Logger.h"
#include "Constants.h"
#include "storage/StorageManager.h"
#include <WiFi.h>
#include <esp_system.h>

Device::Device()
    : _state(DeviceState::BOOT)
    , _bootTime(0)
    , _bootCount(0)
    , _lastBootTimestamp(0)
    , _resetReason(ESP_RST_POWERON)
    , _safeMode(false) {
    clearNetworkInfo();
    _registration.isRegistered = false;
    _registration.deviceId[0] = '\0';
}

Device::~Device() {
}

void Device::setup() {
    _bootTime = millis();
    _state = DeviceState::BOOT;
    populateDeviceInfo();

    Logger log;
    log.info("Device", "=====================================");
    log.info("Device", "Device Identity");
    log.info("Device", "=====================================");
    log.info("Device", _info.deviceName);
    log.info("Device", _info.model);
    log.info("Device", _info.manufacturer);
    log.info("Device", _info.firmwareVersion);
    log.info("Device", _info.chipId);
    log.info("Device", _info.macAddress);

    char regBuf[48];
    snprintf(regBuf, sizeof(regBuf), "Type: %s Rev: %s Proto: v%u",
             _info.deviceType, _info.hardwareRevision, _info.protocolVersion);
    log.info("Device", regBuf);

    snprintf(regBuf, sizeof(regBuf), "Registered: %s", _info.isRegistered ? "YES" : "NO");
    log.info("Device", regBuf);
    log.info("Device", "=====================================");

    // Transition to INIT after boot
    setState(DeviceState::INIT);
}

void Device::loop() {
}

DeviceState Device::getState() const {
    return _state;
}

void Device::setState(DeviceState newState) {
    DeviceState oldState = _state;
    if (oldState != newState) {
        _state = newState;
        logStateChange(oldState, newState);
    }
}

unsigned long Device::getUptimeMs() const {
    return millis() - _bootTime;
}

const char* Device::getStateString() const {
    switch (_state) {
        case DeviceState::BOOT:            return "BOOT";
        case DeviceState::INIT:            return "INIT";
        case DeviceState::UNREGISTERED:    return "UNREGISTERED";
        case DeviceState::REGISTERED:      return "REGISTERED";
        case DeviceState::CONNECTING:      return "CONNECTING";
        case DeviceState::REGISTERING:     return "REGISTERING";
        case DeviceState::ONLINE:          return "ONLINE";
        case DeviceState::READY:           return "READY";
        case DeviceState::PRINTING:        return "PRINTING";
        case DeviceState::OFFLINE:         return "OFFLINE";
        case DeviceState::RECONNECTING:    return "RECONNECTING";
        case DeviceState::ERROR:           return "ERROR";
        case DeviceState::OTA:             return "OTA";
        case DeviceState::FACTORY_RESET:   return "FACTORY_RESET";
        default:                           return "UNKNOWN";
    }
}

const NetworkInfo& Device::getNetworkInfo() const {
    return _networkInfo;
}

void Device::setNetworkInfo(const NetworkInfo& info) {
    _networkInfo = info;
}

const DeviceInfo& Device::getInfo() const {
    return _info;
}

const RegistrationInfo& Device::getRegistration() const {
    return _registration;
}

void Device::setRegistration(const RegistrationInfo& reg) {
    _registration = reg;
    _info.isRegistered = reg.isRegistered;
}

void Device::trackBoot() {
    _resetReason = esp_reset_reason();
    
    StorageManager& storage = StorageManager::getInstance();

    // Clear safe mode from previous debug sessions
    storage.setBool(RISTO_STORAGE_KEY_SAFE_MODE, false);
    storage.setUInt32(RISTO_STORAGE_KEY_BOOT_COUNT, 0);
    
    // Read boot count from NVS (will be 0 after clear)
    _bootCount = storage.getUInt32(RISTO_STORAGE_KEY_BOOT_COUNT, 0);
    _lastBootTimestamp = storage.getUInt32(RISTO_STORAGE_KEY_LAST_BOOT_TS, 0);
    _safeMode = storage.getBool(RISTO_STORAGE_KEY_SAFE_MODE, false);
    
    unsigned long now = millis();
    unsigned long elapsed = (_lastBootTimestamp > 0) ? (now - _lastBootTimestamp) : 0;
    
    // If previous boot was within window, increment counter; otherwise reset
    if (elapsed < RISTO_BOOT_WINDOW_MS && _lastBootTimestamp > 0) {
        _bootCount++;
    } else {
        _bootCount = 1;
    }
    
    _lastBootTimestamp = now;
    
    // Check if we should enter safe mode
    if (_bootCount >= RISTO_BOOT_THRESHOLD) {
        _safeMode = true;
        Logger log;
        log.warn("Device", "SAFE MODE ENABLED — repeated boot detected");
    }
    
    // Auto-clear safe mode if we've been running stably for > 1 boot window
    if (_safeMode && elapsed > RISTO_BOOT_WINDOW_MS) {
        _safeMode = false;
        _bootCount = 0;
        Logger().info("Device", "Boot window expired — safe mode cleared");
    }

    // Persist
    storage.setUInt32(RISTO_STORAGE_KEY_BOOT_COUNT, _bootCount);
    storage.setUInt32(RISTO_STORAGE_KEY_LAST_BOOT_TS, _lastBootTimestamp);
    storage.setBool(RISTO_STORAGE_KEY_SAFE_MODE, _safeMode);
    
    // Store reset reason as string
    const char* reasonStr = getLastResetReasonStr();
    storage.setString(RISTO_STORAGE_KEY_LAST_RESET_REASON, reasonStr);
    
    Logger log;
    char buf[96];
    snprintf(buf, sizeof(buf), "Boot #%u reason=%s safeMode=%s",
             _bootCount, reasonStr, _safeMode ? "YES" : "NO");
    log.info("Device", buf);
}

uint32_t Device::getBootCount() const {
    return _bootCount;
}

const char* Device::getLastResetReasonStr() const {
    switch (_resetReason) {
        case ESP_RST_POWERON:    return "POWER_ON";
        case ESP_RST_EXT:        return "EXT_PIN";
        case ESP_RST_SW:         return "SOFTWARE";
        case ESP_RST_PANIC:      return "PANIC";
        case ESP_RST_INT_WDT:    return "INT_WDT";
        case ESP_RST_TASK_WDT:   return "TASK_WDT";
        case ESP_RST_WDT:        return "WDT";
        case ESP_RST_DEEPSLEEP:  return "DEEP_SLEEP";
        case ESP_RST_BROWNOUT:   return "BROWNOUT";
        case ESP_RST_SDIO:       return "SDIO";
        default:                 return "UNKNOWN";
    }
}

bool Device::isSafeMode() const {
    return _safeMode;
}

void Device::markRegistered(const char* deviceId) {
    _registration.isRegistered = true;
    strncpy(_registration.deviceId, deviceId, sizeof(_registration.deviceId) - 1);
    _registration.deviceId[sizeof(_registration.deviceId) - 1] = '\0';
    _info.isRegistered = true;

    Logger log;
    char buf[64];
    snprintf(buf, sizeof(buf), "Device registered as: %s", deviceId);
    log.info("Device", buf);
}

void Device::markUnregistered() {
    _registration.isRegistered = false;
    _registration.deviceId[0] = '\0';
    _info.isRegistered = false;

    Logger log;
    log.info("Device", "Device marked as UNREGISTERED");
}

void Device::logStateChange(DeviceState oldState, DeviceState newState) {
    Logger log;
    char buf[64];
    snprintf(buf, sizeof(buf), "%s -> %s",
             getStateString(),
             (newState == DeviceState::BOOT ? "BOOT" :
              newState == DeviceState::INIT ? "INIT" :
              newState == DeviceState::UNREGISTERED ? "UNREGISTERED" :
              newState == DeviceState::REGISTERED ? "REGISTERED" :
              newState == DeviceState::REGISTERING ? "REGISTERING" :
              newState == DeviceState::READY ? "READY" :
              newState == DeviceState::ONLINE ? "ONLINE" :
              newState == DeviceState::OFFLINE ? "OFFLINE" : "?"));
    log.info("Device", buf);
}

void Device::clearNetworkInfo() {
    _networkInfo.connected = false;
    _networkInfo.ssid[0] = '\0';
    _networkInfo.mac[0] = '\0';
    _networkInfo.hostname[0] = '\0';
    _networkInfo.rssi = 0;
}

void Device::populateDeviceInfo() {
    uint64_t chipMac = ESP.getEfuseMac();
    snprintf(_info.chipId, sizeof(_info.chipId), "%016llX", chipMac);

    uint8_t mac[6];
    esp_efuse_mac_get_default(mac);
    snprintf(_info.macAddress, sizeof(_info.macAddress),
             "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    strncpy(_info.model, "ESP32-S3", sizeof(_info.model));
    _info.model[sizeof(_info.model) - 1] = '\0';

    strncpy(_info.firmwareVersion, RISTO_FIRMWARE_VERSION, sizeof(_info.firmwareVersion));
    _info.firmwareVersion[sizeof(_info.firmwareVersion) - 1] = '\0';

    strncpy(_info.manufacturer, MANUFACTURER, sizeof(_info.manufacturer));
    _info.manufacturer[sizeof(_info.manufacturer) - 1] = '\0';

    strncpy(_info.deviceName, RISTO_DEVICE_NAME, sizeof(_info.deviceName));
    _info.deviceName[sizeof(_info.deviceName) - 1] = '\0';

    // RP-1001B.1: new fields
    strncpy(_info.deviceType, DEVICE_TYPE, sizeof(_info.deviceType));
    _info.deviceType[sizeof(_info.deviceType) - 1] = '\0';

    strncpy(_info.hardwareRevision, HARDWARE_REVISION, sizeof(_info.hardwareRevision));
    _info.hardwareRevision[sizeof(_info.hardwareRevision) - 1] = '\0';

    _info.protocolVersion = RISTO_PROTOCOL_VERSION;
    _info.isRegistered = false;
}
