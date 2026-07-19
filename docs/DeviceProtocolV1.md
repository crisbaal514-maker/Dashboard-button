# 🔄 Device Protocol V1 — Risto Device OS ↔ Risto Cloud

> Protocolo definitivo de comunicación entre dispositivos Risto y la nube.
> Válido para todos los dispositivos del ecosistema: Button Ticket, Kitchen Display, Order Pad, Smart Queue, Customer Display, Smart Printer y futuros.

**Versión del protocolo:** 1
**Última actualización:** 2026-07-17

---

## Design Principles

| Principio | Descripción |
|-----------|-------------|
| **Offline First** | El dispositivo debe funcionar sin conexión. La nube es un acelerador, no un requisito. |
| **Cloud Agnostic** | El firmware solo conoce `Risto Cloud API`. No sabe qué hay detrás (Supabase, PostgreSQL, Redis, etc.). |
| **Hardware Agnostic** | El servidor nunca asume el hardware instalado. El dispositivo anuncia sus capacidades. |
| **API Contract First** | El contrato API es la fuente de verdad. Firmware y Cloud se desarrollan contra el mismo contrato. |
| **Backward Compatibility** | El protocolo V1 debe seguir funcionando aunque exista V2. |
| **Security by Design** | Autenticación, cifrado y validación desde el diseño, no como afterthought. |
| **Modular Architecture** | Cada componente del protocolo es independiente y reemplazable. |
| **Long-term Maintainability** | Diseñado para 10+ años de operación. |

---

## Cloud Abstraction (Regla Permanente)

**Risto Device OS JAMÁS conocerá:**

- Supabase, PostgreSQL, Redis u otras tecnologías del backend
- Tablas, columnas o esquemas de base de datos
- UUIDs internos del cloud
- JWT internos del backend
- Detalles de implementación del servidor

**Risto Device OS únicamente conocerá:**

- `Risto Cloud API` — endpoints, headers, request/response formats
- Su propia `apiKey` y `deviceId`
- El protocolo definido en este documento

> Cualquier cambio en el backend (migración de base de datos, cambio de proveedor cloud, refactor interno) **no debe afectar al firmware**.

---

## Jerarquía de Organización (Tenant)

```
Tenant (Grupo Restaurantero / Franquicia)
  └── Restaurant
        └── Branch (Sucursal)
              └── Devices
```

| Nivel | Descripción | Ejemplo |
|-------|-------------|---------|
| **Tenant** | Organización dueña de uno o más restaurantes | "Grupo La Moderna" |
| **Restaurant** | Marca o restaurante específico | "La Moderna" |
| **Branch** | Sucursal física | "Sucursal Centro" |
| **Device** | Dispositivo físico | Button Ticket #001 |

- El dispositivo conoce su `restaurantId` y `branchId` después del registro.
- El tenant es invisible para el dispositivo (manejado exclusivamente en Cloud).
- El protocolo soporta que un dispositivo cambie de branch sin re-registrar.

---

## Identidad del Dispositivo

### deviceType

Identifica el tipo de dispositivo. El servidor lo usa para enrutar comandos y configuraciones específicas.

| deviceType | Dispositivo |
|------------|-------------|
| `button-ticket` | Kiosko turnero |
| `kitchen-display` | Pantalla de cocina |
| `order-pad` | Tablet de meseros |
| `customer-display` | Pantalla para cliente |
| `smart-printer` | Impresora inteligente |
| `voice-assistant` | Asistente de voz |
| `future-device` | Reservado para expansión |

### Capabilities

Cada dispositivo anuncia sus capacidades reales durante el registro. El servidor nunca asume hardware.

```json
"capabilities": {
  "button": true,
  "led": true,
  "wifi": true,
  "usb": true,
  "ota": true,
  "display": true,
  "printer": true,
  "touch": true,
  "speaker": false,
  "microphone": false,
  "bluetooth": true,
  "ethernet": false
}
```

### Feature Flags

El Cloud puede habilitar/deshabilitar funcionalidades sin actualizar firmware.

```json
"features": {
  "ota": true,
  "voice": false,
  "printer": true,
  "diagnostics": true,
  "debug": false,
  "remoteAccess": false
}
```

- Los feature flags se entregan en el heartbeat response.
- El firmware los almacena en StorageManager y los respeta.
- Si un feature flag cambia, el dispositivo lo aplica en el próximo heartbeat.

---

## Versionado

```json
{
  "protocolVersion": 1,
  "protocolMinimum": 1,
  "firmwareVersion": "0.0.2",
  "hardwareRevision": "v0.2",
  "apiVersion": "v1"
}
```

| Campo | Quién lo define | Propósito |
|-------|----------------|-----------|
| `protocolVersion` | Cloud | Versión del protocolo que el servidor soporta |
| `protocolMinimum` | Cloud | Versión mínima que el firmware debe soportar |
| `firmwareVersion` | Firmware | Semver del firmware instalado |
| `hardwareRevision` | Firmware | Revisión de PCB/hardware |
| `apiVersion` | Cloud | Versión de la API REST (path: `/v1/`) |

### Reglas de compatibilidad

| Cambio en protocolo | protocolVersion | Ejemplo |
|---------------------|----------------|---------|
| Bugfix (backward compatible) | No cambia | 1 → 1 |
| Nuevo campo opcional en request/response | No cambia | 1 → 1 |
| Nuevo campo obligatorio | Incrementa minor | 1 → 1.1 |
| Breaking change (campos eliminados, endpoints renombrados) | Incrementa major | 1 → 2 |

### Negociación

```
Device → Cloud: Header X-Risto-Protocol-Version: 1
Cloud → Device: Response incluye "protocolVersion" y "protocolMinimum"

Si protocolMinimum > device.protocolVersion:
  → Device DEBE actualizar firmware (OTA forzado)
  → No puede operar hasta actualizar

Si protocolVersion > device.protocolVersion:
  → Device puede operar
  → Pierde acceso a features nuevas del protocolo
```

---

## Máquina de Estados del Dispositivo

```
                    ┌─────────┐
                    │  BOOT   │
                    └────┬────┘
                         │
                    ┌────▼────┐
                    │  INIT   │
                    └────┬────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         ┌────▼────┐          ┌────▼────┐
         │UNREGISTER│          │REGISTERED│
         │   ED     │          └────┬────┘
         └────┬────┘               │
              │ WiFi OK             │ WiFi OK
         ┌────▼────┐          ┌────▼────┐
         │CONNECTING│          │CONNECTING│
         └────┬────┘          └────┬────┘
              │ WiFi OK             │ WiFi OK
         ┌────▼────┐          ┌────▼────┐
         │REGISTER │          │ ONLINE  │
         │ ING     │          └────┬────┘
         └────┬────┘               │
              │ Cloud OK            │ Cloud OK
         ┌────▼────┐          ┌────▼────┐
         │REGISTER │          │ READY   │
         │ ED      │          └────┬────┘
         └────┬────┘               │
              │                     │
              └─────────┬───────────┘
                        │
              ┌─────────┴─────────┐
              │                   │
         ┌────▼────┐        ┌────▼────┐
         │ OFFLINE │        │PRINTING │
         └────┬────┘        └────┬────┘
              │                   │
         ┌────▼────┐        ┌────▼────┐
         │RECONNECT│        │ READY   │
         └────┬────┘        └─────────┘
              │
         ┌────▼────┐
         │ ONLINE  │
         └────┬────┘
              │
         ┌────▼────┐
         │ READY   │
         └─────────┘

Estados terminales:
┌─────────┐  ┌─────────┐  ┌──────────────┐
│  ERROR  │  │   OTA   │  │ FACTORY_RESET│
└─────────┘  └─────────┘  └──────────────┘
```

### Tabla de Estados

| Estado | Descripción | Transiciones |
|--------|-------------|--------------|
| **BOOT** | Inicialización de módulos | → INIT |
| **INIT** | StorageManager listo, DeviceInfo poblado | → UNREGISTERED / REGISTERED |
| **UNREGISTERED** | No hay registro en NVS | → CONNECTING |
| **REGISTERED** | Registro válido en NVS | → CONNECTING |
| **CONNECTING** | Conectando a WiFi | → ONLINE / OFFLINE |
| **REGISTERING** | Enviando POST /v1/devices/register | → REGISTERED / ERROR |
| **ONLINE** | WiFi conectado, cloud reachable | → READY |
| **READY** | Operación normal | → PRINTING / OFFLINE / OTA / ERROR |
| **PRINTING** | Imprimiendo ficha (solo button-ticket) | → READY |
| **OFFLINE** | Sin conexión a cloud | → RECONNECTING |
| **RECONNECTING** | Reintentando conexión | → ONLINE / OFFLINE |
| **ERROR** | Error crítico | → BOOT (reset) |
| **OTA** | Actualizando firmware | → BOOT (post-OTA) |
| **FACTORY_RESET** | Borrando NVS y reiniciando | → BOOT |

---

## API REST — Contrato V1

### Base URL

```
Producción:  https://api.risto.com/v1
Desarrollo:  http://localhost:3000/api/v1
```

### Headers Comunes

```
Content-Type: application/json
X-API-Key: risto_{deviceType}_{apiKey}
X-Risto-Protocol-Version: 1
X-Risto-Firmware-Version: 0.0.2
X-Risto-Request-Id: req_{uuid}     ← Correlation ID
```

### Correlation ID (requestId / traceId)

- Cada request del dispositivo debe incluir un `X-Risto-Request-Id` único.
- El servidor debe incluir el mismo ID en la respuesta.
- Facilita trazabilidad y diagnóstico en sistemas distribuidos.

---

### POST /v1/devices/register

Registrar un dispositivo nuevo en el ecosistema.

**Request:**
```json
{
  "hardwareId": "0000BC4A7DDB511",
  "macAddress": "10:51:DB:7D:4A:BC",
  "deviceType": "button-ticket",
  "chipModel": "ESP32-S3",
  "firmwareVersion": "0.0.2",
  "protocolVersion": 1,
  "manufacturer": "Risto Devices",
  "deviceName": "Button Ticket",
  "hardwareRevision": "v0.2",
  "capabilities": {
    "button": true,
    "led": true,
    "wifi": true,
    "display": true,
    "printer": true,
    "touch": true,
    "bluetooth": true,
    "ota": true
  }
}
```

**Response 201 (nuevo registro):**
```json
{
  "deviceId": "bt-a1b2c3d4",
  "apiKey": "risto_bt_a1b2c3d4e5f6...",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "tokenExpiresAt": "2026-08-17T00:00:00Z",
  "protocolVersion": 1,
  "protocolMinimum": 1,
  "heartbeatInterval": 30,
  "serverTime": "2026-07-17T12:00:00Z",
  "timezone": "America/Mexico_City",
  "features": {
    "ota": true,
    "diagnostics": true,
    "debug": false
  },
  "config": {
    "ledBrightness": 128,
    "language": "es",
    "otaChannel": "stable"
  },
  "restaurant": null,
  "branch": null
}
```

**Response 200 (ya registrado — idempotencia):**
```json
{
  "status": "already_registered",
  "deviceId": "bt-a1b2c3d4",
  "apiKey": "risto_bt_existing_key..."
}
```

---

### POST /v1/devices/heartbeat

Heartbeat + polling de comandos + sincronización de tiempo.

**Request:**
```json
{
  "deviceId": "bt-a1b2c3d4",
  "requestId": "req_abc123",
  "timestamp": "2026-07-17T12:00:00Z",
  "state": "READY",
  "network": {
    "rssi": -65,
    "ssid": "Totalplay-2.4G-bfe8",
    "ip": "192.168.1.100"
  },
  "system": {
    "uptime": 3600,
    "freeHeap": 98765,
    "freePsram": 4194304,
    "flashUsage": 10.4,
    "resetReason": "POWER_ON"
  },
  "firmware": {
    "version": "0.0.2",
    "protocolVersion": 1
  },
  "counters": {
    "ticketsToday": 47,
    "errorsToday": 0
  }
}
```

**Response 200:**
```json
{
  "status": "ok",
  "requestId": "req_abc123",
  "serverTime": "2026-07-17T12:00:05Z",
  "timezone": "America/Mexico_City",
  "heartbeatInterval": 30,
  "features": {
    "ota": true,
    "diagnostics": true
  },
  "commands": [],
  "config": null,
  "token": null
}
```

**Response 200 con comandos:**
```json
{
  "status": "ok",
  "commands": [
    {
      "commandId": "cmd_restart_001",
      "type": "restart",
      "payload": { "delayMs": 5000 },
      "expiresAt": "2026-07-17T12:05:00Z",
      "priority": "high"
    }
  ]
}
```

**Response 410 (desvinculado):**
```json
{
  "status": "gone",
  "reason": "DEVICE_UNLINKED",
  "message": "Device has been unlinked from restaurant"
}
```

---

### POST /v1/devices/events

Enviar eventos al cloud.

**Request:**
```json
{
  "deviceId": "bt-a1b2c3d4",
  "requestId": "req_def456",
  "events": [
    {
      "eventId": "evt_{uuid}",
      "type": "ticket.requested",
      "timestamp": "2026-07-17T12:05:30Z",
      "payload": {
        "source": "button"
      }
    }
  ]
}
```

**Response 200:**
```json
{
  "status": "ok",
  "requestId": "req_def456",
  "received": 1
}
```

---

### POST /v1/devices/logs

Subir logs al cloud.

**Request:**
```json
{
  "deviceId": "bt-a1b2c3d4",
  "requestId": "req_logs_001",
  "logs": [
    {
      "timestamp": "2026-07-17T12:00:00Z",
      "level": "ERROR",
      "tag": "NetworkManager",
      "message": "WiFi connection timeout"
    }
  ]
}
```

**Response 200:**
```json
{
  "status": "ok",
  "requestId": "req_logs_001",
  "received": 1
}
```

---

### POST /v1/devices/diagnostics

Enviar información de diagnóstico.

**Request:**
```json
{
  "deviceId": "bt-a1b2c3d4",
  "requestId": "req_diag_001",
  "diagnostics": {
    "heap": {
      "total": 327680,
      "free": 98765,
      "minFree": 85000
    },
    "psram": {
      "total": 8388608,
      "free": 4194304
    },
    "flash": {
      "total": 16777216,
      "used": 681537,
      "usagePercent": 10.4
    },
    "network": {
      "rssi": -65,
      "uptime": 3600,
      "reconnects": 2
    },
    "system": {
      "resetReason": "POWER_ON",
      "firmwareVersion": "0.0.2",
      "hardwareRevision": "v0.2",
      "uptime": 3600
    },
    "storage": {
      "keys": 12,
      "usageBytes": 1024
    },
    "errors": [
      {
        "timestamp": "2026-07-17T11:55:00Z",
        "type": "WIFI_TIMEOUT",
        "count": 1
      }
    ]
  }
}
```

**Response 200:**
```json
{
  "status": "ok",
  "requestId": "req_diag_001"
}
```

---

### POST /v1/devices/ota/report

Reportar estado de OTA.

**Request:**
```json
{
  "deviceId": "bt-a1b2c3d4",
  "requestId": "req_ota_001",
  "otaId": "ota_001",
  "status": "success",
  "error": null,
  "version": "0.1.0",
  "timestamp": "2026-07-17T13:00:00Z"
}
```

**Response 200:**
```json
{
  "status": "ok",
  "requestId": "req_ota_001"
}
```

---

## Catálogo de Comandos Remotos V1

| Comando | Descripción | Payload | Prioridad |
|---------|-------------|---------|-----------|
| `restart` | Reiniciar dispositivo | `{"delayMs": 5000}` | alta |
| `factoryReset` | Reset a valores de fábrica | `{}` | alta |
| `ota.start` | Iniciar actualización OTA | `{"version", "url", "checksum", "size"}` | alta |
| `blink` | Parpadear LED (identificar) | `{"times": 5, "intervalMs": 500}` | baja |
| `config.update` | Actualizar configuración | `{"settings": {...}}` | normal |
| `sync.time` | Sincronizar hora | `{"timestamp": "..."}` | normal |
| `request.logs` | Subir logs al cloud | `{"level": "error", "since": "..."}` | baja |
| `identify` | Mostrar info en pantalla | `{}` | baja |
| `enable.feature` | Activar feature flag | `{"feature": "debug", "enabled": true}` | normal |

---

## Configuración desde Cloud

```json
{
  "heartbeatInterval": 30,
  "timezone": "America/Mexico_City",
  "ledBrightness": 128,
  "language": "es",
  "otaChannel": "stable",
  "debugMode": false,
  "printerTimeoutMs": 5000,
  "displayTimeoutMs": 2000,
  "buttonDebounceMs": 300,
  "offlineMaxTickets": 50
}
```

- La configuración se entrega en el heartbeat response.
- El firmware la persiste en StorageManager.
- Los cambios se aplican inmediatamente.

---

## Almacenamiento Local (StorageManager)

### Qué debe guardarse

| Clave | Tipo | Persistencia | Se pierde en... |
|-------|------|-------------|-----------------|
| `device.registered` | bool | Permanente | Factory reset |
| `device.id` | string | Permanente | Factory reset |
| `device.api_key` | string | Permanente | Factory reset |
| `device.token` | string | Hasta expiración | Factory reset |
| `device.token_expires` | uint64 | Hasta expiración | Factory reset |
| `device.restaurant_id` | string | Permanente | Factory reset / reasignación |
| `device.branch_id` | string | Permanente | Factory reset / reasignación |
| `device.protocol_version` | uint32 | Permanente | Factory reset |
| `device.firmware_version` | string | Se actualiza en OTA | Factory reset |
| `device.device_type` | string | Permanente | Factory reset |
| `device.hardware_revision` | string | Permanente | Factory reset |
| `config.*` | varios | Permanente | Factory reset |
| `features.*` | bool | Permanente | Factory reset |
| `counters.tickets_today` | uint32 | Se resetea diario | Factory reset |
| `counters.tickets_total` | uint64 | Permanente | Factory reset |

### Qué nunca debe guardarse

- Contraseñas de WiFi (deben venir de configuración externa)
- Datos de tarjetas de crédito
- Información personal de clientes
- Tokens de terceros
- Esquemas de base de datos del cloud

### Qué puede regenerarse

- `device.token` — Se regenera automáticamente en heartbeat si expira
- `counters.tickets_today` — Se resetea a 0 si no hay heartbeat por > 24h
- `config.*` — Se puede solicitar desde Cloud vía comando `config.update`
- `features.*` — Se actualizan en cada heartbeat

---

## Seguridad

### Prevención de duplicados

- El servidor usa `hardwareId` como único físico.
- Si `hardwareId` ya existe → devuelve `already_registered` con el `deviceId` existente.
- El firmware verifica `device.registered` en NVS antes de intentar registrar.

### Prevención de spoofing

- `hardwareId` se obtiene de `ESP.getEfuseMac()` — no se puede falsificar desde software.
- `macAddress` se obtiene de `esp_efuse_mac_get_default()` — solo lectura.
- El servidor puede validar que `hardwareId` y `macAddress` coincidan.

### Prevención de replay attacks

- Todos los requests incluyen `requestId` único.
- El servidor rechaza `requestId` duplicados (ventana de 5 minutos).
- Opcional: timestamp ISO8601 en cada request con tolerancia de ±5 minutos.

### Prevención de tokens robados

- Si un token es robado, el atacante solo tiene acceso hasta que expire (30 días).
- El admin puede revocar el token desde SaaS → próximo heartbeat recibe 401 → device se auto-resetea.
- Rotación automática de token en cada heartbeat si expira < 7 días.

### Device Certificate (Reservado para futuro)

El protocolo actual usa API Key + Token JWT. En el futuro, podría evolucionar a:

```
API Key + Token JWT  →  Device Certificate (X.509)
```

**Estrategia de migración sin romper compatibilidad:**

1. El firmware sigue enviando `X-API-Key` como hoy.
2. Si el servidor responde con `upgrade: "certificate"`, el firmware inicia handshake de certificado.
3. Una vez establecido el certificado, el firmware deja de enviar API Key.
4. Dispositivos viejos que no soporten certificados siguen usando API Key.

---

## Offline First

### Filosofía

El dispositivo **nunca debe quedar inoperable** por falta de conexión.

### Reglas

| Estado | Operación permitida |
|--------|-------------------|
| **UNREGISTERED + offline** | ❌ No puede operar. Muestra "Conecta a Internet para activar" |
| **REGISTERED + offline** | ✅ Operación normal limitada. Asigna tickets locales, los sincroniza después. |
| **REGISTERED + online** | ✅ Operación completa |

### Cola de eventos offline

- Los eventos se encolan localmente en una cola circular (máximo 100 eventos).
- Cuando se recupera la conexión, se envían en orden FIFO.
- Si la cola se llena, los eventos más viejos se descartan (con log de advertencia).

### Sincronización al reconectar

```
OFFLINE → ONLINE:
1. Enviar heartbeat inmediato
2. Enviar eventos encolados (POST /v1/devices/events)
3. Recibir configuración actual y feature flags
4. Reanudar operación normal
```

---

## Sincronización de Tiempo

- El servidor incluye `serverTime` ISO8601 en cada respuesta.
- El firmware almacena el offset calculado: `serverTime - deviceTime`.
- No se implementa RTC. El tiempo del dispositivo es `millis() + offset`.
- El timezone se recibe como string (`"America/Mexico_City"`) y se usa para formateo.

---

## Reintentos (Backoff)

```
Intento 1: esperar 5s
Intento 2: esperar 10s
Intento 3: esperar 20s
Intento 4: esperar 40s
Intento 5+: esperar 60s (máximo)
```

- Después de 5 intentos fallidos, el dispositivo entra en OFFLINE.
- Reintenta en cada heartbeat (30s por defecto).
- Si el error es 401 (API Key inválida) → factory reset automático.

---

## Códigos de Error Globales

| Status | Código | Descripción |
|--------|--------|-------------|
| 400 | INVALID_REQUEST | Body mal formado |
| 401 | UNAUTHORIZED | API Key inválida o expirada |
| 404 | NOT_FOUND | Device no encontrado |
| 409 | CONFLICT | hardwareId ya registrado con otro deviceId |
| 410 | GONE | Device desvinculado del restaurante |
| 422 | UNPROCESSABLE | Protocolo no soportado (protocolMinimum > device version) |
| 429 | RATE_LIMITED | Demasiadas peticiones |
| 500 | SERVER_ERROR | Error interno |

---

## Alternativas Descartadas

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| **MQTT en lugar de HTTP REST** | Complejidad adicional innecesaria. REST polling es suficiente para 30s de intervalo. MQTT se considerará si se requiere latencia < 1s. |
| **WebSockets** | Mayor consumo de RAM y conexión permanente. No justificado para el modelo offline-first. |
| **gRPC / Protocol Buffers** | Sobredimensionado para ESP32-S3. JSON es más simple de depurar y suficientemente eficiente. |
| **Registro vía Bluetooth** | Añade complejidad al primer uso. Se prefiere WiFi + botón físico para modo AP. |
| **Blockchain para identidad** | Sin caso de uso real. Añade complejidad sin beneficio. |

---

## Revisión Final — Preguntas de Diseño

### 1. ¿Qué podría romper este protocolo con 100,000 dispositivos?

- **Heartbeat escalonado** — Si todos los dispositivos hacen heartbeat al mismo segundo, el servidor recibe ~3,300 req/s. Solución: distribuir usando `hash(deviceId) % heartbeatInterval`.
- **Payload de heartbeat** — Si crece demasiado (ej: 10KB por request), el ancho de banda del servidor se satura. Solución: mantener heartbeat ligero (< 1KB), usar endpoints separados para logs y diagnostics.
- **Cola de eventos offline** — Si 10,000 dispositivos reconectan simultáneamente después de un corte masivo, el servidor recibe una avalancha de eventos. Solución: reintentos con jitter aleatorio (±5s).

### 2. ¿Qué modificarías antes de fabricar hardware en serie?

- **hardwareRevision** debe estar grabado en el firmware de fábrica, no hardcodeado en Constants.h.
- **deviceType** debe ser configurable por modelo de hardware (no por compilación).
- **MAC address** debe poder leerse desde una memoria externa (I2C EEPROM) si el chip no tiene efuse.
- **Factory reset** debe tener un mecanismo físico (botón + hold 10s) que no dependa de software.

### 3. ¿Qué parte del protocolo merece pruebas de estrés?

- **POST /v1/devices/heartbeat** — Es el endpoint más usado (30s por dispositivo).
- **POST /v1/devices/register** — Bajo volumen pero crítico. Debe ser idempotente.
- **Cola de eventos offline** — Sincronización masiva después de corte de energía.

### 4. ¿Qué responsabilidades pertenecen exclusivamente al Cloud?

- Generar `deviceId`, `apiKey`, `token`
- Validar `hardwareId` único
- Encolar y entregar comandos
- Distribuir configuración y feature flags
- Gestionar tenants, restaurantes, branches
- Firmar y expirar tokens
- Rate limiting y anti-abuse
- Almacenamiento persistente de eventos

### 5. ¿Qué responsabilidades pertenecen exclusivamente al Firmware?

- Generar `hardwareId` desde efuse MAC
- Almacenar `apiKey` y `token` en NVS
- Reintentar registro con backoff
- Operación offline (cola de eventos, tickets locales)
- Anunciar `capabilities` reales
- Ejecutar comandos remotos
- Reportar diagnóstico

### 6. ¿Existe algún riesgo para OTA futura?

- **Tamaño de firmware** — Si crece > 8MB, no cabe en el slot OTA con particiones de 16MB.
- **Rollback** — Si la OTA falla, el dispositivo debe poder volver a la versión anterior.
- **Versión mínima** — Si `protocolMinimum` cambia, dispositivos muy viejos quedarán inoperables hasta OTA.
- **Conexión interrumpida** — Si se corta el WiFi durante la descarga, el firmware queda corrupto. Solución: checksum + validación antes de aplicar.

### 7. ¿El protocolo puede soportar nuevos dispositivos sin modificaciones?

**Sí.** El protocolo está diseñado para ser device-agnostic:

- `deviceType` identifica el tipo de dispositivo.
- `capabilities` anuncia el hardware real.
- Los comandos se enrutan por `deviceType`.
- La configuración es genérica (clave-valor).
- Los feature flags permiten habilitar/deshabilitar funcionalidades sin cambiar firmware.

Para agregar un nuevo dispositivo solo se necesita:
1. Definir un nuevo `deviceType` en el servidor.
2. El firmware existente ya soporta el protocolo.

---

## Aprobado para ACT MODE

El diseño está completo y revisado. No requiere otra revisión arquitectónica.

**Próximo paso:** Implementar Fase 2 (Core Changes):
1. Modificar `Device.h/cpp` — nuevos estados
2. Modificar `Constants.h` — protocol version, API base URL
3. Modificar `ApiClient.h/cpp` — HTTP real + registerDevice() + heartbeat()
4. Crear `ProvisioningManager.h/cpp`
5. Integrar en `Application`
6. Compilar y probar en hardware
