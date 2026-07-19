# 📡 OTA - Actualizaciones Remotas

> Estrategia de actualización Over-The-Air para dispositivos Risto.

---

## Flujo OTA

```
1. Cloud publica nueva versión de firmware
2. Device hace heartbeat → Cloud responde "nueva versión disponible"
3. Device → HTTP GET /ota/firmware/{version}
4. Device verifica checksum SHA-256
5. Device aplica actualización OTA
6. Device se reinicia con nuevo firmware
7. Device → POST /events [device.boot] con nueva versión
8. Cloud confirma actualización exitosa
```

---

## Particiones de Memoria

Para soportar OTA, el ESP32-S3 necesita particiones:

```
# Partición típica para OTA
nvs:        20KB
otadata:    8KB
app0:       2MB     # Firmware activo
app1:       2MB     # Firmware backup (OTA)
spiffs:     1MB     # Archivos de configuración
```

---

## Estrategia de Versiones

Usamos [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
   │      │      └── Bug fixes (compatible)
   │      └───────── New features (compatible)
   └──────────────── Breaking changes
```

Ejemplo: `0.1.0` → `0.2.0` → `1.0.0`

---

## Rollback

Si una actualización falla:
1. El bootloader detecta el fallo
2. Reinicia con la partición anterior (app0)
3. Reporta error a la nube
4. El dispositivo queda en modo seguro

---

## Consideraciones

- OTA solo cuando el dispositivo está inactivo
- No interrumpir durante la actualización
- Verificar batería suficiente (si aplica)
- Mantener al menos 2 versiones anteriores
- Notificar al usuario durante la actualización