#pragma once

#include <Arduino.h>
#include "core/Constants.h"

// ===========================================
// Risto Device OS — CloudState
// ===========================================
// Independent state machine for cloud connectivity.
// Observers: Application, LedManager, ProvisioningManager.
//
// Transitions are triggered by CloudClient or NetworkManager.
// ===========================================

enum class CloudState : uint8_t {
    UNKNOWN         = 0,
    OFFLINE         = 1,
    CONNECTING      = 2,
    AUTHENTICATING  = 3,
    REGISTERING     = 4,
    ONLINE          = 5,
    SYNCING         = 6,
    DEGRADED        = 7,
    UPDATING        = 8,
    ERROR           = 9
};

// Events that trigger state transitions
enum class CloudEvent : uint8_t {
    NONE                = 0,
    WIFI_CONNECTED      = 1,
    WIFI_DISCONNECTED   = 2,
    REGISTER_STARTED    = 3,
    REGISTER_SUCCESS    = 4,
    REGISTER_FAILED     = 5,
    AUTH_SUCCESS        = 6,
    AUTH_FAILED         = 7,
    HEARTBEAT_OK        = 8,
    HEARTBEAT_FAILED    = 9,
    HEARTBEAT_TIMEOUT   = 10,
    TOKEN_EXPIRED       = 11,
    DEVICE_GONE         = 12,
    PROTOCOL_MISMATCH   = 13,
    ERROR_RECOVERABLE   = 14,
    ERROR_FATAL         = 15
};

// Transition result
struct CloudStateTransition {
    CloudState from;
    CloudState to;
    CloudEvent event;
    bool changed;           // true if state actually changed
    const char* description;
};

class CloudStateMachine {
public:
    CloudStateMachine();
    ~CloudStateMachine();

    void reset();

    // Process an event and transition if applicable
    // Returns true if state changed
    bool handleEvent(CloudEvent event);

    // Getters
    CloudState getState() const;
    const char* getStateString() const;
    const char* getEventString(CloudEvent event) const;
    unsigned long getStateDurationMs() const;   // Time in current state
    unsigned long getLastTransitionMs() const;

    // Observer callback
    typedef void (*StateChangeCallback)(CloudStateTransition transition, void* context);
    void onStateChange(StateChangeCallback callback, void* context);

private:
    CloudState _state;
    unsigned long _lastTransitionTime;
    StateChangeCallback _callback;
    void* _callbackContext;

    void transitionTo(CloudState newState, CloudEvent event);
    bool isValidTransition(CloudState current, CloudEvent event) const;
};
