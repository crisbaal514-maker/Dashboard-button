# ADR-0003: Estrategia Cloud

## Estado
🟡 Aceptado

## Contexto
Risto Platform necesita un backend cloud que:
- Reciba eventos de todos los dispositivos
- Gestione el estado de cada restaurante
- Provea una API REST para el SaaS
- Almacene datos de forma segura
- Permita OTA de firmware

## Decisión

### Stack Propuesto
| Componente | Tecnología | Razón |
|------------|------------|-------|
| API | Node.js (Express/Fastify) | Alto rendimiento I/O, ecosistema maduro |
| Base de datos | PostgreSQL | Relacional, confiable, JSONB para flexibilidad |
| Cola de eventos | Redis / Bull | Rápido, persistente, colas de eventos |
| Cache | Redis | Sesiones, rate limiting |
| Almacenamiento | S3 (o compatible) | Firmware OTA, backups |
| Auth | JWT + API Keys | Simple, stateless |

### Endpoints Principales
```
POST   /api/v1/events              ← Dispositivos envían eventos
GET    /api/v1/commands/:device_id ← Dispositivos polling de comandos
POST   /api/v1/devices/register    ← Registro de nuevo dispositivo
GET    /api/v1/devices/:id         ← Estado del dispositivo
PATCH  /api/v1/devices/:id         ← Actualizar configuración
POST   /api/v1/ota/check           ← Verificar nueva versión firmware
GET    /api/v1/restaurants/:id     ← Datos del restaurante
POST   /api/v1/tickets             ← Crear ticket (desde SaaS)
GET    /api/v1/tickets/:id         ← Consultar ticket
```

### Base de Datos: Modelos Iniciales
```sql
-- Restaurantes
Restaurant: id, name, address, phone, config (JSONB), created_at

-- Dispositivos
Device: id, restaurant_id, type, name, firmware_version, config (JSONB), last_seen, status

-- Tickets
Ticket: id, restaurant_id, device_id, number, status, created_at, completed_at

-- Eventos
Event: id, device_id, type, payload (JSONB), created_at

-- Firmware
Firmware: id, device_type, version, file_url, checksum, changelog, created_at
```

## Consecuencias
### Positivas
- + Stack moderno y probado
- + Node.js permite compartir tipos con el frontend
- + PostgreSQL ofrece flexibilidad con JSONB

### Negativas
- - Node.js no es ideal para cómputo intensivo
- - Dependencia de múltiples servicios (Redis, S3)

## Referencias
- [ADR-0001](./ADR-0001-Architecture.md)
- [docs/Cloud.md](../docs/Cloud.md)
- [docs/API.md](../docs/API.md)
