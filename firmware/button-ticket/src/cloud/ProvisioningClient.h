#pragma once

#include <Arduino.h>
#include "cloud/Transport.h"

// ===========================================
// Risto Device OS — ProvisioningClient
// ===========================================
// Cloud provisioning over REST API.
// Steps:
//   1. POST /v1/devices/register  -> 200: { deviceId, token }
//   2. POST /v1/devices/auth      -> 200: { accessToken }
//   3. Device is now "owned" by cloud account.
//
// No String, no std::vector, no std::span.
// Uses callback pattern for JSON parsing.
// ===========================================

// Provisioning status callback
struct ProvisioningResult {
    bool success;
    char deviceId[32];       // Cloud-assigned device ID
    char accessToken[256];   // JWT access token
    char refreshToken[128];  // Refresh token for re-auth
    int statusCode;          // HTTP status code
    char error[128];         // Error message if failed
};

// JSON field callback — called for each field during parsing
typedef void (*ProvisioningFieldCallback)(const char* key, const char* value, void* context);

class ProvisioningClient {
public:
    ProvisioningClient(Transport* transport);
    ~ProvisioningClient();

    // Configure API endpoint
    void setHost(const char* host, uint16_t port = 443);
    void setPath(const char* registerPath, const char* authPath);

    // Register device with cloud
    // Returns true if request was sent (check result.success for actual outcome)
    bool registerDevice(
        const char* hardwareId,     // MAC address or unique hardware ID
        const char* firmwareVersion,
        const char* deviceModel,
        ProvisioningResult& result
    );

    // Authenticate existing device (after registration)
    bool authenticateDevice(
        const char* deviceId,
        const char* refreshToken,
        ProvisioningResult& result
    );

    // Set callback for certificate validation
    void onCertificateNeeded(const char* (*callback)(void));

    // Set timeout
    void setTimeout(unsigned long ms);

    // Get last transport error
    TransportError getLastError() const;

private:
    Transport* _transport;
    char _host[128];
    uint16_t _port;
    char _registerPath[64];
    char _authPath[64];
    unsigned long _timeoutMs;

    // Certificate callback
    const char* (*_certCallback)(void);

    // Build JSON payload (no heap allocation)
    // Returns actual payload length
    size_t buildRegisterPayload(
        char* buffer, size_t bufsize,
        const char* hardwareId,
        const char* firmwareVersion,
        const char* deviceModel
    );

    // Parse JSON response into ProvisioningResult
    bool parseProvisioningResponse(
        const char* json,
        size_t jsonLen,
        ProvisioningResult& result,
        bool expectTokens
    );

    // Add auth headers callback
    static void addAuthHeaders(const char* name, const char* value, void* context);
};
