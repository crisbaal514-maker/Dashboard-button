#include "StorageManager.h"
#include "Logger.h"
#include "Constants.h"
#include <Preferences.h>
#include <nvs_flash.h>

// ===========================================
// StorageManager Implementation
// ===========================================
// Encapsulates all NVS access behind a stable API.
// Singleton: use StorageManager::getInstance().
// Includes robust initialization with retry.
// ===========================================

static Preferences prefs;
static const char* NVS_NAMESPACE = "risto";
static const int NVS_MAX_RETRIES = 3;

StorageManager& StorageManager::getInstance() {
    static StorageManager instance;
    return instance;
}

StorageManager::StorageManager()
    : _initialized(false) {
}

StorageManager::~StorageManager() {
    end();
}

void StorageManager::begin() {
    if (_initialized) return;

    Logger log;
    log.info("Storage", "Initializing NVS storage...");

    // Robust NVS init: retry up to NVS_MAX_RETRIES times,
    // then try erasing and re-initializing.
    bool ok = false;
    for (int attempt = 0; attempt < NVS_MAX_RETRIES; attempt++) {
        if (prefs.begin(NVS_NAMESPACE, false)) {
            ok = true;
            break;
        }
        log.warn("Storage", "NVS begin() failed, retrying...");
        delay(100);
    }

    if (!ok) {
        log.warn("Storage", "NVS begin() failed after retries, erasing and retrying...");
        esp_err_t err = nvs_flash_erase();
        if (err != ESP_OK) {
            log.error("Storage", "NVS erase failed");
        } else {
            // Re-init NVS after erase
            err = nvs_flash_init();
            if (err != ESP_OK) {
                log.error("Storage", "NVS re-init after erase failed");
            } else {
                if (prefs.begin(NVS_NAMESPACE, false)) {
                    ok = true;
                    log.info("Storage", "NVS recovered after erase");
                }
            }
        }
    }

    _initialized = ok;
    if (ok) {
        log.info("Storage", "NVS storage ready.");
    } else {
        log.error("Storage", "NVS storage FAILED — device may not persist credentials");
    }
}

void StorageManager::end() {
    if (_initialized) {
        prefs.end();
        _initialized = false;
    }
}

bool StorageManager::exists(const char* key) {
    if (!_initialized) return false;
    return prefs.isKey(key);
}

bool StorageManager::remove(const char* key) {
    if (!_initialized) return false;
    return prefs.remove(key);
}

void StorageManager::clear() {
    if (!_initialized) return;
    prefs.clear();
}

void StorageManager::setString(const char* key, const char* value) {
    if (!_initialized) return;
    prefs.putString(key, value);
}

String StorageManager::getString(const char* key, const char* defaultValue) {
    if (!_initialized) return String(defaultValue);
    return prefs.getString(key, defaultValue);
}

void StorageManager::setBool(const char* key, bool value) {
    if (!_initialized) return;
    prefs.putBool(key, value);
}

bool StorageManager::getBool(const char* key, bool defaultValue) {
    if (!_initialized) return defaultValue;
    return prefs.getBool(key, defaultValue);
}

void StorageManager::setInt(const char* key, int32_t value) {
    if (!_initialized) return;
    prefs.putInt(key, value);
}

int32_t StorageManager::getInt(const char* key, int32_t defaultValue) {
    if (!_initialized) return defaultValue;
    return prefs.getInt(key, defaultValue);
}

void StorageManager::setUInt32(const char* key, uint32_t value) {
    if (!_initialized) return;
    prefs.putUInt(key, value);
}

uint32_t StorageManager::getUInt32(const char* key, uint32_t defaultValue) {
    if (!_initialized) return defaultValue;
    return prefs.getUInt(key, defaultValue);
}

void StorageManager::setUInt64(const char* key, uint64_t value) {
    if (!_initialized) return;
    prefs.putULong64(key, value);
}

uint64_t StorageManager::getUInt64(const char* key, uint64_t defaultValue) {
    if (!_initialized) return defaultValue;
    return prefs.getULong64(key, defaultValue);
}

void StorageManager::setFloat(const char* key, float value) {
    if (!_initialized) return;
    prefs.putFloat(key, value);
}

float StorageManager::getFloat(const char* key, float defaultValue) {
    if (!_initialized) return defaultValue;
    return prefs.getFloat(key, defaultValue);
}
