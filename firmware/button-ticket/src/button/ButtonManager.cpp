#include "ButtonManager.h"

// ===========================================
// ButtonManager Implementation
// ===========================================

ButtonManager::ButtonManager()
    : _pin(0)  // GPIO0 = BOOT button on most ESP32 dev boards
    , _currentState(HIGH)
    , _lastState(HIGH)
    , _pressReported(false)
    , _lastDebounceTime(0)
    , _debounceDelay(50)
    , _pressStartTime(0) {
}

ButtonManager::~ButtonManager() {
}

void ButtonManager::setup() {
    pinMode(_pin, INPUT_PULLUP);
    _currentState = digitalRead(_pin);
    _lastState = _currentState;
}

void ButtonManager::loop() {
    _lastState = _currentState;
    _currentState = readWithDebounce();

    // Detect press: transition from HIGH to LOW (pull-up)
    if (_lastState == HIGH && _currentState == LOW) {
        _pressStartTime = millis();
        _pressReported = false;
    }

    // Detect release: transition from LOW to HIGH
    if (_lastState == LOW && _currentState == HIGH) {
        _pressReported = true;
    }
}

bool ButtonManager::isPressed() const {
    return _currentState == LOW;
}

bool ButtonManager::wasPressed() {
    if (_pressReported) {
        _pressReported = false;
        return true;
    }
    return false;
}

bool ButtonManager::readWithDebounce() {
    bool reading = digitalRead(_pin);

    if (reading != _lastState) {
        _lastDebounceTime = millis();
    }

    if ((millis() - _lastDebounceTime) > _debounceDelay) {
        return reading;
    }

    return _lastState;
}
