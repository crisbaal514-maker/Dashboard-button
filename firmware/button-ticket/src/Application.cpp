#include "Application.h"
#include "core/BuildInfo.h"

static unsigned long _bootStartTime = 0;

Application::Application()
    : _logger()
    , _config()
    , _device()
    , _networkManager()
    , _eventManager()
    , _ledManager()
    , _buttonManager()
    , _apiClient()
    , _transport()
    , _cloudClient(&_transport)
    , _provisioningManager(_device, &_cloudClient)
    , _dispatcher() {
}

Application::~Application() {
}

void Application::setup() {
    _bootStartTime = millis();

    // Initialize core modules first
    _logger.setup();

    _logger.info("App", "=================================");
    _logger.info("App", "BOOT");
    _logger.info("App", "=================================");
    _logger.info("App", "Risto Devices - Button Ticket");
    _logger.info("App", BuildInfo::version);
    _logger.info("App", BuildInfo::buildTime);

    char verBuf[48];
    snprintf(verBuf, sizeof(verBuf), "Device: %s Rev: %s Proto: v%u",
             BuildInfo::deviceType, HARDWARE_REVISION, RISTO_PROTOCOL_VERSION);
    _logger.info("App", verBuf);

    unsigned long t0, t1;
    char timeBuf[48];

    // ---- Storage ----
    t0 = micros();
    StorageManager::getInstance().begin();
    t1 = micros();
    snprintf(timeBuf, sizeof(timeBuf), "Storage initialized (%lu us)", (t1 - t0));
    _logger.info("App", timeBuf);

    // ---- Device (populates info, boots state machine) ----
    _device.setup();

    // RP-1003K: Boot counter and reset reason tracking
    t0 = micros();
    _device.trackBoot();
    t1 = micros();
    snprintf(timeBuf, sizeof(timeBuf), "Boot tracking (%lu us) count=%u safe=%s",
             (t1 - t0), _device.getBootCount(), _device.isSafeMode() ? "YES" : "NO");
    _logger.info("App", timeBuf);

    // RP-1003K: Check safe mode — limit functionality if boot looping
    if (_device.isSafeMode()) {
        _logger.warn("App", "SAFE MODE — limiting network/cloud activity");
    }

    _config.setup();

    // ---- Network ----
    _networkManager.setDevice(&_device);
    _networkManager.setup();

    // ---- Peripheral modules ----
    _eventManager.setup();
    _ledManager.setup();
    _buttonManager.setup();
    _apiClient.setup();

    // ---- Cloud (unless safe mode) ----
    if (!_device.isSafeMode()) {
        t0 = micros();
        _transport.begin();
        _transport.setInsecure(CLOUD_USE_INSECURE);

        CloudClientConfig cloudConfig;
        cloudConfig.host = CLOUD_DEFAULT_HOST;
        cloudConfig.port = CLOUD_DEFAULT_PORT;
        cloudConfig.registerPath = CLOUD_DEFAULT_REGISTER_PATH;
        cloudConfig.heartbeatPath = CLOUD_DEFAULT_HEARTBEAT_PATH;
        cloudConfig.ackPath = "/v1/devices/commands/%s/ack";
        cloudConfig.heartbeatIntervalMs = RISTO_HEARTBEAT_INTERVAL_MS;
        cloudConfig.connectionTimeoutMs = RISTO_TIMEOUT_MS;
        cloudConfig.backoffMinMs = 5000;
        cloudConfig.backoffMaxMs = 300000;

        _cloudClient.begin(cloudConfig);
        t1 = micros();
        snprintf(timeBuf, sizeof(timeBuf), "CloudClient initialized (%lu us)", (t1 - t0));
        _logger.info("App", timeBuf);

        // RP-1001B.1: Initialize provisioning (uses CloudClient internally)
        _provisioningManager.setup();

        // Load persisted credentials from NVS
        _provisioningManager.loadFromStorage();
    } else {
        _logger.warn("App", "CloudClient DISABLED — safe mode");
    }

    unsigned long elapsed = millis() - _bootStartTime;
    snprintf(timeBuf, sizeof(timeBuf), "Boot complete (%lu ms total)", elapsed);
    _logger.info("App", timeBuf);
    _logger.info("App", "=================================");
}

void Application::loop() {
    _logger.loop();
    _config.loop();
    _device.loop();
    _networkManager.loop();

    _ledManager.setNetworkState(_networkManager.getState());

    _eventManager.loop();
    _ledManager.loop();
    _buttonManager.loop();
    _apiClient.loop();

    // Cloud & provisioning (skip in safe mode)
    if (!_device.isSafeMode()) {
        _cloudClient.loop();
        _provisioningManager.loop();
    }

    // RP-1003K: Drain one command from queue per loop cycle
    CommandQueue& cmdQueue = _cloudClient.getCommandQueue();
    if (!cmdQueue.isEmpty()) {
        Command cmd;
        if (cmdQueue.pop(cmd)) {
            _logger.info("App", "Executing queued command");

            char result[256];
            CommandStatus status = _dispatcher.execute(cmd, result, sizeof(result));

            const char* error = nullptr;
            if (status == CommandStatus::FAILED || status == CommandStatus::REJECTED) {
                error = result;
            }

            _cloudClient.sendAck(cmd.id, status,
                                 (status == CommandStatus::COMPLETED) ? result : nullptr,
                                 error);
        }
    }

    // Yield to watchdog / scheduler
    delay(RISTO_LOOP_DELAY_MS);
}
