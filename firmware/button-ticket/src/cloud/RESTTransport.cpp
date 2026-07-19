#include "RESTTransport.h"
#include "core/Logger.h"

RESTTransport::RESTTransport()
    : _port(80)
    , _timeoutMs(5000)
    , _lastError(TransportError::NONE)
    , _initialized(false) {
    _host[0] = '\0';
    _bearerToken[0] = '\0';
}

RESTTransport::~RESTTransport() { end(); }

bool RESTTransport::begin() {
    if (_initialized) return true;
    _initialized = true;
    _lastError = TransportError::NONE;
    Logger().info("REST", "RESTTransport initialized (HTTP)");
    return true;
}

void RESTTransport::end() {
    disconnect();
    _initialized = false;
}

bool RESTTransport::connect(const char* host, uint16_t port) {
    if (!_initialized) return false;
    strncpy(_host, host, sizeof(_host) - 1);
    _host[sizeof(_host) - 1] = '\0';
    _port = port;
    return connectInternal();
}

void RESTTransport::disconnect() {
    if (_client.connected()) {
        _client.stop();
        Logger().info("REST", "Disconnected");
    }
}

bool RESTTransport::isConnected() {
    return _client.connected();
}

bool RESTTransport::sendRequest(const char* method, const char* path,
                                 const uint8_t* data, size_t dataLen,
                                 HeaderCallback headers, void* headersCtx,
                                 TransportResponse& response) {
    memset(&response, 0, sizeof(response));
    _lastError = TransportError::NONE;
    unsigned long t0 = millis();

    if (!_client.connected() && !connectInternal()) {
        response.timeout = (_lastError == TransportError::CONNECTION_TIMEOUT);
        return false;
    }

    if (!sendHttpRequest(method, path, data, dataLen, headers, headersCtx)) {
        response.timeout = (_lastError == TransportError::RESPONSE_TIMEOUT);
        return false;
    }

    if (!readHttpResponse(response)) {
        response.timeout = (_lastError == TransportError::RESPONSE_TIMEOUT);
        return false;
    }

    response.responseTimeMs = millis() - t0;

    char buf[64];
    snprintf(buf, sizeof(buf), "%s %s -> %d (%lu ms)",
             method, path, response.statusCode, response.responseTimeMs);
    Logger().info("REST", buf);

    return response.statusCode > 0;
}

void RESTTransport::setTimeout(unsigned long ms) {
    _timeoutMs = ms;
    _client.setTimeout(ms);
}

void RESTTransport::setCertificate(const char* cert) {
    // No-op: HTTP does not use certificates
    (void)cert;
}

void RESTTransport::setInsecure(bool insecure) {
    // No-op: HTTP has no SSL handshake
    (void)insecure;
}

void RESTTransport::setBearerToken(const char* token) {
    if (token && strlen(token) > 0) {
        snprintf(_bearerToken, sizeof(_bearerToken), "Bearer %s", token);
    } else {
        _bearerToken[0] = '\0';
    }
}

TransportError RESTTransport::getLastError() const { return _lastError; }

const char* RESTTransport::getLastErrorString() const {
    switch (_lastError) {
        case TransportError::NONE:                 return "NONE";
        case TransportError::WIFI_NOT_CONNECTED:   return "WiFi not connected";
        case TransportError::DNS_FAILED:           return "DNS resolution failed";
        case TransportError::CONNECTION_TIMEOUT:   return "Connection timeout";
        case TransportError::CONNECTION_REFUSED:   return "Connection refused";
        case TransportError::SSL_HANDSHAKE_FAILED: return "SSL handshake failed";
        case TransportError::SSL_CERT_INVALID:     return "SSL certificate invalid";
        case TransportError::HTTP_ERROR:           return "HTTP protocol error";
        case TransportError::RESPONSE_TIMEOUT:     return "Response timeout";
        case TransportError::PAYLOAD_TOO_LARGE:    return "Payload too large";
        case TransportError::UNKNOWN:              return "Unknown error";
        default:                                   return "?";
    }
}

bool RESTTransport::connectInternal() {
    if (_host[0] == '\0') { setLastError(TransportError::DNS_FAILED); return false; }

    char buf[128];
    snprintf(buf, sizeof(buf), "Connecting to %s:%u...", _host, _port);
    Logger().info("REST", buf);

    // Detectar si _host es una IP literal (x.x.x.x) para evitar resolución DNS
    IPAddress ip;
    bool isIp = ip.fromString(_host);

    bool connected = false;
    if (isIp) {
        connected = _client.connect(ip, _port);
    } else {
        connected = _client.connect(_host, _port);
    }

    if (!connected) {
        snprintf(buf, sizeof(buf), "Connection failed: %s", _host);
        Logger().error("REST", buf);
        setLastError(TransportError::CONNECTION_REFUSED);
        return false;
    }
    Logger().info("REST", "Connected");
    return true;
}

bool RESTTransport::sendHttpRequest(const char* method, const char* path,
                                     const uint8_t* data, size_t dataLen,
                                     HeaderCallback headers, void* headersCtx) {
    char line[256];
    buildRequestLine(line, sizeof(line), method, path);
    _client.println(line);

    buildHeaderLine(line, sizeof(line), "Host", _host);
    _client.println(line);

    if (data && dataLen > 0) {
        buildHeaderLine(line, sizeof(line), "Content-Type", "application/json");
        _client.println(line);
        snprintf(line, sizeof(line), "Content-Length: %u", (unsigned)dataLen);
        _client.println(line);
    }

    _client.println("Connection: close");

    // Inject Authorization: Bearer if token is set
    if (_bearerToken[0] != '\0') {
        buildHeaderLine(line, sizeof(line), "Authorization", _bearerToken);
        _client.println(line);
    }

    if (headers) headers("X-Risto-Transport", "rest", headersCtx);
    _client.println();
    if (data && dataLen > 0) _client.write(data, dataLen);
    _client.flush();
    return true;
}

bool RESTTransport::readHttpResponse(TransportResponse& response) {
    char line[256];
    unsigned long start = millis();

    if (readLine(line, sizeof(line)) == 0) {
        if (millis() - start >= _timeoutMs) {
            setLastError(TransportError::RESPONSE_TIMEOUT);
            response.timeout = true;
        } else {
            setLastError(TransportError::HTTP_ERROR);
        }
        return false;
    }

    char httpVersion[16];
    int statusCode = 0;
    if (sscanf(line, "%15s %d", httpVersion, &statusCode) >= 2) {
        response.statusCode = statusCode;
    } else {
        setLastError(TransportError::HTTP_ERROR);
        return false;
    }

    while (readLine(line, sizeof(line)) > 0); // skip headers

    size_t totalRead = 0;
    while (_client.available() && totalRead < sizeof(response.body) - 1) {
        int c = _client.read();
        if (c < 0) break;
        response.body[totalRead++] = (char)c;
    }
    response.body[totalRead] = '\0';
    response.bodyLength = totalRead;
    return true;
}

void RESTTransport::buildRequestLine(char* buf, size_t sz,
                                      const char* method, const char* path) const {
    snprintf(buf, sz, "%s %s HTTP/1.1", method, path);
}

void RESTTransport::buildHeaderLine(char* buf, size_t sz,
                                     const char* name, const char* value) const {
    snprintf(buf, sz, "%s: %s", name, value);
}

size_t RESTTransport::readLine(char* buf, size_t sz) {
    if (!_client.available() && !_client.connected()) return 0;
    size_t i = 0;
    unsigned long start = millis();
    while (i < sz - 1) {
        if (!_client.available()) {
            if (!_client.connected()) break;
            if (millis() - start > _timeoutMs) break;
            delay(1);
            continue;
        }
        int c = _client.read();
        if (c < 0) break;
        if (c == '\r') continue;
        if (c == '\n') break;
        buf[i++] = (char)c;
    }
    buf[i] = '\0';
    return i;
}

void RESTTransport::setLastError(TransportError err) {
    _lastError = err;
    if (err != TransportError::NONE) Logger().error("REST", getLastErrorString());
}
