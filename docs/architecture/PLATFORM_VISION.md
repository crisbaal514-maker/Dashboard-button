# 🌐 Risto Platform — Platform Vision

> ¿Qué es Risto Cloud?

---

## 🎯 Declaración

**Risto Cloud no es un backend para Button Ticket.**

Es una plataforma IoT para restaurantes.

Un dispositivo no es un producto. La plataforma sí.

---

## 🧱 Filosofía de la plataforma

Todo dispositivo en Risto debe implementar **únicamente** 5 capacidades:

| Capacidad | Descripción |
|-----------|-------------|
| **Register** | Registrarse en la plataforma y obtener identidad |
| **Heartbeat** | Reportar estado periódicamente (vida) |
| **Commands** | Recibir y ejecutar comandos remotos |
| **Diagnostics** | Reportar salud (heap, RSSI, uptime, errores) |
| **OTA** | Actualizar firmware de forma remota |

Nada más.

El resto es especialización del dispositivo (pantalla, botón, impresora, cámara, etc.)

---

## 🏗️ Interfaces estables

Las siguientes interfaces están **congeladas** (no cambian sin ADR):

| Interfaz | Propósito |
|----------|-----------|
| **Contracts V1** | Contratos de API entre cloud y dispositivos |
| **Protocol V1** | Formato de mensajes (JSON sobre HTTP/TCP) |
| **Storage Provider** | Abstracción de base de datos (SQLite → PostgreSQL) |
| **Cloud API** | Endpoints públicos (/v1/*) |

Lo que **puede cambiar** sin romper contratos:
- Dashboard
- Firmware interno del dispositivo
- Drivers de hardware
- Optimizaciones de red

---

## 🗺️ Ciclo de vida de un dispositivo

```
Factory
  │
  ▼
Provisioning (primer registro)
  │
  ▼
Registered (identidad asignada)
  │
  ▼
Authenticated (tokens válidos)
  │
  ▼
Heartbeat (operación continua)
  │
  ▼
Commands (interacción remota)
  │
  ▼
OTA (actualizaciones)
  │
  ▼
Retired (fin de vida)
```

---

## 🧩 Familias de dispositivos

| Familia | Estado | Prioridad |
|---------|--------|-----------|
| Button Ticket | 🟢 MVP validado | 🔴 Alta |
| Kitchen Display | 📅 Planificado | 🟡 Media |
| Display Cliente | 📅 Planificado | 🟡 Media |
| POS | 📅 Planificado | 🟢 Alta |
| Sensores (temperatura, humedad) | 📅 Planificado | 🟡 Media |
| Relays (control de equipos) | 📅 Planificado | 🟡 Media |
| Kiosk (autoservicio) | 📅 Planificado | 🟢 Alta |
| Voice Assistant | 📅 Planificado | 🟠 Baja |
| AI Camera (visión computacional) | 📅 Planificado | 🟠 Baja |
