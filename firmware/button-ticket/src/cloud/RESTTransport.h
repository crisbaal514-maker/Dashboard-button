#pragma once

#include <Arduino.h>
#include <WiFi.h>
#include "cloud/Transport.h"

// ===========================================
// Risto Device OS — RESTTransport
// ===========================================
// Implementation of Transport interface using
// HTTP over WiFiClient (plain TCP, no SSL).
//
// Only implements: POST, GET, HTTP, Headers, Timeouts.
// No chunked encoding, no keep-alive, no streaming.
// ===========================================

class RESTTransport : public Transport {
public:
    RESTTransport();
    ~RESTTransport();

    // Transport interface
    bool begin() override;
    void end() override;

    bool connect(const char* host, uint16_t port) override;
    void disconnect() override;
    bool isConnected() override;

    bool sendRequest(
        const char* method,
        const char* path,
        const uint8_t* data,
        size_t dataLen,
        HeaderCallback headers,
        void* headersCtx,
        TransportResponse& response
    ) override;

    void setTimeout(unsigned long ms) override;
    void setCertificate(const char* cert) override;
    void setInsecure(bool insecure) override;
    void setBearerToken(const char* token) override;

    TransportError getLastError() const override;
    const char* getLastErrorString() const override;

private:
    WiFiClient _client;
    char _host[128];
    uint16_t _port;
    unsigned long _timeoutMs;
    TransportError _lastError;
    bool _initialized;
    char _bearerToken[288];  // "Bearer " + 256-char token + null

    bool connectInternal();
    bool sendHttpRequest(
        const char* method,
        const char* path,
        const uint8_t* data,
        size_t dataLen,
        HeaderCallback headers,
        void* headersCtx
    );
    bool readHttpResponse(TransportResponse& response);
    void buildRequestLine(char* buffer, size_t bufsize,
                          const char* method, const char* path) const;
    void buildHeaderLine(char* buffer, size_t bufsize,
                         const char* name, const char* value) const;
    size_t readLine(char* buffer, size_t bufsize);
    void setLastError(TransportError err);
};
