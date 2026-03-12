# ACP-REP-1.1
## Reputation Extension — Especificación Completa

**Status:** Superseded
**Superseded-by:** ACP-REP-1.2
**Version:** 1.1
**Depends-on:** ACP-SIGN-1.0, ACP-CT-1.0, ACP-REV-1.0, ACP-HP-1.0
**Required-by:** ACP-CONF-1.1 (Nivel 2 — Security Conformance)

> ⚠️ **DEPRECATED** — Este documento ha sido supersedido por **ACP-REP-1.2**.
> Nuevas implementaciones MUST usar ACP-REP-1.2.
> Este documento se mantiene por referencia histórica.

---

## Abstract

ACP-REP-1.1 introduce un modelo reputacional cuantificable para agentes dentro del ecosistema ACP. Define el modelo matemático de scoring, la máquina de estados del agente, la taxonomía de eventos, la API de consulta, el modelo de almacenamiento, y los límites explícitos entre el scope v1 (esta especificación) y v2 (trabajo futuro).

La reputación en ACP no es un adorno — es el mecanismo que convierte el protocolo de un sistema de verificación estático en un sistema de confianza adaptativo. Un token criptográficamente válido emitido por un agente con reputación `BANNED` debe ser rechazado. Un agente con historial consistente de comportamiento correcto debe recibir políticas más permisivas.

---

## 1. Decisiones de Diseño — Rationale

Esta sección documenta las decisiones arquitectónicas tomadas y el razonamiento detrás de cada una. Leer antes de implementar.

### 1.1 Reputación por institución, no global

Cada institución mantiene su propio registro de reputación para los agentes que opera. Un agente puede tener reputación alta en la Institución A y reputación nula en la Institución B.

**Por qué:** El protocolo ACP está fundamentado en soberanía institucional. Una reputación global requeriría una autoridad central que la mantenga — lo que contradice ACP-ITA y el modelo GAT. El mismo token de capacidad está firmado por la institución, no por un órgano global. La reputación debe seguir el mismo principio de soberanía.

**Qué queda para v2:** La federación de reputación entre instituciones (una institución puede consultar el historial de un agente en otra institución, sujeto a acuerdos bilaterales). Ver §12.1.

### 1.2 Emisor de eventos: solo el servidor (v1)

En v1, únicamente el servidor ACP puede registrar eventos de reputación. Los eventos son producidos automáticamente como efecto secundario de las operaciones de verificación.

**Por qué:** Si cualquier verificador puede reportar eventos sobre un agente, se abre el problema de Sybil: un actor malicioso puede crear múltiples verificadores falsos para degradar la reputación de un agente competidor. Resolver este problema requiere staking criptográfico o pruebas de evidencia verificables — mecanismos que exceden el scope de v1.

**Qué queda para v2:** Verificadores externos que pueden emitir eventos firmados con prueba criptográfica de evidencia + mecanismo de staking con penalización por denuncias falsas. Ver §12.2.

### 1.3 Cold start: score `null`

Un agente recién registrado no tiene score `0.0` — tiene score `null`. Estas son semánticamente diferentes:

- `null` = sin historial
- `0.0` = historial con reputación mínima

**Por qué:** Un score `0.0` para agentes nuevos bloquea la adopción — ningún agente legítimo podría operar hasta acumular suficiente historial positivo. Un score `1.0` es inseguro — permite que agentes maliciosos operen con máxima confianza solo por registrarse. `null` traslada la decisión a la política de la institución, donde corresponde.

**Política de cold start por institución:** Cada institución define qué hacer con un agente sin historial:
- Una institución financiera puede requerir un proceso de onboarding antes de permitir operación
- Una institución de bajo riesgo puede tratar `null` como `0.5` (confianza inicial moderada)
- Una institución de desarrollo puede tratar `null` como `ACTIVE` sin restricciones

La política de cold start MUST ser explícita y documentada por la institución. No hay default global.

### 1.4 Score privado — acceso autenticado vía ACP-HP-1.0

El score de reputación de un agente es privado. No es un dato público. El acceso a la API de reputación requiere autenticación ACP-HP-1.0.

**Modelo de acceso:**

| Actor | Puede consultar el score | Condición |
|---|---|---|
| El agente mismo | ✅ | Siempre, con auth ACP-HP-1.0 |
| La institución que lo gestiona | ✅ | Siempre, con credenciales institucionales |
| Otra institución | ⚠️ | Solo con federación habilitada (v2) |
| El público en general | ❌ | Nunca |

**Los eventos sí son auditables:** El registro de eventos (con firma criptográfica de cada evento) puede ser auditado por el agente y la institución. El score calculado es interno a la institución.

**Qué queda para v2:** Exploración de un score externo portable (separado del score interno institucional) gestionado por un oracle descentralizado. Ver §12.3.

### 1.5 Modelo dual: score continuo + máquina de estados

El sistema de reputación tiene dos capas ortogonales:

1. **Score continuo** `[0.0, 1.0]`: mide el historial de comportamiento del agente a lo largo del tiempo. Se actualiza con cada evento verificable.
2. **Máquina de estados**: captura eventos categóricos que no son representables en un continuo (ej: una clave comprometida no es "un poco comprometida").

Ambas capas afectan las decisiones de acceso. Un agente con score `0.9` pero en estado `BANNED` es rechazado.

---

## 2. Modelo Matemático

### 2.1 ReputationScore

```
ReputationScore ∈ [0.0, 1.0]  ∪  {null}

null  = sin historial (cold start)
0.0   = mínima reputación observable
1.0   = máxima reputación observable
```

### 2.2 Función de actualización

Después de cada evento verificable:

```
score' = α · score + β · event_metric
```

**Parámetros:**

| Parámetro | Default | Rango permitido | Descripción |
|---|---|---|---|
| α | 0.90 | [0.70, 0.99] | Factor de memoria / decaimiento |
| β | 0.10 | [0.01, 0.30] | Tasa de aprendizaje de nuevos eventos |
| Restricción | — | α + β ≤ 1 | Siempre |

Los valores de α y β son configurables por institución dentro del rango permitido. Los defaults DEBEN ser usados si la institución no configura valores propios.

**Interpretación de α:** Controla qué tan rápido el sistema "olvida" el historial anterior. Un α alto (0.99) da mucho peso al pasado — útil en contextos financieros donde el historial importa. Un α bajo (0.70) da más peso a comportamiento reciente — útil en contextos donde se quiere permitir recuperación más rápida.

### 2.3 Taxonomía de eventos y event_metric

Los valores de `event_metric` son **fijos en esta especificación** y no son configurables por institución. La uniformidad garantiza conformidad cross-implementación.

**Eventos positivos:**

| Evento | event_metric | Descripción |
|---|---|---|
| `REP_EVT_VERIFY_OK` | +0.05 | Verificación ACP-HP-1.0 exitosa |
| `REP_EVT_AUDIT_PASS` | +0.10 | Auditoría formal superada |

**Eventos negativos:**

| Evento | event_metric | Descripción |
|---|---|---|
| `REP_EVT_SIG_LATE` | −0.05 | Firma producida fuera del window temporal |
| `REP_EVT_TOKEN_MALFORMED` | −0.10 | Token con formato inválido (campos faltantes, tipos incorrectos) |
| `REP_EVT_REV_INVALID` | −0.20 | Intento de revocación sin autorización o mal formado |
| `REP_EVT_SIG_INVALID` | −0.30 | Firma Ed25519 inválida detectada |
| `REP_EVT_POLICY_VIOLATION` | −0.40 | Violación de política institucional detectada |

### 2.4 La asimetría es una propiedad de seguridad intencional

> **Nota para implementadores y lectores del protocolo:**
>
> La diferencia entre los valores positivos (+0.05, +0.10) y negativos (−0.30, −0.40) **no es un error de calibración** — es una decisión de diseño deliberada con consecuencias de seguridad directas.
>
> **Ejemplo con defaults (α=0.90, β=0.10), score inicial 0.80:**
>
> Después de una firma inválida (`REP_EVT_SIG_INVALID`, −0.30):
> ```
> score' = 0.90 × 0.80 + 0.10 × (−0.30) = 0.720 − 0.030 = 0.690
> ```
>
> Para recuperar esos ~0.030 puntos vía verificaciones exitosas (+0.05 cada una):
> ```
> score' = 0.90 × score + 0.10 × 0.05 = 0.90 × score + 0.005
> ```
> Un agente necesita aproximadamente **6 verificaciones exitosas** para recuperar el impacto de una sola firma inválida.
>
> **Por qué esto es correcto:** Un agente que produce firmas inválidas es una señal de alarma, sea por compromiso de clave o por comportamiento malicioso. El protocolo debe hacer que recuperar reputación después de este evento requiera demostración sostenida de comportamiento correcto. Si los eventos positivos y negativos fueran simétricos, un agente podría alternar comportamiento malicioso y correcto sin consecuencias netas — lo que eliminaría el valor del sistema.
>
> La asimetría también desincentiva ataques de prueba: intentar una firma inválida para testear los límites del sistema tiene un costo reputacional significativo que no se recupera fácilmente.

---

## 3. Máquina de Estados del Agente

### 3.1 Estados

| Estado | Semántica | ¿Puede operar? |
|---|---|---|
| `ACTIVE` | Operación normal | ✅ Si score ≥ umbral institucional |
| `PROBATION` | Score bajo, bajo vigilancia | ⚠️ Con restricciones (tokens de menor duración, capacidades limitadas) |
| `SUSPENDED` | Barrado temporalmente | ❌ No |
| `BANNED` | Barrado permanentemente | ❌ No, nunca |

### 3.2 Transiciones

```
ACTIVE ──────────────────► PROBATION   [automático: score < probation_threshold]
PROBATION ───────────────► ACTIVE      [automático: score ≥ active_threshold]
PROBATION ───────────────► SUSPENDED   [automático: score < suspend_threshold]
                                        [manual: decisión institucional]
SUSPENDED ───────────────► ACTIVE      [manual: revisión institucional ÚNICAMENTE]
ANY ─────────────────────► BANNED      [manual: orden institucional]
                                        [automático: trigger REV-002 (clave comprometida)]
BANNED ──────────────────► (ninguno)   [PERMANENTE — no hay transición de salida]
```

**Regla crítica:** La transición `SUSPENDED → ACTIVE` NUNCA es automática. Requiere revisión y decisión explícita de la institución. Esto previene que un agente suspendido acumule eventos positivos en background para auto-rehabilitarse.

**Regla crítica:** El estado `BANNED` es terminal e irreversible. Un agente baneado no puede recuperar operación bajo ninguna condición algorítmica. Si la institución determina que fue un error, debe crear una nueva identidad de agente.

### 3.3 Umbrales por defecto

| Umbral | Default | Configurable por institución |
|---|---|---|
| `probation_threshold` | 0.40 | ✅ Sí |
| `active_threshold` | 0.50 | ✅ Sí (MUST ser > probation_threshold) |
| `suspend_threshold` | 0.20 | ✅ Sí |

La histéresis entre `probation_threshold` (0.40) y `active_threshold` (0.50) es intencional — previene oscillación rápida entre `ACTIVE` y `PROBATION` cuando el score está en el límite.

### 3.4 Score durante estados no-ACTIVE

El score **sigue calculándose** aunque el agente esté en `PROBATION`, `SUSPENDED` o `BANNED`. El registro histórico es valioso para auditoría. Sin embargo:

- En `SUSPENDED` y `BANNED`: el score no afecta decisiones de acceso — el estado tiene precedencia.
- En `PROBATION`: el score sí afecta decisiones — determina si sube a `ACTIVE` o baja a `SUSPENDED`.

---

## 4. API

Todos los endpoints requieren autenticación ACP-HP-1.0. Las respuestas son firmadas según ACP-SIGN-1.0.

### 4.1 Consulta de reputación

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
  "state": "ACTIVE",
  "event_count": 142,
  "last_event_at": 1718920000,
  "checked_at": 1718921000,
  "sig": "<firma_institucional>"
}
```

`score` es `null` si el agente no tiene historial (cold start).

**Códigos HTTP:**

| HTTP | Condición |
|---|---|
| 200 | Éxito |
| 401 | No autenticado |
| 403 | Sin permiso (solo el agente y la institución pueden consultar) |
| 404 | AgentID no encontrado |
| 429 | Rate limit excedido |

### 4.2 Historial de eventos

```http
GET /acp/v1/rep/{agent_id}/events?limit=50&offset=0
Authorization: ACP-Agent <token>
X-ACP-Agent-ID: <AgentID>
```

**Response 200:**
```json
{
  "agent_id": "<AgentID>",
  "events": [
    {
      "event_id": "<uuid>",
      "event_type": "REP_EVT_VERIFY_OK",
      "event_metric": 0.05,
      "score_before": 0.842,
      "score_after": 0.847,
      "recorded_at": 1718920000,
      "sig": "<firma_del_evento>"
    }
  ],
  "total": 142,
  "sig": "<firma_institucional>"
}
```

Cada evento tiene firma individual. Un auditor puede verificar la cadena de eventos independientemente del score calculado.

### 4.3 Actualización de estado (solo institucional)

```http
POST /acp/v1/rep/{agent_id}/state
Authorization: ACP-Institution <token>
```

```json
{
  "new_state": "SUSPENDED",
  "reason": "Investigación por violación de política REV-003",
  "authorized_by": "<AgentID_institucional>",
  "sig": "<firma_del_autorizador>"
}
```

Este endpoint NO está disponible para agentes — solo para credenciales institucionales con scope `acp:rep:admin`.

---

## 5. Modelo de Almacenamiento

### 5.1 Requisito de durabilidad (normativo)

Una implementación ACP-REP-1.1 conforme MUST garantizar que los registros de reputación (scores, eventos, estados) sobrevivan reinicios del servidor. La implementación de referencia DEBE incluir al menos una implementación conforme de almacenamiento persistente.

### 5.2 Interface ReputationStore

```go
type ReputationStore interface {
    // GetRecord retorna el registro completo del agente, o nil si no existe (cold start).
    GetRecord(agentID string) (*ReputationRecord, error)

    // RecordEvent registra un evento y actualiza el score.
    RecordEvent(agentID string, event ReputationEvent) error

    // GetState retorna el estado actual del agente.
    GetState(agentID string) (AgentState, error)

    // SetState actualiza el estado del agente con razón y firma del autorizador.
    SetState(agentID string, state AgentState, reason, authorizedBy string) error

    // GetEvents retorna el historial paginado de eventos.
    GetEvents(agentID string, limit, offset int) ([]ReputationEvent, int, error)
}
```

### 5.3 Implementaciones de referencia

| Implementación | Persistente | ¿Conforme para producción? | Uso |
|---|---|---|---|
| `InMemoryReputationStore` | ❌ No | ❌ No | Testing / desarrollo local |
| `FileReputationStore` (SQLite o JSON) | ✅ Sí | ✅ Sí | Demo, referencia, instancias pequeñas |

`InMemoryReputationStore` DEBE incluir un warning visible al iniciar el servidor:

```
[WARN] ACP-REP: using InMemoryReputationStore — reputation data will NOT survive restarts.
[WARN] This implementation is NOT conformant for production use.
[WARN] Configure a persistent store (FileReputationStore or external DB) for production.
```

El mismo patrón de diseño ya existe en el codebase con `RevocationChecker` (`NoOpRevocationChecker` / `HTTPRevocationChecker` / `InMemoryRevocationChecker`).

---

## 6. Configuración

```go
type ReputationConfig struct {
    // Alpha: factor de memoria / decaimiento. Default: 0.90
    Alpha float64 // range [0.70, 0.99]

    // Beta: tasa de aprendizaje. Default: 0.10
    Beta float64 // range [0.01, 0.30]

    // ProbationThreshold: score por debajo del cual el agente entra en PROBATION.
    // Default: 0.40
    ProbationThreshold float64

    // ActiveThreshold: score por encima del cual un agente en PROBATION vuelve a ACTIVE.
    // MUST ser > ProbationThreshold para evitar oscillación. Default: 0.50
    ActiveThreshold float64

    // SuspendThreshold: score por debajo del cual un agente en PROBATION es SUSPENDED.
    // Default: 0.20
    SuspendThreshold float64

    // ColdStartPolicy: política cuando score es null.
    // "deny" | "allow_with_restrictions" | "allow"
    ColdStartPolicy string

    // ColdStartInitialScore: score inicial para ColdStartPolicy "allow_with_restrictions".
    // Si es nil, el score permanece null hasta el primer evento.
    ColdStartInitialScore *float64
}
```

---

## 7. Integración con ACP-REV-1.0

ACP-REP-1.1 depende de ACP-REV-1.0. El evento `REP_EVT_REV_INVALID` solo puede ser registrado si el sistema de revocación está operativo.

La revocación de un agente (`REV-002`, `REV-004`) DEBE triggear automáticamente la transición a estado `BANNED`.

---

## 8. Seguridad

### 8.1 La asimetría como mecanismo anti-abuso

Ver §2.4. La asimetría entre eventos positivos y negativos es la primera línea de defensa contra el uso del sistema de reputación como vector de ataque.

### 8.2 Anti-gaming

- Los eventos solo son registrables por el servidor (v1) — previene inserción de eventos falsos
- Cada evento tiene firma individual — previene modificación retroactiva del historial
- La transición `SUSPENDED → ACTIVE` es manual — previene auto-rehabilitación algorítmica
- `BANNED` es terminal — previene que actores maliciosos se rehabiliten acumulando eventos positivos

### 8.3 Rate limiting

El endpoint `GET /acp/v1/rep/{agent_id}` MUST tener rate limiting para prevenir enumeración de scores de agentes ajenos.

---

## 9. Errores

| Código | Condición |
|---|---|
| `REP-E001` | AgentID no registrado |
| `REP-E002` | Score null — agente sin historial (cold start) |
| `REP-E003` | Estado BANNED — operación denegada permanentemente |
| `REP-E004` | Estado SUSPENDED — operación denegada temporalmente |
| `REP-E005` | Parámetros α/β fuera del rango permitido |
| `REP-E006` | Sin permiso para consultar reputación de este agente |
| `REP-E007` | Sin permiso para modificar estado (requiere credencial institucional) |

---

## 10. Conformidad

Una implementación es ACP-REP-1.1 conforme si:

- [ ] Implementa el modelo matemático con los `event_metric` fijos de §2.3
- [ ] Implementa la máquina de estados de §3 con todas las transiciones definidas
- [ ] Garantiza que registros de reputación sobreviven reinicios (§5.1)
- [ ] Expone los endpoints de §4 con autenticación ACP-HP-1.0
- [ ] Usa los defaults de §6 si la institución no configura valores propios
- [ ] Produce los códigos de error de §9
- [ ] Integra con ACP-REV-1.0 para el trigger `BANNED` por revocación (§7)

---

## 11. IANA Considerations

No requiere asignaciones IANA.

---

## 12. Roadmap v2 — Trabajo Futuro

Esta sección documenta features deliberadamente excluidos del scope de v1 con el rationale de por qué son v2 y no v1.

### 12.1 Federación inter-institucional de reputación

**Descripción:** Una institución B puede consultar el historial reputacional de un agente en la institución A, sujeto a acuerdos bilaterales firmados.

**Por qué es v2:** Requiere un protocolo de intercambio de datos de reputación entre instituciones, acuerdos de confianza inter-institucionales, y posiblemente un formato de "attestation de reputación" firmado por la institución origen. Excede el scope del servidor de referencia v1.

**Impacto de diseño futuro:** Las estructuras de datos de v1 deben ser diseñadas para que sea posible agregar este campo sin breaking changes.

### 12.2 Verificadores externos con staking

**Descripción:** Cualquier verificador participante puede emitir eventos de reputación firmados con prueba criptográfica de evidencia. Un mecanismo de staking penaliza denuncias falsas.

**Por qué es v2:** El problema de Sybil en sistemas de reputación abiertos es un problema no trivial. La solución con staking requiere un mecanismo de consenso, un token de valor, y un proceso de disputa — todo fuera del scope de v1. Si se implementara sin estas salvaguardas, el sistema sería trivialmente atacable.

### 12.3 Score interno vs score externo — Oracle descentralizado

**Descripción:** Cuando un agente cruza las fronteras de su institución de origen para interactuar con el ecosistema externo, su score interno no es necesariamente portátil ni conocido. Se propone distinguir:

- **Score interno:** reputación del agente dentro de su institución de origen. Rico, detallado, contextual.
- **Score externo:** reputación del agente en el ecosistema global ACP. Sparse, privacy-preserving, portable.

Un oracle descentralizado (análogo a los price oracles en DeFi, pero para reputación) podría agregar attestations de múltiples instituciones para producir un score externo sin revelar el historial detallado interno.

**Por qué es v2:** Requiere diseño de un sub-protocolo propio (`ACP-REP-ORACLE`), mecanismos de privacidad (zk-proofs de reputación mínima sin revelar el score exacto), y gobernanza del oracle. Es un problema abierto en la literatura de sistemas distribuidos de reputación.

**Nota de diseño:** Un agente con score interno alto que entra por primera vez al ecosistema externo tendrá score externo `null`. Esto es correcto — el score externo comienza a construirse desde las interacciones externas, no desde el historial interno. La distinción interna/externa es fundamental para respetar la soberanía institucional.

---

## 13. Referencias normativas

- RFC 2119 — Key words for use in RFCs
- ACP-SIGN-1.0 — Ed25519 + JCS canonicalization
- ACP-CT-1.0 — Capability Token format
- ACP-REV-1.0 — Revocation Protocol
- ACP-HP-1.0 — HTTP Protocol + ACP-HP-1.0 authentication
- Byzantine systems research — EigenTrust, HistoryNet
- Reputation systems literature — Mui et al., Jøsang et al.
