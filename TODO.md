# ✅ Risto Platform — TODO

> Lista priorizada de tareas del proyecto.

---

## 🟢 Sprint Actual — Sprint 1 (Firmware Core + Cloud)

### RP-1000: Storage Service ✅ COMPLETADO

Prioridad: 🔴 Alta — ✅ **Completado (100%)** — 2026-07-17

- [x] Crear `src/storage/StorageManager.h` y `.cpp`
- [x] Singleton con backend NVS (Preferences)
- [x] API: set/get para String, Bool, Int, UInt32, UInt64, Float
- [x] Prueba temporal en `begin()` validada en hardware
- [x] Integrar en Application (include + inicialización)
- [x] Compilar (0 errores, RAM 13.3%, Flash 10.4%)
- [x] Reporte RP-1000 en docs/reports/
- [x] Actualizar ROADMAP.md, CHANGELOG.md, DEVICE_SPEC.md, API.md
- [x] Remover prueba temporal de `begin()` (cuando RP-1001 inicie)

---

### RP-1001: Device Provisioning ✅ COMPLETADO

Prioridad: 🔴 Alta — ✅ **Completado (100%)** — 2026-07-19

- [x] Diseñar flujo completo de aprovisionamiento
- [x] Definir nuevos estados (UNREGISTERED, REGISTERING, REGISTERED)
- [x] Definir claves en StorageManager
- [x] Definir endpoints cloud (POST /devices/register)
- [x] Definir escenarios: primer arranque, reemplazo, factory reset, cambio restaurante
- [x] Implementar `src/provisioning/ProvisioningManager.h`
- [x] Implementar `src/provisioning/ProvisioningManager.cpp`
- [x] Implementar nuevos estados en Device (UNREGISTERED, REGISTERING, REGISTERED)
- [x] Implementar registerDevice() en CloudClient
- [x] Integrar ProvisioningManager en Application
- [x] Compilar (0 errores)
- [x] Subir y probar en hardware — registro exitoso
- [x] Reporte RP-1001
- [x] Actualizar documentación

---

### RP-1003I: Fix DNS / timing heartbeat ✅ COMPLETADO

Prioridad: 🔴 Alta — ✅ **Completado (100%)** — 2026-07-19

- [x] `RESTTransport.cpp`: Detectar IP literal vs hostname
- [x] `CloudClient.cpp`: Inicializar transport en ruta provisionada
- [x] `ProvisioningManager.cpp`: Diferir connectToCloud hasta WiFi conectado
- [x] Compilar y subir
- [x] Verificar heartbeats → HTTP 200

---

### RP-1003J: Pilot 0 — Estabilidad 48h 🟡 EN EJECUCIÓN

Prioridad: 🔴 Alta — 🟡 **En ejecución** — Inicio: 2026-07-19 09:00

**Setup:**
- [x] ESP32 registrado, heartbeats funcionando, ONLINE en dashboard
- [x] Sin factory reset — el estado actual es valioso para el piloto
- [x] Pilot Status añadido al Dashboard: banner verde con timer, HB, Re, RS, RSSI

**Fase 1 — Operación continua (24h sin tocar nada):**
- [ ] Dejar ESP32 conectado a cargador USB, sin PC
- [ ] Mantener Risto Cloud + Dashboard corriendo en PC
- [ ] Cada 6h verificar:
  - [ ] Dashboard: 🟢 Online
  - [ ] Heartbeats: contador sigue aumentando
  - [ ] SQLite: `SELECT * FROM heartbeats ORDER BY created_at DESC LIMIT 5;`

**Fase 2 — Pruebas destructivas (después de 24h, en este orden):**
- [ ] 1. Reiniciar servidor → verificar backoff + reconexión automática
- [ ] 2. Reiniciar router → verificar reconexión WiFi automática
- [ ] 3. Cortar energía al ESP32 → reconectar → debe hacer Boot → leer NVS → Heartbeat (sin re-register)
- [ ] 4. Probar comandos: Ping → Restart → Ping
- [ ] 5. Factory reset (solo si todo lo anterior pasó)

**Fase 3 — Reporte:**
- [ ] Revisar SQLite: heartbeats, events, commands
- [ ] Verificar limpieza de datos viejos
- [ ] Escribir reporte RP-1003J en docs/reports/

---

### Documentación de continuidad — ✅ COMPLETADO

- [x] Crear `PROJECT_CONTEXT.md` (memoria del proyecto para IAs)
- [x] Crear `ai/AI_CONTEXT.md` (instrucciones específicas para IAs)
- [x] Actualizar `PROJECT_MANIFEST.md` con estado real
- [x] Actualizar `TODO.md` con estado actual
- [x] Actualizar `ROADMAP.md` con progreso real (98% MVP)
- [x] Actualizar `CHANGELOG.md` con RP-1003I y RP-1003J

---

### Próximos RP (futuros, después del Pilot 0)

| RP | Título | Prioridad |
|----|--------|-----------|
| RP-1004 | Event Bus completo (cloud + internal) | 🟡 Media |
| RP-1005 | Display Manager (pantalla táctil) | 🟡 Media |
| RP-1006 | Printer Manager (Bluetooth ESC/POS) | 🟡 Media |
| RP-1007 | WiFi Manager (configuración inicial por AP/BLE) | 🟡 Media |
| RP-0016 | OTA - Actualizaciones remotas | 🟡 Media |
