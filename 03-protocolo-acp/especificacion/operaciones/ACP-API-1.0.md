# ACP-API-1.0
## HTTP API Formal Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** ACP-SIGN-1.0, ACP-CT-1.0, ACP-HP-1.0, ACP-RISK-1.0, ACP-REV-1.0, ACP-CAP-REG-1.0
**Required-by:** ACP-EXEC-1.0, ACP-LEDGER-1.0

---

## 1. Alcance

Este documento especifica la API HTTP completa del sistema ACP: endpoints, schemas de request/response, códigos de estado, contratos de error, autenticación, y comportamiento ante condiciones anómalas.

---

## 2. Principios Generales

**2.1 Protocolo base**
HTTPS obligatorio. HTTP sin TLS MUST NOT ser aceptado fuera de desarrollo local explícito. TLS mínimo: 1.2. TLS 1.3 SHOULD en entornos B2B.

**2.2 Formato**
Todos los bodies MUST ser JSON. Header `Content-Type: application/json` MUST estar presente en requests con body.

**2.3 Autenticación**
Todo endpoint excepto `/acp/v1/health` y `POST /acp/v1/handshake/challenge` MUST requerir dos headers:
```http
Authorization: ACP-Agent <base64url_encoded_capability_token>
X-ACP-PoP: <base64url_encoded_pop_token>
```
El servidor MUST verificar la Proof-of-Possession según ACP-HP-1.0 §10 antes de validar el CT. Si la PoP falla, el CT no se procesa. Solo después de que la PoP es válida se ejecuta la validación del CT según ACP-CT-1.0 §6.

**2.4 Request ID**
Todo request MUST incluir:
```http
X-ACP-Request-ID: <uuid>
```
El servidor MUST incluir este valor en el response.

**2.5 Versionado**
El servidor MUST incluir en todo response:
```http
X-ACP-Version: 1.0
```

**2.6 Timestamps**
Bodies JSON: Unix timestamp en segundos. Headers: RFC 7231.

---

## 3. Estructura Base de Response

**Response exitoso:**
```json
{
  "acp_version": "1.0",
  "request_id": "<uuid>",
  "timestamp": 1718920000,
  "data": {},
  "sig": "<base64url_firma_institucional>"
}
```

El campo `sig` MUST cubrir: `acp_version`, `request_id`, `timestamp`, `data`. Según ACP-SIGN-1.0.

**Response de error:**
```json
{
  "acp_version": "1.0",
  "request_id": "<uuid>",
  "timestamp": 1718920000,
  "error": {
    "code": "<código_ACP>",
    "message": "<descripción>",
    "detail": {}
  }
}
```

Los responses de error MUST NOT incluir campo `sig`.

---

## 4. Endpoints — Agent Registry

### `POST /acp/v1/agents`
Registra nuevo agente. **Capability requerida:** `acp:cap:agent.register`

**Request body:**
```json
{
  "agent_id": "<AgentID>",
  "public_key": "<base64url_pk>",
  "institution_id": "org.example.banking",
  "autonomy_level": 2,
  "authority_domain": "financial",
  "metadata": {
    "name": "payment-agent-01",
    "version": "1.0.0"
  },
  "sig": "<firma_del_solicitante>"
}
```

**Validaciones MUST:**
```
agent_id == base58(SHA-256(decode_base64url(public_key)))
autonomy_level ∈ {0,1,2,3,4}
authority_domain ∈ dominios registrados en ACP-CAP-REG-1.0
sig válida según ACP-SIGN-1.0
agent_id no existente previamente
```

**Response 201:** `data.agent_id`, `data.status: "active"`, `data.registered_at`

**Errores:** AGENT-001 a AGENT-004, SIGN-003, AUTH-001, AUTH-002

---

### `GET /acp/v1/agents/{agent_id}`
Estado del agente. **Capability requerida:** `acp:cap:agent.read`

**Response 200 data:**
```json
{
  "agent_id": "<AgentID>",
  "status": "active",
  "autonomy_level": 2,
  "authority_domain": "financial",
  "registered_at": 1718900000,
  "last_active_at": 1718919000,
  "trust_score": null
}
```

`trust_score` es campo reservado para ACP-REP-1.1. En v1.0 el servidor MAY retornar null.

---

### `POST /acp/v1/agents/{agent_id}/state`
Modifica estado del agente.

**Estados válidos en v1.0:** `active`, `restricted`, `suspended`, `revoked`.
El estado `under_review` no existe en v1.0. Una escalación es un evento de autorización, no un estado del agente.

**Transiciones permitidas:**
```
active      → restricted   (agent.modify)
active      → suspended    (agent.suspend)
active      → revoked      (agent.revoke)
restricted  → active       (agent.modify)
restricted  → suspended    (agent.suspend)
restricted  → revoked      (agent.revoke)
suspended   → active       (agent.modify)
suspended   → revoked      (agent.revoke)
revoked     → *            NEVER — irreversible
```

---

## 5. Endpoints — Authorization

### `POST /acp/v1/authorize`
Evaluación central de autorización.

**Request body:**
```json
{
  "request_id": "uuid",
  "agent_id": "<AgentID>",
  "capability": "acp:cap:financial.payment",
  "resource": "org.example/accounts/ACC-001",
  "action_parameters": {
    "amount": 1500.00,
    "currency": "USD"
  },
  "context": {
    "timestamp": 1718920000,
    "ip_type": "corporate",
    "geo": "AR",
    "channel": "internal_api",
    "hour_of_day": 14,
    "day_of_week": 2
  },
  "sig": "<firma_del_agente>"
}
```

**Procesamiento interno MUST (en orden):**
```
1.   Validar firma del request
2.   Verificar estado del agente != revoked, suspended
2.5  Si autonomy_level == 0 → DENIED inmediato AUTH-008
3.   Verificar Capability Token del header Authorization
4.   Verificar capability solicitada ∈ token
5.   Verificar resource cubierto por token
6.   Registrar nonce del CT en ventana 5 min — si ya visto → AUTH-007
7.   Ejecutar ACP-RISK-1.0 → RS
8.   Aplicar thresholds según autonomy_level
9.   Generar AuthorizationDecision
10.  Registrar en Audit Ledger
11.  Retornar response
```

**Response APPROVED:**
```json
{
  "decision": "APPROVED",
  "risk_score": 28,
  "risk_eval_id": "<uuid>",
  "valid_until": 1718920300,
  "execution_token": { }
}
```

**Response DENIED:**
```json
{
  "decision": "DENIED",
  "risk_score": 82,
  "reason_code": "RISK-005",
  "retry_allowed": false
}
```

**Response ESCALATED:**
```json
{
  "decision": "ESCALATED",
  "risk_score": 55,
  "escalation_id": "<uuid>",
  "escalated_to": "<AgentID_o_queue>",
  "expires_at": 1718923600
}
```

Una decisión ESCALATED MUST generar entrada en cola de revisión. La acción MUST NOT ejecutarse hasta resolución explícita.

---

### `POST /acp/v1/authorize/escalations/{escalation_id}/resolve`
Resuelve escalación. **Capability requerida:** `acp:cap:agent.modify` con autonomy_level ≥ 3.

**Request body:** `resolution: "APPROVED" | "DENIED"`, `resolved_by`, `sig`.

---

## 6. Endpoints — Capability Tokens

### `POST /acp/v1/tokens`
Emite nuevo CT. **Capability requerida:** `acp:cap:agent.delegate`

---

## 7. Endpoints — Audit

### `POST /acp/v1/audit/query`
Consulta del Audit Ledger. **Capability requerida:** `acp:cap:audit.query`

Response incluye `chain_valid: true | false`.

### `GET /acp/v1/audit/verify/{event_id}`
Verifica integridad de un evento. **Capability requerida:** `acp:cap:audit.verify`

---

## 8. Endpoints — Execution Tokens

### `POST /acp/v1/exec-tokens/{et_id}/consume`
Reporta consumo de ET por sistema objetivo. Según ACP-EXEC-1.0 §9.1.

### `GET /acp/v1/exec-tokens/{et_id}/status`
Estado de un ET.

**Response 200 data:**
```json
{
  "et_id": "<uuid>",
  "state": "issued | used | expired",
  "expires_at": 1718920300,
  "consumed_at": null
}
```

---

## 9. Endpoint — Health

### `GET /acp/v1/health`
No requiere autenticación.

**Response 200:**
```json
{
  "acp_version": "1.0",
  "status": "operational | degraded | unavailable",
  "timestamp": 1718920000,
  "components": {
    "policy_engine": "operational",
    "audit_ledger": "operational",
    "agent_registry": "operational",
    "rev_endpoint": "operational"
  }
}
```

---

## 10. Comportamiento ante Condiciones Anómalas

| Condición | Comportamiento MUST |
|-----------|-------------------|
| Token de autenticación expirado | 401 AUTH-001 |
| Token revocado | 401 AUTH-006 |
| Agent Registry no disponible | 503 SYS-001 — no procesar |
| Policy Engine no disponible | 503 SYS-002 — no procesar |
| Audit Ledger no disponible | 503 SYS-003 — no procesar |
| Rev endpoint externo no disponible | Aplicar ACP-REV-1.0 §5 política offline |
| Rev endpoint retorna firma inválida | 403 REV-E002 — DENIED |
| Request body malformado | 400 SYS-004 |
| request_id duplicado en ventana 5 min | 400 AUTH-004 |
| Rate limit excedido | 429 con Retry-After |
| Timeout interno > 5 segundos | 504 SYS-005 |
| Capacidad core no registrada | 403 CAP-002 — DENIED inmediato |
| Capacidad extended desconocida | 200 ESCALATED reason CAP-003 |

**Principio crítico:** Ante cualquier fallo de componente interno, ACP MUST fallar cerrado. Una request que no puede ser completamente evaluada MUST ser denegada, nunca aprobada por defecto.

---

## 11. Rate Limiting

Por `agent_id`:

| Endpoint | Límite de referencia |
|----------|---------------------|
| POST /authorize | 100 req/min |
| POST /tokens | 20 req/min |
| POST /agents | 5 req/min |
| POST /audit/query | 30 req/min |

Headers en response 429:
```http
Retry-After: 30
X-ACP-RateLimit-Limit: 100
X-ACP-RateLimit-Remaining: 0
X-ACP-RateLimit-Reset: 1718920060
```

---

## 12. Códigos de Error Consolidados

| Código | HTTP | Descripción |
|--------|------|-------------|
| HP-004 | 400 | Header X-ACP-PoP ausente |
| HP-007 | 401 | Challenge no encontrado, expirado, o ya consumido |
| HP-009 | 401 | Firma PoP inválida |
| HP-010 | 401 | agent_id en PoP no coincide con sub del CT |
| HP-014 | 400 | request_body_hash no coincide |
| AUTH-001 | 401 | Token ausente o expirado |
| AUTH-002 | 403 | Capability insuficiente |
| AUTH-003 | 403 | Capability insuficiente para transición de estado |
| AUTH-004 | 400 | request_id duplicado |
| AUTH-005 | 403 | Agente suspendido o revocado |
| AUTH-006 | 401 | Token revocado |
| AUTH-007 | 401 | Token nonce reutilizado — posible replay |
| AUTH-008 | 403 | Agente sin autonomía de ejecución (level 0) |
| AGENT-001 | 400 | agent_id no deriva de public_key |
| AGENT-002 | 400 | autonomy_level fuera de rango |
| AGENT-003 | 400 | authority_domain no registrado |
| AGENT-004 | 409 | agent_id ya registrado |
| AGENT-005 | 404 | agent_id no encontrado |
| STATE-001 | 400 | Transición de estado inválida |
| STATE-002 | 400 | Intento de transición desde revoked |
| AUDIT-001 | 500 | Cadena de hashes inválida |
| SYS-001 | 503 | Agent Registry no disponible |
| SYS-002 | 503 | Policy Engine no disponible |
| SYS-003 | 503 | Audit Ledger no disponible |
| SYS-004 | 400 | Request body malformado |
| SYS-005 | 504 | Timeout interno |

---

## 13. Conformidad

Una implementación es ACP-API-1.0 conforme si:

- Implementa todos los endpoints de §4 a §9
- Usa estructura base de response de §3 con cobertura de firma correcta
- Implementa autenticación por CT en todos los endpoints excepto /health
- Firma todos los responses exitosos con clave institucional
- Falla cerrado ante fallos de componentes internos
- Implementa rate limiting por agent_id
- Implementa validación de nonce anti-replay (ventana 5 min)
- Verifica X-ACP-PoP según ACP-HP-1.0 §10 antes de procesar CT
- Rechaza requests sin X-ACP-PoP en endpoints autenticados con HP-004
- Produce los códigos de error de §12
- Incluye `X-ACP-Request-ID` en todos los responses
