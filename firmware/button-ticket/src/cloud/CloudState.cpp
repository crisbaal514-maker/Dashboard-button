#include "CloudState.h"
#include "core/Logger.h"

// ===========================================
// CloudState Implementation
// ===========================================

CloudStateMachine::CloudStateMachine()
    : _state(CloudState::UNKNOWN)
    , _lastTransitionTime(0)
    , _callback(nullptr)
    , _callbackContext(nullptr) {
}

CloudStateMachine::~CloudStateMachine() {
}

void CloudStateMachine::reset() {
    CloudState oldState = _state;
    _state = CloudState::UNKNOWN;
    _lastTransitionTime = millis();

    if (_callback && oldState != CloudState::UNKNOWN) {
        CloudStateTransition t = { oldState, CloudState::UNKNOWN, CloudEvent::NONE, true, "reset" };
        _callback(t, _callbackContext);
    }
}

bool CloudStateMachine::handleEvent(CloudEvent event) {
    if (!isValidTransition(_state, event)) {
        // Invalid transition — log and ignore
        Logger log;
        char buf[64];
        snprintf(buf, sizeof(buf), "Invalid transition: %s -> event(%d)",
                 getStateString(), static_cast<int>(event));
        log.warn("CloudState", buf);
        return false;
    }

    CloudState newState = CloudState::UNKNOWN;

    // Define target state based on current + event
    switch (_state) {
        case CloudState::UNKNOWN:
            if (event == CloudEvent::WIFI_CONNECTED) newState = CloudState::CONNECTING;
            else if (event == CloudEvent::WIFI_DISCONNECTED) newState = CloudState::OFFLINE;
            else if (event == CloudEvent::ERROR_FATAL) newState = CloudState::ERROR;
            break;

        case CloudState::OFFLINE:
            if (event == CloudEvent::WIFI_CONNECTED) newState = CloudState::CONNECTING;
            else if (event == CloudEvent::ERROR_FATAL) newState = CloudState::ERROR;
            break;

        case CloudState::CONNECTING:
            if (event == CloudEvent::AUTH_SUCCESS) newState = CloudState::AUTHENTICATING;
            else if (event == CloudEvent::REGISTER_STARTED) newState = CloudState::REGISTERING;
            else if (event == CloudEvent::WIFI_DISCONNECTED) newState = CloudState::OFFLINE;
            else if (event == CloudEvent::ERROR_RECOVERABLE) newState = CloudState::DEGRADED;
            else if (event == CloudEvent::ERROR_FATAL) newState = CloudState::ERROR;
            break;

        case CloudState::AUTHENTICATING:
            if (event == CloudEvent::REGISTER_STARTED) newState = CloudState::REGISTERING;
            else if (event == CloudEvent::HEARTBEAT_OK) newState = CloudState::ONLINE;
            else if (event == CloudEvent::WIFI_DISCONNECTED) newState = CloudState::OFFLINE;
            else if (event == CloudEvent::AUTH_FAILED) newState = CloudState::DEGRADED;
            else if (event == CloudEvent::ERROR_FATAL) newState = CloudState::ERROR;
            break;

        case CloudState::REGISTERING:
            if (event == CloudEvent::REGISTER_SUCCESS) newState = CloudState::ONLINE;
            else if (event == CloudEvent::REGISTER_FAILED) newState = CloudState::DEGRADED;
            else if (event == CloudEvent::WIFI_DISCONNECTED) newState = CloudState::OFFLINE;
            else if (event == CloudEvent::ERROR_FATAL) newState = CloudState::ERROR;
            break;

        case CloudState::ONLINE:
            if (event == CloudEvent::HEARTBEAT_OK) newState = CloudState::ONLINE;       // Stay
            else if (event == CloudEvent::HEARTBEAT_FAILED) newState = CloudState::DEGRADED;
            else if (event == CloudEvent::HEARTBEAT_TIMEOUT) newState = CloudState::DEGRADED;
            else if (event == CloudEvent::WIFI_DISCONNECTED) newState = CloudState::OFFLINE;
            else if (event == CloudEvent::TOKEN_EXPIRED) newState = CloudState::AUTHENTICATING;
            else if (event == CloudEvent::DEVICE_GONE) newState = CloudState::OFFLINE;
            else if (event == CloudEvent::PROTOCOL_MISMATCH) newState = CloudState::ERROR;
            else if (event == CloudEvent::ERROR_FATAL) newState = CloudState::ERROR;
            break;

        case CloudState::SYNCING:
            if (event == CloudEvent::HEARTBEAT_OK) newState = CloudState::ONLINE;
            else if (event == CloudEvent::HEARTBEAT_FAILED) newState = CloudState::DEGRADED;
            else if (event == CloudEvent::WIFI_DISCONNECTED) newState = CloudState::OFFLINE;
            else if (event == CloudEvent::ERROR_FATAL) newState = CloudState::ERROR;
            break;

        case CloudState::DEGRADED:
            if (event == CloudEvent::HEARTBEAT_OK) newState = CloudState::ONLINE;
            else if (event == CloudEvent::WIFI_DISCONNECTED) newState = CloudState::OFFLINE;
            else if (event == CloudEvent::ERROR_FATAL) newState = CloudState::ERROR;
            else if (event == CloudEvent::HEARTBEAT_FAILED) newState = CloudState::DEGRADED;  // Stay
            break;

        case CloudState::UPDATING:
            if (event == CloudEvent::HEARTBEAT_OK) newState = CloudState::ONLINE;
            else if (event == CloudEvent::WIFI_DISCONNECTED) newState = CloudState::OFFLINE;
            else if (event == CloudEvent::ERROR_FATAL) newState = CloudState::ERROR;
            break;

        case CloudState::ERROR:
            // From ERROR, only recoverable events can move out
            if (event == CloudEvent::ERROR_RECOVERABLE) newState = CloudState::DEGRADED;
            else if (event == CloudEvent::WIFI_CONNECTED) newState = CloudState::CONNECTING;
            else if (event == CloudEvent::WIFI_DISCONNECTED) newState = CloudState::OFFLINE;
            break;
    }

    if (newState != CloudState::UNKNOWN && newState != _state) {
        transitionTo(newState, event);
        return true;
    }

    return false;
}

CloudState CloudStateMachine::getState() const {
    return _state;
}

const char* CloudStateMachine::getStateString() const {
    switch (_state) {
        case CloudState::UNKNOWN:        return "UNKNOWN";
        case CloudState::OFFLINE:        return "OFFLINE";
        case CloudState::CONNECTING:     return "CONNECTING";
        case CloudState::AUTHENTICATING: return "AUTHENTICATING";
        case CloudState::REGISTERING:    return "REGISTERING";
        case CloudState::ONLINE:         return "ONLINE";
        case CloudState::SYNCING:        return "SYNCING";
        case CloudState::DEGRADED:       return "DEGRADED";
        case CloudState::UPDATING:       return "UPDATING";
        case CloudState::ERROR:          return "ERROR";
        default:                         return "?";
    }
}

const char* CloudStateMachine::getEventString(CloudEvent event) const {
    switch (event) {
        case CloudEvent::NONE:              return "NONE";
        case CloudEvent::WIFI_CONNECTED:    return "WIFI_CONNECTED";
        case CloudEvent::WIFI_DISCONNECTED: return "WIFI_DISCONNECTED";
        case CloudEvent::REGISTER_STARTED:  return "REGISTER_STARTED";
        case CloudEvent::REGISTER_SUCCESS:  return "REGISTER_SUCCESS";
        case CloudEvent::REGISTER_FAILED:   return "REGISTER_FAILED";
        case CloudEvent::AUTH_SUCCESS:      return "AUTH_SUCCESS";
        case CloudEvent::AUTH_FAILED:       return "AUTH_FAILED";
        case CloudEvent::HEARTBEAT_OK:      return "HEARTBEAT_OK";
        case CloudEvent::HEARTBEAT_FAILED:  return "HEARTBEAT_FAILED";
        case CloudEvent::HEARTBEAT_TIMEOUT: return "HEARTBEAT_TIMEOUT";
        case CloudEvent::TOKEN_EXPIRED:     return "TOKEN_EXPIRED";
        case CloudEvent::DEVICE_GONE:       return "DEVICE_GONE";
        case CloudEvent::PROTOCOL_MISMATCH: return "PROTOCOL_MISMATCH";
        case CloudEvent::ERROR_RECOVERABLE: return "ERROR_RECOVERABLE";
        case CloudEvent::ERROR_FATAL:       return "ERROR_FATAL";
        default:                            return "?";
    }
}

unsigned long CloudStateMachine::getStateDurationMs() const {
    return millis() - _lastTransitionTime;
}

unsigned long CloudStateMachine::getLastTransitionMs() const {
    return _lastTransitionTime;
}

void CloudStateMachine::onStateChange(StateChangeCallback callback, void* context) {
    _callback = callback;
    _callbackContext = context;
}

// ---- Private ----

void CloudStateMachine::transitionTo(CloudState newState, CloudEvent event) {
    CloudState oldState = _state;
    _state = newState;
    _lastTransitionTime = millis();

    Logger log;
    char buf[64];
    snprintf(buf, sizeof(buf), "%s -> %s (%s)",
             getStateString(),
             (newState == CloudState::UNKNOWN ? "UNKNOWN" :
              newState == CloudState::OFFLINE ? "OFFLINE" :
              newState == CloudState::CONNECTING ? "CONNECTING" :
              newState == CloudState::AUTHENTICATING ? "AUTHENTICATING" :
              newState == CloudState::REGISTERING ? "REGISTERING" :
              newState == CloudState::ONLINE ? "ONLINE" :
              newState == CloudState::SYNCING ? "SYNCING" :
              newState == CloudState::DEGRADED ? "DEGRADED" :
              newState == CloudState::UPDATING ? "UPDATING" :
              newState == CloudState::ERROR ? "ERROR" : "?"),
             getEventString(event));
    log.info("CloudState", buf);

    // Notify observer
    if (_callback) {
        CloudStateTransition t = { oldState, newState, event, true, buf };
        _callback(t, _callbackContext);
    }
}

bool CloudStateMachine::isValidTransition(CloudState current, CloudEvent event) const {
    // Validate the event is relevant for the current state
    switch (current) {
        case CloudState::UNKNOWN:
            return event == CloudEvent::WIFI_CONNECTED ||
                   event == CloudEvent::WIFI_DISCONNECTED ||
                   event == CloudEvent::ERROR_FATAL;

        case CloudState::OFFLINE:
            return event == CloudEvent::WIFI_CONNECTED ||
                   event == CloudEvent::ERROR_FATAL;

        case CloudState::CONNECTING:
            return event == CloudEvent::AUTH_SUCCESS ||
                   event == CloudEvent::REGISTER_STARTED ||
                   event == CloudEvent::WIFI_DISCONNECTED ||
                   event == CloudEvent::ERROR_RECOVERABLE ||
                   event == CloudEvent::ERROR_FATAL;

        case CloudState::AUTHENTICATING:
            return event == CloudEvent::REGISTER_STARTED ||
                   event == CloudEvent::HEARTBEAT_OK ||
                   event == CloudEvent::AUTH_FAILED ||
                   event == CloudEvent::WIFI_DISCONNECTED ||
                   event == CloudEvent::ERROR_FATAL;

        case CloudState::REGISTERING:
            return event == CloudEvent::REGISTER_SUCCESS ||
                   event == CloudEvent::REGISTER_FAILED ||
                   event == CloudEvent::WIFI_DISCONNECTED ||
                   event == CloudEvent::ERROR_FATAL;

        case CloudState::ONLINE:
            return event == CloudEvent::HEARTBEAT_OK ||
                   event == CloudEvent::HEARTBEAT_FAILED ||
                   event == CloudEvent::HEARTBEAT_TIMEOUT ||
                   event == CloudEvent::WIFI_DISCONNECTED ||
                   event == CloudEvent::TOKEN_EXPIRED ||
                   event == CloudEvent::DEVICE_GONE ||
                   event == CloudEvent::PROTOCOL_MISMATCH ||
                   event == CloudEvent::ERROR_FATAL;

        case CloudState::SYNCING:
            return event == CloudEvent::HEARTBEAT_OK ||
                   event == CloudEvent::HEARTBEAT_FAILED ||
                   event == CloudEvent::WIFI_DISCONNECTED ||
                   event == CloudEvent::ERROR_FATAL;

        case CloudState::DEGRADED:
            return event == CloudEvent::HEARTBEAT_OK ||
                   event == CloudEvent::HEARTBEAT_FAILED ||
                   event == CloudEvent::WIFI_DISCONNECTED ||
                   event == CloudEvent::ERROR_FATAL;

        case CloudState::UPDATING:
            return event == CloudEvent::HEARTBEAT_OK ||
                   event == CloudEvent::WIFI_DISCONNECTED ||
                   event == CloudEvent::ERROR_FATAL;

        case CloudState::ERROR:
            return event == CloudEvent::ERROR_RECOVERABLE ||
                   event == CloudEvent::WIFI_CONNECTED ||
                   event == CloudEvent::WIFI_DISCONNECTED;

        default:
            return false;
    }
}
