# 📟 Device Specification — Button Ticket

> Especificación técnica actual del dispositivo Button Ticket.

**Última actualización:** 2026-07-17

---

## Modelo

| Campo | Valor |
|-------|-------|
| Nombre | Button Ticket |
| Tipo | `button-ticket` |
| Fabricante | Risto Devices |
| Firmware | `0.0.2` |
| Protocolo | `v1` |
| HW Revision | `R1` |

---

## Hardware Soportado

| Componente | Especificación | Estado |
|------------|---------------|--------|
| MCU | ESP32-S3 (Xtensa LX7 dual-core @ 240MHz) | ✅ Operativo |
| Flash | 16 MB (Quad I/O) | ✅ Operativo |
| PSRAM | 8 MB (Embedded) | ✅ Disponible |
| WiFi | 2.4 GHz 802.11 b/g/n | ✅ Operativo |
| Bluetooth | BLE 5.0 | 📅 Pendiente |
| LED | GPIO_NUM_2 | ✅ Operativo |
| Botón | GPIO_NUM_0 (BOOT) | ✅ Operativo |
| USB | USB-Serial/JTAG | ✅ Operativo |
| Pantalla | 4D Systems gen4 (táctil resistiva) | 📅 Pendiente |
| Impresora | Térmica Bluetooth 58mm ESC/POS | 📅 Pendiente |

---

## Servicios Disponibles

### Storage

| Servicio | Estado | Descripción |
|----------|--------|-------------|
| StorageManager | ✅ | Persistencia NVS singleton |
| setString / getString | ✅ | Strings |
| setBool / getBool | ✅ | Booleanos |
| setInt / getInt | ✅ | Enteros 32-bit |
| setUInt32 / getUInt32 | ✅ | Unsigned 32-bit |
| setUInt64 / getUInt64 | ✅ | Unsigned 64-bit |
| setFloat / getFloat | ✅ | Flotantes |
| exists / remove / clear | ✅ | Utilidades |

### Network

| Servicio | Estado | Descripción |
|----------|--------|-------------|
| WiFi Station | ✅ | Conexión a router |
| Reconexión automática | ✅ | Al perder señal |
| NetworkState | ✅ | BOOT → CONNECTING → CONNECTED → DISCONNECTED |
| NetworkInfo | ✅ | IP, RSSI, Gateway, DNS, MAC, Hostname |

### Device Identity

| Servicio | Estado | Descripción |
|----------|--------|-------------|
| DeviceInfo | ✅ | Chip ID, MAC, modelo, firmware, fabricante, nombre, tipo, HW rev, protocolo |
| DeviceState | ✅ | BOOT → INIT → UNREGISTERED → REGISTERED → CONNECTING → REGISTERING → ONLINE → READY → PRINTING → OFFLINE → RECONNECTING → ERROR → OTA → FACTORY_RESET |
| getInfo() | ✅ | Retorna DeviceInfo |
| RegistrationInfo | ✅ | isRegistered + deviceId |
| markRegistered() | ✅ | Marca dispositivo como registrado |
| markUnregistered() | ✅ | Marca dispositivo como no registrado |

### Provisioning (RP-1001B.1)

| Servicio | Estado | Descripción |
|----------|--------|-------------|
| ProvisioningManager | ✅ | Máquina de estados de registro local |
| startRegistration() | ✅ | Genera deviceId local mock |
| resetRegistration() | ✅ | Factory reset, limpia NVS |
| Persistencia en NVS | ✅ | device.registered + device.id |
| Registro cloud real | 📅 | RP-1001B.2 |

### API

| Servicio | Estado | Descripción |
|----------|--------|-------------|
| ApiClient | ⚠️ Esqueleto | Sin conexión HTTP real |
| POST /events | 📅 | Pendiente |
| GET /commands | 📅 | Pendiente |
| POST /devices/register | 📅 | RP-1001B.2 |
| GET /ota/check | 📅 | Pendiente |

### Eventos

| Servicio | Estado | Descripción |
|----------|--------|-------------|
| EventManager | ✅ | Bus interno publish/subscribe |
| Eventos cloud | 📅 | Pendiente |

### OTA

| Servicio | Estado | Descripción |
|----------|--------|-------------|
| OTAManager | 📅 | Pendiente |

---

## Estados del Dispositivo

```
[BOOT]           → Inicialización de módulos
[INIT]           → Transición post-boot
[UNREGISTERED]   → No registrado, esperando registro
[REGISTERED]     → Registrado localmente (sin cloud)
[CONNECTING]     → Conectando a WiFi
[REGISTERING]    → Registrando con cloud (RP-1001B.2+)
[ONLINE]         → Conectado y registrado
[READY]          → Listo para operar
[PRINTING]       → Imprimiendo ficha (futuro)
[OFFLINE]        → Sin conexión a cloud
[RECONNECTING]   → Reconectando
[ERROR]          → Error crítico
[OTA]            → Actualizando firmware
[FACTORY_RESET]  → Reset de fábrica
```
