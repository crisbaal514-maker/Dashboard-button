#include "Logger.h"

// ===========================================
// Logger Implementation
// ===========================================

Logger::Logger()
    : _logLevel(RISTO_LOG_LEVEL_DEBUG)
    , _lastLogTime(0) {
}

Logger::~Logger() {
}

void Logger::setup() {
    Serial.begin(RISTO_SERIAL_BAUD);
    // ESP32-S3 needs extra time for USB-Serial/JTAG enumeration
    delay(3000);
    // Flush any garbage from boot
    Serial.println();
}

void Logger::loop() {
    // Logger loop is idle; could flush buffers in future.
}

void Logger::printPrefix(const char* level, const char* tag) {
    _lastLogTime = millis();
    Serial.print("[");
    Serial.print(_lastLogTime);
    Serial.print("] [");
    Serial.print(level);
    Serial.print("] [");
    Serial.print(tag);
    Serial.print("] ");
}

void Logger::error(const char* tag, const char* message) {
    if (_logLevel < RISTO_LOG_LEVEL_ERROR) return;
    printPrefix("ERRO", tag);
    Serial.println(message);
}

void Logger::warn(const char* tag, const char* message) {
    if (_logLevel < RISTO_LOG_LEVEL_WARN) return;
    printPrefix("WARN", tag);
    Serial.println(message);
}

void Logger::info(const char* tag, const char* message) {
    if (_logLevel < RISTO_LOG_LEVEL_INFO) return;
    printPrefix("INFO", tag);
    Serial.println(message);
}

void Logger::debug(const char* tag, const char* message) {
    if (_logLevel < RISTO_LOG_LEVEL_DEBUG) return;
    printPrefix("DEBG", tag);
    Serial.println(message);
}
