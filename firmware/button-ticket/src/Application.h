#pragma once

// ===========================================
// Risto Devices - Application
// ===========================================
// Central orchestration point for all modules.
// Application owns every manager and controls
// the device lifecycle: setup() -> loop().
// ===========================================

#include "core/Logger.h"
#include "core/Config.h"
#include "core/Constants.h"
#include "device/Device.h"
#include "network/NetworkManager.h"
#include "events/EventManager.h"
#include "api/ApiClient.h"
#include "led/LedManager.h"
#include "button/ButtonManager.h"
#include "storage/StorageManager.h"
#include "cloud/RESTTransport.h"
#include "cloud/CloudClient.h"
#include "provisioning/ProvisioningManager.h"
#include "commands/CommandDispatcher.h"
#include "commands/CommandQueue.h"

// Default cloud config (dev mode — use insecure for now)
#define CLOUD_USE_INSECURE true

class Application {
public:
    Application();
    ~Application();

    void setup();
    void loop();

private:
    Logger      _logger;
    Config      _config;
    Device      _device;
    NetworkManager  _networkManager;
    EventManager    _eventManager;
    LedManager      _ledManager;
    ButtonManager   _buttonManager;
    ApiClient       _apiClient;

    // RP-1003H: Real cloud communication
    RESTTransport   _transport;
    CloudClient     _cloudClient;

    // RP-1001B.1: Provisioning
    ProvisioningManager _provisioningManager;

    // RP-1003K: Command infrastructure
    CommandDispatcher _dispatcher;
};
