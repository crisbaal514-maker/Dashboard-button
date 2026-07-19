#include "ProvisioningClient.h"
#include "core/Logger.h"

ProvisioningClient::ProvisioningClient(Transport* transport)
    : _transport(transport), _port(443), _timeoutMs(5000), _certCallback(nullptr) {
    _host[0] = '\0';
    strcpy(_registerPath, "/v1/devices/register");
    strcpy(_authPath, "/v1/devices/auth");
}

ProvisioningClient::~ProvisioningClient() {}

void ProvisioningClient::setHost(const char* host, uint16_t port) {
    strncpy(_host, host, sizeof(_host) - 1);
    _host[sizeof(_host) - 1] = '\0';
    _port = port;
}

void ProvisioningClient::setPath(const char* regPath, const char* authPath) {
    if (regPath) { strncpy(_registerPath, regPath, sizeof(_registerPath)-1); _registerPath[sizeof(_registerPath)-1] = '\0'; }
    if (authPath) { strncpy(_authPath, authPath, sizeof(_authPath)-1); _authPath[sizeof(_authPath)-1] = '\0'; }
}

bool ProvisioningClient::registerDevice(const char* hardwareId, const char* firmwareVersion,
                                         const char* deviceModel, ProvisioningResult& result) {
    memset(&result, 0, sizeof(result));
    char payload[512];
    size_t payloadLen = (size_t)snprintf(payload, sizeof(payload),
        "{\"hardwareId\":\"%s\",\"firmware\":\"%s\",\"model\":\"%s\"}",
        hardwareId ? hardwareId : "", firmwareVersion ? firmwareVersion : "", deviceModel ? deviceModel : "");
    if (!_transport->isConnected()) {
        if (_certCallback) {
            const char* cert = _certCallback();
            if (cert && strlen(cert)) _transport->setCertificate(cert);
            else _transport->setInsecure(true);
        } else { _transport->setInsecure(true); }
        if (!_transport->connect(_host, _port)) {
            result.success = false;
            snprintf(result.error, sizeof(result.error), "Connection failed: %s", _transport->getLastErrorString());
            return false;
        }
    }
    TransportResponse resp;
    bool sent = _transport->sendRequest("POST", _registerPath, (const uint8_t*)payload, payloadLen, nullptr, nullptr, resp);
    if (!sent && resp.timeout) { result.success = false; snprintf(result.error, sizeof(result.error), "Timeout"); return false; }
    result.statusCode = resp.statusCode;
    if (resp.statusCode == 200 || resp.statusCode == 201)
        return parseProvisioningResponse(resp.body, resp.bodyLength, result, true);
    else {
        result.success = false;
        if (resp.bodyLength > 0) parseProvisioningResponse(resp.body, resp.bodyLength, result, false);
        else snprintf(result.error, sizeof(result.error), "HTTP %d", resp.statusCode);
        return true;
    }
}

bool ProvisioningClient::authenticateDevice(const char* deviceId, const char* refreshToken, ProvisioningResult& result) {
    memset(&result, 0, sizeof(result));
    char payload[384];
    size_t payloadLen = (size_t)snprintf(payload, sizeof(payload), "{\"deviceId\":\"%s\",\"refreshToken\":\"%s\"}", deviceId, refreshToken);
    if (payloadLen >= sizeof(payload)) { result.success = false; snprintf(result.error, sizeof(result.error), "Payload too large"); return false; }
    if (!_transport->isConnected() && !_transport->connect(_host, _port)) {
        result.success = false; snprintf(result.error, sizeof(result.error), "Connection failed"); return false;
    }
    TransportResponse resp;
    if (!_transport->sendRequest("POST", _authPath, (const uint8_t*)payload, payloadLen, nullptr, nullptr, resp)) {
        result.success = false; snprintf(result.error, sizeof(result.error), "Request failed"); return false;
    }
    result.statusCode = resp.statusCode;
    if (resp.statusCode == 200) return parseProvisioningResponse(resp.body, resp.bodyLength, result, true);
    else { result.success = false; if (resp.bodyLength > 0) parseProvisioningResponse(resp.body, resp.bodyLength, result, false); else snprintf(result.error, sizeof(result.error), "HTTP %d", resp.statusCode); return true; }
}

void ProvisioningClient::onCertificateNeeded(const char* (*cb)(void)) { _certCallback = cb; }
void ProvisioningClient::setTimeout(unsigned long ms) { _timeoutMs = ms; _transport->setTimeout(ms); }
TransportError ProvisioningClient::getLastError() const { return _transport->getLastError(); }

bool ProvisioningClient::parseProvisioningResponse(const char* json, size_t jsonLen, ProvisioningResult& result, bool expectTokens) {
    if (!json || jsonLen == 0) { result.success = false; return false; }
    result.success = false;
    const char* p = json;
    const char* end = json + jsonLen;
    while (p < end && (*p == ' ' || *p == '\t' || *p == '\n' || *p == '\r')) p++;
    if (p >= end || *p != '{') { if (jsonLen < sizeof(result.error)) { memcpy(result.error, json, jsonLen); result.error[jsonLen] = '\0'; } return false; }
    p++;
    while (p < end) {
        while (p < end && (*p == ' ' || *p == '\t' || *p == '\n' || *p == '\r')) p++;
        if (p >= end || *p == '}') break;
        if (*p != '"') { p++; continue; }
        p++;
        char key[32]; size_t ki = 0;
        while (p < end && *p != '"' && ki < sizeof(key)-1) key[ki++] = *p++;
        key[ki] = '\0'; if (p < end) p++;
        while (p < end && *p != ':') p++; if (p < end) p++;
        while (p < end && (*p == ' ' || *p == '\t')) p++;
        if (p < end && *p == '"') {
            p++; char value[256]; size_t vi = 0;
            while (p < end && *p != '"' && vi < sizeof(value)-1) {
                if (*p == '\\' && p+1 < end) { p++; if (*p == '"') value[vi++] = '"'; else if (*p == '\\') value[vi++] = '\\'; else if (*p == 'n') value[vi++] = '\n'; else { value[vi++] = '\\'; value[vi++] = *p; } }
                else value[vi++] = *p;
                p++;
            }
            value[vi] = '\0'; if (p < end) p++;
            if (strcmp(key, "deviceId") == 0) strncpy(result.deviceId, value, sizeof(result.deviceId)-1);
            else if (strcmp(key, "accessToken") == 0 || strcmp(key, "token") == 0) { strncpy(result.accessToken, value, sizeof(result.accessToken)-1); if (expectTokens) result.success = true; }
            else if (strcmp(key, "refreshToken") == 0) strncpy(result.refreshToken, value, sizeof(result.refreshToken)-1);
            else if ((strcmp(key, "error") == 0 || strcmp(key, "message") == 0) && strlen(result.error) == 0) strncpy(result.error, value, sizeof(result.error)-1);
        } else if (p < end && *p == '{') { int d = 1; p++; while (p < end && d > 0) { if (*p == '{') d++; if (*p == '}') d--; p++; } }
        else { while (p < end && *p != ',' && *p != '}') p++; }
        while (p < end && (*p == ',' || *p == ' ' || *p == '\t')) p++;
    }
    return true;
}
