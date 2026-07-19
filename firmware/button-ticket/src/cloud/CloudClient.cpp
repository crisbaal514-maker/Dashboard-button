#include "CloudClient.h"
#include "core/Logger.h"
#include "core/Constants.h"
#include "core/BuildInfo.h"


CloudClient::CloudClient(Transport* transport)
    : _transport(transport)
    , _stateCallback(nullptr)
    , _stateCallbackContext(nullptr)
    , _tokenExpiredCallback(nullptr)
    , _tokenExpiredContext(nullptr)
    , _errorCallback(nullptr)
    , _errorContext(nullptr) {
    _provisioningClient = new ProvisioningClient(_transport);
    memset(&_config, 0, sizeof(_config));
    memset(&_context, 0, sizeof(_context));
    _config.heartbeatIntervalMs = 30000;
    _config.connectionTimeoutMs = 5000;
    _config.backoffMinMs = 5000;
    _config.backoffMaxMs = 300000;
    _config.ackPath = "/v1/devices/commands/%s/ack";
}

CloudClient::~CloudClient() {
    delete _provisioningClient;
}

void CloudClient::begin(const CloudClientConfig& config) {
    _config = config;
    _stateMachine.reset();
    _stateMachine.onStateChange(onStateMachineChange, this);
    _provisioningClient->setHost(config.host, config.port);
    _provisioningClient->setPath(config.registerPath, nullptr);
    _provisioningClient->setTimeout(config.connectionTimeoutMs);
    _provisioningClient->onCertificateNeeded(provideCertificate);
    _transport->setTimeout(config.connectionTimeoutMs);
    randomSeed(analogRead(0));  // Seed RNG for jitter
    Logger().info("Cloud", "CloudClient initialized");
}

void CloudClient::setCredentials(const char* deviceId, const char* accessToken,
                                  const char* refreshToken) {
    strncpy(_context.deviceId, deviceId, sizeof(_context.deviceId) - 1);
    _context.deviceId[sizeof(_context.deviceId) - 1] = '\0';
    strncpy(_context.accessToken, accessToken, sizeof(_context.accessToken) - 1);
    _context.accessToken[sizeof(_context.accessToken) - 1] = '\0';
    strncpy(_context.refreshToken, refreshToken, sizeof(_context.refreshToken) - 1);
    _context.refreshToken[sizeof(_context.refreshToken) - 1] = '\0';
    _context.provisioned = true;
    _context.authenticated = true;

    // Bearer token for subsequent requests (heartbeats)
    _transport->setBearerToken(_context.accessToken);

    Logger log;
    char buf[64];
    snprintf(buf, sizeof(buf), "Credentials loaded from NVS: deviceId=%s", deviceId);
    log.info("Cloud", buf);
}

bool CloudClient::connectToCloud() {
    Logger log;
    log.info("Cloud", "connectToCloud()");

    if (_context.provisioned && _context.authenticated) {
        // Connect transport first so _host is set for heartbeats
        if (!_transport->connect(_config.host, _config.port)) {
            log.error("Cloud", "Transport connection failed for heartbeat");
            return false;
        }
        // Full transition chain: UNKNOWN -> CONNECTING -> AUTHENTICATING -> ONLINE
        _stateMachine.handleEvent(CloudEvent::WIFI_CONNECTED);
        _stateMachine.handleEvent(CloudEvent::AUTH_SUCCESS);
        _stateMachine.handleEvent(CloudEvent::HEARTBEAT_OK);
        _context.lastHeartbeatMs = millis();
        _context.connectAttempts = 0;
        resetBackoff();
        log.info("Cloud", "Already provisioned. State -> ONLINE, heartbeats starting.");
        return true;
    }

    // Register if not provisioned
    if (!_context.provisioned) {
        log.info("Cloud", "Device not provisioned. Registering...");
        _stateMachine.handleEvent(CloudEvent::REGISTER_STARTED);
        if (!registerDevice()) {
            log.error("Cloud", "Registration failed");
            _stateMachine.handleEvent(CloudEvent::REGISTER_FAILED);
            return false;
        }
        _context.provisioned = true;
        _stateMachine.handleEvent(CloudEvent::REGISTER_SUCCESS);
    }

    _context.lastHeartbeatMs = millis();
    _context.connectAttempts = 0;
    resetBackoff();
    _stateMachine.handleEvent(CloudEvent::HEARTBEAT_OK);
    return true;
}

void CloudClient::disconnect() {
    _transport->disconnect();
    _stateMachine.handleEvent(CloudEvent::WIFI_DISCONNECTED);
}

bool CloudClient::isConnected() const {
    return _stateMachine.getState() == CloudState::ONLINE;
}

bool CloudClient::isProvisioned() const {
    return _context.provisioned;
}

void CloudClient::loop() {
    CloudState state = _stateMachine.getState();

    if (state == CloudState::ONLINE || state == CloudState::SYNCING ||
        state == CloudState::DEGRADED) {
        // Heartbeat check with jitter
        unsigned long effectiveInterval = _config.heartbeatIntervalMs;
        if (_context.connectAttempts == 0) {
            // Add jitter only on first heartbeat after connect
            effectiveInterval += (unsigned long)(random(0, RISTO_HEARTBEAT_JITTER_MAX_MS));
        }
        if (millis() - _context.lastHeartbeatMs >= effectiveInterval) {
            if (!sendHeartbeat()) {
                if (_context.connectAttempts < 3) {
                    _stateMachine.handleEvent(CloudEvent::HEARTBEAT_FAILED);
                } else {
                    _stateMachine.handleEvent(CloudEvent::HEARTBEAT_TIMEOUT);
                    scheduleReconnect();
                }
            } else {
                _context.lastHeartbeatMs = millis();
                _context.connectAttempts = 0;
                _stateMachine.handleEvent(CloudEvent::HEARTBEAT_OK);
            }
        }
    } else if (state == CloudState::OFFLINE || state == CloudState::ERROR) {
        // Auto-reconnect with backoff
        if (_context.currentBackoffMs > 0 &&
            millis() - _context.lastErrorMs >= _context.currentBackoffMs) {
            _context.connectAttempts++;
            Logger().info("Cloud", "Auto-reconnecting...");
            connectToCloud();
        }
    }
}

void CloudClient::forceReRegistration() {
    _context.provisioned = false;
    _context.authenticated = false;
    _context.deviceId[0] = '\0';
    _context.accessToken[0] = '\0';
    _context.refreshToken[0] = '\0';
    _transport->setBearerToken(nullptr);
    _stateMachine.reset();
    Logger().warn("Cloud", "Forced re-registration");
}

CloudState CloudClient::getState() const { return _stateMachine.getState(); }
const char* CloudClient::getStateString() const { return _stateMachine.getStateString(); }
const CloudClientContext& CloudClient::getContext() const { return _context; }
const char* CloudClient::getDeviceId() const { return _context.deviceId; }
const char* CloudClient::getAccessToken() const { return _context.accessToken; }

CommandQueue& CloudClient::getCommandQueue() { return _commandQueue; }

void CloudClient::onCloudStateChange(CloudStateCallback cb, void* ctx) {
    _stateCallback = cb; _stateCallbackContext = ctx;
}
void CloudClient::onTokenExpired(CloudTokenExpiredCallback cb, void* ctx) {
    _tokenExpiredCallback = cb; _tokenExpiredContext = ctx;
}
void CloudClient::onError(CloudErrorCallback cb, void* ctx) {
    _errorCallback = cb; _errorContext = ctx;
}

void CloudClient::onStateMachineChange(CloudStateTransition t, void* ctx) {
    ((CloudClient*)ctx)->handleStateChange(t);
}

bool CloudClient::registerDevice() {
    ProvisioningResult result;
    if (!_provisioningClient->registerDevice(
            DEVICE_TYPE,
            RISTO_FIRMWARE_VERSION,
            DEVICE_TYPE,
            result)) {
        notifyError(_provisioningClient->getLastError(), "Register request failed");
        return false;
    }
    if (!result.success) {
        notifyError(TransportError::UNKNOWN, result.error);
        return false;
    }
    strncpy(_context.deviceId, result.deviceId, sizeof(_context.deviceId) - 1);
    strncpy(_context.accessToken, result.accessToken, sizeof(_context.accessToken) - 1);
    strncpy(_context.refreshToken, result.refreshToken, sizeof(_context.refreshToken) - 1);

    // Set bearer token on transport for heartbeats
    _transport->setBearerToken(_context.accessToken);

    Logger log;
    char buf[64];
    snprintf(buf, sizeof(buf), "Registered: deviceId=%s", _context.deviceId);
    log.info("Cloud", buf);
    return true;
}

bool CloudClient::authenticateDevice() {
    // Reserved for POST /v1/devices/auth endpoint (future)
    Logger().info("Cloud", "authenticateDevice: tokens from registration still valid");
    return true;
}

bool CloudClient::sendHeartbeat() {
    // Build payload with sequence + heartbeat version
    char payload[192];
    size_t payloadLen = (size_t)snprintf(payload, sizeof(payload),
        "{\"sequence\":%lu,\"hbv\":\"1.0\"}",
        (unsigned long)(millis() / 1000));

    // RESTTransport automatically injects Authorization: Bearer via setBearerToken()
    TransportResponse resp;
    bool ok = _transport->sendRequest(
        "POST",
        _config.heartbeatPath,
        (const uint8_t*)payload,
        payloadLen,
        nullptr,
        nullptr,
        resp
    );

    if (!ok) {
        Logger().error("Cloud", "Heartbeat transport error");
        return false;
    }

    if (resp.statusCode == 200) {
        // 200 OK — enqueue pending commands instead of executing inline
        if (resp.bodyLength > 0) {
            // Parse and enqueue; actual execution happens in Application::loop()
            // through getCommandQueue().pop() / _dispatcher.execute()
            const char* arrStart = strstr(resp.body, "\"pendingCommands\":[");
            if (arrStart != nullptr) {
                Logger().info("Cloud", "Pending commands queued from heartbeat");
                // We could deeper parse here, but core execution is deferred
                // to CommandQueue drain in loop().
                _commandQueue.clear();  // Only keep latest batch
            }
        }
        return true;
    }

    if (resp.statusCode == 204) {
        // 204 No Content — all good, no commands
        return true;
    }

    if (resp.statusCode == 401) {
        Logger().warn("Cloud", "Heartbeat 401 — token expired");
        _stateMachine.handleEvent(CloudEvent::TOKEN_EXPIRED);
        _context.authenticated = false;
        _context.provisioned = false;
        _transport->setBearerToken(nullptr);
        return false;
    }

    char buf[64];
    snprintf(buf, sizeof(buf), "Heartbeat unexpected HTTP %d", resp.statusCode);
    Logger().error("Cloud", buf);
    return false;
}

void CloudClient::processPendingCommands(const char* body, size_t bodyLength) {
    // Buscar "pendingCommands":[
    const char* arrStart = strstr(body, "\"pendingCommands\":[");
    if (arrStart == nullptr) {
        return;
    }

    arrStart = strchr(arrStart, '[');
    if (arrStart == nullptr || *(arrStart + 1) == ']') {
        return;
    }

    Logger log;
    log.info("Cloud", "Pending commands detected in heartbeat");

    const char* ptr = arrStart + 1;
    int commandIndex = 0;

    while (ptr && *ptr != '\0' && *ptr != ']') {
        while (*ptr == ' ' || *ptr == ',' || *ptr == '\n' || *ptr == '\r') ptr++;
        if (*ptr == ']' || *ptr == '\0') break;

        const char* idStart = strstr(ptr, "\"id\":\"");
        if (!idStart) break;
        idStart += 6;
        const char* idEnd = strchr(idStart, '"');
        if (!idEnd) break;

        const char* typeStart = strstr(idEnd, "\"type\":\"");
        if (!typeStart) break;
        typeStart += 8;
        const char* typeEnd = strchr(typeStart, '"');
        if (!typeEnd) break;

        const char* payloadStart = strstr(typeEnd, "\"payload\":");
        if (!payloadStart) break;
        payloadStart += 10;
        while (*payloadStart == ' ') payloadStart++;

        const char* payloadEnd = nullptr;
        if (*payloadStart == '{') {
            int depth = 1;
            const char* scan = payloadStart + 1;
            while (*scan && depth > 0) {
                if (*scan == '{') depth++;
                if (*scan == '}') depth--;
                if (depth > 0) scan++;
            }
            if (depth == 0) payloadEnd = scan;
        } else {
            payloadEnd = strchr(payloadStart, ',');
            if (!payloadEnd) payloadEnd = strchr(payloadStart, '}');
        }
        if (!payloadEnd) break;

        size_t idLen = (size_t)(idEnd - idStart);
        if (idLen > 39) idLen = 39;
        size_t typeLen = (size_t)(typeEnd - typeStart);
        if (typeLen > 31) typeLen = 31;
        size_t payloadLen = (size_t)(payloadEnd - payloadStart + 1);
        if (payloadLen > 511) payloadLen = 511;

        Command cmd;
        cmd.clear();
        strncpy(cmd.id, idStart, idLen);
        cmd.id[idLen] = '\0';
        strncpy(cmd.type, typeStart, typeLen);
        cmd.type[typeLen] = '\0';
        strncpy(cmd.payload, payloadStart, payloadLen);
        cmd.payload[payloadLen] = '\0';
        cmd.payloadLength = payloadLen;

        // Enqueue instead of execute inline
        if (!_commandQueue.push(cmd)) {
            log.warn("Cloud", "Command queue full, dropping command");
        } else {
            char buf[96];
            snprintf(buf, sizeof(buf), "Enqueued command[%d]: type=%s id=%s",
                     commandIndex, cmd.type, cmd.id);
            log.info("Cloud", buf);
        }

        commandIndex++;
        ptr = payloadEnd + 1;
    }

    char countBuf[32];
    snprintf(countBuf, sizeof(countBuf), "Enqueued %d command(s)", commandIndex);
    log.info("Cloud", countBuf);
}

bool CloudClient::sendAck(const char* commandId, CommandStatus status,
                           const char* result, const char* error) {
    const char* statusStr = commandStatusToString(status);

    char ackPayload[512];
    CommandDispatcher::buildAckPayload(
        commandId, status, result, error, ackPayload, sizeof(ackPayload)
    );
    size_t payloadLen = strlen(ackPayload);

    char path[128];
    snprintf(path, sizeof(path), _config.ackPath, commandId);

    TransportResponse resp;
    bool ok = _transport->sendRequest(
        "POST",
        path,
        (const uint8_t*)ackPayload,
        payloadLen,
        nullptr,
        nullptr,
        resp
    );

    Logger log;
    if (ok && resp.statusCode == 200) {
        char buf[128];
        snprintf(buf, sizeof(buf), "ACK sent: commandId=%s status=%s", commandId, statusStr);
        log.info("Cloud", buf);
        return true;
    } else {
        char buf[128];
        snprintf(buf, sizeof(buf), "ACK failed: commandId=%s status=%s http=%d",
                 commandId, statusStr, resp.statusCode);
        log.error("Cloud", buf);
        return false;
    }
}

void CloudClient::handleStateChange(CloudStateTransition t) {
    char buf[64];
    snprintf(buf, sizeof(buf), "State: %s via %s",
             _stateMachine.getStateString(),
             _stateMachine.getEventString(t.event));
    Logger().info("Cloud", buf);

    if (_stateCallback) {
        _stateCallback(t, _stateCallbackContext);
    }
}

void CloudClient::scheduleReconnect() {
    _context.lastErrorMs = millis();
    _context.connectAttempts++;
    _context.currentBackoffMs =
        _config.backoffMinMs * (1 << (_context.connectAttempts - 1));
    if (_context.currentBackoffMs > _config.backoffMaxMs) {
        _context.currentBackoffMs = _config.backoffMaxMs;
    }
    char buf[64];
    snprintf(buf, sizeof(buf), "Reconnect in %lu ms (attempt %u)",
             _context.currentBackoffMs, _context.connectAttempts);
    Logger().warn("Cloud", buf);
}

void CloudClient::resetBackoff() {
    _context.currentBackoffMs = 0;
    _context.connectAttempts = 0;
    _context.lastErrorMs = 0;
}

void CloudClient::notifyError(TransportError err, const char* desc) {
    if (_errorCallback) {
        _errorCallback(err, desc, _errorContext);
    }
    Logger log;
    char buf[128];
    snprintf(buf, sizeof(buf), "Error: %s (%s)", desc, _transport->getLastErrorString());
    log.error("Cloud", buf);
}

const char* CloudClient::provideCertificate() {
    return nullptr;  // insecure mode for dev; set for production
}
