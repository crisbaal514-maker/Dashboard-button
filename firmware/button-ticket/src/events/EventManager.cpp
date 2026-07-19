#include "EventManager.h"

// ===========================================
// EventManager Implementation
// ===========================================

EventManager::EventManager()
    : _lastEvent()
    , _hasEvent(false) {
    _lastEvent.type = EventType::NONE;
    _lastEvent.timestamp = 0;
    _lastEvent.data = nullptr;
}

EventManager::~EventManager() {
}

void EventManager::setup() {
    // EventManager is ready from construction.
}

void EventManager::loop() {
    // Future: dispatch events to registered listeners.
    if (_hasEvent) {
        // Process and clear
        clearEvent();
    }
}

void EventManager::emit(EventType type, const void* data) {
    _lastEvent.type = type;
    _lastEvent.timestamp = millis();
    _lastEvent.data = data;
    _hasEvent = true;
}

const Event* EventManager::peek() const {
    if (_hasEvent) {
        return &_lastEvent;
    }
    return nullptr;
}

void EventManager::clearEvent() {
    _hasEvent = false;
    _lastEvent.type = EventType::NONE;
    _lastEvent.data = nullptr;
}
