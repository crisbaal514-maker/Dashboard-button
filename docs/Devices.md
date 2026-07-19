# 📟 Dispositivos Risto

> Catálogo y especificaciones de los dispositivos de la plataforma.

---

## Button Ticket (Kiosko Turnero)

### Hardware
| Componente | Especificación |
|------------|---------------|
| **MCU** | ESP32-S3 (Xtensa LX7 dual-core @ 240MHz) |
| **Pantalla** | 4D Systems gen4 con pantalla táctil resistiva |
| **Impresora** | Térmica Bluetooth 58mm (ESC/POS) |
| **Botón** | Arcade físico iluminado (opcional) |
| **Audio** | Buzzer / Speaker |
| **Conectividad** | WiFi 2.4GHz + Bluetooth 5.0 |
| **Alimentación** | 5V USB-C / DC |

### Funcionalidad
- Modo kiosko: solo muestra botón "TOMAR FICHA"
- Impresión automática de fichas numeradas
- Modo offline: asigna números locales, sincroniza al reconectar
- Heartbeat cada 30 segundos
- OTA automática

### Estados
```
[BOOT]       → Inicialización de módulos
[CONNECTING] → Conectando a WiFi
[READY]      → Listo para tomar fichas
[PRINTING]   → Imprimiendo ficha
[OFFLINE]    → Sin conexión a cloud (modo limitado)
[ERROR]      → Error crítico (reinicio automático)
[OTA]        → Actualizando firmware
```

---

## Futuros Dispositivos

| Dispositivo | Descripción | Estado |
|-------------|-------------|--------|
| **Order Pad** | Tablet para meseros | 📅 Idea |
| **Kitchen Display** | Pantalla en cocina | 📅 Idea |
| **Status Board** | Panel de estado geral | 📅 Idea |
| **Smart Queue** | Gestión de filas | 📅 Idea |
