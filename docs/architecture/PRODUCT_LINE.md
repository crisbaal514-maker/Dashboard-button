# 📦 Risto Platform — Product Line

> Familias de dispositivos y su hoja de ruta.

---

## 🟢 Button Ticket (MVP validado)

**Estado:** 🟢 MVP técnico validado con hardware real (ESP32-S3)

**Propósito:** Sistema de turneros para restaurantes.

**Hardware:**
- 4D Systems GEN4-ESP32 (ESP32-S3 R8N16)
- Chip: ESP32-S3, 8MB PSRAM, 16MB Flash
- Pantalla táctil (gen4-uLCD-43)
- Botón físico
- Conexión WiFi

**Capacidades:**
- ✅ Register / Heartbeat / Commands
- ✅ WiFi persistente con credenciales en NVS
- ✅ Almacenamiento local (Preferences via StorageManager)
- ✅ LEDs de estado
- ✅ Event bus interno
- 📅 Button press → evento cloud
- 📅 Display de turno
- 📅 Impresión Bluetooth ESC/POS
- 📅 OTA

---

## 🟡 Kitchen Display System (KDS)

**Estado:** 📅 Planificado — Siguiente prioridad después de POS

**Propósito:** Pantalla en cocina que muestra órdenes en tiempo real.

**Hardware propuesto:** 
- ESP32-S3 + pantalla 7-10"
- WiFi + Ethernet

**Capacidades adicionales:**
- Visualización de órdenes entrantes
- Actualización en tiempo real (WebSocket)
- Alertas sonoras/visuales
- Tiempos de preparación

---

## 🟡 Display Cliente

**Estado:** 📅 Planificado

**Propósito:** Pantalla que el cliente ve mostrando estado de su orden/turno.

**Hardware propuesto:**
- ESP32-S3 + pantalla pequeña (3.5-5")
- WiFi

**Capacidades:**
- Mostrar número de turno
- Mostrar tiempo estimado
- Publicidad / contenido promocional

---

## 🔴 POS (Point of Sale)

**Estado:** 📅 Planificado — Alta prioridad

**Propósito:** Sistema de punto de venta para restaurantes.

**Hardware propuesto:**
- ESP32-S3 o similar + pantalla táctil
- Impresora térmica
- Lector de tarjetas (opcional)
- WiFi + Ethernet

**Capacidades:**
- Toma de órdenes
- Envío a cocina (KDS)
- Impresión de comanda
- Cierre de cuenta
- Integración con pagos

---

## 🟡 Sensores IoT

**Estado:** 📅 Planificado

**Propósitos:**
- Temperatura de refrigeradores/cámaras
- Humedad ambiental
- Consumo energético
- Monitoreo de equipos

**Hardware propuesto:**
- ESP32-S3 + sensores I2C/1-Wire
- Batería + WiFi (Low Power)

---

## 🟡 Relays / Actuadores

**Estado:** 📅 Planificado

**Propósito:** Control remoto de equipos (luces, aire acondicionado, equipos de cocina).

**Hardware propuesto:**
- ESP32-S3 + módulo de relays
- WiFi + opcional LoRa

---

## 🔴 Kiosk (Autoservicio)

**Estado:** 📅 Planificado — Alta prioridad

**Propósito:** Quiosco de autoservicio para que los clientes ordenen sin intervención de personal.

**Hardware propuesto:**
- Tablet industrial o pantalla táctil grande
- ESP32-S3 como controlador de periféricos
- Impresora de tickets
- Lector de códigos

---

## 🟠 Voice Assistant

**Estado:** 📅 Planificado — Baja prioridad

**Propósito:** Asistente por voz para pedidos en mostrador o drive-thru.

**Hardware propuesto:**
- ESP32-S3 + micrófono阵列
- WiFi + procesamiento cloud (o local con ESP-SR)

---

## 🟠 AI Camera

**Estado:** 📅 Planificado — Baja prioridad

**Propósito:** Cámaras con visión computacional para:
- Conteo de personas
- Detección de mesas ocupadas
- Seguridad

**Hardware propuesto:**
- ESP32-S3 + cámara (ESP32-CAM)
- Procesamiento cloud

---

## 📐 Matriz de capacidades por dispositivo

| Dispositivo | Register | Heartbeat | Commands | Diagnostics | OTA | Especialización |
|-------------|----------|-----------|----------|-------------|-----|-----------------|
| Button Ticket | ✅ | ✅ | ✅ | ✅ | 📅 | Botón, Display, LED, Printer |
| Kitchen Display | ✅ | ✅ | ✅ | ✅ | 📅 | Display grande, Audio |
| Display Cliente | ✅ | ✅ | ✅ | ✅ | 📅 | Display pequeño |
| POS | ✅ | ✅ | ✅ | ✅ | 📅 | Touch, Printer, Payment |
| Sensores | ✅ | ✅ | ✅ | ✅ | 📅 | I2C, Low Power |
| Relays | ✅ | ✅ | ✅ | ✅ | 📅 | GPIO, High Current |
| Kiosk | ✅ | ✅ | ✅ | ✅ | 📅 | Touch, Printer, Scanner |
| Voice Assistant | ✅ | ✅ | ✅ | ✅ | 📅 | Micrófono, Audio |
| AI Camera | ✅ | ✅ | ✅ | ✅ | 📅 | Cámara, CV |
