# ACP-LEDGER-1.0
## Audit Ledger Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** ACP-SIGN-1.0, ACP-CT-1.0, ACP-RISK-1.0, ACP-REV-1.0, ACP-EXEC-1.0
**Required-by:** ACP-CONF-1.0

---

## 1. Alcance

Este documento define la estructura del Audit Ledger ACP, el formato unificado de eventos, el mecanismo de hash encadenado, los tipos de eventos y sus schemas, el proceso de verificación de integridad, y el comportamiento ante corrupción detectada.

---

## 2. Definiciones

**Audit Ledger:** Registro append-only de eventos ACP ordenados cronológicamente y vinculados por hash encadenado.

**Evento:** Unidad atómica de registro. Representa un hecho ocurrido en el sistema ACP en un momento específico.

**Chain hash:** Hash SHA-256 del evento anterior. Vincula eventos en orden verificable.

**Genesis event:** Primer evento del ledger. Su `prev_hash` es el valor constante de genesis.

**Ledger segment:** Subconjunto contiguo de eventos, verificable independientemente si se conoce el hash del evento inicial.

---

## 3. Estructura Base de Evento

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

**4.1 `sequence`** — Entero positivo, monotónicamente creciente, sin huecos. Genesis: sequence 1.

**4.2 `prev_hash`** — `base64url(SHA-256(JCS(evento_anterior sin campos hash y sig)))`.

Para el genesis event:
```
prev_hash = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
```
(32 bytes cero en base64url — fijo y verificable)

**4.3 `hash`** — `base64url(SHA-256(JCS(evento sin campos hash y sig)))`.

Cobertura: `ver`, `event_id`, `event_type`, `sequence`, `timestamp`, `institution_id`, `prev_hash`, `payload`.

**4.4 `sig`** — Firma institucional ACP sobre todos los campos excepto `sig`. Cubre `hash` transitivamente.

---

## 5. Tipos de Eventos y Schemas

### 5.1 `LEDGER_GENESIS`
Primer evento. Emitido una sola vez. `prev_hash` MUST ser valor constante. `sequence` MUST ser 1.

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
Generado por POST /acp/v1/authorize al completar evaluación.

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
    "token_nonce": "<nonce_del_CT>",
    "context_fingerprint": "<SHA-256_base64url_de_JCS(context)>"
  }
}
```

Decisiones DENIED y ESCALATED MUST ser registradas — el ledger no es solo registro de éxitos.

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
    "factors_applied": ["f_ctx_ip_non_corporate", "f_res_sensitive"]
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
    "target_id": "<nonce_o_AgentID>",
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
Generado al emitir ET como parte de AuthorizationDecision APPROVED.

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
    "escalated_to": "<AgentID_o_queue>",
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
    "resolved_by": "<AgentID>",
    "resolved_at": 1718921000
  }
}
```

---

## 6. Cálculo de Hash

```
Objeto = {ver, event_id, event_type, sequence, timestamp, institution_id, prev_hash, payload}
hash = base64url(SHA-256(JCS(Objeto)))
```

JCS (RFC 8785) es obligatorio para garantizar determinismo entre implementaciones.

---

## 7. Verificación de Cadena

**Verificación de segmento** (dado hash de E_n-1 como punto de inicio):

```
Para cada evento E_i:
  1. Verificar sig con pk institucional ACP
  2. Calcular hash_computado = base64url(SHA-256(JCS(E_i sin hash y sig)))
  3. Verificar hash_computado == E_i.hash
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
|------|--------|-------------------|
| Firma inválida | LEDGER-002 | Reportar con event_id y sequence |
| Hash no coincide | LEDGER-003 | Reportar, E_i y posteriores no confiables |
| prev_hash roto | LEDGER-004 | Reportar, indica inserción/eliminación |
| Hueco en sequence | LEDGER-005 | Reportar, indica evento eliminado |
| Timestamp regresivo | LEDGER-006 | Reportar |
| Genesis faltante | LEDGER-007 | Reportar |

Ante corrupción:
- MUST NOT silenciar el error
- MUST continuar verificación para identificar alcance
- MUST NOT eliminar ni modificar eventos corruptos — son evidencia
- MUST NOT reparar automáticamente — requiere intervención humana autorizada

---

## 9. Inmutabilidad

Operaciones MUST NOT disponibles en ninguna interfaz:

```
- Eliminar eventos
- Modificar payload de eventos existentes
- Reordenar eventos
- Insertar en posiciones no-tail
- Modificar sequence de eventos existentes
```

Cualquier request que implique estas operaciones MUST ser rechazado con LEDGER-001.

---

## 10. Retención

Mínimo 7 años. Archivado a almacenamiento frío después de 90 días permitido si:
- Integridad de cadena verificable sobre el archivo
- Tiempo de recuperación < 24 horas
- Firma institucional verificable sin degradación

---

## 11. Interoperabilidad entre Instituciones

Institución B verifica eventos de institución A:
```
1. Obtener pk de A via ACP-ITA-1.0
2. Solicitar segmento via GET /acp/v1/audit/query
3. Verificar firmas con pk de A
4. Verificar integridad de cadena
```

El resultado es verificable sin confiar en institución A.

---

## 12. Errores

| Código | Condición |
|--------|-----------|
| LEDGER-001 | Operación de modificación rechazada |
| LEDGER-002 | Firma inválida en evento |
| LEDGER-003 | Hash de evento no coincide |
| LEDGER-004 | prev_hash roto |
| LEDGER-005 | Hueco en sequence |
| LEDGER-006 | Timestamp regresivo |
| LEDGER-007 | Genesis event faltante o inválido |
| LEDGER-008 | Tipo de evento no reconocido |
| LEDGER-009 | Payload incompleto para tipo declarado |

---

## 13. Conformidad

Una implementación es ACP-LEDGER-1.0 conforme si:

- Genera eventos con estructura base completa de §3
- Implementa todos los tipos de eventos de §5
- Calcula hash con JCS obligatorio según §6
- Implementa verificación de cadena de §7
- Reporta corrupción según §8 sin silenciar
- No expone operaciones de modificación
- Retiene eventos mínimo 7 años
- Incluye `chain_valid` en responses de consulta
