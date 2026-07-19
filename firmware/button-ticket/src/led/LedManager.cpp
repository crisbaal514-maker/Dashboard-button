#include "LedManager.h"

// ===========================================
// LedManager Implementation
// ===========================================

LedManager::LedManager()
    : _pattern(LedPattern::OFF)
    , _pin(2)  // GPIO2 = built-in LED on most ESP32
    , _ledState(false)
    , _lastToggle(0) {
}

LedManager::~LedManager() {
}

void LedManager::setup() {
    pinMode(_pin, OUTPUT);
    digitalWrite(_pin, LOW);
}

void LedManager::loop() {
    applyPattern();
}

void LedManager::setNetworkState(NetworkState state) {
    switch (state) {
        case NetworkState::BOOT:
            setPattern(LedPattern::OFF);
            break;
        case NetworkState::CONNECTING:
            setPattern(LedPattern::BLINK_SLOW);
            break;
        case NetworkState::CONNECTED:
            setPattern(LedPattern::SOLID);
            break;
        case NetworkState::DISCONNECTED:
            setPattern(LedPattern::OFF);
            break;
    }
}

void LedManager::setPattern(LedPattern pattern) {
    if (_pattern != pattern) {
        _pattern = pattern;
        _lastToggle = 0;
    }
}

LedPattern LedManager::getPattern() const {
    return _pattern;
}

void LedManager::applyPattern() {
    unsigned long now = millis();
    unsigned long interval = 0;

    switch (_pattern) {
        case LedPattern::OFF:
            digitalWrite(_pin, LOW);
            _ledState = false;
            return;

        case LedPattern::SOLID:
            digitalWrite(_pin, HIGH);
            _ledState = true;
            return;

        case LedPattern::BLINK_SLOW:
            interval = 1000;
            break;

        case LedPattern::BLINK_FAST:
            interval = 200;
            break;

        case LedPattern::BLINK_SINGLE:
            interval = 100;
            break;
    }

    if (interval > 0 && (now - _lastToggle >= interval)) {
        _lastToggle = now;
        _ledState = !_ledState;
        digitalWrite(_pin, _ledState ? HIGH : LOW);
    }
}
