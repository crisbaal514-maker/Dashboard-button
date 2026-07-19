# ☁️ Risto Cloud

> Documentación del backend cloud de Risto Platform.

---

## Stack Tecnológico

| Componente | Tecnología | Versión | Propósito |
|------------|------------|---------|-----------|
| API | Node.js + Fastify | 20+ | Servidor REST |
| Base de Datos | PostgreSQL | 16 | Datos persistentes |
| Colas | Redis + Bull | 7 | Cola de eventos y comandos |
| Caché | Redis | 7 | Sesiones, rate limiting |
| Almacenamiento | S3/MinIO | — | Firmware OTA, backups |
| Auth | JWT + API Keys | — | Autenticación |
| Contenedores | Docker + Docker Compose | — | Entorno local y producción |

---

## Estructura del Proyecto (Propuesta)

```
cloud/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── devices.js
│   │   │   ├── events.js
│   │   │   ├── tickets.js
│   │   │   ├── restaurants.js
│   │   │   └── ota.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   └── rateLimit.js
│   │   └── server.js
│   ├── eventBus/
│   │   ├── processor.js
│   │   ├── handlers/
│   │   │   └── ticketHandler.js
│   │   └── queue.js
│   ├── models/
│   │   ├── Device.js
│   │   ├── Ticket.js
│   │   ├── Restaurant.js
│   │   └── Event.js
│   ├── services/
│   │   ├── deviceService.js
│   │   ├── ticketService.js
│   │   └── otaService.js
│   └── config/
│       ├── database.js
│       ├── redis.js
│       └── env.js
├── migrations/
├── tests/
├── Dockerfile
├── docker-compose.yml
└── package.json
```

---

## API Endpoints

### Dispositivos
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/devices/register` | Registrar nuevo dispositivo |
| GET | `/api/v1/devices/:id` | Obtener estado del dispositivo |
| PATCH | `/api/v1/devices/:id` | Actualizar configuración |
| GET | `/api/v1/devices` | Listar dispositivos (admin) |

### Eventos
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/events` | Recibir evento de dispositivo |
| GET | `/api/v1/commands/:deviceId` | Polling de comandos |

### Tickets
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/tickets` | Crear ticket (SaaS) |
| GET | `/api/v1/tickets/:id` | Consultar ticket |
| GET | `/api/v1/tickets` | Listar tickets (filtros) |

### OTA
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/ota/check` | Verificar nueva versión |
| GET | `/api/v1/ota/firmware/:version` | Descargar firmware |

---

## Consideraciones de Seguridad

- TLS obligatorio en todas las conexiones
- API Keys por dispositivo
- Rate limiting por IP y por API Key
- Validación de todos los inputs (JSON Schema)
- Logs de auditoría para eventos críticos
