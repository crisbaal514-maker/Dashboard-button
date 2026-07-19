# 🗺️ Risto Platform — Roadmap

> Estado general del proyecto y progreso de los RP.

**Última actualización:** 2026-07-17

---

## Estado General

| Componente | Estado |
|---|---|
| Firmware Base (estructura modular) | ✅ Completado |
| WiFi / NetworkManager | ✅ Completado |
| Device Identity (RP-0003) | ✅ Completado |
| Storage / Persistencia (RP-1000) | ✅ Completado |
| Versionado centralizado (Constants.h) | ✅ Completado |
| Provisioning Local (RP-1001B.1) | ✅ **Validado en HW** |
| API Cloud | 📅 Pendiente |
| OTA | 📅 Pendiente |

---

## Lista de RP

| RP | Descripción | Estado | Fecha |
|----|-------------|--------|-------|
| Base | Estructura modular + Logger + Config + main.cpp | ✅ Completado | 2026-07-17 |
| RP-0002 | WiFi real + NetworkManager + LedManager + Device NetworkInfo | ✅ Completado | 2026-07-17 |
| RP-0003 | Device Identity (Chip ID, MAC, modelo fabricante) | ✅ Completado | 2026-07-17 |
| RP-1000 | StorageManager (NVS singleton) | ✅ Completado | 2026-07-17 |
| RP-1001B.1 | ProvisioningManager local (sin HTTP) | ✅ Validado en HW | 2026-07-17 |
| RP-1001B.2 | ApiClient real + registro cloud | 📅 Pendiente | — |
| RP-1001B.3 | Persistencia post-registro (deviceId, token, etc.) | 📅 Pendiente | — |
| RP-1001B.4 | Heartbeat | 📅 Pendiente | — |
| RP-1001B.5 | Diagnostics | 📅 Pendiente | — |
| RP-1001B.6 | Feature Flags | 📅 Pendiente | — |
| RP-1001B.7 | Remote Commands | 📅 Pendiente | — |

---

## Próximo RP Recomendado

**RP-1001B.2 — ApiClient real + registro cloud**

Implementar HTTP/HTTPS en ApiClient:
- `registerDevice()` — POST /v1/devices/register
- JSON payload con DeviceInfo completo
- Timeout, retry, manejo de errores HTTP
- Integración con ProvisioningManager
