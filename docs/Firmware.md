# 🔧 Desarrollo de Firmware

> Guía de desarrollo de firmware para dispositivos Risto.

---

## Stack

- **IDE**: VS Code + PlatformIO Extension
- **Framework**: Arduino (para ESP32-S3)
- **Lenguaje**: C++17
- **Placa**: `4d_systems_esp32s3_gen4_r8n16`

---

## Estructura del Proyecto

```
firmware/button-ticket/
├── lib/                        # Librerías del proyecto
│   ├── DeviceCore/             # Núcleo de dispositivo
│   │   ├── DeviceCore.h
│   │   └── DeviceCore.cpp
│   ├── NetworkManager/         # WiFi + HTTP
│   │   ├── NetworkManager.h
│   │   └── NetworkManager.cpp
│   ├── DisplayManager/         # Pantalla táctil
│   │   ├── DisplayManager.h
│   │   └── DisplayManager.cpp
│   ├── InputManager/           # Botón + Touch
│   │   ├── InputManager.h
│   │   └── InputManager.cpp
│   ├── PrinterManager/         # Bluetooth ESC/POS
│   │   ├── PrinterManager.h
│   │   └── PrinterManager.cpp
│   ├── TicketEngine/           # Lógica de turnos
│   │   ├── TicketEngine.h
│   │   └── TicketEngine.cpp
│   ├── StorageManager/         # Persistencia
│   │   ├── StorageManager.h
│   │   └── StorageManager.cpp
│   ├── OTAManager/             # Actualizaciones
│   │   ├── OTAManager.h
│   │   └── OTAManager.cpp
│   └── Logger/                 # Logging
│       ├── Logger.h
│       └── Logger.cpp
├── src/
│   └── main.cpp                # Punto de entrada
├── include/                    # Headers globales
├── test/                       # Tests unitarios
├── platformio.ini              # Configuración
└── README.md
```

---

## Convenciones de Código

### Nombramiento
- **Clases**: PascalCase (`NetworkManager`)
- **Métodos**: camelCase (`connectToWiFi()`)
- **Variables**: camelCase (`wifiTimeout`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Archivos**: PascalCase para clases, snake_case para utilidades

### Estilo
- 2 espacios de indentación
- Llaves en la misma línea
- Comentarios en inglés (código) / español (documentación)
- Usar `#pragma once` en headers

### Logging
```cpp
Logger::info("Conectando a WiFi...");
Logger::debug("RSSI: %d", rssi);
Logger::error("Fallo conexión: %s", error.c_str());
```

### Manejo de Errores
```cpp
if (!networkManager.connect()) {
    Logger::error("No se pudo conectar a WiFi");
    displayManager.showError("Sin conexión");
    return false;
}
```

---

## Ciclo de Desarrollo

1. **Escribir módulo** en `lib/`
2. **Compilar**: `platformio run`
3. **Subir**: `platformio run --target upload`
4. **Monitorear**: `platformio device monitor`
5. **Testear**: `platformio test`

---

## Recursos del ESP32-S3

| Recurso | Límite | Nota |
|---------|--------|------|
| Flash | 16 MB | Suficiente para firmware + OTA |
| PSRAM | 8 MB | Para framebuffers de pantalla |
| RAM | 512 KB | Limitada, usar con cuidado |
| CPU | 240 MHz | Dual core |
