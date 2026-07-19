# 🔄 AI Workflow — Risto Platform

> Flujo de trabajo estandarizado para cada sesión de desarrollo.

---

## 🔁 Ciclo Completo de una Sesión

### Fase 1: Onboarding (5 min)
```
[INICIO DE SESIÓN]
       │
       ▼
┌─────────────────────────────┐
│  Leer PROJECT_MANIFEST.md   │ ← Sprint actual, fase, progreso
├─────────────────────────────┤
│  Leer ROADMAP.md            │ ← Dónde estamos en el roadmap
├─────────────────────────────┤
│  Leer CHANGELOG.md          │ ← Qué pasó en la última sesión
├─────────────────────────────┤
│  Leer TODO.md               │ ← Tareas pendientes
├─────────────────────────────┤
│  Leer ADR/                  │ ← Decisiones activas
├─────────────────────────────┤
│  Leer PROJECT_CONTEXT.md    │ ← Contexto general
└─────────────────────────────┘
```

### Fase 2: Análisis (5 min)
```
┌─────────────────────────────┐
│  Revisar código actual      │
├─────────────────────────────┤
│  Comparar vs documentación  │ ← ¿Hay diferencias?
├─────────────────────────────┤
│  Reportar hallazgos         │ ← ⚠️ Si hay desviaciones
└─────────────────────────────┘
```

### Fase 3: Planificación (5 min)
```
┌─────────────────────────────┐
│  Revisar ticket actual      │
├─────────────────────────────┤
│  Identificar archivos       │ ← ¿Qué archivos cambiarán?
├─────────────────────────────┤
│  Estimar complejidad        │
├─────────────────────────────┤
│  Proponer plan              │ → APRUEBA HUMANO ←
└─────────────────────────────┘
```

### Fase 4: Implementación
```
┌─────────────────────────────┐
│  Escribir código            │
├─────────────────────────────┤
│  Compilar / Testear         │
├─────────────────────────────┤
│  Repetir hasta OK           │
└─────────────────────────────┘
```

### Fase 5: Cierre (5 min)
```
┌─────────────────────────────┐
│  Actualizar CHANGELOG.md    │
├─────────────────────────────┤
│  Actualizar TODO.md         │
├─────────────────────────────┤
│  Actualizar ROADMAP.md      │ ← Progreso
├─────────────────────────────┤
│  Mostrar resumen            │
└─────────────────────────────┘
```

---

## 📋 Template de Sesión

Al iniciar cada sesión, muestra:

```
╔══════════════════════════════════════╗
║     RISTO PLATFORM - Sesión          ║
║══════════════════════════════════════║
║  Sprint:     {sprint}                ║
║  Fase:       {fase}                  ║
║  Progreso:   {progreso}%             ║
║  Ticket:     {ticket}                ║
║  Título:     {titulo}                ║
║  Estado:     🟡 En progreso          ║
╚══════════════════════════════════════╝
```
