# 🗺️ Risto Platform — Roadmap

> Ruta de desarrollo del proyecto. Dividido en fases y sprints.

---

## 📊 Progreso Global

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ 98% — MVP Técnico Validado con Hardware Real
```

---

## 🚩 Fase 1: Fundación (Sprint 0)

> **Estado:** ✅ Completado  
> **Objetivo:** Establecer la base documental y de infraestructura del proyecto.

| Sprint | Ticket | Título | Estado |
|--------|--------|--------|--------|
| 0 | RP-0001 | Crear núcleo documental | ✅ Completado |
| 0 | RP-0002 | Configurar entorno de desarrollo | ✅ Completado |
| 0 | RP-0003 | Crear proyecto PlatformIO base | ✅ Completado |
| 0 | RP-0004 | Primer blink + pantalla | ✅ Completado |

---

## 🚩 Fase 2: Button Ticket MVP (Sprint 1-3)

> **Estado:** ✅ Completado — MVP técnico validado con hardware real  
> **Objetivo:** Kiosko turnero funcional con ESP32-S3 + Cloud.

| Sprint | Ticket | Título | Estado |
|--------|--------|--------|--------|
| 1 | RP-1000 | Storage Service (NVS singleton) | ✅ Completado |
| 1 | RP-1001 | Device Provisioning (registro + heartbeats) | ✅ Completado |
| 1 | RP-1003I | Fix DNS / timing heartbeat | ✅ Completado |
| 1 | RP-1003J | Pilot 0 — Estabilidad 48h | 📅 Pendiente |
| 2 | RP-1002 | ApiClient real (HTTP/HTTPS + registerDevice) | ✅ Completado (RESTTransport) |
| 2 | RP-1004 | Event Bus completo (cloud + internal) | 🟡 En progreso |
| 3 | RP-1005 | Display Manager (pantalla táctil) | 📅 Pendiente |
| 3 | RP-1006 | Printer Manager (Bluetooth ESC/POS) | 📅 Pendiente |
| 3 | RP-1007 | WiFi Manager (configuración inicial por AP/BLE) | 📅 Pendiente |

---

## 🚩 Fase 3: Risto Cloud (Sprint 4-6)

> **Estado:** ✅ Completado — Backend funcional con Fastify + SQLite + Dashboard  
> **Objetivo:** Backend cloud para gestión de dispositivos.

| Sprint | Ticket | Título | Estado |
|--------|--------|--------|--------|
| 4 | RP-0012 | API REST - Endpoints básicos | ✅ Completado |
| 4 | RP-0013 | Base de datos - Modelos de datos | ✅ Completado |
| 5 | RP-0014 | Device Manager - Registro y monitoreo | ✅ Completado |
| 5 | RP-0015 | Event Bus - Comunicación por eventos | ✅ Completado |
| 6 | RP-0016 | OTA - Actualizaciones remotas | 📅 Pendiente |
| 6 | RP-0017 | Autenticación y seguridad | ✅ Completado (JWT) |

---

## 🚩 Fase 4: Risto SaaS (Sprint 7-9)

> **Estado:** 🟡 Dashboard básico funcional  
> **Objetivo:** Plataforma web para administración de restaurantes.

| Sprint | Ticket | Título | Estado |
|--------|--------|--------|--------|
| 7 | RP-0018 | Frontend - Dashboard | 🟡 Dashboard básico funcional |
| 7 | RP-0019 | Frontend - Gestión de turnos | 📅 Pendiente |
| 8 | RP-0020 | Frontend - Configuración de devices | 📅 Pendiente |
| 8 | RP-0021 | Frontend - Reportes básicos | 📅 Pendiente |
| 9 | RP-0022 | Integración End-to-End | 📅 Pendiente |

---

## 🚩 Fase 5: Escalamiento (Sprint 10+)

> **Estado:** 📅 Planificado  
> **Objetivo:** Más dispositivos, más funcionalidad.

| Sprint | Ticket | Título | Estado |
|--------|--------|--------|--------|
| 10+ | RP-0023 | Nuevos tipos de dispositivo | 📅 Planificado |
| 10+ | RP-0024 | Multi-sucursal | 📅 Planificado |
| 10+ | RP-0025 | Reportes avanzados | 📅 Planificado |
| 10+ | RP-0026 | App móvil | 📅 Planificado |
| 10+ | RP-0027 | IA y analítica | 📅 Planificado |

---

## 📐 Estimaciones

| Fase | Sprints | Duración estimada | Estado |
|------|---------|-------------------|--------|
| Fundación | 1 sprint | 1 semana | ✅ Completado |
| Button Ticket MVP | 3 sprints | 3 semanas | ✅ Completado |
| Risto Cloud | 3 sprints | 3 semanas | ✅ Completado |
| Risto SaaS | 3 sprints | 3 semanas | 🟡 En progreso |
| Escalamiento | Continuo | — | 📅 Pendiente |

> **Nota:** Cada sprint = 1 semana de trabajo.
