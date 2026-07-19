#pragma once

#include <Arduino.h>
#include <cstdint>

// ===========================================
// Risto Device OS — Transport Interface
// ===========================================
// Abstract interface for cloud communication.
// Implementations: RESTTransport, (future) MQTTTransport, WSTransport.
//
// Rules:
// - No String, no std::vector, no std::span.
// - Payloads use const uint8_t* + size_t length.
// - Headers use simple callback pattern.
// ===========================================

struct TransportResponse {
    int statusCode;           // 200, 201, 401, 500, 0 = error
    char body[2048];          // Response body buffer (max 2KB)
    size_t bodyLength;        // Actual bytes in body
    unsigned long responseTimeMs;
    bool timeout;
    bool sslError;
};

enum class TransportError {
    NONE,
    WIFI_NOT_CONNECTED,
    DNS_FAILED,
    CONNECTION_TIMEOUT,
    CONNECTION_REFUSED,
    SSL_HANDSHAKE_FAILED,
    SSL_CERT_INVALID,
    HTTP_ERROR,
    RESPONSE_TIMEOUT,
    PAYLOAD_TOO_LARGE,
    UNKNOWN
};

// Callback for setting request headers
// Implementations call this to add headers before sending
typedef void (*HeaderCallback)(const char* name, const char* value, void* context);

class Transport {
public:
    virtual ~Transport() {}

    // Lifecycle
    virtual bool begin() = 0;
    virtual void end() = 0;

    // Connection
    virtual bool connect(const char* host, uint16_t port) = 0;
    virtual void disconnect() = 0;
    virtual bool isConnected() = 0;

    // HTTP methods
    // method: "GET", "POST"
    // path: "/v1/devices/register"
    // data: payload bytes (nullptr for GET)
    // dataLen: payload length in bytes
    // headers: callback to add custom headers
    // headersCtx: context passed to headers callback
    // response: output
    virtual bool sendRequest(
        const char* method,
        const char* path,
        const uint8_t* data,
        size_t dataLen,
        HeaderCallback headers,
        void* headersCtx,
        TransportResponse& response
    ) = 0;

    // Configuration
    virtual void setTimeout(unsigned long ms) = 0;
    virtual void setCertificate(const char* cert) = 0;
    virtual void setInsecure(bool insecure) = 0;

    // Set bearer token for Authorization header
    virtual void setBearerToken(const char* token) = 0;

    // Error reporting
    virtual TransportError getLastError() const = 0;
    virtual const char* getLastErrorString() const = 0;
};
