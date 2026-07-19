# RP-1000 — Storage Service (Risto Device OS)

## Reporte de Implementación

---

### Objetivo
✔ Implementar un servicio de almacenamiento persistente (NVS) encapsulado en `StorageManager`, singleton, con interfaz simple. Prohibir el acceso directo a `Preferences` desde cualquier otro módulo.

---

### Archivos creados

| Archivo | Descripción |
|---|---|
| `src/storage/StorageManager.h` | Header del servicio singleton |
| `src/storage/StorageManager.cpp` | Implementación completa con backend NVS |

### Archivos modificados

| Archivo | Cambio |
|---|---|
| `platformio.ini` | Se agregó `-Isrc/storage` a `build_flags` |
| `src/Application.h` | Se agregó `#include "storage/StorageManager.h"` |
| `src/Application.cpp` | Se agregó `StorageManager::getInstance().begin()` en `setup()` |

---

### API pública del servicio

```cpp
// Singleton
static StorageManager& getInstance();

// Ciclo de vida
void begin();
void end();

// Consulta y eliminación
bool exists(const char* key);
bool remove(const char* key);
void clear();

// Tipos soportados
void setString(const char* key, const char* value);
String getString(const char* key, const char* defaultValue = "");

void setBool(const char* key, bool value);
bool getBool(const char* key, bool defaultValue = false);

void setInt(const char* key, int32_t value);
int32_t getInt(const char* key, int32_t defaultValue = 0);

void setUInt32(const char* key, uint32_t value);
uint32_t getUInt32(const char* key, uint32_t defaultValue = 0);

void setUInt64(const char* key, uint64_t value);
uint64_t getUInt64(const char* key, uint64_t defaultValue = 0);

void setFloat(const char* key, float value);
float getFloat(const char* key, float defaultValue = 0.0f);
```

---

### Prueba realizada

Durante `begin()` se ejecuta una prueba temporal:

```
Escribir  → "device.test" = "OK"
Leer     → getString("device.test") → "OK"
Limpiar  → remove("device.test")
```

---

### Resultado del Monitor Serial

```
[INFO] [App] Risto Devices
[INFO] [App] Button Ticket
[INFO] [App] Firmware 0.0.1
[INFO] [Storage] Initializing NVS storage...
[INFO] [Storage] Writing test...
[INFO] [Storage] Reading test...
[INFO] [Storage] Result: OK        ← ✅ Validación exitosa
[INFO] [Storage] Test passed. Data removed.
[INFO] [Storage] NVS storage ready.
[INFO] [Device] Device Identity
[INFO] [Device] Button Ticket
[INFO] [Device] ESP32-S3
...
[INFO] [WiFi] WiFi Connected
[INFO] [WiFi] IP: 192.168.100.18
```

---

### RAM utilizada

`13.3%` (43,596 bytes de 327,680)

### Flash utilizada

`10.4%` (681,537 bytes de 6,553,600)

---

### Compatibilidad

✔ ESP32-S3 (probado en 4D Systems GEN4-ESP32 16MB)
✔ PlatformIO (espressif32 7.0.1, Arduino framework)
✔ Sin dependencias externas (usa Preferences incluida en framework)
✔ Compilación sin warnings
✔ Ningún módulo existente fue modificado en su lógica interna

---

### Próximo ticket recomendado

**RP-1001 — Persistir Device identity en StorageManager**

*Almacenar `device.id`, `device.uid`, `device.token`, `registered` en NVS usando StorageManager.*
*Modificar Device::setup() para leer/escribir desde StorageManager.*
