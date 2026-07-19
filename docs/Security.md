# 🔒 Seguridad en Risto Platform

> Consideraciones de seguridad para toda la plataforma.

---

## Principios

1. **Defense in Depth**: Múltiples capas de seguridad
2. **Least Privilege**: Cada componente solo tiene acceso a lo que necesita
3. **Secure by Default**: Las configuraciones seguras son el estándar
4. **Encryption in Transit & at Rest**: Datos siempre cifrados

---

## Comunicaciones

### Device ↔ Cloud
- TLS 1.3 obligatorio
- API Key única por dispositivo (generada en registro)
- Rotación de API Keys periódica
- Rate limiting por dispositivo (100 req/min)

### Cloud ↔ SaaS
- TLS 1.3 obligatorio
- JWT con expiración (15 min)
- Refresh tokens con rotación
- CORS configurado

---

## Autenticación

### Dispositivos
```json
// Registro inicial
POST /api/v1/devices/register
{
  "device_id": "bt-001",
  "mac": "AA:BB:CC:DD:EE:FF",
  "type": "button_ticket"
}

// Respuesta
{
  "api_key": "risto_bt_abc123def456...",
  "config": { ... }
}
```

### Usuarios (SaaS)
- Email + contraseña (bcrypt)
- 2FA opcional
- Sesiones JWT
- Rate limiting en login

---

## Almacenamiento

- Contraseñas: bcrypt (cost 12)
- API Keys: hash SHA-256 en BD
- Datos sensibles: cifrados en BD
- Firmware: checksum SHA-256 verificado
- Logs: sin datos personales

---

## OTA Seguro

1. Firma digital del firmware
2. Verificación de checksum antes de instalar
3. Rollback automático si falla
4. Firmware cifrado en tránsito (TLS)
5. Versiones mínimas obligatorias
