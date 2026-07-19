# 🏗️ Risto Platform — Infrastructure Roadmap

> Evolución de la infraestructura cloud. 4 etapas, de 1 a decenas de miles de dispositivos.

---

## Filosofía

**No optimizar antes de tiempo.** Cada etapa resuelve los problemas de la etapa anterior.

El Storage Provider (abstracción de base de datos) existe precisamente para que migrar de SQLite a PostgreSQL no requiera cambiar nada más.

---

## 🟢 Etapa 1 — MVP / Pilotos (ahora)

**Capacidad:** 1-20 dispositivos  
**Estado:** 🟢 Activa

### Stack

```
GitHub
  │
  ▼
Railway
  │
  ▼
Fastify
  │
  ▼
SQLite (archivo local en Railway)
```

### Componentes

| Componente | Especificación |
|------------|---------------|
| Servidor | Railway (1 instancia, 512MB RAM) |
| Framework | Fastify + TypeScript |
| Base de datos | SQLite (archivo persistente en Railway) |
| Cache | Ninguno |
| CDN | Ninguno |
| Dominio | cloud.ristomx.com |
| HTTPS | Automático (Railway) |

### Costo estimado

| Recurso | Costo |
|---------|-------|
| Railway | ~$5-8 USD/mes |
| Dominio | ~$10 USD/año |
| **Total** | **~$70-100 USD/año** |

### Limitaciones conocidas

- SQLite no soporta escritura concurrente pesada
- Sin replicación
- Sin failover
- 1 instancia = punto único de fallo

---

## 🟡 Etapa 2 — Crecimiento

**Capacidad:** 100-500 dispositivos  
**Estado:** 📅 Cuando se alcancen 20+ dispositivos

### Stack

```
GitHub
  │
  ▼
Railway
  │
  ▼
Fastify
  │
  ▼
PostgreSQL (Railway Managed)
```

### Cambio principal

Solo se cambia:

```typescript
// Antes (Etapa 1)
new SqliteStorageProvider(...)

// Después (Etapa 2)
new PostgresStorageProvider(...)
```

El resto del código no cambia.

### Costo estimado

| Recurso | Costo |
|---------|-------|
| Railway (instancia) | ~$5-8 USD/mes |
| PostgreSQL Railway | ~$5-10 USD/mes |
| **Total** | **~$180-200 USD/año** |

---

## 🟡 Etapa 3 — Escalamiento medio

**Capacidad:** Miles de dispositivos  
**Estado:** 📅 Cuando se superen 500 dispositivos

### Stack

```
GitHub
  │
  ▼
Railway
  │
  ▼
Fastify
  │
  ▼
Redis (cache + cola de comandos)
  │
  ▼
PostgreSQL
```

### Mejoras
- Redis para caché de sesiones/tokens
- Cola de comandos (Redis Queue)
- Rate limiting más agresivo

### Costo estimado

| Recurso | Costo |
|---------|-------|
| Railway (2 instancias) | ~$15-20 USD/mes |
| PostgreSQL Railway | ~$10-15 USD/mes |
| Redis Railway | ~$5-10 USD/mes |
| **Total** | **~$360-540 USD/año** |

---

## 🟡 Etapa 4 — Alta disponibilidad

**Capacidad:** Decenas de miles de dispositivos  
**Estado:** 📅 Escenario futuro

### Stack

```
Load Balancer
  │
  ├── Fastify (instancia 1)
  ├── Fastify (instancia 2)
  └── Fastify (instancia N)
        │
        ▼
      Redis (cluster)
        │
        ▼
      PostgreSQL (replicación)
```

### Mejoras
- Load balancer (Railway o Cloudflare)
- Múltiples instancias de Fastify
- Redis cluster
- PostgreSQL con replicación (lectura/escritura)

---

## 📐 Resumen

| Etapa | Dispositivos | Stack | Costo/mes | Cuándo |
|-------|-------------|-------|-----------|--------|
| 1 🟢 | 1-20 | Fastify + SQLite | ~$5-8 | Ahora |
| 2 🟡 | 100-500 | Fastify + PostgreSQL | ~$15-20 | 20+ dispositivos |
| 3 🟡 | Miles | + Redis | ~$30-40 | 500+ dispositivos |
| 4 🟡 | Decenas de miles | Load Balancer + HA | ~$100+ | Escenario futuro |

> **Regla:** No pasar a la siguiente etapa hasta que la actual esté mostrando señales claras de agotamiento (CPU, RAM, tiempo de respuesta).
