# ADR-0002: Event Bus para Comunicación

## Estado
🟡 Aceptado

## Contexto
Los dispositivos IoT y la nube necesitan comunicarse de forma desacoplada. No queremos que cada dispositivo tenga que conocer la API específica de los demás.

## Decisión
Implementamos un **Event Bus** basado en HTTPS REST con cola de eventos.

### Flujo de Eventos
```
Device → HTTP POST /events → Cloud Event Bus → Procesadores
                                                       ↓
Cloud → HTTP GET /commands → Device (polling)
```

### Formato de Evento
```json
{
  "event_id": "evt_abc123",
  "type": "ticket.requested",
  "device_id": "bt-001",
  "timestamp": "2026-07-17T12:00:00Z",
  "payload": {}
}
```

### Formato de Comando
```json
{
  "command_id": "cmd_xyz789",
  "type": "ticket.assign",
  "payload": {
    "ticket_number": 146
  },
  "expires_at": "2026-07-17T12:00:30Z"
}
```

### ¿Por qué HTTPS Polling (no WebSockets ni MQTT)?
1. HTTPS es más simple de asegurar (TLS nativo)
2. No requiere broker adicional
3. Firewalls corporativos no bloquean HTTPS
4. Suficiente para el volumen (1 petición/segundo por dispositivo)
5. Se puede migrar a MQTT si el volumen lo requiere

## Consecuencias
### Positivas
- + Desacoplamiento total entre dispositivos
- + Fácil auditoría (todos los eventos quedan registrados)
- + Se pueden agregar nuevos procesadores sin modificar devices

### Negativas
- - Latencia de polling (máximo 1 segundo)
- - Mayor consumo de ancho de banda que MQTT
- - Complejidad de la cola de eventos en el backend

## Referencias
- [ADR-0001](./ADR-0001-Architecture.md)
- [docs/Architecture.md](../docs/Architecture.md)
- [docs/DeviceProtocol.md](../docs/DeviceProtocol.md)
