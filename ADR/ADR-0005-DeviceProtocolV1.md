# ADR-0005: Device Protocol V1

## Decisión

Adoptar el protocolo definido en `docs/DeviceProtocolV1.md` como el contrato definitivo de comunicación entre Risto Device OS y Risto Cloud.

## Estado

Aceptado. Pendiente de implementación (Fase 2).

## Contexto

El proyecto necesitaba un protocolo de comunicación estándar para todos los dispositivos del ecosistema Risto. Hasta ahora, la comunicación era informal (esqueleto de ApiClient, eventos sin estructura definida). Se requería un diseño que:

- Soportara múltiples tipos de dispositivos (Button Ticket, Kitchen Display, Order Pad, etc.)
- Fuera offline-first
- Escalara a 100,000+ dispositivos
- Fuera seguro por diseño
- Permaneciera estable por años

## Alternativas Consideradas

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| **MQTT** | Complejidad innecesaria para polling de 30s. Se reconsiderará si se requiere latencia < 1s. |
| **WebSockets** | Mayor consumo de RAM. No justificado para offline-first. |
| **gRPC / Protocol Buffers** | Sobredimensionado para ESP32-S3. JSON es más simple y suficientemente eficiente. |
| **Registro vía Bluetooth** | Complejidad en primer uso. Se prefiere WiFi + botón físico. |
| **Blockchain para identidad** | Sin caso de uso real. Complejidad sin beneficio. |

## Consecuencias

### Positivas

- Contrato claro entre firmware y cloud. Ambos equipos pueden desarrollar en paralelo.
- Device-agnostic: cualquier dispositivo nuevo solo necesita definir su `deviceType`.
- Offline-first: el dispositivo nunca depende de la nube para operar.
- Seguridad por diseño: API Key + Token + requestId único.
- Escalable: heartbeat ligero, endpoints separados para logs/diagnostics.

### Negativas

- Mayor complejidad inicial en el firmware (ProvisioningManager, heartbeat loop, cola offline).
- El cloud debe implementar todos los endpoints antes de que el firmware pueda probarse end-to-end.
- Los dispositivos viejos sin OTA no podrán actualizar si el protocolo cambia.

### Neutrales

- Se introduce el concepto de `protocolVersion` y `protocolMinimum` para gestionar compatibilidad.
- Se reserva espacio para Device Certificate (X.509) en el futuro.

## Reglas Arquitectónicas Derivadas

1. **Cloud Abstraction**: El firmware JAMÁS conocerá detalles internos del cloud (Supabase, tablas, UUIDs, JWT internos).
2. **Hardware Agnostic**: El servidor nunca asume hardware. El dispositivo anuncia `capabilities`.
3. **API Contract First**: El contrato en DeviceProtocolV1.md es la fuente de verdad.

## Tags

`protocolo`, `api`, `comunicacion`, `device-cloud`, `rp-1001a`
