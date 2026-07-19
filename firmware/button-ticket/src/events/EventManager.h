#pragma once

#include <Arduino.h>

// ===========================================
// Risto Devices - EventManager
// ===========================================
// Internal event bus for communication between
// modules. Modules can emit events and register
// callbacks without knowing each other directly.
// ===========================================

enum class EventType {
    NONE,
    TICKET_REQUESTED,
    TICKET_PRINTED,
    BUTTON_PRESSED,
    NETWORK_CONNECTED,
    NETWORK_DISCONNECTED,
    DEVICE_STATE_CHANGED,
    CONFIG_UPDATED
};

struct Event {
    EventType type;
    unsigned long timestamp;
    const void* data;
};

class EventManager {
public:
    EventManager();
    ~EventManager();

    void setup();
    void loop();

    void emit(EventType type, const void* data = nullptr);
    const Event* peek() const;

private:
    Event _lastEvent;
    bool _hasEvent;

    void clearEvent();
};
