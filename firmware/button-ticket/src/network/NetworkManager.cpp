#include "NetworkManager.h"

// ===========================================
// NetworkManager Implementation
// ===========================================

NetworkManager::NetworkManager()
    : _state(NetworkState::BOOT)
    , _connected(false)
    , _rssi(0)
    , _device(nullptr) {
    _currentSsid[0] = '\0';
}

NetworkManager::~NetworkManager() {
}

void NetworkManager::setup() {
    _log.info("WiFi", "Initializing WiFi in station mode...");
    WiFi.mode(WIFI_STA);
    _state = NetworkState::BOOT;
}

void NetworkManager::loop() {
    switch (_state) {
        case NetworkState::BOOT: {
            connect();
            _state = NetworkState::CONNECTING;
            break;
        }

        case NetworkState::CONNECTING: {
            int status = WiFi.status();
            if (status == WL_CONNECTED) {
                _connected = true;
                _state = NetworkState::CONNECTED;
                if (_currentSsid[0] == '\0') {
                    strncpy(_currentSsid, WiFi.SSID().c_str(), sizeof(_currentSsid) - 1);
                    _currentSsid[sizeof(_currentSsid) - 1] = '\0';
                }
                logNetworkInfo();
                updateDeviceInfo();
            } else if (status == WL_CONNECT_FAILED || status == WL_NO_SSID_AVAIL) {
                _log.error("WiFi", "Connection failed. Check SSID/PASSWORD.");
                _state = NetworkState::DISCONNECTED;
                _connected = false;
            }
            break;
        }

        case NetworkState::CONNECTED: {
            if (WiFi.status() != WL_CONNECTED) {
                _log.warn("WiFi", "Connection lost.");
                _connected = false;
                _state = NetworkState::DISCONNECTED;
            } else {
                updateSignalStrength();
            }
            break;
        }

        case NetworkState::DISCONNECTED: {
            // Stay disconnected; no auto-reconnect yet (future)
            updateSignalStrength();
            break;
        }
    }
}

bool NetworkManager::isConnected() const {
    return _connected;
}

NetworkState NetworkManager::getState() const {
    return _state;
}

int NetworkManager::getSignalStrength() const {
    return _rssi;
}

const char* NetworkManager::getSsid() const {
    return _currentSsid;
}

void NetworkManager::setDevice(Device* device) {
    _device = device;
}

void NetworkManager::connect() {
    char msg[128];
    snprintf(msg, sizeof(msg), "Connecting to \"%s\"...", WIFI_SSID);
    _log.info("WiFi", msg);

    strncpy(_currentSsid, WIFI_SSID, sizeof(_currentSsid) - 1);
    _currentSsid[sizeof(_currentSsid) - 1] = '\0';
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void NetworkManager::updateSignalStrength() {
    if (_connected) {
        _rssi = WiFi.RSSI();
    }
}

void NetworkManager::logNetworkInfo() {
    char buf[128];

    _log.info("WiFi", "=====================================");
    _log.info("WiFi", "WiFi Connected");

    snprintf(buf, sizeof(buf), "SSID:     %s", WiFi.SSID().c_str());
    _log.info("WiFi", buf);

    snprintf(buf, sizeof(buf), "IP:       %s", WiFi.localIP().toString().c_str());
    _log.info("WiFi", buf);

    snprintf(buf, sizeof(buf), "Gateway:  %s", WiFi.gatewayIP().toString().c_str());
    _log.info("WiFi", buf);

    snprintf(buf, sizeof(buf), "DNS:      %s", WiFi.dnsIP().toString().c_str());
    _log.info("WiFi", buf);

    snprintf(buf, sizeof(buf), "MAC:      %s", WiFi.macAddress().c_str());
    _log.info("WiFi", buf);

    snprintf(buf, sizeof(buf), "Hostname: %s", WiFi.getHostname());
    _log.info("WiFi", buf);

    snprintf(buf, sizeof(buf), "RSSI:     %d dBm", WiFi.RSSI());
    _log.info("WiFi", buf);

    _log.info("WiFi", "=====================================");
}

void NetworkManager::updateDeviceInfo() {
    if (_device == nullptr) return;

    NetworkInfo info;
    info.connected = true;
    strncpy(info.ssid, WiFi.SSID().c_str(), sizeof(info.ssid) - 1);
    info.ssid[sizeof(info.ssid) - 1] = '\0';
    info.localIP = WiFi.localIP();
    info.gateway = WiFi.gatewayIP();
    info.dns = WiFi.dnsIP();
    strncpy(info.mac, WiFi.macAddress().c_str(), sizeof(info.mac) - 1);
    info.mac[sizeof(info.mac) - 1] = '\0';
    strncpy(info.hostname, WiFi.getHostname(), sizeof(info.hostname) - 1);
    info.hostname[sizeof(info.hostname) - 1] = '\0';
    info.rssi = WiFi.RSSI();

    _device->setNetworkInfo(info);
}
