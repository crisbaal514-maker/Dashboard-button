#pragma once

#include <Arduino.h>
#include "core/Constants.h"

// ===========================================
// Risto Devices - LedManager
// ===========================================
// Controls the device LED indicator.
// Supports different patterns for device states:
// - Solid ON: ready/idle / connected
// - Blink slow: connecting
// - Blink fast: error
// - Off: boot / disconnected / deep sleep
// ===========================================

enum class LedPattern {
    OFF,
    SOLID,
    BLINK_SLOW,
    BLINK_FAST,
    BLINK_SINGLE
};

class LedManager {
public:
    LedManager();
    ~LedManager();

    void setup();
    void loop();

    void setPattern(LedPattern pattern);
    LedPattern getPattern() const;

    void setNetworkState(NetworkState state);

private:
    LedPattern _pattern;
    uint8_t _pin;
    bool _ledState;
    unsigned long _lastToggle;

    void applyPattern();
};


