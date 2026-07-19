# 🔌 Hardware — Button Ticket

> Especificación de hardware del dispositivo Button Ticket.

**Última actualización:** 2026-07-17

---

## Placa Base

| Especificación | Valor |
|---------------|-------|
| Modelo | 4D Systems GEN4-ESP32 16MB (ESP32S3-R8N16) |
| MCU | ESP32-S3 (Xtensa LX7 dual-core @ 240 MHz) |
| Flash | 16 MB (Quad I/O) |
| PSRAM | 8 MB (Embedded, AP_3v3) |
| USB | USB-Serial/JTAG integrado |
| Voltaje | 3.3V / 5V (USB-C) |

---

## Pines Utilizados

| Pin | Función | Módulo | Nota |
|-----|---------|--------|------|
| GPIO_NUM_2 | LED indicador | LedManager | LED interno de la placa |
| GPIO_NUM_0 | Botón BOOT | ButtonManager | Botón físico (pull-up) |
| UART0 (TX/RX) | Serial monitor | Logger | 115200 baud |
| USB D+/D- | USB-Serial/JTAG | Upload/Monitor | COM8 |

### Pines Futuros (pendientes)

| Pin | Función | Módulo | Nota |
|-----|---------|--------|------|
| TBD | Pantalla táctil | DisplayManager | 4D Systems gen4 |
| TBD | Botón físico arcade | InputManager | Iluminado opcional |
| TBD | Buzzer | Audio | Speaker |
| TBD | Bluetooth UART | PrinterManager | Impresora térmica |

---

## Conectividad

| Interfaz | Estado | Nota |
|----------|--------|------|
| WiFi 2.4 GHz | ✅ Operativo | 802.11 b/g/n, station mode |
| Bluetooth BLE 5.0 | 📅 Pendiente | Para impresora térmica |
| USB-Serial/JTAG | ✅ Operativo | Upload y monitor |

---

## LED

| Propiedad | Valor |
|-----------|-------|
| GPIO | GPIO_NUM_2 |
| Lógica | Activo HIGH (1 = encendido) |
| Patrones | BOOT = 1s on/off, CONNECTING = 250ms rápido, CONNECTED = sólido, DISCONNECTED = 2s lento |

---

## Botón

| Propiedad | Valor |
|-----------|-------|
| GPIO | GPIO_NUM_0 (BOOT) |
| Lógica | Pull-up interno (0 = presionado) |
| Debounce | 50ms por software |

---

## PCB / Versión

| Campo | Valor |
|-------|-------|
| Fabricante | 4D Systems |
| Modelo | gen4-ESP32 16MB |
| Revisión | v0.2 |
| MAC | 10:51:DB:7D:4A:BC |
| Chip ID | 0000BC4A7DDB511 |
