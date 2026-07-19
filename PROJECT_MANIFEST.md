# 📋 Risto Platform — Manifest

> ADN del proyecto. Estado actual, versión y módulos.

---

## 🆔 Identidad

| Campo | Valor |
|-------|-------|
| **Nombre** | Risto Platform |
| **Visión** | Crear el ecosistema tecnológico para restaurantes más importante de Latinoamérica. |
| **Inicio** | Julio 2026 |
| **Repositorio** | `RistoPlatform` |

---

## 📊 Estado Actual

| Indicador | Valor |
|-----------|-------|
| **Sprint** | Sprint 1 (Firmware Core + Cloud) |
| **Fase** | MVP Técnico — Validado con hardware real |
| **Progreso** | ~98% del MVP técnico |
| **Versión** | 0.0.2 |
| **Dispositivo activo** | Button Ticket (ESP32-S3) |
| **Último hito** | Heartbeat → 200 OK desde ESP32 real |

---

## 🧩 Módulos

| Módulo | Estado | Versión |
|--------|--------|---------|
| Button Ticket (firmware) | 🟢 Operativo | 0.0.2 |
| Device Core | 🟢 Operativo | — |
| Network Manager | 🟢 Operativo | — |
| Storage Manager | 🟢 Operativo (RP-1000) | — |
| Device Identity | 🟢 Operativo (RP-0003) | — |
| Led Manager | 🟢 Operativo | — |
| Button Manager | 🟢 Operativo | — |
| Event Manager | 🟢 Operativo (bus interno) | — |
| REST Transport | 🟢 Operativo (con fix IP literal) | — |
| Cloud Client | 🟢 Operativo (provisioning + heartbeats) | — |
| Provisioning Manager | 🟢 Operativo (registro + persistencia NVS) | — |
| Cloud State Machine | 🟢 Operativo (UNKNOWN → ONLINE) | — |
| Risto Cloud (backend) | 🟢 Operativo (Fastify + SQLite + Auth + Dashboard) | — |
| Risto SaaS (frontend) | 🟡 Dashboard básico funcional | — |
| OTA | 📅 Planificado | — |

---

## 🎯 Sprint Actual

| Ticket | Título | Estado |
|--------|--------|--------|
| RP-1000 | Storage Service (NVS singleton) | ✅ Completado |
| RP-1001 | Device Provisioning | ✅ Completado |
| RP-1003I | Fix DNS / timing heartbeat | ✅ Completado |
| RP-1003J | Pilot 0 — Estabilidad 48h | 📅 Pendiente |
| — | PROJECT_CONTEXT.md + AI_CONTEXT.md | ✅ Creados |

---

## 🚫 No Romper

- Arquitectura por eventos
- Dispositivos desacoplados
- Cloud First
- Business Layer separado del device
- OTA desde el día uno
- Documentación como fuente de verdad
- Nunca acceder a Preferences directamente (siempre vía StorageManager)
- Nunca acceder a WiFi directamente (siempre vía NetworkManager)
- Application como único orquestador
