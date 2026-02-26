# ACP-RISK-1.0
## Deterministic Risk Model Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** ACP-SIGN-1.0, ACP-CT-1.0, ACP-CAP-REG-1.0
**Required-by:** ACP-API-1.0, ACP-LEDGER-1.0

---

## 1. Alcance

Este documento define la función de evaluación de riesgo Risk(a,c,r,x,h)→[0,100], sus factores, los thresholds de decisión, el override por autonomy_level, y el formato de registro de evaluación para auditabilidad.

---

## 2. Definiciones

**agent_id (a):** AgentID del agente solicitante. MUST cumplir formato ACP-CT-1.0 §3.2.

**capability (c):** Capability identifier según ACP-CAP-REG-1.0.

**resource (r):** Identificador del recurso objetivo.

**context (x):** Conjunto de atributos observables del entorno en el momento de la solicitud.

**history (h):** Registro de actividad del agente en ventana de 24 horas previas.

**Risk Score (RS):** Entero en [0, 100]. Valor más alto indica mayor riesgo.

---

## 3. Función de Riesgo

```
RS = min(100, B(c) + F_ctx(x) + F_hist(h) + F_res(r))
```

donde:
- `B(c)` = baseline por capacidad
- `F_ctx(x)` = factor contextual
- `F_hist(h)` = factor de historial
- `F_res(r)` = factor de recurso

---

## 4. Baseline por Capacidad B(c)

Valores definidos en ACP-CAP-REG-1.0 §3. Resumen:

| Capacidad | B(c) |
|-----------|------|
| *.read, *.monitor | 0 |
| *.write, *.notify | 5–10 |
| financial.payment | 35 |
| financial.transfer | 40 |
| infrastructure.delete | 55 |
| agent.revoke | 40 |

Para capacidades extendidas desconocidas: B(c) = 40.

---

## 5. Factor Contextual F_ctx(x)

Suma de los factores aplicables. Máximo no limitado aquí — el `min(100,...)` de la función principal es el tope.

| Condición | Valor |
|-----------|-------|
| Horario fuera de ventana operativa institucional | +15 |
| Día no laboral (fin de semana o festivo) | +10 |
| IP origen no corporativa | +20 |
| Geolocalización fuera de dominio institucional | +25 |
| Timestamp drift > 300 segundos | +30 |
| Ninguna condición aplica | 0 |

La ventana operativa institucional es configurable. Por defecto: 08:00–20:00 hora local de la institución.

---

## 6. Factor de Historial F_hist(h)

Ventana de análisis: 24 horas previas para el mismo `agent_id`.

| Condición | Valor |
|-----------|-------|
| Tasa de denegación > 10% en ventana | +15 |
| Escalaciones no resueltas en ventana | +10 |
| Denegación en últimos 30 minutos | +20 |
| Frecuencia de requests anómala (>3σ respecto a baseline del agente) | +15 |
| Monto solicitado > 80% del límite del agente (si aplica) | +20 |
| Sin historial previo del agente | +10 |
| Ninguna condición aplica | 0 |

---

## 7. Factor de Recurso F_res(r)

Clasificación del recurso objetivo:

| Clasificación | F_res |
|---------------|-------|
| public | 0 |
| internal | 5 |
| sensitive | 15 |
| critical | 30 |
| restricted | 45 |

La clasificación de cada recurso es responsabilidad de la institución y MUST ser registrada en su directorio de recursos. Si un recurso no tiene clasificación registrada, MUST ser tratado como `sensitive` (F_res = 15).

---

## 8. Thresholds de Decisión

| RS | Decisión |
|----|----------|
| 0 – 39 | APPROVED |
| 40 – 69 | ESCALATED |
| 70 – 100 | DENIED |

---

## 9. Override por Autonomy Level

El autonomy_level del agente modifica los thresholds efectivos:

| Autonomy Level | Descripción | Threshold APPROVED | Threshold ESCALATED |
|----------------|-------------|-------------------|---------------------|
| 0 | Sin autonomía | — | DENIED siempre |
| 1 | Mínima | 0–19 | 20–100 → ESCALATED |
| 2 | Estándar | 0–39 | 40–69 → ESCALATED, 70+ → DENIED |
| 3 | Elevada | 0–59 | 60–79 → ESCALATED, 80+ → DENIED |
| 4 | Máxima | 0–79 | 80–89 → ESCALATED, 90+ → DENIED |

Autonomy level 0 MUST producir DENIED para cualquier RS sin ejecutar la función de riesgo.

---

## 10. Registro de Evaluación

Toda evaluación MUST producir un registro con la siguiente estructura para el Audit Ledger:

```json
{
  "eval_id": "<uuid>",
  "request_id": "<uuid>",
  "agent_id": "<AgentID>",
  "capability": "acp:cap:financial.payment",
  "resource": "org.example/accounts/ACC-001",
  "baseline": 35,
  "f_ctx": 15,
  "f_hist": 0,
  "f_res": 15,
  "rs_final": 65,
  "decision": "ESCALATED",
  "threshold_config": {
    "approved_max": 39,
    "escalated_max": 69,
    "autonomy_level": 2
  },
  "factors_applied": [
    "f_ctx_ip_non_corporate",
    "f_res_sensitive"
  ]
}
```

El campo `factors_applied` MUST listar exactamente los factores que contribuyeron al score. Esto permite reproducir el cálculo desde el registro.

---

## 11. Extensibilidad

Las instituciones MAY agregar factores custom bajo el identificador `F_custom_<institution_id>`. Estos factores:

- MUST ser documentados internamente
- MUST ser incluidos en el registro de evaluación
- MUST NOT modificar los factores core definidos en §5, §6, §7

---

## 12. Errores

| Código | Condición |
|--------|-----------|
| RISK-001 | agent_id no registrado |
| RISK-002 | capability inválida según ACP-CAP-REG-1.0 |
| RISK-003 | Recurso sin clasificación (tratado como sensitive) |
| RISK-004 | Contexto con campos obligatorios ausentes |
| RISK-005 | RS ≥ 70 — DENIED |
| RISK-006 | Autonomy level 0 — DENIED sin evaluación |

---

## 13. Conformidad

Una implementación es ACP-RISK-1.0 conforme si:

- Implementa la función Risk con todos los factores definidos
- Produce RS idénticos para los mismos inputs (función determinística)
- Aplica thresholds con override por autonomy_level
- Registra cada evaluación con estructura completa de §10
- Produce DENIED para autonomy_level 0 sin ejecutar función
- Rechaza requests con contexto incompleto (RISK-004)
