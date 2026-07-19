# ADR-0004: Arquitectura de Firmware para Dispositivos

## Estado
🟡 Aceptado

## Contexto
Los dispositivos Risto necesitan un firmware que sea:
- Modular y reutilizable entre diferentes tipos de dispositivo
- Fácil de testear
- Capaz de operar offline de forma limitada
- Actualizable vía OTA
- Eficiente en recursos (ESP32)

## Decisión

### Arquitectura del Firmware
Cada dispositivo sigue una arquitectura basada en módulos con un núcleo central:

```
┌──────────────────────────────────┐
│        Application (main)        │
├──────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │ Device │ │ Display│ │Audio │ │
│  │ Core   │ │ Manager│ │Manager│ │
│  └────────┘ └────────┘ └──────┘ │
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │Network │ │ Storage│ │OTA   │ │
│  │Manager │ │ Manager│ │Manager│ │
│  └────────┘ └────────┘ └──────┘ │
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │Input   │ │ Printer│ │Logger│ │
│  │Manager │ │ Manager│ │      │ │
│  └────────┘ └────────┘ └──────┘ │
├──────────────────────────────────┤
│         HAL (Hardware Layer)     │
└──────────────────────────────────┘
```

### Módulos Core (Reutilizables)
| Módulo | Responsabilidad |
|--------|----------------|
| **Device Core** | Ciclo de vida, configuración, estado |
| **Network Manager** | WiFi, HTTPS, reconexión, heartbeat |
| **Storage Manager** | LittleFS/NVS, config persistente |
| **OTA Manager** | Actualizaciones over-the-air |
| **Logger** | Logging estructurado con niveles |
| **Event Bus Client** | Cliente HTTP para Event Bus |

### Módulos Específicos (Button Ticket)
| Módulo | Responsabilidad |
|--------|----------------|
| **Display Manager** | UI en pantalla táctil |
| **Input Manager** | Botón físico + touch |
| **Printer Manager** | Bluetooth ESC/POS |
| **Ticket Engine** | Lógica de turnos local (offline) |
| **Audio Manager** | Beep/buzzer |

### Reglas de Diseño
1. **Nunca poner lógica de negocio en el firmware**
2. **Un módulo = una responsabilidad**
3. **Comunicación entre módulos vía callbacks/eventos**
4. **Configuración siempre desde la nube**
5. **Offline mode limitado a lo esencial**

### PlatformIO Config
```ini
[env:4d_systems_esp32s3_gen4_r8n16]
platform = espressif32
board = 4d_systems_esp32s3_gen4_r8n16
framework = arduino
monitor_speed = 115200
upload_speed = 921600
build_flags =
    -D CORE_DEBUG_LEVEL=3
    -D RISTO_DEVICE
```

## Consecuencias
### Positivas
- + Módulos reutilizables entre dispositivos
- + Código fácil de testear de forma individual
- + Device Core puede publicarse como librería

### Negativas
- - Mayor consumo de flash por la abstracción
- - Curva de aprendizaje inicial para nuevos módulos

## Referencias
- [ADR-0001](./ADR-0001-Architecture.md)
- [docs/Firmware.md](../docs/Firmware.md)
- [docs/DeviceProtocol.md](../docs/DeviceProtocol.md)
