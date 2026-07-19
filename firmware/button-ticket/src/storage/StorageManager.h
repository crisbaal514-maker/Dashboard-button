#pragma once

#include <Arduino.h>

// ===========================================
// Risto Platform - StorageManager
// ===========================================
// Singleton service for persistent key-value storage.
// Encapsulates NVS (Preferences) behind a stable API.
// If the backend changes (e.g. LittleFS, FRAM),
// only this file and its implementation change.
// ===========================================

class StorageManager {
public:
    static StorageManager& getInstance();

    void begin();
    void end();

    bool exists(const char* key);
    bool remove(const char* key);
    void clear();

    void setString(const char* key, const char* value);
    String getString(const char* key, const char* defaultValue = "");

    void setBool(const char* key, bool value);
    bool getBool(const char* key, bool defaultValue = false);

    void setInt(const char* key, int32_t value);
    int32_t getInt(const char* key, int32_t defaultValue = 0);

    void setUInt32(const char* key, uint32_t value);
    uint32_t getUInt32(const char* key, uint32_t defaultValue = 0);

    void setUInt64(const char* key, uint64_t value);
    uint64_t getUInt64(const char* key, uint64_t defaultValue = 0);

    void setFloat(const char* key, float value);
    float getFloat(const char* key, float defaultValue = 0.0f);

private:
    StorageManager();
    ~StorageManager();
    StorageManager(const StorageManager&) = delete;
    StorageManager& operator=(const StorageManager&) = delete;

    bool _initialized;
};
