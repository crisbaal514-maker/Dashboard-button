# 📝 Risto Platform — Changelog

> Registro de todas las sesiones y cambios importantes del proyecto.

---

## Sprint 0 — Arquitectura

### [RP-0001] — 2026-07-17

> Crear núcleo documental

**✅ Estado:** Completado

**Cambios:**
- [x] Crear estructura de carpetas del proyecto
- [x] Crear `README.md` — visión general
- [x] Crear `PROJECT_MANIFEST.md` — ADN del proyecto
- [x] Crear `PROJECT_CONTEXT.md` — contexto narrativo
- [x] Crear `ROADMAP.md` — ruta de desarrollo
- [x] Crear `CHANGELOG.md` — registro de sesiones
- [x] Crear `TODO.md` — tareas priorizadas
- [x] Crear ADR-0001 a ADR-0004
- [x] Crear documentación completa en `docs/` (10 archivos)
- [x] Crear reglas de IA en `ai/` (4 archivos)
- [x] Crear `firmware/button-ticket/` — carpeta del proyecto PlatformIO

### [RP-0002] — 2026-07-17

> Configurar entorno de desarrollo

**✅ Estado:** Completado

**Cambios:**
- [x] Verificar que PlatformIO está instalado
- [x] Mover proyecto PlatformIO de `button-ticket` a `firmware/button-ticket/`
- [x] Mejorar `platformio.ini` con:
  - `monitor_speed = 115200`
  - `upload_speed = 921600`
  - `board_build.flash_mode = qio`
  - `board_build.partitions = default_16MB.csv`
  - `build_flags` con `CORE_DEBUG_LEVEL`, `RISTO_DEVICE`, `RISTO_DEVICE_TYPE`, `RISTO_FIRMWARE_VERSION`

### [RP-0003] — 2026-07-17

> Crear proyecto PlatformIO base

**✅ Estado:** Completado

---

## Sprint 1 — Firmware Core + Cloud

### [RP-1000] — 2026-07-17

> Storage Service (NVS singleton)

**✅ Estado:** Completado

**Cambios:**
- [x] Crear `src/storage/StorageManager.h` y `.cpp`
- [x] Singleton con backend NVS (Preferences)
- [x] API: set/get para String, Bool, Int, UInt32, UInt64, Float
- [x] Integrar en Application
- [x] Compilar (0 errores, RAM 13.3%, Flash 10.4%)

### [RP-1001] — 2026-07-17

> Device Provisioning

**✅ Estado:** Completado

**Cambios:**
- [x] Diseñar flujo completo de aprovisionamiento
- [x] Definir nuevos estados (UNREGISTERED, REGISTERING, REGISTERED)
- [x] Definir claves en StorageManager
- [x] Definir endpoints cloud (POST /devices/register)
- [x] Implementar `ProvisioningManager.h` y `.cpp`
- [x] Implementar nuevos estados en Device
- [x] Implementar registerDevice() en CloudClient
- [x] Integrar ProvisioningManager en Application
- [x] Compilar (0 errores)
- [x] Subir y probar en hardware — registro exitoso

### [RP-1003I] — 2026-07-19

> Fix DNS / timing heartbeat

**✅ Estado:** Completado

**Problema:** Heartbeat fallaba con "DNS resolution failed" y "Host is unreachable"

**Causas raíz:**
1. `RESTTransport::connectInternal()` usaba `WiFiClient.connect("192.168.1.87", 3000)` con IP como string — a veces fallaba resolución DNS
2. `CloudClient::connectToCloud()` en ruta "already provisioned" no inicializaba el transport (host, port)
3. `ProvisioningManager::setup()` llamaba `connectToCloud()` antes de que WiFi estuviera conectado

**Cambios:**
- [x] `RESTTransport.cpp`: Detectar IP literal con `IPAddress::fromString()` y usar `IPAddress` directamente
- [x] `CloudClient.cpp`: Agregar `_transport->connect(_config.host, _config.port)` en ruta provisionada
- [x] `ProvisioningManager.cpp`: Diferir `connectToCloud()` al `loop()` hasta `WiFi.status() == WL_CONNECTED`
- [x] `ProvisioningManager.h`: Agregar flag `_connectToCloudPending`

**Resultado:**
```
POST /v1/devices/heartbeat -> 200 (72 ms)
POST /v1/devices/heartbeat -> 200 (105 ms)
POST /v1/devices/heartbeat -> 200 (76 ms)
```
Heartbeats funcionando cada ~30s con respuesta HTTP 200. Camino crítico validado: ESP32 → WiFi → REST → Fastify → Auth → SQLite → Dashboard → HTTP 200.

### [RP-1003J] — 2026-07-19

> Pilot 0 — Estabilidad 48h

**📅 Estado:** Pendiente

**Objetivo:** Validar estabilidad del sistema en operación continua.

**Pruebas planificadas:**
- [ ] 48h de heartbeat continuo
- [ ] Monitoreo de heap (free, largest block, fragmentation)
- [ ] Medición de jitter real en heartbeats
- [ ] 10 reinicios remotos (corte de luz)
- [ ] 20 pings al dispositivo
- [ ] 2 factory reset
- [ ] Router reiniciado
- [ ] Servidor reiniciado
- [ ] Verificar limpieza de eventos viejos en SQLite
- [ ] Dashboard estable durante horas
