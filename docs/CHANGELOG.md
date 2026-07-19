# 📋 Changelog — Risto Platform

> Historial de cambios del proyecto.

---

## v0.0.3 — RP-1001B.1 HW Validation (2026-07-17)

### Agregado
- Logs detallados en Application, StorageManager y ProvisioningManager
- Tiempos de NVS (lectura/escritura en microsegundos)
- Tiempo total de boot
- Transiciones de estado (anterior → nuevo)
- Auto-restart con `ESP.restart()` después del registro mock
- `docs/reports/RP-1001B.1-HW.md` — Reporte de validación en hardware

### Bugfix
- Claves NVS `device.registered` (17 chars) excedían límite de 15 → corregido a `reg` y `devid`
- StorageManager no mostraba errores de NVS → ahora visibles en log

### Compatibilidad
- RAM: 13.3% | Flash: 10.5%
- Compilación 0 errores, 0 warnings

---

## v0.0.2 — RP-1000 Storage Service (2026-07-17)

### Agregado
- `provisioning/ProvisioningManager` — Máquina de estados de registro local
  - `setup()` → carga estado desde NVS, setea UNREGISTERED o REGISTERED
  - `loop()` → intenta registro mock con retry exponencial
  - `startRegistration()` → genera deviceId local basado en chipId
  - `resetRegistration()` → factory reset, limpia NVS
  - Persiste `device.registered` y `device.id` en StorageManager
- Nuevos estados en `DeviceState`: INIT, UNREGISTERED, REGISTERED, REGISTERING, ONLINE, RECONNECTING, FACTORY_RESET
- `RegistrationInfo` struct en `Device.h` con `isRegistered` y `deviceId`
- `Device::markRegistered(deviceId)` y `Device::markUnregistered()`
- Versionado centralizado en `Constants.h`:
  - `RISTO_PROTOCOL_VERSION`, `RISTO_API_VERSION`, `RISTO_FIRMWARE_VERSION="0.0.2"`
  - `DEVICE_TYPE`, `HARDWARE_REVISION`, `MANUFACTURER`
- `DeviceInfo` extendido: `deviceType`, `hardwareRevision`, `protocolVersion`

### Cambios
- `Constants.h`: versionado centralizado, nuevos estados, claves de storage
- `Device.h/cpp`: nuevos estados, RegistrationInfo, markRegistered/markUnregistered
- `StorageManager.cpp`: eliminado test temporal de validación NVS
- `Application.h/cpp`: integración de ProvisioningManager
- `platformio.ini`: include path `-Isrc/provisioning`, eliminado `-D RISTO_FIRMWARE_VERSION`
- `Architecture.md`: diagrama actualizado con ProvisioningManager

### Compatibilidad
- RAM: 13.3% | Flash: 10.4%
- Compilación 0 errores, 0 warnings

---

## v0.0.2 — RP-1000 Storage Service (2026-07-17)

### Agregado
- `StorageManager` — Servicio singleton de persistencia NVS
  - `begin()`, `end()`, `exists()`, `remove()`, `clear()`
  - `setString/getString`, `setBool/getBool`, `setInt/getInt`
  - `setUInt32/getUInt32`, `setUInt64/getUInt64`, `setFloat/getFloat`
- Inicialización de StorageManager en `Application::setup()`
- Include path `-Isrc/storage` en `platformio.ini`

### Cambios
- `platformio.ini`: nuevo include path
- `Application.h`: nuevo include
- `Application.cpp`: inicialización del storage

### Compatibilidad
- RAM: 13.3% | Flash: 10.4%
- Compilación 0 errores, 0 warnings

---

## v0.0.1 — Base System (2026-07-17)

### Agregado
- Estructura modular del firmware
- `core/Logger` — Logging con timestamps y niveles
- `core/Config` — Configuración básica
- `core/Constants` — Constantes del sistema
- `device/Device` — Estados (BOOT → READY → OFFLINE) + NetworkInfo
- `network/NetworkManager` — WiFi real con reconexión
- `led/LedManager` — Traducción de NetworkState a patrones LED
- `button/ButtonManager` — Debounce de botón físico
- `events/EventManager` — Bus de eventos interno
- `api/ApiClient` — Esqueleto de cliente HTTP
- `Application` — Orquestador central (setup/loop)
- `main.cpp` — Entry point
- Documentación base en `docs/`

### Compatibilidad
- RAM: 5.7% → 13.2% | Flash: 3.9% → 10.3%
- Compilación 0 errores
