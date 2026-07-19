# 🏗️ Arquitectura de Risto Platform

> Documento detallado de la arquitectura del sistema.

---

## Diagrama de Arquitectura

### Visión General (Sistema Completo)

```
┌──────────────────────────────────────────────────┐
│                   INTERNET                        │
└──────────────────────────────────────────────────┘
           ▲                          ▲
           │ HTTPS                    │ HTTPS
           ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐
│   Risto SaaS (Web)   │   │  Dispositivos IoT    │
│   React / Next.js    │   │  (ESP32-S3 + otros)  │
│                      │   │                      │
│  - Dashboard         │   │  - Button Ticket     │
│  - Gestión turnos    │   │  - Futuros devices   │
│  - Configuración     │   │                      │
│  - Reportes          │   │                      │
└──────────┬───────────┘   └──────────┬───────────┘
           ▲                          ▲
           │ REST API                 │ POST /events
           ▼                          ▼ GET /commands
┌──────────────────────────────────────────────────┐
│              Risto Cloud (Backend)                │
│                                                  │
│  ┌─────────────┐  ┌─────────────┐               │
│  │  API REST   │  │  Event Bus  │               │
│  │  (Node.js)  │  │  (Processor)│               │
│  └──────┬──────┘  └──────┬──────┘               │
│         │                │                       │
│         ▼                ▼                       │
│  ┌─────────────┐  ┌─────────────┐               │
│  │ PostgreSQL  │  │   Redis     │               │
│  │  (Datos)    │  │  (Colas)    │               │
│  └─────────────┘  └─────────────┘               │
└──────────────────────────────────────────────────┘
```

---

## Capas del Sistema

### 1. Capa de Dispositivos (Firmware)
- ESP32-S3 con pantalla táctil
- PlatformIO + Arduino Framework
- Módulos modulares (Device Core, Network, Display, etc.)
- Sin lógica de negocio

### 2. Capa de Comunicación (Event Bus)
- HTTPS REST polling
- Eventos estandarizados JSON
- Cola de comandos en la nube
- Heartbeat cada 30 segundos

### 3. Capa de Negocio (Cloud)
- API REST en Node.js
- PostgreSQL como base de datos
- Redis para colas y caché
- Lógica de negocio centralizada

### 4. Capa de Presentación (SaaS)
- Web app React/Next.js
- Dashboard en tiempo real
- Gestión de restaurantes
- Reportes y analytics

---

## Flujo de Datos: Pedir Ficha

```
1. Usuario presiona botón (físico o táctil)
2. InputManager detecta → Event: "ticket.requested"
3. NetworkManager → HTTP POST /events { type: "ticket.requested" }
4. Cloud recibe evento → Busca next ticket number
5. Cloud → Almacena en BD: Ticket { number: 146, status: "pending" }
6. Cloud → Encola comando: HTTP GET /commands/bt-001
7. Device recibe → Command: "ticket.assign" { number: 146 }
8. TicketEngine → Genera formato de ficha
9. PrinterManager → Bluetooth → Impresora térmica
10. DisplayManager → Muestra "FICHA 146 - IMPRIMIENDO..."
11. Device → HTTP POST /events { type: "ticket.printed" }
12. Display → Vuelve a pantalla de inicio
```

**Tiempo total estimado:** < 2 segundos

---

---

## Arquitectura del Firmware (Button Ticket)

### Diagrama de Módulos

```
┌──────────────────────────────────────────────────┐
│                    main.cpp                       │
│                    Application                    │
├──────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌──────────────────┐  │
│  │ Logger  │  │ Config  │  │ StorageManager   │  │
│  │ (core)  │  │ (core)  │  │ (NVS singleton)  │  │
│  └─────────┘  └─────────┘  └──────────────────┘  │
│  ┌─────────┐  ┌─────────┐  ┌──────────────────┐  │
│  │ Device  │  │Network  │  │   LedManager     │  │
│  │(device) │  │Manager  │  │   (led)          │  │
│  └─────────┘  └─────────┘  └──────────────────┘  │
│  ┌─────────┐  ┌─────────┐  ┌──────────────────┐  │
│  │ Button  │  │  Event  │  │   ApiClient      │  │
│  │ Manager │  │ Manager │  │   (api)          │  │
│  │ (button)│  │(events) │  │                  │  │
│  └─────────┘  └─────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │        ProvisioningManager (prov)             │  │
│  │    Registro local sin HTTP                    │  │
│  └──────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────┤
│               Hardware Layer (ESP32-S3)           │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────┐ │
│  │ Boot     │ │ WiFi /   │ │  GPIO / LED /     │ │
│  │ Button   │ │ BLE      │ │  Botón / UART     │ │
│  └──────────┘ └──────────┘ └───────────────────┘ │
└──────────────────────────────────────────────────┘
```

### Responsabilidades de cada módulo

| Módulo | Responsabilidad | Dependencias |
|--------|----------------|--------------|
| **Application** | Orquestador: setup() → loop(). No tiene lógica de negocio. | Todos los módulos |
| **Logger** | Logging con timestamp, nivel y tag. Solo imprime por Serial. | Constants |
| **Config** | Configuración del sistema (cargada de Storage). | Logger, StorageManager |
| **StorageManager** | Singleton. Encapsula NVS (Preferences). Persistencia clave-valor. | Logger, Preferences |
| **Device** | Estados del dispositivo, identidad, información de red. | Logger, Constants, WiFi |
| **NetworkManager** | WiFi: conexión, reconexión, monitoreo de estado. | Logger, Device, Constants |
| **LedManager** | Traduce NetworkState a patrones LED. No conoce red. | Logger |
| **ButtonManager** | Debounce de botón físico, detección de pulsación. | Logger |
| **EventManager** | Bus de eventos interno (publish/subscribe). | Logger |
| **ApiClient** | Cliente HTTP/HTTPS. registerDevice(), heartbeat(), sendEvent(). | Logger, NetworkManager, Constants |
| **ProvisioningManager** | Gestiona el ciclo de registro del dispositivo. | Logger, StorageManager, Device, ApiClient |

### Reglas de Arquitectura

1. **Application** es el único orquestador. Los módulos no se conocen entre sí.
2. **Logger** y **StorageManager** son servicios globales accesibles desde cualquier módulo.
3. Ningún módulo usa `Preferences` directamente. Siempre a través de `StorageManager`.
4. Los módulos tienen `setup()` y `loop()`.
5. `LedManager` no conoce WiFi. `Application` le pasa `NetworkState`.
6. Todo el logging usa `Logger`. No hay `Serial.print()` directo.
7. **Cloud Abstraction**: El firmware JAMÁS conoce detalles internos del cloud (Supabase, tablas, UUIDs, JWT internos). Solo conoce Risto Cloud API.
8. **Hardware Agnostic**: El servidor nunca asume hardware. El dispositivo anuncia `capabilities` en el registro.
9. **API Contract First**: El contrato en `docs/DeviceProtocolV1.md` es la fuente de verdad entre firmware y cloud.

---

## Principios Arquitecturales

1. **Separation of Concerns**: Cada capa tiene una responsabilidad única
2. **Single Source of Truth**: Los datos viven en la nube
3. **Fail Gracefully**: Si no hay cloud, el kiosko funciona offline limitado
4. **Stateless Devices**: Los dispositivos no almacenan estado crítico
5. **Observability**: Todos los eventos quedan registrados
6. **Persistence Abstraction**: Todo acceso a NVS pasa por StorageManager
7. **Singleton Services**: Logger y StorageManager son instancia única
