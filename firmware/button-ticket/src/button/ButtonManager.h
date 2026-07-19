#pragma once

#include <Arduino.h>

// ===========================================
// Risto Devices - ButtonManager
// ===========================================
// Manages a physical button input with debounce.
// Detects press, release, and long-press events.
// Emits events via EventManager in future versions.
// ===========================================

class ButtonManager {
public:
    ButtonManager();
    ~ButtonManager();

    void setup();
    void loop();

    bool isPressed() const;
    bool wasPressed();

private:
    uint8_t _pin;
    bool _currentState;
    bool _lastState;
    bool _pressReported;
    unsigned long _lastDebounceTime;
    unsigned long _debounceDelay;
    unsigned long _pressStartTime;

    bool readWithDebounce();
};


