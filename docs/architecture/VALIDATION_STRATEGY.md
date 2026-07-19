# ✅ Risto Platform — Validation Strategy

> Estrategia de validación en campo. De la mesa de trabajo al restaurante real.

---

## 🎯 Filosofía

No validamos features. Validamos que el sistema funcione en condiciones reales.

Cada piloto tiene un objetivo claro:
1. Probar una tesis
2. Recoger datos
3. Decidir si avanzar, pivote o detener

---

## 🟢 Pilot 0 — Estabilidad 48h

**Estado:** 🟡 En ejecución (2026-07-19 09:00)

**Tesis:** Un solo ESP32 puede mantener heartbeats continuos durante 48h sin degradación.

**Setup:**
- 1 ESP32 (Button Ticket) en cargador USB
- Risto Cloud corriendo en PC local
- Sin modificaciones de código durante el piloto

**Lo que se mide:**
| Métrica | Criterio de éxito |
|---------|-------------------|
| Heartbeat continuo | Sin interrupciones > 5 min |
| Dashboard ONLINE | Siempre 🟢 |
| Heap (free memory) | Sin decrecimiento progresivo |
| Jitter entre heartbeats | < 5s de desviación |

**Pruebas destructivas (después de 24h):**
1. Reiniciar servidor → backoff + reconexión automática
2. Reiniciar router → reconexión WiFi automática
3. Corte de energía al ESP32 → boot → leer NVS → heartbeat (sin re-register)
4. Comandos remotos (Ping → Restart → Ping)
5. Factory reset (solo si todo lo anterior pasa)

**Criterio de éxito del Pilot 0:**
- [ ] 48h sin intervención manual
- [ ] Heartbeats continúan después de cada prueba destructiva
- [ ] Sin fugas de memoria detectadas

---

## 🟡 Pilot 1 — Múltiples dispositivos

**Estado:** 📅 Después del Pilot 0

**Tesis:** La plataforma soporta 3-5 dispositivos simultáneos sin degradación.

**Setup:**
- 3-5 ESP32 (o simuladores)
- Risto Cloud en Railway (cloud.ristomx.com)
- HTTPS

**Lo que se mide:**
| Métrica | Criterio de éxito |
|---------|-------------------|
| Heartbeats concurrentes | Todos llegan en < 1s |
| SQLite sin bloqueos | Sin errores de locked database |
| Dashboard actualizado | Todos los dispositivos visibles |
| Comandos simultáneos | Sin conflictos |

**Pruebas:**
- Todos los dispositivos enviando heartbeat cada 30s
- Comandos a múltiples dispositivos simultáneamente
- Un dispositivo se desconecta → los demás no se afectan

**Criterio de éxito:**
- [ ] 24h con 5 dispositivos
- [ ] Dashboard muestra todos correctamente
- [ ] Sin errores en logs del servidor

---

## 🟡 Pilot 2 — Estrés (100 dispositivos)

**Estado:** 📅 Después del Pilot 1

**Tesis:** La plataforma soporta 100 dispositivos simulados sin degradación significativa.

**Setup:**
- Simulador de dispositivos en Node.js o script Python
- Railway + Fastify + SQLite
- 100 clientes simultáneos

**Lo que se mide:**
| Métrica | Criterio de éxito |
|---------|-------------------|
| CPU del servidor | < 50% |
| RAM | < 512MB |
| Tiempo de respuesta heartbeat | < 500ms |
| Tasa de éxito | > 99% |

**Criterio de éxito:**
- [ ] 100 dispositivos funcionando 1h
- [ ] Sin timeouts ni errores 5xx
- [ ] Dashboard responde en < 2s

---

## 🟢 Restaurante Real (Piloto en campo)

**Estado:** 📅 Después del Pilot 2

**Tesis:** El sistema funciona en un restaurante real durante una semana.

**Setup:**
- 1-3 Button Tickets instalados en restaurante
- Risto Cloud en Railway con PostgreSQL
- Personal del restaurante usando el sistema

**Lo que se mide:**
| Métrica | Criterio de éxito |
|---------|-------------------|
| Uptime del sistema | > 99.9% |
| Heartbeats | Sin pérdidas |
| Órdenes procesadas | Sin errores |
| Feedback del personal | Positivo o con mejoras accionables |

**Criterio de éxito:**
- [ ] 7 días sin intervención del equipo de desarrollo
- [ ] Personal usando el sistema sin capacitación intensiva
- [ ] Reporte de retroalimentación documentado

---

## 📐 Resumen de criterios de éxito por fase

| Fase | Duración | Dispositivos | Infraestructura | Éxito |
|------|----------|-------------|-----------------|-------|
| Pilot 0 | 48h | 1 | Local | ❌/✅ |
| Pilot 1 | 24h | 3-5 | Railway | ❌/✅ |
| Pilot 2 | 1h | 100 | Railway | ❌/✅ |
| Restaurante | 7 días | 1-3 | Railway + PG | ❌/✅ |

Si alguna fase falla, se detiene el avance y se corrige antes de continuar.
