# ACP-RISK-2.0
## Especificación del Modelo de Riesgo Determinista — Extensión de Detección de Anomalías y Cooldown
**Estado:** Borrador
**Versión:** 2.0
**Reemplaza:** ACP-RISK-1.0
**Depende-de:** ACP-SIGN-1.0, ACP-CT-1.0, ACP-CAP-REG-1.0
**Requerido-por:** ACP-API-1.0, ACP-LEDGER-1.3
**Fecha:** 2026-03-22

---

## 1. Alcance

Este documento reemplaza ACP-RISK-1.0. Extiende la función de evaluación de riesgo con:

1. **F_anom** — un factor de anomalía determinista basado en tres reglas de conteo
2. **Mecanismo de Cooldown** — un estado de bloqueo temporal para agentes con patrones de denegación sostenidos
3. **Desglose de factores** — un registro de evaluación extendido obligatorio que habilita reproducibilidad forense completa

Todas las adiciones preservan el invariante core: **determinista, auditable, reproducible con los mismos inputs y una política firmada**.

---

## 2. Definiciones

Las definiciones de ACP-RISK-1.0 §2 aplican sin cambios. Definiciones adicionales:

**anomalía (a):** Patrón de comportamiento observable derivado del flujo de requests y el Audit Ledger, evaluado mediante F_anom.

**pattern_key:** Un identificador derivado que codifica la tupla (agent_id, capability, resource), usado para detección de patrones repetidos. Calculado como:
```
pattern_key = SHA-256(agent_id || "|" || capability || "|" || resource)
```
Truncado a 32 caracteres hex para almacenamiento.

**sliding window (ventana deslizante):** Una ventana temporal anclada al momento de evaluación, no a límites fijos de reloj (ej: no "este minuto" sino "los 60 segundos que terminan ahora").

**cooldown_period:** Una duración configurable durante la cual las requests de un agente son automáticamente DENEGADAS sin ejecutar la función de riesgo. Registrado como estado explícito del agente en el Audit Ledger.

**policy_hash:** SHA-256 del documento de política firmado activo. DEBE incluirse en cada registro de evaluación.

---

## 3. Función de Riesgo

```
RS = min(100, B(c) + F_ctx(x) + F_hist(h) + F_res(r) + F_anom(a))
```

donde:
- `B(c)` = baseline de capability (sin cambios respecto a ACP-RISK-1.0 §4)
- `F_ctx(x)` = factor contextual (sin cambios respecto a ACP-RISK-1.0 §5)
- `F_hist(h)` = factor de historial (sin cambios respecto a ACP-RISK-1.0 §6)
- `F_res(r)` = factor de recurso (sin cambios respecto a ACP-RISK-1.0 §7)
- `F_anom(a)` = **factor de anomalía (nuevo en v2.0, definido en §3.1)**

La evaluación DEBE verificar el estado de cooldown (§3.5) antes de ejecutar esta función. Si un agente está en cooldown, la función no se ejecuta.

---

### 3.1 Factor de Anomalía F_anom(a)

F_anom es la suma de las contribuciones de reglas aplicables. Todas las reglas operan sobre conteos enteros derivados exclusivamente del Audit Ledger. Sin aritmética de punto flotante. Sin machine learning. Sin estado externo.

```
F_anom(a) = Regla1(a) + Regla2(a) + Regla3(a)
```

**Regla 1 — Alta Tasa de Requests**
```
si count(requests[agent_id], sliding_window=60s) > N → +20
si no → 0
```
- `N` se define en la política firmada (default: 10)
- La ventana es deslizante (anclada a ahora), no de bucket fijo
- Cuenta todas las requests en el Audit Ledger para este agent_id en la ventana

**Regla 2 — Denegaciones Recientes**
```
si count(eventos[agent_id, decision=DENIED], últimas_24h) ≥ X → +15
si no → 0
```
- `X` se define en la política firmada (default: 3)
- Incluye eventos DENIED tanto por override de autonomy_level como por evaluación de umbral
- Ventana: 24 horas terminando en el timestamp de evaluación

**Regla 3 — Patrón Repetido**
```
pattern_key = SHA-256(agent_id || "|" || capability || "|" || resource)
si count(eventos[pattern_key], últimos_5min) ≥ Y → +15
si no → 0
```
- `Y` se define en la política firmada (default: 3)
- Ventana: 5 minutos deslizantes terminando en el timestamp de evaluación
- Sin fuzzy matching. Sin equivalencia semántica. Sin ML. Solo igualdad exacta de hash.

**Contribución máxima:** F_anom ≤ 50 (las tres reglas disparadas simultáneamente).

---

### 3.2 Baseline de Capability B(c)

Sin cambios respecto a ACP-RISK-1.0 §4.

| Capability | B(c) |
|------------|------|
| *.read, *.monitor | 0 |
| *.write, *.notify | 5–10 |
| financial.payment | 35 |
| financial.transfer | 40 |
| infrastructure.delete | 55 |
| agent.revoke | 40 |

Para capabilities extendidas desconocidas: B(c) = 40.

---

### 3.3 Factor Contextual F_ctx(x)

Sin cambios respecto a ACP-RISK-1.0 §5.

| Condición | Valor |
|-----------|-------|
| Fuera de ventana operativa institucional | +15 |
| Día no hábil (fin de semana o feriado) | +10 |
| IP de origen no corporativa | +20 |
| Geolocalización fuera del dominio institucional | +25 |
| Desvío de timestamp > 300 segundos | +30 |
| Ninguna condición aplica | 0 |

---

### 3.4 Factor de Historial F_hist(h) y Factor de Recurso F_res(r)

Sin cambios respecto a ACP-RISK-1.0 §6 y §7 respectivamente.

---

### 3.5 Mecanismo de Cooldown

El Decision Engine DEBE evaluar el estado de cooldown antes de ejecutar la función de riesgo.

**Condición de disparo:**
```
si count(eventos[agent_id, decision=DENIED], últimos_10min) ≥ 3:
    → entrar en estado COOLDOWN por cooldown_period (definido en política, default: 5 min)
```

**Durante el cooldown:**
- Todas las requests del agent_id → DENIED automáticamente
- La función de riesgo NO se ejecuta
- La decisión = "DENIED" con razón = "COOLDOWN_ACTIVE"
- Se registra un evento DECISION en el Audit Ledger con metadatos de cooldown

**Registro de estado de agente en cooldown** (anexado al Audit Ledger al entrar):
```json
{
  "event_type": "AGENT_STATE_CHANGE",
  "agent_id": "A1",
  "previous_status": "ACTIVE",
  "new_status": "COOLDOWN",
  "until": "2026-03-22T15:30:00Z",
  "triggered_by": "3_DENIED_in_10min",
  "policy_hash": "abc123..."
}
```

**Salida del cooldown:**
- Automática en el timestamp `until`
- Un evento AGENT_STATE_CHANGE con new_status = "ACTIVE" DEBE ser registrado

**Fundamento de diseño:** El cooldown es un estado explícito y observable del agente. Cualquier auditoría puede reconstruir exactamente por qué y hasta cuándo un agente estuvo bloqueado. No es un throttle silencioso — es un estado formal en el modelo de gobernanza.

---

## 4. Umbrales de Decisión

Sin cambios respecto a ACP-RISK-1.0 §8. Se aplican después de la contribución de F_anom.

| RS | Decisión |
|----|----------|
| 0 – 39 | APPROVED |
| 40 – 69 | ESCALATED |
| 70 – 100 | DENIED |

---

## 5. Override por Nivel de Autonomía

Sin cambios respecto a ACP-RISK-1.0 §9.

| Nivel de Autonomía | Descripción | Umbral APPROVED | Umbral ESCALATED |
|--------------------|-------------|-----------------|------------------|
| 0 | Sin autonomía | — | DENIED siempre |
| 1 | Mínima | 0–19 | 20–100 → ESCALATED |
| 2 | Estándar | 0–39 | 40–69 → ESCALATED, 70+ → DENIED |
| 3 | Elevada | 0–59 | 60–79 → ESCALATED, 80+ → DENIED |
| 4 | Máxima | 0–79 | 80–89 → ESCALATED, 90+ → DENIED |

---

## 6. Registro de Evaluación (Extendido)

Cada evaluación DEBE producir un registro con la siguiente estructura. El objeto `factors` (nuevo en v2.0) habilita reproducibilidad forense: cualquier tercero con el Audit Ledger y la política firmada puede recalcular RS y verificar que coincide.

```json
{
  "eval_id": "<uuid>",
  "request_id": "<uuid>",
  "agent_id": "acp:agent:org.example:PayAgent-001",
  "capability": "acp:cap:financial.payment",
  "resource": "org.example/cuentas/ACC-001",
  "timestamp": "2026-03-22T14:00:00Z",
  "factors": {
    "base": 35,
    "context": 20,
    "history": 0,
    "resource": 15,
    "anomaly": 15
  },
  "rs_raw": 85,
  "rs_final": 85,
  "decision": "DENIED",
  "threshold_config": {
    "approved_max": 39,
    "escalated_max": 69,
    "autonomy_level": 2
  },
  "factors_applied": [
    "f_ctx_ip_no_corporativa",
    "f_res_restricted",
    "f_anom_regla2_denegaciones_recientes"
  ],
  "anomaly_detail": {
    "rule1_triggered": false,
    "rule1_count": 4,
    "rule1_threshold": 10,
    "rule2_triggered": true,
    "rule2_count": 3,
    "rule2_threshold": 3,
    "rule3_triggered": false,
    "rule3_count": 1,
    "rule3_threshold": 3,
    "pattern_key": "a3f8bc12..."
  },
  "cooldown_active": false,
  "policy_hash": "sha256:d4e5f6..."
}
```

**Notas:**
- `rs_raw` = suma antes del cap min(100,...). `rs_final` = RS efectivo después del cap.
- `anomaly_detail` DEBE estar presente en cada evaluación (incluso cuando ninguna regla de anomalía se dispara), para habilitar verificación de que las reglas fueron evaluadas correctamente.
- `cooldown_active` DEBE ser `true` cuando el registro se genera por cooldown (en cuyo caso factors, rs_raw, rs_final y threshold_config DEBEN omitirse o ser null — la función no fue ejecutada).
- `policy_hash` DEBE referenciar la versión de política firmada activa al momento de evaluación.

---

## 7. Extensibilidad

Sin cambios respecto a ACP-RISK-1.0 §11. Las instituciones PUEDEN agregar reglas de anomalía personalizadas como `F_anom_custom_<institution_id>`. Estas:

- DEBEN ser deterministas (inputs enteros → salida entera)
- DEBEN estar documentadas en la política firmada
- DEBEN aparecer en `factors_applied` y `anomaly_detail`
- NO DEBEN reemplazar ni modificar las Reglas 1–3

---

## 8. Errores

Extiende ACP-RISK-1.0 §12.

| Código | Condición |
|--------|-----------|
| RISK-001 | agent_id no registrado |
| RISK-002 | Capability inválida según ACP-CAP-REG-1.0 |
| RISK-003 | Recurso sin clasificación (tratado como sensitive) |
| RISK-004 | Contexto con campos requeridos faltantes |
| RISK-005 | RS ≥ 70 — DENIED |
| RISK-006 | Nivel de autonomía 0 — DENIED sin evaluación |
| RISK-007 | Agente en estado COOLDOWN — DENIED sin ejecutar función de riesgo |
| RISK-008 | Audit Ledger no disponible — la evaluación DEBE ser rechazada (fail-closed) |
| RISK-009 | policy_hash no verificable — la evaluación DEBE ser rechazada |

**Nota de diseño RISK-008:** F_anom depende del Audit Ledger. Si el ledger no está disponible, el factor de anomalía no puede computarse. ACP-RISK-2.0 exige fail-closed: rechazar la request en lugar de evaluar sin datos de anomalía.

---

## 9. Migración desde ACP-RISK-1.0

Implementaciones que actualicen de v1.0 a v2.0:

1. Agregar cómputo de F_anom usando conteos del ledger (§3.1)
2. Agregar tracking de estado de cooldown (§3.5)
3. Extender registros de evaluación con `factors`, `anomaly_detail` y `policy_hash` (§6)
4. Actualizar manejo de errores para incluir RISK-007, RISK-008, RISK-009

Compatibilidad hacia atrás: los valores de RS para requests donde F_anom = 0 y no hay cooldown activo son idénticos a los outputs de ACP-RISK-1.0 para los mismos inputs.

---

## 10. Conformance

Una implementación es conforme a ACP-RISK-2.0 si:

- Implementa la función de Riesgo extendida con los cinco factores (B, F_ctx, F_hist, F_res, F_anom)
- Implementa F_anom usando exactamente las Reglas 1–3 con sliding windows (sin aproximación de bucket fijo)
- Computa pattern_key como SHA-256(agent_id || "|" || capability || "|" || resource)
- Evalúa el estado de cooldown antes de ejecutar la función de riesgo
- Registra eventos AGENT_STATE_CHANGE en entrada y salida de cooldown
- Produce DENIED con razón "COOLDOWN_ACTIVE" para todas las requests durante cooldown
- Produce valores de RS idénticos para los mismos inputs y la misma política (determinista)
- Registra cada evaluación con la estructura completa del §6 incluyendo anomaly_detail
- Aplica comportamiento fail-closed cuando el Audit Ledger no está disponible (RISK-008)
- Rechaza evaluaciones cuando policy_hash no puede verificarse (RISK-009)
- Rechaza requests con contexto incompleto (RISK-004)
- Produce DENIED para autonomy_level 0 sin ejecutar la función (RISK-006)

---

## Apéndice A — Parámetros de Configuración de Política

Los siguientes parámetros DEBEN definirse en el documento de política firmado referenciado por policy_hash:

| Parámetro | Default | Descripción |
|-----------|---------|-------------|
| `risk.anom.rule1.threshold_N` | 10 | Umbral de conteo de requests para Regla 1 (ventana 60s) |
| `risk.anom.rule2.threshold_X` | 3 | Umbral de conteo de denegaciones para Regla 2 (ventana 24h) |
| `risk.anom.rule3.threshold_Y` | 3 | Umbral de conteo de patrón para Regla 3 (ventana 5min) |
| `risk.cooldown.trigger_denials` | 3 | Denegaciones en 10 min que disparan el cooldown |
| `risk.cooldown.period_seconds` | 300 | Duración del cooldown en segundos |

Todos los cambios de política DEBEN producir un nuevo policy_hash. Los registros de evaluación DEBEN referenciar el policy_hash activo al momento de evaluación — esto permite reconstruir los umbrales usados en cualquier evaluación histórica.
