# 🧠 Risto Platform — Contexto del Proyecto

> Contexto narrativo, decisiones actuales y estado del proyecto para cualquier IA que se incorpore.

---

## 📖 Historia

Risto Platform nació como un proyecto para crear un kiosko turnero económico para negocios locales. La idea original era simple: una tablet Android + impresora Bluetooth + un botón arcade físico conectado a un ESP32 para generar fichas numeradas.

Durante el desarrollo, el proyecto evolucionó hacia algo mucho más grande: **un ecosistema completo de dispositivos IoT inteligentes para la industria restaurantera**.

Actualmente estamos en **Sprint 0 — Fase de Arquitectura**, sentando las bases documentales y de infraestructura antes de escribir una sola línea de firmware.

---

## 🎯 Propósito

Crear un sistema donde:

1. Los restaurantes puedan instalar dispositivos inteligentes (kioskos, ordenadores, pantallas)
2. Todos los dispositivos se conecten a una nube centralizada
3. El dueño del restaurante pueda administrar todo desde un SaaS web
4. Los dispositivos sean simples terminales: toda la lógica de negocio vive en la nube
5. Las actualizaciones sean OTA (over-the-air)
6. La comunicación sea por eventos (Event Bus desacoplado)

---

## 🧱 Decisiones Arquitecturales Clave

### ¿Por qué ESP32?
- Bajo costo ($5-$15 USD)
- Bluetooth + WiFi integrados
- Suficiente potencia para un kiosko turnero
- Amplio ecosistema (PlatformIO, Arduino, ESP-IDF)

### ¿Por qué NO Raspberry Pi?
- Mayor costo
- Sobrada para la tarea
- Mayor consumo energético
- Más complejidad innecesaria

### ¿Por qué eventos (Event Bus)?
- Desacopla dispositivos de la nube
- Permite agregar nuevos tipos de dispositivos sin modificar el core
- Escalable
- Resiliente a fallos de red

### ¿Por qué Cloud First?
- La lógica de negocio cambia más rápido que el firmware
- Actualizar un backend es más seguro que actualizar 100 dispositivos
- Permite auditoría centralizada
- Los dispositivos se vuelven tontos (y eso es bueno)

### ¿Por qué HTTPS y no MQTT?
- HTTPS es más simple de asegurar
- No requiere broker adicional
- Suficiente para el volumen de un restaurante
- Se puede migrar a MQTT si escala

---

## 📁 Estructura del Proyecto

```
RistoPlatform/
├── firmware/
│   └── button-ticket/       # Proyecto PlatformIO del kiosko
├── docs/                     # Documentación técnica
├── ADR/                      # Decisiones de arquitectura
├── ai/                       # Reglas y contexto para IAs
├── cloud/                    # Backend cloud (futuro)
├── saas/                     # Frontend web (futuro)
├── tools/                    # Herramientas y scripts
├── .github/                  # CI/CD y templates
├── README.md
├── PROJECT_MANIFEST.md
├── PROJECT_CONTEXT.md
├── ROADMAP.md
├── CHANGELOG.md
└── TODO.md
```

---

## 🔗 Documentación Relacionada

- [PROJECT_MANIFEST.md](./PROJECT_MANIFEST.md) — Estado estructurado del proyecto
- [ROADMAP.md](./ROADMAP.md) — Ruta de desarrollo
- [CHANGELOG.md](./CHANGELOG.md) — Registro de sesiones
- [TODO.md](./TODO.md) — Tareas pendientes
- [ADR/](./ADR/) — Decisiones de arquitectura
- [docs/Architecture.md](./docs/Architecture.md) — Arquitectura detallada
- [ai/AI_RULES.md](./ai/AI_RULES.md) — Reglas para IAs del proyecto
