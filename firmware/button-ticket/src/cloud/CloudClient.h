#pragma once

#include <Arduino.h>
#include "cloud/CloudState.h"
#include "cloud/Transport.h"
#include "cloud/ProvisioningClient.h"
#include "commands/CommandDispatcher.h"
#include "commands/CommandQueue.h"

struct CloudClientConfig {
    const char* host;
    uint16_t port;
    const char* registerPath;
    const char* heartbeatPath;
    const char* ackPath;                    // e.g. "/v1/devices/commands/%s/ack"
    unsigned long heartbeatIntervalMs;
    unsigned long connectionTimeoutMs;
    unsigned long backoffMinMs;
    unsigned long backoffMaxMs;
};

struct CloudClientContext {
    char deviceId[32];
    char accessToken[256];
    char refreshToken[128];
    unsigned long lastHeartbeatMs;
    unsigned long lastErrorMs;
    unsigned long currentBackoffMs;
    uint8_t connectAttempts;
    bool provisioned;
    bool authenticated;
};

typedef void (*CloudStateCallback)(CloudStateTransition transition, void* context);
typedef void (*CloudTokenExpiredCallback)(const char* refreshToken, void* context);
typedef void (*CloudErrorCallback)(TransportError error, const char* desc, void* context);

class CloudClient {
public:
    CloudClient(Transport* transport);
    ~CloudClient();

    void begin(const CloudClientConfig& config);

    /**
     * Set credentials loaded from NVS (after reboot).
     * Skips registration; goes directly to heartbeat.
     */
    void setCredentials(const char* deviceId, const char* accessToken, const char* refreshToken);

    bool connectToCloud();
    void disconnect();
    bool isConnected() const;
    bool isProvisioned() const;
    void loop();
    void forceReRegistration();

    CloudState getState() const;
    const char* getStateString() const;
    const CloudClientContext& getContext() const;
    const char* getDeviceId() const;
    const char* getAccessToken() const;

    CommandQueue& getCommandQueue();
    bool sendAck(const char* commandId, CommandStatus status, const char* result, const char* error);

    void onCloudStateChange(CloudStateCallback cb, void* ctx);
    void onTokenExpired(CloudTokenExpiredCallback cb, void* ctx);
    void onError(CloudErrorCallback cb, void* ctx);

private:
    Transport* _transport;
    ProvisioningClient* _provisioningClient;
    CloudStateMachine _stateMachine;
    CloudClientConfig _config;
    CloudClientContext _context;
    CommandDispatcher _dispatcher;
    CommandQueue _commandQueue;

    CloudStateCallback _stateCallback;
    void* _stateCallbackContext;
    CloudTokenExpiredCallback _tokenExpiredCallback;
    void* _tokenExpiredContext;
    CloudErrorCallback _errorCallback;
    void* _errorContext;

    static void onStateMachineChange(CloudStateTransition t, void* ctx);
    bool registerDevice();
    bool authenticateDevice();
    bool sendHeartbeat();
    void processPendingCommands(const char* body, size_t bodyLength);
    void handleStateChange(CloudStateTransition t);
    void scheduleReconnect();
    void resetBackoff();
    void notifyError(TransportError err, const char* desc);
    static const char* provideCertificate();
};
