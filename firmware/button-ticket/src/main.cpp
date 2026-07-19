// ===========================================
// Risto Platform - Button Ticket
// Entry point for ESP32-S3 firmware
// ===========================================

#include <Arduino.h>
#include "Application.h"

Application app;

void setup() {
    app.setup();
}

void loop() {
    app.loop();
}
