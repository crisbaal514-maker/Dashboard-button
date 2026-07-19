# 🤖 AI_CONTEXT.md — Instrucciones para IAs

> Este archivo contiene instrucciones para cualquier inteligencia artificial que trabaje en el proyecto Risto Device OS.
> 
> **Si eres una IA y estás leyendo esto, debes seguir estas reglas.**

---

## Reglas fundamentales

1. **No reestructures la arquitectura sin justificarlo.** Si necesitas cambiar la arquitectura, primero propón el cambio en PLAN MODE.

2. **No rompas compatibilidad.** Los cambios deben ser hacia atrás compatibles. Si no es posible, documéntalo.

3. **No elimines documentación.** Siempre agrega. Nunca sobrescribas información histórica.

4. **No implementes código sin PLAN MODE.** Primero diseña, luego implementa.

5. **Todos los cambios deben compilar.** Usa PlatformIO para verificar.

6. **Toda funcionalidad debe probarse en hardware.** No asumas que compilar = funciona.

7. **Toda modificación debe actualizar:**
   - `docs/ROADMAP.md` — Estado del RP
   - `docs/CHANGELOG.md` — Cambios realizados
   - `docs/reports/RP-XXXX.md` — Reporte técnico

---

## Flujo de trabajo

```
1. USER solicita cambio → PLAN MODE
2. IA analiza documentación (docs/, PROJECT_CONTEXT.md, ADR/)
3. IA propone diseño
4. USER revisa y aprueba
5. USER cambia a ACT MODE
6. IA implementa
7. IA compila (pio run)
8. IA sube a hardware (pio run --target upload)
9. IA prueba (monitor serial)
10. IA actualiza documentación
11. IA genera reporte RP
12. IA presenta resultado
```

---

## Estilo de código

- **Lenguaje:** C++17
- **Framework:** Arduino (ESP32-S3)
- **IDE:** PlatformIO + VS Code
- **Indentación:** 2 espacios
- **Nombramiento:** PascalCase (clases), camelCase (métodos/vars), UPPER_SNAKE_CASE (constantes)
- **Headers:** `#pragma once`
- **Logging:** Siempre usar `Logger`. No usar `Serial.print()` directamente.

---

## Reglas de arquitectura

1. **Application** es el único orquestador. Los módulos no se conocen entre sí.
2. **Logger** y **StorageManager** son servicios globales (singleton).
3. Nunca acceder directamente a `Preferences`. Siempre vía `StorageManager`.
4. Nunca acceder directamente a WiFi. Siempre vía `NetworkManager`.
5. Nunca acceder directamente al hardware GPIO. Siempre vía módulo específico.
6. Los módulos tienen `setup()` y `loop()`.
7. Todo logging usa `Logger`. No hay `Serial.print()` directo.
8. Todos los cambios deben compilar y probarse en hardware.
9. Toda modificación debe actualizar ROADMAP y CHANGELOG.

---

## Si hay duda

Prioriza **estabilidad sobre velocidad**. Si no estás seguro de un cambio, pregúntale al usuario.
