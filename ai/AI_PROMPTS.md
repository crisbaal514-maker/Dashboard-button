# 💬 AI Prompts — Risto Platform

> Comandos oficiales para interactuar con IAs en el proyecto.

---

## /continue

**Propósito:** Retomar el proyecto exactamente donde se quedó.

**Comportamiento:**
```
✔ Leyendo PROJECT_MANIFEST.md...
✔ Leyendo ROADMAP.md...
✔ Leyendo CHANGELOG.md...
✔ Leyendo TODO.md...
✔ Leyendo ADR/...
✔ Analizando código actual...

╔══════════════════════════════════════╗
║     RISTO PLATFORM                   ║
║══════════════════════════════════════║
║  Sprint:     0                       ║
║  Fase:       Arquitectura            ║
║  Progreso:   18%                     ║
║  Ticket:     RP-0001                 ║
║  Título:     Crear núcleo documental ║
║  Estado:     🟡 En progreso          ║
║                                      ║
║  Siguiente:  Continuar con ADRs      ║
╚══════════════════════════════════════╝
```

**Uso:**
```
/continue
```

---

## /review

**Propósito:** Revisar la arquitectura y detectar malas prácticas.

**Comportamiento:**
- Revisa toda la arquitectura documentada
- Compara con el código existente
- Detecta desviaciones de ADRs
- Propone mejoras sin escribir código

**Uso:**
```
/review [módulo específico]
```

---

## /sprint

**Propósito:** Planificar el siguiente sprint.

**Comportamiento:**
```
📋 Sprint Planning
────────────────
Objetivo:    {objetivo}
Archivos:    {lista de archivos}
Riesgos:     {riesgos identificados}
Tiempo est:  {estimación}
Criterios:   {criterios de aceptación}
```

**Uso:**
```
/sprint
```

---

## /refactor

**Propósito:** Refactorizar código reduciendo complejidad.

**Comportamiento:**
- Solo refactoriza si reduce complejidad (métrica)
- No cambia comportamiento
- Actualiza documentación afectada
- Reporta qué cambió y por qué

**Uso:**
```
/refactor [archivo o módulo]
```

---

## /status

**Propósito:** Mostrar estado actual del proyecto.

**Comportamiento:**
```
📊 Estado del Proyecto
────────────────────
Sprint:     {sprint}
Progreso:   {progreso}%
Módulos:    {online/offline}
Tickets:    {completados}/{total}
Docs OK:    {sí/no}
```

**Uso:**
```
/status
```

---

## /ticket

**Propósito:** Crear un nuevo ticket.

**Comportamiento:**
Solicita la información necesaria y genera un ticket con:
- ID auto-incremental (RP-XXXX)
- Título
- Descripción
- Archivos afectados
- Criterios de aceptación
- Prioridad

**Uso:**
```
/ticket "título del ticket"
```

---

## 🤖 Nota para la IA

Cuando uses estos comandos, ejecuta las acciones sin preguntar. Si falta información, infiere del contexto. Si no puedes inferir, pregunta UNA SOLA VEZ.
