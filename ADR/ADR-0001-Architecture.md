# ADR-0001: Arquitectura General del Sistema

## Estado
🟡 Aceptado

## Contexto
Risto Platform necesita una arquitectura que permita:
- Múltiples tipos de dispositivos IoT en restaurantes
- Escalabilidad horizontal
- Desacoplamiento entre dispositivos y lógica de negocio
- Actualizaciones OTA sin intervención del cliente
- Operación offline básica

## Decisión
Adoptamos una **Arquitectura por Capas con Event Bus desacoplado**:

```
┌────────────────────────────────────┐
│         Capa de Presentación       │
│   (Risto SaaS - Web Dashboard)     │
├────────────────────────────────────┤
│         Capa de Negocio            │
│   (Risto Cloud - API + Lógica)     │
├────────────────────────────────────┤
│       ┌────────────────────┐       │
│       │   Event Bus        │       │
│       └────────────────────┘       │
├────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐       │
│  │ Device   │  │ Device   │       │
│  │ Core     │  │ Manager  │       │
│  └──────────┘  └──────────┘       │
├────────────────────────────────────┤
│  Button Ticket │  Otros Devices   │
│  (ESP32-S3)    │  (Futuro)        │
└────────────────────────────────────┘
```

### Principios
1. **Cloud First**: Toda la lógica de negocio vive en la nube
2. **Dispositivos tontos**: Los devices solo ejecutan, no deciden
3. **Eventos**: La comunicación es asíncrona basada en eventos
4. **Desacoplamiento**: Los devices no conocen a otros devices
5. **Resiliencia**: Operación offline básica en cada device

## Consecuencias
### Positivas
- + Escalabilidad horizontal
- + Fácil agregar nuevos tipos de dispositivo
- + La lógica de negocio se actualiza sin tocar firmware
- + Equipos pueden trabajar en paralelo (firmware, cloud, saas)

### Negativas
- - Dependencia de conectividad cloud para funciones avanzadas
- - Mayor latencia en operaciones que requieren cloud
- - Complejidad inicial del Event Bus

## Referencias
- [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md)
- [docs/Architecture.md](../docs/Architecture.md)
