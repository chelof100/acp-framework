# ACP-REP-1.2
## Reputation & Trust Layer — Especificación Completa

**Status:** Stable
**Version:** 1.2
**Supersedes:** ACP-REP-1.1
**Depends-on:** ACP-SIGN-1.0, ACP-CT-1.0, ACP-REV-1.0, ACP-HP-1.0, ACP-LEDGER-1.2, ACP-LIA-1.0
**Required-by:** ACP-AGS-1.0 (L7 — Reputation & Trust)

---

## Abstract

ACP-REP-1.2 extiende ACP-REP-1.1 con tres mecanismos nuevos que cierran L7 del Agent Governance Stack:

1. **ExternalReputationScore** — score formal de reputación externa calculado a partir de eventos `REPUTATION_UPDATED` del ACP-LEDGER-1.2, portable entre instituciones bajo condiciones controladas.
2. **Dual Trust Bootstrap** — mecanismo por el cual un agente nuevo puede inicializar su reputación externa a partir de una attestation firmada de su reputación interna institucional.
3. **Reputation Decay** — degradación temporal del score externo ante inactividad, que previene que agentes dormidos mantengan privilegios indefinidamente.

Esta especificación es compatible hacia atrás con ACP-REP-1.1. Toda implementación ACP-REP-1.2 conforme implementa automáticamente ACP-REP-1.1.

---

## Parte I — Herencia de ACP-REP-1.1

ACP-REP-1.2 incorpora por referencia la totalidad de ACP-REP-1.1. Las siguientes secciones de la especificación anterior se mantienen sin cambios:

| Sección (REP-1.1) | Contenido | Estado en REP-1.2 |
|---|---|---|
| §1 — Decisiones de diseño | Reputación por institución, emisor servidor, cold start null, score privado, modelo dual | ✅ Sin cambios |
| §2 — Modelo matemático | score' = α·score + β·event_metric, parámetros, event_metrics fijos | ✅ Sin cambios |
| §3 — Máquina de estados | ACTIVE/PROBATION/SUSPENDED/BANNED + transiciones | ✅ Sin cambios |
| §4 — API v1.1 | GET /rep/{id}, GET /rep/{id}/events, POST /rep/{id}/state | ✅ Sin cambios, extendido en §6 |
| §5 — Almacenamiento | Interface ReputationStore, InMemoryStore, FileStore | ✅ Sin cambios, extendido en §10 |
| §6 — Configuración | ReputationConfig, α, β, umbrales | ✅ Sin cambios, extendido en §11 |
| §7 — Integración REV-1.0 | Trigger BANNED por revocación | ✅ Sin cambios |
| §8 — Seguridad | Asimetría, anti-gaming, rate limiting | ✅ Sin cambios, extendido en §12 |
| §9 — Errores | REP-E001 a REP-E007 | ✅ Sin cambios, extendido en §13 |
| §10 — Conformidad | Checklist REP-1.1 | Reemplazado por §14 |

---

## Parte II — Extensiones v1.2

---

## 1. Modelo Dual de Confianza

ACP-REP-1.2 formaliza la distinción entre dos dimensiones de reputación que coexisten en el ecosistema ACP:

### 1.1 Definiciones

**InternalTrustScore (ITS):** El score de reputación tal como está definido en ACP-REP-1.1. Es el score calculado por la institución que opera el agente, basado en los eventos registrados dentro de su propio ledger. Es privado, institucional y contextual.

**ExternalReputationScore (ERS):** Score de reputación del agente en el ecosistema externo. Se construye a partir de eventos `REPUTATION_UPDATED` en ACP-LEDGER-1.2 y refleja el comportamiento del agente en interacciones cross-institucionales. Es portable (dentro de condiciones definidas en §3) y computado de forma verificable.

### 1.2 Orthogonalidad

Los dos scores son dimensiones ortogonales — un agente puede tener:

| ITS | ERS | Interpretación |
|---|---|---|
| Alto (0.9) | null | Agente con largo historial interno, nuevo en el ecosistema externo |
| null | Alto (0.8) | Agente nuevo internamente, reputación establecida en otro contexto |
| Alto (0.9) | Alto (0.8) | Agente consolidado en ambas dimensiones |
| Bajo (0.2) | Alto (0.8) | Agente con problemas internos recientes, historial externo positivo |

**Regla de precedencia:** Cuando ambos scores existen y son contradictorios, la política de la institución determina cuál tiene más peso en la decisión de autorización. Si la institución no configura política de precedencia, el estado de la máquina de estados (§3 de REP-1.1) tiene precedencia absoluta: un agente BANNED es rechazado independientemente del ERS.

### 1.3 Separación de responsabilidades

| Responsable | Dominio |
|---|---|
| Institución operadora | ITS — calcula y custodia el score interno |
| ACP-LEDGER-1.2 | Registro de eventos `REPUTATION_UPDATED` |
| Motor ERS (§2) | Cómputo del ExternalReputationScore a partir de LEDGER |
| Institución | Política de uso de ITS vs ERS en decisiones de autorización |

---

## 2. ExternalReputationScore (ERS)

### 2.1 Definición formal

```
ERS ∈ [0.0, 1.0]  ∪  {null}

null  = sin actividad externa registrada
0.0   = score externo mínimo observable
1.0   = score externo máximo observable
```

El ERS se calcula a partir del conjunto de eventos `REPUTATION_UPDATED` en el ledger ACP-LEDGER-1.2 donde `agent_id` coincide con el agente evaluado.

### 2.2 Estructura del evento REPUTATION_UPDATED

El evento `REPUTATION_UPDATED` (definido en ACP-LEDGER-1.2) transporta:

```json
{
  "event_type": "REPUTATION_UPDATED",
  "payload": {
    "agent_id": "<AgentID>",
    "score_before": 0.842,
    "score_after": 0.851,
    "delta": 0.009,
    "trigger_event_id": "<uuid>",
    "trigger_event_type": "EXECUTION_TOKEN_CONSUMED",
    "evaluation_context": "cross_institutional",
    "institution_id": "org.example.banking",
    "timestamp": 1718920000
  }
}
```

**Campo `evaluation_context`:** Enum que distingue el origen del evento:
- `internal` — evento generado por actividad dentro de la institución
- `cross_institutional` — evento generado por interacción con otra institución
- `bootstrap` — evento generado por el mecanismo de Dual Trust Bootstrap (§3)

### 2.3 Función de cómputo ERS

El ERS se calcula con un **weighted moving average** sobre los eventos `REPUTATION_UPDATED` más recientes, con ponderación por tiempo y contexto:

```
ERS = Σ(w_i · delta_i) / Σ(w_i)
```

Donde para cada evento i:

```
w_i = w_context(context_i) · w_time(age_i)

w_context:
  "internal"            → 0.5
  "cross_institutional" → 1.0
  "bootstrap"           → 0.3

w_time(age):
  age = now - timestamp_i  (en segundos)
  w_time = exp(-λ · age / DECAY_WINDOW)
```

**Parámetros ERS:**

| Parámetro | Default | Configurable | Descripción |
|---|---|---|---|
| `ers_window_events` | 100 | ✅ | Máx eventos históricos a considerar |
| `ers_lambda` | 0.5 | ✅ [0.1, 2.0] | Factor de decaimiento temporal |
| `ers_decay_window` | 2592000 (30 días) | ✅ | Ventana temporal de referencia en segundos |

### 2.4 Score base de cómputo

El ERS no parte de cero. El score base inicial de cada cómputo usa el score de la última evaluación como punto de anclaje:

```
Si ERS_anterior existe:
    ERS_nuevo = α_ext · ERS_anterior + (1 - α_ext) · ERS_incremental

Si ERS_anterior == null (cold start externo):
    ERS_nuevo = ERS_bootstrap (§3) si existe, sino null hasta acumular min_events
```

**Parámetro `alpha_ext`:** Factor de memoria del score externo. Default: 0.85. Rango: [0.70, 0.98].

**Parámetro `ers_min_events`:** Número mínimo de eventos para que ERS sea distinto de null (sin bootstrap activo). Default: 3.

### 2.5 ERS como campo en respuestas de API

El ERS se expone como campo adicional en los endpoints existentes de reputación y en el nuevo endpoint de score rápido (§6):

```json
{
  "agent_id": "<AgentID>",
  "internal_score": 0.847,
  "external_score": 0.731,
  "state": "ACTIVE",
  "event_count": 142,
  "last_event_at": 1718920000,
  "checked_at": 1718921000,
  "sig": "<firma_institucional>"
}
```

El campo `score` de REP-1.1 se mantiene como alias de `internal_score` para compatibilidad hacia atrás.

---

## 3. Dual Trust Bootstrap

### 3.1 El problema del cold start externo

Un agente nuevo que opera por primera vez fuera de su institución de origen tiene ERS = null. Sin mecanismo de bootstrap, el agente está en desventaja frente a agentes con historial externo — no por su comportamiento, sino por falta de exposición previa.

El Dual Trust Bootstrap permite que la institución de origen del agente **avale** al agente en el ecosistema externo, usando su historial interno como proxy de confiabilidad inicial.

### 3.2 Flujo de bootstrap

```
1. La institución genera una TrustAttestation para el agente
2. La TrustAttestation se firma con la clave institucional
3. La TrustAttestation se registra como evento REPUTATION_UPDATED
   con evaluation_context = "bootstrap"
4. El motor ERS inicializa el score externo del agente con el
   bootstrap_value derivado de la attestation
```

### 3.3 Estructura de TrustAttestation

```json
{
  "attestation_id": "<uuid_v4>",
  "attestation_type": "trust_bootstrap",
  "agent_id": "<AgentID>",
  "issuing_institution": "org.example.banking",
  "internal_score": 0.847,
  "agent_state": "ACTIVE",
  "event_count": 142,
  "operating_since": 1714320000,
  "bootstrap_value": 0.45,
  "bootstrap_confidence": 0.3,
  "valid_until": 1774320000,
  "sig": "<firma_institucional_Ed25519>"
}
```

**Campos:**

| Campo | Tipo | Descripción |
|---|---|---|
| `attestation_id` | uuid | Identificador único de la attestation |
| `attestation_type` | string | Siempre `"trust_bootstrap"` en este contexto |
| `agent_id` | AgentID | Agente avalado |
| `issuing_institution` | string | Institución que avala (MUST ser ITA registrada per ACP-ITA-1.0) |
| `internal_score` | float64 | ITS del agente en el momento de la attestation |
| `agent_state` | AgentState | Estado del agente en la máquina de estados REP-1.1 |
| `event_count` | int | Número de eventos de reputación que generaron el ITS |
| `operating_since` | unix timestamp | Fecha de primer evento de reputación del agente |
| `bootstrap_value` | float64 | Valor ERS inicial propuesto. Ver §3.4 para cálculo. |
| `bootstrap_confidence` | float64 | Peso del evento bootstrap en el cómputo ERS. Fijo: 0.3 |
| `valid_until` | unix timestamp | Expiración de la attestation. MAx: now + 180 días |
| `sig` | string | Firma Ed25519 de la institución (sobre JCS de la attestation sin sig) |

### 3.4 Cálculo de bootstrap_value

El `bootstrap_value` NO es el ITS directamente. Se aplica un factor de descuento:

```
bootstrap_value = internal_score · discount_factor

discount_factor:
  event_count < 10:   0.30  (historial muy corto, alta incertidumbre)
  event_count 10–49:  0.45
  event_count 50–199: 0.55
  event_count ≥ 200:  0.65  (máximo discount_factor)
```

**Justificación:** El ITS es un score contextual institucional. Trasladarlo directamente al ecosistema externo implicaría que la institución puede inflar artificialmente el ERS de sus agentes. El descuento asegura que:
1. El bootstrap es un punto de partida, no un score consolidado.
2. Un agente debe demostrar comportamiento externo para subir su ERS por encima del bootstrap.
3. El descuento crece con el historial interno para incentivar a instituciones a desarrollar agentes con trayectoria.

### 3.5 Condiciones para emitir una TrustAttestation

La institución MUST verificar antes de emitir:

1. `agent_state == ACTIVE` — no se avala a agentes en PROBATION, SUSPENDED o BANNED.
2. `internal_score ≥ 0.50` — no se avala a agentes con ITS por debajo del umbral de confianza mínima.
3. `event_count ≥ 5` — se requiere historial mínimo verificable.
4. La institución emisora MUST estar registrada como ITA válida (ACP-ITA-1.0).

### 3.6 Una attestation por agente por institución

Una institución MUST emitir solo una attestation activa por agente. Si se emite una nueva attestation (renovación), la anterior queda inválida y el `attestation_id` anterior se registra en el ledger como `ATTESTATION_REVOKED`.

### 3.7 Degradación del bootstrap

El evento bootstrap tiene peso `bootstrap_confidence = 0.3` (fijo). A medida que el agente acumula eventos `cross_institutional`, el peso del bootstrap se diluye naturalmente en el cómputo ERS hasta volverse irrelevante. El bootstrap no bloquea ni distorsiona el score a largo plazo.

---

## 4. Reputation Decay

### 4.1 Definición

Reputation decay es la degradación del ExternalReputationScore ante inactividad. Un agente que no registra eventos de reputación externa durante un período configurable ve su ERS disminuir gradualmente.

**Justificación:** Un agente que acumuló ERS alto hace dos años y no ha operado desde entonces no debería mantener ese privilegio indefinidamente. El mundo cambia, las políticas cambian, y el historial antiguo es menos predictivo que el reciente.

### 4.2 Función de decay

El decay se aplica al ERS como factor multiplicativo en cada cómputo de score:

```
Si last_external_event_age > decay_start_days:
    decay_factor = exp(-λ_decay · (last_external_event_age - decay_start_days) / decay_half_life)
    ERS_effective = ERS_raw · decay_factor
Sino:
    ERS_effective = ERS_raw
```

**Parámetros de decay:**

| Parámetro | Default | Configurable | Descripción |
|---|---|---|---|
| `decay_enabled` | `true` | ✅ | Activar/desactivar decay |
| `decay_start_days` | 90 | ✅ [30, 365] | Días de inactividad antes de iniciar decay |
| `decay_half_life_days` | 180 | ✅ [60, 730] | Días para reducir ERS a la mitad |
| `decay_floor` | 0.10 | ✅ [0.0, 0.40] | ERS mínimo por decay (no decae a cero) |

**Ejemplo numérico (defaults):**

Un agente con ERS = 0.80 que no opera durante 270 días (90 días de gracia + 180 días de half-life):
```
decay_factor = exp(-0.693 · 180/180) = exp(-0.693) = 0.50
ERS_effective = 0.80 · 0.50 = 0.40
```
Si continúa inactivo 180 días más (450 días totales desde última actividad):
```
decay_factor = exp(-0.693 · 360/180) = exp(-1.386) = 0.25
ERS_effective = max(0.80 · 0.25, 0.10) = max(0.20, 0.10) = 0.20
```

### 4.3 Decay y el ITS

El decay aplica **únicamente al ERS**. El ITS (ACP-REP-1.1) tiene su propio mecanismo de memoria implícita (parámetro α). El ITS no decae por este mecanismo — las instituciones pueden implementar su propio decay interno si lo requieren, pero no está normado por esta spec.

### 4.4 Reactivación post-decay

Cuando un agente inactivo vuelve a operar externamente, el decay se detiene y el score comienza a recuperarse con los nuevos eventos `REPUTATION_UPDATED`. No hay penalización adicional por el período de inactividad — el decay es el mecanismo suficiente.

### 4.5 Visibilidad del decay state

Los endpoints de score (§5, §6) DEBEN incluir el campo `decay_state` en la respuesta:

```json
{
  "external_score": 0.40,
  "decay_state": {
    "active": true,
    "last_external_event_days_ago": 270,
    "decay_factor": 0.50,
    "raw_score_before_decay": 0.80
  }
}
```

---

## 5. Actualización del Endpoint GET /acp/v1/rep/{agent_id}

El endpoint de REP-1.1 se extiende con los nuevos campos. La respuesta completa en REP-1.2:

```http
GET /acp/v1/rep/{agent_id}
Authorization: ACP-Agent <token>
X-ACP-Agent-ID: <AgentID>
```

**Response 200:**
```json
{
  "agent_id": "<AgentID>",
  "score": 0.847,
  "internal_score": 0.847,
  "external_score": 0.731,
  "state": "ACTIVE",
  "event_count": 142,
  "last_event_at": 1718920000,
  "last_external_event_at": 1718800000,
  "decay_state": {
    "active": false,
    "last_external_event_days_ago": 1,
    "decay_factor": 1.0,
    "raw_score_before_decay": 0.731
  },
  "bootstrap": {
    "active": false,
    "attestation_id": null
  },
  "checked_at": 1718921000,
  "sig": "<firma_institucional>"
}
```

`score` es alias de `internal_score` para compatibilidad con REP-1.1.
`external_score` es null si el agente no tiene actividad externa (sin bootstrap ni eventos cross-institutional).

---

## 6. Nuevo Endpoint: GET /acp/v1/rep/{agent_id}/score

Endpoint de consulta rápida de score — retorna solo los valores numéricos sin el detalle completo del historial. Diseñado para ser invocado en el hot path de autorización.

```http
GET /acp/v1/rep/{agent_id}/score
Authorization: ACP-Agent <token>
X-ACP-Agent-ID: <AgentID>
```

**Response 200:**
```json
{
  "agent_id": "<AgentID>",
  "internal_score": 0.847,
  "external_score": 0.731,
  "composite_score": 0.789,
  "state": "ACTIVE",
  "checked_at": 1718921000,
  "sig": "<firma_institucional>"
}
```

**Campo `composite_score`:** Score ponderado que combina ITS y ERS según la política institucional. Cálculo:

```
composite_score = w_int · internal_score + w_ext · external_score

Donde:
  w_int + w_ext = 1.0
  Defaults: w_int = 0.6, w_ext = 0.4
  Si external_score == null: composite_score = internal_score (w_int = 1.0 efectivo)
  Si internal_score == null: composite_score = external_score (w_ext = 1.0 efectivo)
  Si ambos == null: composite_score = null
```

**Parámetros configurables:**

| Parámetro | Default | Descripción |
|---|---|---|
| `composite_weight_internal` | 0.6 | Peso del ITS en el composite |
| `composite_weight_external` | 0.4 | Peso del ERS en el composite |

**Códigos HTTP:**

| HTTP | Condición |
|---|---|
| 200 | Éxito |
| 401 | No autenticado |
| 403 | Sin permiso |
| 404 | AgentID no encontrado |
| 429 | Rate limit excedido |

**Rate limiting:** Este endpoint está sujeto a rate limiting diferenciado del endpoint full `/rep/{agent_id}`, dado que es el más invocado. Las implementaciones DEBEN aplicar rate limiting por `X-ACP-Agent-ID` solicitante.

---

## 7. Nuevo Endpoint: POST /acp/v1/rep/{agent_id}/bootstrap

Endpoint para que la institución emita una TrustAttestation e inicialice el ERS de un agente.

```http
POST /acp/v1/rep/{agent_id}/bootstrap
Authorization: ACP-Institution <token>
```

**Request body:**
```json
{
  "attestation_type": "trust_bootstrap",
  "valid_until": 1774320000,
  "sig": "<firma_institucional_de_la_attestation>"
}
```

La institución DEBE haber pre-computado la TrustAttestation según §3.3 y firmado.

**Response 201:**
```json
{
  "attestation_id": "<uuid>",
  "agent_id": "<AgentID>",
  "bootstrap_value": 0.45,
  "bootstrap_confidence": 0.3,
  "external_score_initialized": 0.135,
  "valid_until": 1774320000,
  "ledger_event_id": "<uuid>"
}
```

**`external_score_initialized`:** Valor ERS efectivo después de aplicar el peso bootstrap (`bootstrap_value · bootstrap_confidence = 0.45 · 0.3 = 0.135`). Es el score externo inicial — bajo por diseño.

**Validaciones del servidor:**
1. Verificar que `agent_state == ACTIVE` en REP-1.1.
2. Verificar que `internal_score ≥ 0.50`.
3. Verificar que `event_count ≥ 5`.
4. Verificar que la institución emisora es ITA válida (ACP-ITA-1.0).
5. Verificar que no existe attestation activa para este agente (salvo renovación explícita).
6. Verificar firma `sig` contra la clave pública institucional.

**Response 400:** Si alguna validación falla → `REP-E011` con detalle.
**Response 409:** Si ya existe attestation activa → `REP-E012`.

---

## 8. Integración con ACP-LEDGER-1.2

### 8.1 Consumo de eventos REPUTATION_UPDATED

El motor ERS consume los eventos `REPUTATION_UPDATED` del ledger para el cómputo del ExternalReputationScore. El campo `evaluation_context` discrimina el origen:

```
evaluation_context == "internal"            → contribuye al ITS (procesado por REP-1.1)
evaluation_context == "cross_institutional" → contribuye al ERS (procesado por REP-1.2)
evaluation_context == "bootstrap"           → inicializa ERS (procesado por REP-1.2 §3)
```

### 8.2 Producción de eventos REPUTATION_UPDATED

Cuando el motor ERS actualiza el ExternalReputationScore, DEBE emitir un evento `REPUTATION_UPDATED` en el ledger con:

```json
{
  "agent_id": "<AgentID>",
  "score_before": 0.720,
  "score_after": 0.731,
  "delta": 0.011,
  "trigger_event_id": "<uuid_del_evento_que_triggereo>",
  "trigger_event_type": "EXECUTION_TOKEN_CONSUMED",
  "evaluation_context": "cross_institutional",
  "institution_id": "org.example.banking",
  "timestamp": 1718920000
}
```

### 8.3 Secuencia de procesamiento

```
1. ET consumido → evento EXECUTION_TOKEN_CONSUMED en ledger
2. ACP-LIA-1.0 emite LIABILITY_RECORD
3. Motor REP-1.1: actualiza ITS → emite REPUTATION_UPDATED (internal)
4. Si interacción cross-institutional:
   Motor REP-1.2: actualiza ERS → emite REPUTATION_UPDATED (cross_institutional)
5. Si decay activo: se recomputa ERS_effective en próxima consulta (lazy evaluation)
```

---

## 9. Integración con ACP-RISK-1.0

Cuando ACP-RISK-1.0 evalúa el riesgo de una solicitud, PUEDE consultar el `composite_score` vía `GET /acp/v1/rep/{agent_id}/score` e incorporarlo al cómputo del risk score.

La integración es opcional en v1 — ACP-RISK-1.0 puede operar sin reputación. Sin embargo, cuando el ERS está disponible, se RECOMIENDA incluirlo en el factor de riesgo histórico del agente.

**Mapping sugerido (no normativo):**

```
composite_score ≥ 0.80 → reputational_risk_modifier = −0.05  (reduce el risk score)
composite_score 0.50–0.79 → reputational_risk_modifier = 0.00 (neutro)
composite_score < 0.50 → reputational_risk_modifier = +0.10  (aumenta el risk score)
composite_score == null → reputational_risk_modifier = +0.05  (sin historial = riesgo leve)
```

---

## 10. Interface ReputationStore — extensión

La interface `ReputationStore` de REP-1.1 se extiende con los métodos para gestionar el ERS y las attestations:

```go
type ReputationStore interface {
    // --- REP-1.1 heredado ---
    GetRecord(agentID string) (*ReputationRecord, error)
    RecordEvent(agentID string, event ReputationEvent) error
    GetState(agentID string) (AgentState, error)
    SetState(agentID string, state AgentState, reason, authorizedBy string) error
    GetEvents(agentID string, limit, offset int) ([]ReputationEvent, int, error)

    // --- REP-1.2 nuevos ---

    // GetExternalScore retorna el ERS efectivo (con decay aplicado) para el agente.
    // Retorna nil si no hay score externo (cold start externo).
    GetExternalScore(agentID string) (*ExternalScoreRecord, error)

    // RecordExternalEvent registra un evento de reputación externa y actualiza el ERS.
    RecordExternalEvent(agentID string, event ExternalReputationEvent) error

    // GetCompositeScore retorna el composite score ponderado según configuración.
    GetCompositeScore(agentID string) (*CompositeScoreRecord, error)

    // SaveAttestation persiste una TrustAttestation emitida por la institución.
    SaveAttestation(attestation TrustAttestation) error

    // GetActiveAttestation retorna la attestation activa del agente, o nil si no existe.
    GetActiveAttestation(agentID string) (*TrustAttestation, error)

    // RevokeAttestation marca la attestation como revocada.
    RevokeAttestation(attestationID string) error
}
```

### 10.1 Struct ExternalScoreRecord

```go
type ExternalScoreRecord struct {
    AgentID                string
    RawScore               *float64   // nil si no hay ERS
    EffectiveScore         *float64   // nil si no hay ERS; con decay aplicado
    LastExternalEventAt    *int64     // unix timestamp
    LastExternalEventDaysAgo int
    DecayActive            bool
    DecayFactor            float64
    BootstrapActive        bool
    AttestationID          *string
    ComputedAt             int64
}
```

### 10.2 Struct CompositeScoreRecord

```go
type CompositeScoreRecord struct {
    AgentID         string
    InternalScore   *float64
    ExternalScore   *float64
    CompositeScore  *float64   // nil si ambos son nil
    State           AgentState
    WeightInternal  float64
    WeightExternal  float64
    CheckedAt       int64
}
```

---

## 11. Configuración — extensión

El struct `ReputationConfig` de REP-1.1 se extiende:

```go
type ReputationConfig struct {
    // --- REP-1.1 heredado ---
    Alpha              float64
    Beta               float64
    ProbationThreshold float64
    ActiveThreshold    float64
    SuspendThreshold   float64
    ColdStartPolicy    string
    ColdStartInitialScore *float64

    // --- REP-1.2 nuevos ---

    // ERS computation
    ERSWindowEvents  int     // Default: 100
    ERSLambda        float64 // Default: 0.5, range [0.1, 2.0]
    ERSDecayWindow   int     // Default: 2592000 (30 días en segundos)
    AlphaExt         float64 // Default: 0.85, range [0.70, 0.98]
    ERSMinEvents     int     // Default: 3

    // Decay
    DecayEnabled       bool    // Default: true
    DecayStartDays     int     // Default: 90, range [30, 365]
    DecayHalfLifeDays  int     // Default: 180, range [60, 730]
    DecayFloor         float64 // Default: 0.10, range [0.0, 0.40]

    // Composite score
    CompositeWeightInternal float64 // Default: 0.6
    CompositeWeightExternal float64 // Default: 0.4

    // Bootstrap
    BootstrapEnabled   bool    // Default: true
    BootstrapMaxAgeDays int    // Default: 180
}
```

---

## 12. Seguridad — extensión

### 12.1 Anti-inflation de bootstrap

La institución no puede bootstrapear a un agente con ERS por encima de `0.65 · 0.30 = 0.195` (máximo bootstrap_value por máximo discount_factor, por máximo bootstrap_confidence). Este techo garantiza que el bootstrap nunca otorga un ERS comparable al de un agente con historial externo real.

### 12.2 Validez de TrustAttestation

Una TrustAttestation se invalida automáticamente si:
- `valid_until < now`
- El agente entra en estado `SUSPENDED` o `BANNED`
- La institución emisora pierde el status de ITA válida

Un servidor que recibe un token de un agente con attestation inválida DEBE ignorar el boost del bootstrap y usar ERS = null para el agente.

### 12.3 Rate limiting diferenciado

| Endpoint | Rate limit default | Por quién |
|---|---|---|
| `GET /rep/{id}` | 60 rpm | Por caller |
| `GET /rep/{id}/score` | 120 rpm | Por caller |
| `POST /rep/{id}/bootstrap` | 5 rpm | Por institución |
| `GET /rep/{id}/events` | 30 rpm | Por caller |

### 12.4 Audit de decay state

El estado de decay DEBE registrarse en el ledger como evento `REPUTATION_UPDATED` (con `evaluation_context = "decay"`) al menos una vez cada 24 horas cuando el decay está activo, para que el historial de degradación sea auditable.

---

## 13. Errores — extensión

Los errores REP-E001 a REP-E007 de ACP-REP-1.1 se mantienen. Se añaden:

| Código | Condición |
|---|---|
| `REP-E008` | ERS no disponible — agente sin actividad externa y sin bootstrap |
| `REP-E009` | composite_score no computable — ambos scores son null |
| `REP-E010` | decay_state no computable — falta last_external_event_at |
| `REP-E011` | TrustAttestation rechazada — condiciones §3.5 no cumplidas |
| `REP-E012` | Attestation activa ya existe para este agente |
| `REP-E013` | Attestation expirada — valid_until < now |
| `REP-E014` | Firma de attestation inválida |
| `REP-E015` | Institución emisora no es ITA válida (ACP-ITA-1.0) |

---

## 14. Conformidad

Una implementación es **ACP-REP-1.2 conforme** si cumple todos los requisitos de ACP-REP-1.1 Y adicionalmente:

### Herencia REP-1.1
- [ ] Implementa el modelo matemático con los `event_metric` fijos
- [ ] Implementa la máquina de estados con todas las transiciones
- [ ] Garantiza que registros de reputación sobreviven reinicios
- [ ] Expone los endpoints de REP-1.1 con autenticación ACP-HP-1.0
- [ ] Usa los defaults si la institución no configura valores propios
- [ ] Produce los códigos de error REP-E001 a REP-E007
- [ ] Integra con ACP-REV-1.0 para trigger BANNED

### ExternalReputationScore
- [ ] Implementa el cómputo ERS según §2.3 con los parámetros del §2.2
- [ ] Consume eventos `REPUTATION_UPDATED` del ledger ACP-LEDGER-1.2
- [ ] Distingue `evaluation_context` en el procesamiento de eventos
- [ ] Expone `external_score` en el endpoint `GET /rep/{agent_id}`
- [ ] Expone el campo `last_external_event_at`

### Score API
- [ ] Implementa `GET /acp/v1/rep/{agent_id}/score` con los campos de §6
- [ ] Computa `composite_score` según los pesos configurables
- [ ] Aplica rate limiting diferenciado según §12.3

### Dual Trust Bootstrap
- [ ] Implementa el endpoint `POST /acp/v1/rep/{agent_id}/bootstrap`
- [ ] Valida las condiciones de §3.5 antes de aceptar una attestation
- [ ] Calcula `bootstrap_value` con los discount_factors de §3.4
- [ ] Persiste la attestation y registra el evento en el ledger
- [ ] Invalida automáticamente attestations expiradas o de agentes suspendidos

### Reputation Decay
- [ ] Implementa la función de decay según §4.2
- [ ] Respeta `decay_floor` — ERS nunca cae a cero por decay
- [ ] Incluye `decay_state` en las respuestas de los endpoints de score
- [ ] Registra eventos de decay en el ledger según §12.4

---

## 15. IANA Considerations

No requiere asignaciones IANA.

---

## 16. Referencias normativas

- RFC 2119 — Key words for use in RFCs
- ACP-SIGN-1.0 — Ed25519 + JCS canonicalization
- ACP-CT-1.0 — Capability Token format
- ACP-REV-1.0 — Revocation Protocol
- ACP-HP-1.0 — HTTP Protocol + autenticación
- ACP-LEDGER-1.2 — Audit log + eventos REPUTATION_UPDATED
- ACP-LIA-1.0 — Liability Traceability
- ACP-ITA-1.0 — Institutional Trust Authority
- ACP-REP-1.1 — Especificación base (supersedida por este documento)
- ACP-AGS-1.0 — Agent Governance Stack (L7)
- EigenTrust — Kamvar et al., "The EigenTrust Algorithm for Reputation Management in P2P Networks"
- Reputation decay en sistemas distribuidos — Jøsang et al., "A Survey of Trust and Reputation Systems for Online Service Provision"
