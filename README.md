# Risto Platform 🚀

> Ecosistema tecnológico para restaurantes de Latinoamérica.

Risto Platform es un sistema modular de dispositivos IoT inteligentes para la industria restaurantera. Comenzamos con **Button Ticket**, un kiosko turnero inteligente para impresión de fichas, y evolucionamos hacia una plataforma completa de gestión restaurantera.

---

## 📦 Módulos

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Button Ticket** | 🟡 En desarrollo | Kiosko turnero con ESP32-S3 + pantalla táctil + impresora Bluetooth |
| **Device Core** | 📅 Planificado | Núcleo de abstracción para dispositivos IoT |
| **Risto Cloud** | 📅 Planificado | Backend cloud para gestión de dispositivos |
| **Risto SaaS** | 📅 Planificado | Plataforma web para administración de restaurantes |
| **Risto Devices** | 📅 Planificado | Catálogo de dispositivos inteligentes |

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────┐
│         Risto SaaS (Web)            │
├─────────────────────────────────────┤
│         Risto Cloud (API)           │
├─────────────────────────────────────┤
│      ┌──────────┐ ┌──────────┐      │
│      │ Device   │ │ Device   │      │
│      │ Core     │ │ Manager  │      │
│      └──────────┘ └──────────┘      │
├─────────────────────────────────────┤
│  Button Ticket  │  Otros Devices    │
│  (ESP32-S3)     │  (Futuro)         │
└─────────────────────────────────────┘
```

- **Arquitectura por eventos** (Event Bus)
- **Cloud First**: toda la lógica de negocio vive en la nube
- **Dispositivos desacoplados**: los devices solo ejecutan, no deciden
- **OTA**: actualizaciones remotas de firmware

---

## 📚 Documentación

| Archivo | Propósito |
|---------|-----------|
| [PROJECT_MANIFEST.md](./PROJECT_MANIFEST.md) | ADN del proyecto (estado, versión, sprint) |
| [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) | Contexto narrativo y decisiones |
| [ROADMAP.md](./ROADMAP.md) | Ruta de desarrollo con sprints |
| [CHANGELOG.md](./CHANGELOG.md) | Registro de sesiones |
| [TODO.md](./TODO.md) | Tareas priorizadas |
| [ADR/](./ADR/) | Decisiones de arquitectura |
| [docs/](./docs/) | Documentación técnica detallada |
| [ai/](./ai/) | Reglas y contexto para IAs del proyecto |

---

## 🛠️ Stack Tecnológico

- **Firmware**: PlatformIO + ESP32-S3 + Arduino Framework
- **Cloud**: Node.js / Python (por definir)
- **SaaS**: Web (React / Next.js)
- **Base de datos**: PostgreSQL
- **Impresión**: Bluetooth térmico (ESC/POS)

---

## 🚀 Empezando

```bash
# Clonar el proyecto
git clone <url>

# Abrir firmware
cd firmware/button-ticket
platformio run

# Ver documentación
code README.md
```

---

## 📋 Convenciones

- Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/)
- Todo cambio importante requiere un ADR
- La documentación es la única fuente de verdad
- Las IAs del proyecto siguen [AI_RULES.md](./ai/AI_RULES.md)
