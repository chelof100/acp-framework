# ACP-LEDGER-1.3
## Especificación del Audit Ledger
**Status:** Stable
**Version:** 1.3
**Supersedes:** ACP-LEDGER-1.2
**Depends-on:** ACP-SIGN-1.0, ACP-CT-1.0, ACP-RISK-1.0, ACP-REV-1.0, ACP-EXEC-1.0
**Emitters:** ACP-LIA-1.0 emits `LIABILITY_RECORD` events; ACP-PSN-1.0 emits `POLICY_SNAPSHOT_CREATED` events. These specs write to the ledger but the ledger does not depend on them for its own correctness.
**Required-by:** ACP-CONF-1.2
**Changelog:**
- v1.3 — Hace `sig` normativamente obligatorio en todas las implementaciones de producción. Agrega código de error LEDGER-012 para firma ausente o vacía. Elimina la ambigüedad en §4.4 (era solo descriptivo; ahora usa MUST). Actualiza la verificación de cadena en §7 (paso 1 ahora rechaza sig ausente antes del chequeo criptográfico). Actualiza §8 y §12 con LEDGER-012. Actualiza los requisitos de conformidad en §13. Aclara postura de testing: las implementaciones de test MUST usar una clave real (MAY ser una clave de test determinista per ACP-TS-1.1); las claves nil no son conformes ni en modo desarrollo.
- v1.2 — Correcciones de esquema: agrega campo `resolver_type` en `ESCALATION_RESOLVED` §5.11 (requerido por ACP-LIA-1.0 §6 Regla 1); corrige tipo de score a `float` (escala 0.0–1.0) en `REPUTATION_UPDATED` §5.14 para alinear con ACP-REP-1.2.
- v1.1 — Agrega tipos de evento `LIABILITY_RECORD`, `POLICY_SNAPSHOT_CREATED`, `REPUTATION_UPDATED`; agrega `policy_snapshot_ref` y `policy_version` a los payloads de AUTHORIZATION y RISK_EVALUATION; define compatibilidad retroactiva con v1.0.

---

## 1. Alcance

Este documento define la estructura del ACP Audit Ledger, el formato
unificado de eventos, el mecanismo de encadenamiento por hash, los tipos de
evento y sus esquemas, el proceso de verificación de integridad y el
comportamiento ante corrupción detectada.

---

## 2. Definiciones

**Audit Ledger:** Log append-only de eventos ACP ordenados cronológicamente y
vinculados por encadenamiento de hashes.

**Evento:** Unidad atómica de registro. Representa un hecho ocurrido en el
sistema ACP en un momento específico.

**Chain hash:** Hash SHA-256 del evento anterior. Vincula los eventos en un
orden verificable.

**Evento génesis:** Primer evento del ledger. Su `prev_hash` es el valor
constante de génesis.

**Segmento de ledger:** Subconjunto contiguo de eventos, verificable de forma
independiente si se conoce el hash del evento inicial.

**policy_snapshot_ref:** UUID del Policy Snapshot (ACP-PSN-1.0) activo en el
momento del evento. Permite reconstruir exactamente las reglas que gobernaron
una decisión.

---

## 3. Estructura Base del Evento

```json
{
  "ver": "1.0",
  "event_id": "<uuid_v4>",
  "event_type": "<tipo>",
  "sequence": 1547,
  "timestamp": 1718920000,
  "institution_id": "org.example.banking",
  "prev_hash": "<SHA-256_base64url_del_evento_anterior>",
  "payload": {},
  "hash": "<SHA-256_base64url_de_este_evento>",
  "sig": "<firma_institucional>"
}
```

---

## 4. Especificación de Campos Base

**4.1 `sequence`** — Entero positivo, monotónicamente creciente, sin brechas.
Génesis: sequence 1.

**4.2 `prev_hash`** — `base64url(SHA-256(JCS(evento_anterior sin campos hash
y sig)))`.

Para el evento génesis:
```
prev_hash = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
```
(32 bytes en cero en base64url — fijo y verificable)

**4.3 `hash`** — `base64url(SHA-256(JCS(evento sin campos hash y sig)))`.

Cobertura: `ver`, `event_id`, `event_type`, `sequence`, `timestamp`,
`institution_id`, `prev_hash`, `payload`.

**4.4 `sig`** — Firma Ed25519 institucional ACP sobre todos los campos excepto
`sig`. Cubre `hash` de forma transitiva.

`sig` MUST estar presente y no vacío en todos los eventos de implementaciones
de producción.

Una implementación MUST NOT almacenar eventos sin `sig`.

Una implementación MUST NOT aceptar eventos no firmados durante la ingestión.

Las implementaciones de testing MAY usar una clave de test determinista
definida en ACP-TS-1.1. El uso de claves nil o firmas ausentes NO es
conforme en ningún modo de despliegue, incluyendo el modo desarrollo. Las
suites de test MUST usar una clave real (MAY ser una clave de test
determinista bien conocida).

---

## 5. Tipos de Evento y Esquemas

### 5.1 `LEDGER_GENESIS`
Primer evento. Emitido exactamente una vez. `prev_hash` MUST ser el valor
constante. `sequence` MUST ser 1.

```json
{
  "event_type": "LEDGER_GENESIS",
  "payload": {
    "institution_id": "org.example.banking",
    "acp_version": "1.0",
    "created_at": 1718900000,
    "created_by": "<AgentID>"
  }
}
```

### 5.2 `AUTHORIZATION`
Generado por POST /acp/v1/authorize al completar la evaluación.

```json
{
  "event_type": "AUTHORIZATION",
  "payload": {
    "request_id": "<uuid>",
    "agent_id": "<AgentID>",
    "capability": "acp:cap:financial.payment",
    "resource": "org.example/accounts/ACC-001",
    "decision": "APPROVED | DENIED | ESCALATED",
    "risk_eval_id": "<uuid>",
    "risk_score": 28,
    "token_nonce": "<CT_nonce>",
    "context_fingerprint": "<SHA-256_base64url_of_JCS(context)>",
    "policy_snapshot_ref": "<uuid>",
    "policy_version": "2.1.0"
  }
}
```

Las decisiones DENIED y ESCALATED MUST ser registradas — el ledger no es
solo un registro de éxitos.

`policy_snapshot_ref` y `policy_version` son REQUIRED en v1.1+. Los eventos
sin estos campos se tratan como legacy v1.0.

### 5.3 `RISK_EVALUATION`
Generado por el motor de riesgo ACP-RISK-1.0.

```json
{
  "event_type": "RISK_EVALUATION",
  "payload": {
    "eval_id": "<uuid>",
    "request_id": "<uuid>",
    "agent_id": "<AgentID>",
    "capability": "acp:cap:financial.payment",
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
    "factors_applied": ["f_ctx_ip_non_corporate", "f_res_sensitive"],
    "policy_snapshot_ref": "<uuid>"
  }
}
```

### 5.4 `REVOCATION`
Generado por POST /acp/v1/rev/revoke.

```json
{
  "event_type": "REVOCATION",
  "payload": {
    "revocation_id": "<uuid>",
    "target_type": "token | agent",
    "target_id": "<nonce_or_AgentID>",
    "reason_code": "REV-003",
    "revoked_by": "<AgentID>",
    "descendants_revoked": true,
    "descendant_count": 3
  }
}
```

### 5.5 `TOKEN_ISSUED`
Generado por POST /acp/v1/tokens.

```json
{
  "event_type": "TOKEN_ISSUED",
  "payload": {
    "token_nonce": "<nonce>",
    "issuer": "<AgentID>",
    "subject": "<AgentID>",
    "capabilities": ["acp:cap:financial.payment"],
    "resource": "org.example/accounts/ACC-001",
    "issued_at": 1718920000,
    "expires_at": 1718923600,
    "delegation_depth": 0,
    "parent_token_nonce": null
  }
}
```

### 5.6 `EXECUTION_TOKEN_ISSUED`
Generado al emitir un ET como parte de una AuthorizationDecision APPROVED.

```json
{
  "event_type": "EXECUTION_TOKEN_ISSUED",
  "payload": {
    "et_id": "<uuid>",
    "authorization_id": "<uuid>",
    "agent_id": "<AgentID>",
    "capability": "acp:cap:financial.payment",
    "resource": "org.example/accounts/ACC-001",
    "expires_at": 1718920300
  }
}
```

### 5.7 `EXECUTION_TOKEN_CONSUMED`
Generado por POST /acp/v1/exec-tokens/{et_id}/consume.

```json
{
  "event_type": "EXECUTION_TOKEN_CONSUMED",
  "payload": {
    "et_id": "<uuid>",
    "authorization_id": "<uuid>",
    "agent_id": "<AgentID>",
    "consumed_at": 1718920150,
    "consumed_by_system": "org.example/systems/payment-processor",
    "execution_result": "success | failure | unknown"
  }
}
```

### 5.8 `AGENT_REGISTERED`
Generado por POST /acp/v1/agents.

```json
{
  "event_type": "AGENT_REGISTERED",
  "payload": {
    "agent_id": "<AgentID>",
    "institution_id": "org.example.banking",
    "autonomy_level": 2,
    "authority_domain": "financial",
    "capabilities": ["acp:cap:financial.payment"],
    "registered_by": "<AgentID>"
  }
}
```

### 5.9 `AGENT_STATE_CHANGE`
Generado por POST /acp/v1/agents/{agent_id}/state.

```json
{
  "event_type": "AGENT_STATE_CHANGE",
  "payload": {
    "agent_id": "<AgentID>",
    "previous_state": "active",
    "new_state": "suspended",
    "reason_code": "AGENT-STATE-003",
    "authorized_by": "<AgentID>",
    "authorization_ref": "<uuid>"
  }
}
```

### 5.10 `ESCALATION_CREATED`

```json
{
  "event_type": "ESCALATION_CREATED",
  "payload": {
    "escalation_id": "<uuid>",
    "request_id": "<uuid>",
    "agent_id": "<AgentID>",
    "capability": "acp:cap:financial.payment",
    "risk_score": 55,
    "escalated_to": "<AgentID_or_queue>",
    "expires_at": 1718923600
  }
}
```

### 5.11 `ESCALATION_RESOLVED`

```json
{
  "event_type": "ESCALATION_RESOLVED",
  "payload": {
    "escalation_id": "<uuid>",
    "original_request_id": "<uuid>",
    "resolution": "APPROVED | DENIED",
    "resolver_type": "human | agent | system",
    "resolved_by": "<AgentID>",
    "resolved_at": 1718921000
  }
}
```

### 5.12 `LIABILITY_RECORD`
Generado por ACP-LIA-1.0 inmediatamente tras registrar
`EXECUTION_TOKEN_CONSUMED`. Captura la cadena de delegación completa y la
parte responsable asignada para cada ejecución. Siempre emitido — tanto para
`success` como para `failure` o `unknown`.

```json
{
  "event_type": "LIABILITY_RECORD",
  "payload": {
    "liability_id": "<uuid>",
    "et_id": "<uuid>",
    "authorization_id": "<uuid>",
    "agent_id": "<AgentID>",
    "capability": "acp:cap:financial.payment",
    "resource": "org.example/accounts/ACC-001",
    "delegation_chain": [
      {
        "depth": 0,
        "token_nonce": "<nonce_root>",
        "agent_id": "<AgentID_institution>",
        "issued_at": 1718900000
      },
      {
        "depth": 1,
        "token_nonce": "<nonce_1>",
        "agent_id": "<AgentID_supervisor>",
        "issued_at": 1718910000
      },
      {
        "depth": 2,
        "token_nonce": "<nonce_2>",
        "agent_id": "<AgentID_executor>",
        "issued_at": 1718920000
      }
    ],
    "delegation_depth": 2,
    "liability_assignee": "<AgentID>",
    "policy_snapshot_ref": "<uuid>",
    "execution_result": "success | failure | unknown",
    "executed_at": 1718920150,
    "consumed_by_system": "org.example/systems/payment-processor",
    "chain_incomplete": false
  }
}
```

`chain_incomplete: true` se emite cuando algún token de la cadena no está
disponible para reconstrucción (token histórico expirado o token de una
institución externa). Esto no invalida el registro — lo marca como
parcialmente verificable.

### 5.13 `POLICY_SNAPSHOT_CREATED`
Generado por ACP-PSN-1.0 al crear un nuevo snapshot de política activo.
Registra cada transición de política en el ledger para trazabilidad histórica.

```json
{
  "event_type": "POLICY_SNAPSHOT_CREATED",
  "payload": {
    "snapshot_id": "<uuid>",
    "policy_version": "2.1.0",
    "effective_from": 1718900000,
    "previous_snapshot_id": "<uuid_or_null>",
    "created_by": "<AgentID>",
    "change_summary": "umbral de financial.payment ajustado de 35 a 39"
  }
}
```

`previous_snapshot_id` es `null` para el primer snapshot de la institución.

### 5.14 `REPUTATION_UPDATED`
Generado por ACP-REP-1.2 tras procesar eventos de ejecución. Hace auditable
el scoring de reputación — cada actualización de score se registra en el
ledger con su evento desencadenante.

```json
{
  "event_type": "REPUTATION_UPDATED",
  "payload": {
    "update_id": "<uuid>",
    "agent_id": "<AgentID>",
    "previous_score": 0.780,
    "new_score": 0.820,
    "trigger_event_id": "<uuid_of_LIABILITY_RECORD_or_EXECUTION_TOKEN_CONSUMED>",
    "trigger_event_type": "LIABILITY_RECORD",
    "delta_reason": "successful_execution"
  }
}
```

---

## 6. Cálculo del Hash

```
Object = {ver, event_id, event_type, sequence, timestamp, institution_id, prev_hash, payload}
hash = base64url(SHA-256(JCS(Object)))
```

JCS (RFC 8785) es obligatorio para garantizar determinismo entre
implementaciones.

---

## 7. Verificación de Cadena

**Verificación de segmento** (dado el hash de E_n-1 como punto de inicio):

```
Por cada evento E_i:
  1. Verificar que sig está presente y no vacío. Si ausente o vacío: LEDGER-012.
     Verificar sig con la pk institucional ACP. Si inválida: LEDGER-002.
  2. Calcular computed_hash = base64url(SHA-256(JCS(E_i sin hash y sig)))
  3. Verificar computed_hash == E_i.hash
  4. Verificar E_i.prev_hash == E_i-1.hash
  5. Verificar E_i.sequence == E_i-1.sequence + 1
  6. Verificar E_i.timestamp >= E_i-1.timestamp
```

Fallo en cualquier paso: segmento inválido desde E_i en adelante.

**Verificación completa:**
```
1. Localizar LEDGER_GENESIS con sequence 1
2. Verificar prev_hash == valor constante
3. Verificar segmento desde E_1 hasta E_last
```

---

## 8. Comportamiento ante Corrupción

| Tipo | Código | Comportamiento MUST |
|------|--------|---------------------|
| Operación de modificación | LEDGER-001 | Rechazar, retornar LEDGER-001 |
| Firma inválida | LEDGER-002 | Reportar con event_id y sequence |
| Hash no coincide | LEDGER-003 | Reportar, E_i y eventos posteriores no confiables |
| prev_hash roto | LEDGER-004 | Reportar, indica inserción/eliminación |
| Brecha de sequence | LEDGER-005 | Reportar, indica evento eliminado |
| Timestamp regresivo | LEDGER-006 | Reportar |
| Génesis ausente | LEDGER-007 | Reportar |
| Tipo de evento no reconocido | LEDGER-008 | Reportar, continuar verificación de cadena |
| Payload incompleto | LEDGER-009 | Reportar con event_id |
| policy_snapshot_ref ausente en AUTHORIZATION | LEDGER-010 | Reportar como legacy v1.0 |
| policy_snapshot_ref ausente en RISK_EVALUATION | LEDGER-011 | Reportar como legacy v1.0 |
| sig ausente o vacío | LEDGER-012 | Reportar con event_id y sequence; segmento inválido |

Ante corrupción:
- MUST NOT suprimir el error
- MUST continuar verificación para identificar el alcance
- MUST NOT eliminar ni modificar eventos corruptos — son evidencia
- MUST NOT auto-reparar — requiere intervención humana autorizada

---

## 9. Inmutabilidad

Las siguientes operaciones MUST NOT estar disponibles en ninguna interfaz:

```
- Eliminar eventos
- Modificar payload de eventos existentes
- Reordenar eventos
- Insertar en posiciones que no sean la cola
- Modificar el sequence de eventos existentes
```

Cualquier solicitud que implique estas operaciones MUST ser rechazada con
LEDGER-001.

---

## 10. Retención

Mínimo 7 años. El archivado a almacenamiento frío tras 90 días está
permitido si:
- La integridad de la cadena es verificable sobre el archivo
- El tiempo de recuperación < 24 horas
- La firma institucional es verificable sin degradación

---

## 11. Interoperabilidad Cross-Institution

Institución B verificando eventos de institución A:
```
1. Obtener pk de A via ACP-ITA-1.0
2. Solicitar segmento via GET /acp/v1/audit/query
3. Verificar firmas con pk de A (incluye chequeo LEDGER-012 para sig ausente)
4. Verificar integridad de cadena
```

El resultado es verificable sin confiar en la institución A.

---

## 12. Errores

| Código | Condición |
|--------|-----------|
| LEDGER-001 | Operación de modificación rechazada |
| LEDGER-002 | Firma inválida en evento |
| LEDGER-003 | Hash del evento no coincide |
| LEDGER-004 | prev_hash roto |
| LEDGER-005 | Brecha de sequence |
| LEDGER-006 | Timestamp regresivo |
| LEDGER-007 | Evento génesis ausente o inválido |
| LEDGER-008 | Tipo de evento no reconocido |
| LEDGER-009 | Payload incompleto para el tipo declarado |
| LEDGER-010 | `policy_snapshot_ref` ausente en AUTHORIZATION (requerido en v1.1+) |
| LEDGER-011 | `policy_snapshot_ref` ausente en RISK_EVALUATION (requerido en v1.1+) |
| LEDGER-012 | Campo `sig` ausente o vacío — el evento no tiene firma institucional |

---

## 13. Conformidad

Una implementación es conforme a ACP-LEDGER-1.3 si:

- Genera eventos con la estructura base completa de §3
- Implementa todos los tipos de evento de §5 (incluyendo §5.12–5.14)
- Calcula hash con JCS obligatorio conforme a §6
- Implementa verificación de cadena conforme a §7
- Reporta corrupción conforme a §8 sin supresión
- No expone operaciones de modificación
- Retiene eventos por un mínimo de 7 años
- Incluye `chain_valid` en respuestas de consulta
- Incluye `policy_snapshot_ref` en eventos AUTHORIZATION y RISK_EVALUATION
- Implementa tipos de evento LIABILITY_RECORD, POLICY_SNAPSHOT_CREATED,
  REPUTATION_UPDATED
- Incluye `resolver_type` en eventos ESCALATION_RESOLVED
- Usa tipo `float` (0.0–1.0) para los campos `previous_score` y `new_score`
  en REPUTATION_UPDATED
- Produce un `sig` válido en cada evento antes de almacenarlo
- Rechaza eventos no firmados en la ingestión con LEDGER-012
- No provee ningún modo (desarrollo, test u otro) que omita la firma
  institucional para eventos almacenados

---

## 14. Compatibilidad Retroactiva

ACP-LEDGER-1.3 es retroactivamente compatible con v1.0, v1.1 y v1.2 con las
siguientes notas:

- Los eventos existentes sin `policy_snapshot_ref` son válidos y se procesan
  como **legacy v1.0**. No se rechazan — se marcan como
  `policy_context: "legacy"` en las respuestas de consulta.
- Los tipos de evento introducidos en v1.1 (§5.12, §5.13, §5.14) son
  ignorados de forma segura por verificadores v1.0 sin romper la integridad
  de la cadena.
- Una implementación v1.3 leyendo un ledger creado bajo v1.2 MUST aceptar
  eventos que lleven un `sig` válido. Los eventos sin `sig` en un ledger
  v1.2 preexistente MAY tratarse como eventos legacy no firmados para lectura,
  pero MUST NOT ser re-emitidos o almacenados sin `sig` a partir de ahora.
- Las nuevas implementaciones MUST desplegarse con una clave institucional
  real desde el primer evento (génesis). No existe ninguna ruta conforme para
  un ledger de producción que comience con eventos no firmados.
