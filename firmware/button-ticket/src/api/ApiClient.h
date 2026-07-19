#pragma once

#include <Arduino.h>

// ===========================================
// Risto Devices - ApiClient
// ===========================================
// HTTP client for communicating with Risto Cloud.
// Sends events via POST and polls commands via GET.
// All communication uses HTTPS with JSON payloads.
// ===========================================

class ApiClient {
public:
    ApiClient();
    ~ApiClient();

    void setup();
    void loop();

    bool sendEvent(const String& eventType, const String& payload);
    String pollCommands();
    bool checkFirmwareUpdate();

private:
    String _baseUrl;
    String _apiKey;
    unsigned long _lastPollTime;
    unsigned long _pollIntervalMs;

    bool httpPost(const String& endpoint, const String& body, String& response);
    bool httpGet(const String& endpoint, String& response);
};


