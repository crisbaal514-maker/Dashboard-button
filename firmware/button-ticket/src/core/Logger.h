#pragma once

#include <Arduino.h>
#include "Constants.h"

// ===========================================
// Risto Devices - Logger
// ===========================================
// Centralized logging with severity levels.
// Prints formatted messages to Serial with
// timestamp and log level prefix.
// ===========================================

class Logger {
public:
    Logger();
    ~Logger();

    void setup();
    void loop();

    void error(const char* tag, const char* message);
    void warn(const char* tag, const char* message);
    void info(const char* tag, const char* message);
    void debug(const char* tag, const char* message);

private:
    uint8_t _logLevel;
    unsigned long _lastLogTime;

    void printPrefix(const char* level, const char* tag);
};
