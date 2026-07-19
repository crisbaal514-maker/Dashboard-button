# 🚀 Risto Platform — Deploy Plan (Railway)

> Plan concreto para subir Risto Cloud a Railway con dominio personalizado.

---

## 🎯 Objetivo

Tener Risto Cloud corriendo en producción en Railway con:
- ✅ HTTPS automático
- ✅ Dominio: `cloud.ristomx.com` (o `risto-cloud.railway.app`)
- ✅ Deploy automático desde GitHub
- ✅ SQLite funcional (migración a PostgreSQL después)
- ✅ Dashboard accesible desde internet
- ✅ ESP32 enviando heartbeats desde cualquier WiFi

---

## 📋 Prerrequisitos

| Recurso | Estado |
|---------|--------|
| Cuenta Railway | ¿? |
| Repositorio GitHub con risto-cloud | ✅ |
| Dominio (cloud.ristomx.com) | ¿? |
| DNS apuntando a Railway | ¿? |

---

## 🔧 Paso a paso

### 1. Railway CLI (opcional pero recomendado)

```bash
npm i -g @railway/cli
railway login
```

### 2. Railway Dashboard

1. Ir a [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Seleccionar repositorio `RistoPlatform`
4. Railway detecta automáticamente `package.json` → Node.js

### 3. Variables de entorno

En Railway Dashboard → Variables:

| Variable | Valor | Notas |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `PORT` | `3000` | Railway asigna puerto automáticamente |
| `HOST` | `0.0.0.0` | Para que Fastify escuche en todas las interfaces |
| `JWT_SECRET` | *(generar)* | `openssl rand -hex 64` |
| `ADMIN_PASSWORD` | *(elegir)* | Para acceso al dashboard |
| `SQLITE_PATH` | `/data/risto.db` | Ruta persistente en Railway |

### 4. Railway.json (raíz del proyecto)

Railway necesita un `railway.json` para configurar el proyecto:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd risto-cloud && npm install && npm run build"
  },
  "deploy": {
    "startCommand": "cd risto-cloud && node dist/index.js",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 5. Health check

Agregar un endpoint `/health` en el backend:

```typescript
fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));
```

Verificar si ya existe.

### 6. Dominio personalizado

1. Railway Dashboard → Settings → Domains
2. Agregar `cloud.ristomx.com`
3. En tu DNS (Hostinger), agregar registro CNAME:

```
cloud.ristomx.com → CNAME → [railway-provided-domain].railway.app
```

### 7. Verificar deploy

```bash
curl https://cloud.ristomx.com/health
# → { "status": "ok", "timestamp": "..." }

curl https://cloud.ristomx.com/admin/api/summary
# → { "devices": 1, "online": 1, ... }
```

### 8. Configurar ESP32

Actualizar `Constants.h`:

```cpp
// Antes (local)
static constexpr const char* CLOUD_HOST = "192.168.1.87";

// Después (Railway)
static constexpr const char* CLOUD_HOST = "cloud.ristomx.com";
```

El RESTTransport ya soporta hostnames (DNS resolution), así que no hay que cambiar nada más.

---

## 🔄 Pipeline de deploy

```
Git Push (main)
  │
  ▼
GitHub Actions (opcional)
  │
  ▼
Railway Build
  │  ├── npm install
  │  └── npm run build
  │
  ▼
Railway Deploy
  │  ├── node dist/index.js
  │  └── health check cada 30s
  │
  ▼
cloud.ristomx.com
```

---

## 🧪 Pruebas post-deploy

| Prueba | Comando |
|--------|---------|
| Health check | `curl https://cloud.ristomx.com/health` |
| Register | `curl -X POST https://cloud.ristomx.com/v1/devices/register -H "Content-Type: application/json" -d '{...}'` |
| Heartbeat | `curl -X POST https://cloud.ristomx.com/v1/devices/heartbeat -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{...}'` |
| Dashboard | Abrir `https://cloud.ristomx.com` en navegador |

---

## ⚠️ Consideraciones importantes

### SQLite en Railway
- Railway **sí** soporta archivos persistentes (`/data/`)
- Pero SQLite **no** funciona con múltiples instancias
- Migrar a PostgreSQL en Etapa 2

### Secrets
- `JWT_SECRET` y `ADMIN_PASSWORD` deben ser secretos fuertes
- Railway permite marcarlos como "secret" (no visibles en logs)

### Monitoreo
- Railway tiene logs integrados
- Agregar endpoint `/admin/api/health` interno
- Considerar Sentry o similar para errores en producción

---

## 📐 Costos Railway

| Plan | Precio | Incluye |
|------|--------|---------|
| Starter | $5 USD/mes | 1 proyecto, 512MB RAM, 1GB disk |
| Pro | $20 USD/mes | Proyectos ilimitados, 1GB RAM, 10GB disk |

**Starter es suficiente para Pilot 0 y Pilot 1.**

---

## ✅ Checklist de deploy

- [ ] Cuenta Railway activa
- [ ] Repositorio GitHub conectado
- [ ] Variables de entorno configuradas
- [ ] `railway.json` creado
- [ ] Endpoint `/health` existe
- [ ] Build exitoso en Railway
- [ ] Dominio configurado (cloud.ristomx.com)
- [ ] DNS propagado (CNAME)
- [ ] HTTPS funcionando
- [ ] ESP32 apunta a cloud.ristomx.com
- [ ] Heartbeats funcionando desde ESP32
- [ ] Dashboard accesible desde internet
