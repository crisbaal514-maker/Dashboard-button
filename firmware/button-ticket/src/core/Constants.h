#pragma once

// ===========================================
// Risto Devices - Core Constants
// ===========================================

// ---- Protocol & Versioning (RP-1001B.1) ----
#define RISTO_PROTOCOL_VERSION      1
#define RISTO_API_VERSION           "v1"
#define RISTO_FIRMWARE_VERSION      "0.0.2"
#define DEVICE_TYPE                 "button-ticket"
#define HARDWARE_REVISION           "R1"
#define MANUFACTURER                "Risto Devices"

// Device Identity
#define RISTO_DEVICE_NAME           "Button Ticket"

// Timing
#define RISTO_SERIAL_BAUD           115200
#define RISTO_LOOP_DELAY_MS         10
#define RISTO_HEARTBEAT_INTERVAL_MS 30000
#define RISTO_BUTTON_DEBOUNCE_MS    300

// Hardware
#define RISTO_LED_BUILTIN           GPIO_NUM_2
#define RISTO_BUTTON_PIN            GPIO_NUM_0

// WiFi Credentials (temporary for development)
#define WIFI_SSID                   "INFINITUM6BB1"
#define WIFI_PASSWORD               "CdARTATt99"

// Network States
enum class NetworkState {
    BOOT,
    CONNECTING,
    CONNECTED,
    DISCONNECTED
};

// Device States (RP-1001B.1)
enum class DeviceState {
    BOOT,
    INIT,
    UNREGISTERED,
    REGISTERED,
    CONNECTING,
    REGISTERING,
    ONLINE,
    READY,
    PRINTING,
    OFFLINE,
    RECONNECTING,
    ERROR,
    OTA,
    FACTORY_RESET
};

// Limits
#define RISTO_MAX_RETRIES           3
#define RISTO_TIMEOUT_MS            5000
#define RISTO_COMMAND_QUEUE_SIZE    8

// Boot counter
#define RISTO_STORAGE_KEY_BOOT_COUNT        "bootcnt"
#define RISTO_STORAGE_KEY_LAST_RESET_REASON "resrson"
#define RISTO_STORAGE_KEY_LAST_BOOT_TS      "bootts"
#define RISTO_STORAGE_KEY_SAFE_MODE         "safemode"
#define RISTO_BOOT_WINDOW_MS                (10 * 60 * 1000)  // 10 minutes
#define RISTO_BOOT_THRESHOLD                5                  // Max boots in window before safe mode

// Heartbeat jitter max (ms) — random offset to avoid storm on reconnection
#define RISTO_HEARTBEAT_JITTER_MAX_MS       5000

// Provisioning (RP-1001B.1)
#define RISTO_REGISTER_RETRY_DELAY_MS   5000
#define RISTO_PROVISIONING_NAMESPACE    "risto"
#define RISTO_STORAGE_KEY_REGISTERED    "reg"
#define RISTO_STORAGE_KEY_DEVICE_ID     "devid"
#define RISTO_STORAGE_KEY_ACCESS_TOKEN  "acctok"
#define RISTO_STORAGE_KEY_REFRESH_TOKEN "reftok"
#define CLOUD_DEFAULT_HOST              "192.168.1.87"    // REPLACE with your server IP
#define CLOUD_DEFAULT_PORT              3000
#define CLOUD_DEFAULT_REGISTER_PATH     "/v1/devices/register"
#define CLOUD_DEFAULT_HEARTBEAT_PATH    "/v1/devices/heartbeat"

// Log Levels
#define RISTO_LOG_LEVEL_NONE        0
#define RISTO_LOG_LEVEL_ERROR       1
#define RISTO_LOG_LEVEL_WARN        2
#define RISTO_LOG_LEVEL_INFO        3
#define RISTO_LOG_LEVEL_DEBUG       4
