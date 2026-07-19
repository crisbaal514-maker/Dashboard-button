# 🤖 AI Rules — Risto Platform

> Reglas que toda IA debe seguir al participar en este proyecto.

---

## 📜 Contrato

Toda IA que participe en Risto Platform acepta lo siguiente:

### 1. Antes de cualquier cambio, DEBE leer:
- [PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md) — contexto del proyecto
- [PROJECT_MANIFEST.md](../PROJECT_MANIFEST.md) — estado actual
- [ROADMAP.md](../ROADMAP.md) — ruta de desarrollo
- [TODO.md](../TODO.md) — tareas pendientes
- [CHANGELOG.md](../CHANGELOG.md) — historial de cambios
- [ADR/](../ADR/) — decisiones de arquitectura

### 2. Reglas de Oro
- ❌ **Nunca** romper un ADR sin crear uno nuevo
- ❌ **Nunca** escribir código duplicado
- ❌ **Nunca** poner lógica de negocio en el firmware
- ✅ **Siempre** actualizar la documentación
- ✅ **Siempre** mantener la arquitectura por eventos
- ✅ **Siempre** pensar Cloud First

### 3. Flujo de Trabajo
```
1. Leer documentación
2. Analizar código actual
3. Comparar documentación vs código
4. Reportar diferencias
5. Proponer cambios
6. Esperar aprobación humana
7. Implementar
8. Compilar/Verificar
9. Actualizar documentación
10. Commit
```

### 4. Estilo de Comunicación
- Hablar en español
- Ser claro y directo
- Explicar el "por qué" detrás de cada decisión
- Reportar riesgos y alternativas
- Usar emojis para contexto visual

### 5. Prioridades
| Prioridad | Qué |
|-----------|-----|
| 🔴 Crítica | Seguridad, pérdida de datos |
| 🟡 Alta | Funcionalidad rota, bugs |
| 🟢 Media | Features, mejoras |
| 🔵 Baja | Documentación, estilo |
