# 🔄 Protocolo de Comunicación entre Dispositivos

> Especificación del protocolo de comunicación entre dispositivos Risto y la nube.

---

## Transporte

- **Protocolo**: HTTPS (TLS 1.3)
- **Formato**: JSON
- **Encoding**: UTF-8
- **Autenticación**: API Key en header `X-API-Key`
- **Content-Type**: `application/json`

---

## Eventos (Device → Cloud)

Los dispositivos envían eventos a `POST /api/v1/events`

### Formato General
```json
{
  "event_id": "evt_<uuid>",
  "type": "<event_type>",
  "device_id": "<device_identifier>",
  "timestamp": "<ISO8601>",
  "payload": {}
}
```

### Tipos de Evento

#### `device.boot`
```json
{
  "event_id": "evt_abc123",
  "type": "device.boot",
  "device_id": "bt-001",
  "timestamp": "2026-07-17T12:00:00Z",
  "payload": {
    "firmware_version": "0.0.1",
    "board": "4d_systems_esp32s3_gen4_r8n16",
    "rssi": -65,
    "uptime": 0
  }
}
```

#### `ticket.requested`
```json
{
  "event_id": "evt_def456",
  "type": "ticket.requested",
  "device_id": "bt-001",
  "timestamp": "2026-07-17T12:05:30Z",
  "payload": {
    "source": "button" // "touch" | "button"
  }
}
```

#### `ticket.printed`
```json
{
  "event_id": "evt_ghi789",
  "type": "ticket.printed",
  "device_id": "bt-001",
  "timestamp": "2026-07-17T12:05:32Z",
  "payload": {
    "ticket_number": 146,
    "success": true,
    "error": null
  }
}
```

#### `device.heartbeat`
```json
{
  "event_id": "evt_jkl012",
  "type": "device.heartbeat",
  "device_id": "bt-001",
  "timestamp": "2026-07-17T12:05:30Z",
  "payload": {
    "rssi": -63,
    "uptime": 3600,
    "free_heap": 98765,
    "tickets_today": 47
  }
}
```

---

## Comandos (Cloud → Device)

Los dispositivos hacen polling a `GET /api/v1/commands/:device_id`

### Formato General
```json
{
  "command_id": "cmd_<uuid>",
  "type": "<command_type>",
  "payload": {},
  "expires_at": "<ISO8601>"
}
```

### Tipos de Comando

#### `ticket.assign`
```json
{
  "command_id": "cmd_xyz789",
  "type": "ticket.assign",
  "payload": {
    "ticket_number": 146,
    "business_name": "Taquería El Güero",
    "timestamp": "2026-07-17T12:05:30Z"
  },
  "expires_at": "2026-07-17T12:06:00Z"
}
```

#### `config.update`
```json
{
  "command_id": "cmd_cfg001",
  "type": "config.update",
  "payload": {
    "settings": {
      "printer_timeout_ms": 5000,
      "display_timeout_ms": 2000,
      "button_debounce_ms": 300,
      "offline_max_tickets": 50
    }
  },
  "expires_at": "2026-07-17T13:00:00Z"
}
```

#### `ota.start`
```json
{
  "command_id": "cmd_ota001",
  "type": "ota.start",
  "payload": {
    "version": "0.1.0",
    "firmware_url": "https://cloud.risto.com/firmware/bt-0.1.0.bin",
    "checksum": "sha256:abc123...",
    "size": 524288
  },
  "expires_at": "2026-07-17T13:00:00Z"
}
```

---

## Flujo de Heartbeat

```
Device                              Cloud
  │                                   │
  │ ─── POST /events [heartbeat] ──→  │
  │                                   │
  │ ←── 200 OK ───────────────────── │
  │       (no commands pending)       │
  │                                   │
  │ ─── POST /events [heartbeat] ──→  │
  │                                   │
  │ ←── 200 OK ───────────────────── │
  │       [comandos pendientes]       │
  │                                   │
  │ ─── GET /commands/bt-001 ──────→  │
  │                                   │
  │ ←── [command: ticket.assign] ─── │
  │                                   │
```

**Frecuencia**: Cada 30 segundos (configurable)

---

## Códigos de Error

| Código | Significado |
|--------|-------------|
| `AUTH_FAILED` | API Key inválida |
| `INVALID_EVENT` | Formato de evento incorrecto |
| `DEVICE_NOT_FOUND` | Device ID no registrado |
| `RATE_LIMITED` | Demasiadas peticiones |
| `SERVER_ERROR` | Error interno del servidor |
