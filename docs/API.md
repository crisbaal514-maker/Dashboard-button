# 📡 API de Risto Platform

> Documentación de APIs del sistema: Cloud REST + Firmware Services.

---

# Parte 1: Cloud REST API

> Documentación de la API REST de Risto Cloud.

---

## Base URL

```
Producción:  https://api.risto.com/v1
Desarrollo:  http://localhost:3000/api/v1
```

---

## Autenticación

### Dispositivos
```
Header: X-API-Key: risto_bt_<api_key>
```

### SaaS (Usuarios)
```
Header: Authorization: Bearer <jwt_token>
```

---

## Endpoints

### POST /events
Recibir evento de un dispositivo.

**Request:**
```json
{
  "event_id": "evt_abc123",
  "type": "ticket.requested",
  "device_id": "bt-001",
  "timestamp": "2026-07-17T12:00:00Z",
  "payload": {}
}
```

**Response 200:**
```json
{
  "status": "ok",
  "event_id": "evt_abc123"
}
```

---

### GET /commands/:deviceId
Polling de comandos pendientes.

**Response 200:**
```json
{
  "commands": [
    {
      "command_id": "cmd_xyz789",
      "type": "ticket.assign",
      "payload": {
        "ticket_number": 146,
        "business_name": "Taquería El Güero"
      },
      "expires_at": "2026-07-17T12:06:00Z"
    }
  ]
}
```

---

### POST /devices/register
Registrar un nuevo dispositivo.

**Request:**
```json
{
  "device_id": "bt-001",
  "mac": "AA:BB:CC:DD:EE:FF",
  "type": "button_ticket",
  "firmware_version": "0.0.1"
}
```

**Response 201:**
```json
{
  "device_id": "bt-001",
  "api_key": "risto_bt_abc123def456...",
  "config": {
    "printer_timeout_ms": 5000,
    "polling_interval_s": 30
  }
}
```

---

### GET /devices/:id
Obtener estado de un dispositivo.

**Response 200:**
```json
{
  "id": "bt-001",
  "restaurant_id": "rest-001",
  "type": "button_ticket",
  "status": "online",
  "firmware_version": "0.0.1",
  "last_seen": "2026-07-17T12:05:30Z",
  "config": {},
  "stats": {
    "tickets_today": 47,
    "uptime_hours": 12
  }
}
```

---

### POST /ota/check
Verificar si hay nueva versión de firmware.

**Request:**
```json
{
  "device_id": "bt-001",
  "current_version": "0.0.1",
  "device_type": "button_ticket"
}
```

**Response 200:**
```json
{
  "update_available": true,
  "version": "0.1.0",
  "firmware_url": "https://storage.risto.com/firmware/bt-0.1.0.bin",
  "checksum": "sha256:abc123...",
  "size": 524288,
  "changelog": "- Soporte para múltiples turnos\n- Mejora en conexión Bluetooth"
}
```

---

## Códigos de Error

| Status | Código | Descripción |
|--------|--------|-------------|
| 400 | INVALID_REQUEST | Body mal formado |
| 401 | UNAUTHORIZED | API Key o token inválido |
| 404 | NOT_FOUND | Recurso no encontrado |
| 429 | RATE_LIMITED | Demasiadas peticiones |
| 500 | SERVER_ERROR | Error interno |

---

# Parte 2: Firmware Services API

> APIs internas del firmware disponibles para los módulos.

---

## StorageManager

```cpp
#include "storage/StorageManager.h"

// Singleton
StorageManager::getInstance();

// Ciclo de vida
void begin();   // Inicializa NVS y ejecuta prueba temporal
void end();     // Cierra sesión NVS

// Consulta y eliminación
bool exists(const char* key);
bool remove(const char* key);
void clear();   // Borra TODO el namespace

// Strings
void setString(const char* key, const char* value);
String getString(const char* key, const char* defaultValue = "");

// Booleanos
void setBool(const char* key, bool value);
bool getBool(const char* key, bool defaultValue = false);

// Enteros
void setInt(const char* key, int32_t value);
int32_t getInt(const char* key, int32_t defaultValue = 0);

// Unsigned
void setUInt32(const char* key, uint32_t value);
uint32_t getUInt32(const char* key, uint32_t defaultValue = 0);
void setUInt64(const char* key, uint64_t value);
uint64_t getUInt64(const char* key, uint64_t defaultValue = 0);

// Floats
void setFloat(const char* key, float value);
float getFloat(const char* key, float defaultValue = 0.0f);
```

---

## Device

```cpp
#include "device/Device.h"

void setup();                          // Inicializa identidad
DeviceState getState() const;          // Estado actual
void setState(DeviceState newState);   // Cambia estado
unsigned long getUptimeMs() const;     // Tiempo desde boot (ms)
const char* getStateString() const;    // Estado como string

const DeviceInfo& getInfo() const;     // Identidad completa
/* DeviceInfo:
    chipId[16], macAddress[18],
    model[32], firmwareVersion[16],
    manufacturer[32], deviceName[32],
    isRegistered
*/

const NetworkInfo& getNetworkInfo() const;
void setNetworkInfo(const NetworkInfo& info);
/* NetworkInfo:
    connected, ssid[32],
    localIP, gateway, dns,
    mac[18], hostname[64], rssi
*/
```

---

## NetworkManager

```cpp
#include "network/NetworkManager.h"

void setDevice(Device* device);   // Para actualizar NetworkInfo
void setup();                     // Conecta WiFi
void loop();                      // Monitorea estado
bool isConnected();               // WiFi conectado?
void connect();                   // (Re)conexión manual
NetworkState getState() const;    // BOOT/CONNECTING/CONNECTED/DISCONNECTED
```

---

## Logger

```cpp
#include "core/Logger.h"

void setup();
void error(const char* tag, const char* message);
void warn(const char* tag, const char* message);
void info(const char* tag, const char* message);
void debug(const char* tag, const char* message);
```

---

## LedManager

```cpp
#include "led/LedManager.h"

void setup();
void loop();
void setNetworkState(NetworkState state);  // Application sincroniza
```

---

## ButtonManager

```cpp
#include "button/ButtonManager.h"

void setup();
void loop();
bool isPressed();                 // Botón presionado (debounced)
```

---

## EventManager

```cpp
#include "events/EventManager.h"

void setup();
void loop();

// publish(topic, payload);
// subscribe(topic, callback);
```
