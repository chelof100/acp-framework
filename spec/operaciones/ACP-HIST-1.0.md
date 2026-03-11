# ACP-HIST-1.0
## History Query API Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** ACP-LEDGER-1.2, ACP-ITA-1.0, ACP-SIGN-1.0
**Required-by:** ACP-REP-1.2 (consulta de eventos históricos para ERS)

---

## 1. Alcance

Este documento define la capa de consulta sobre el Audit Ledger ACP. Especifica endpoints de filtrado y paginación para acceso programático al historial de eventos, el formato de exportación portátil para compartir segmentos de audit trail entre instituciones, y el contrato de integridad que toda respuesta debe incluir.

ACP-LEDGER-1.2 define la estructura y almacenamiento. ACP-HIST-1.0 define el acceso.

---

## 2. Definiciones

**HistoryQuery:** Solicitud filtrada de eventos del ledger con parámetros de paginación y alcance.

**Cursor:** Token opaco que representa la posición de paginación. Encapsula el `sequence` del último evento devuelto.

**ExportBundle:** Colección firmada y auto-verificable de eventos del ledger, diseñada para compartirse entre instituciones como unidad de auditoría portátil.

**chain_valid:** Campo booleano presente en toda respuesta que indica si la cadena de hash del segmento devuelto fue verificada por el servidor respondente.

**Segmento verificable:** Subconjunto contiguo del ledger que incluye suficiente información para verificar su integridad de forma independiente.

---

## 3. Modelo de Autorización

Las consultas requieren autenticación ACP estándar según ACP-API-1.0.

| Rol | Alcance |
|-----|---------|
| `SYSTEM` | Puede consultar todos los eventos de su institución |
| `SUPERVISOR` | Puede consultar eventos de agentes bajo su supervisión |
| `AGENT` | Puede consultar únicamente sus propios eventos |
| `EXTERNAL_AUDITOR` | Puede consultar eventos compartidos explícitamente via ExportBundle |

Las consultas cross-institucionales (institución B consultando eventos de institución A) MUST realizarse mediante ExportBundle firmado por institución A, no mediante acceso directo al ledger de A.

---

## 4. Endpoint Principal — `GET /acp/v1/audit/query`

Consulta paginada y filtrada del ledger institucional.

### Parámetros de query

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `event_type` | string (multi) | Filtro por tipo de evento. Acepta múltiples valores separados por coma |
| `agent_id` | string | Filtro por AgentID (exacto) |
| `institution_id` | string | Filtro por institución emisora del evento |
| `capability` | string | Filtro por capability ACP (prefijo permitido: `acp:cap:financial.*`) |
| `resource` | string | Filtro por recurso (exacto) |
| `decision` | string | Filtro por decisión: `APPROVED`, `DENIED`, `ESCALATED` (solo en eventos AUTHORIZATION y ESCALATION_RESOLVED) |
| `from_ts` | int64 | Timestamp UNIX inicio del rango (inclusive) |
| `to_ts` | int64 | Timestamp UNIX fin del rango (inclusive) |
| `from_seq` | int64 | Sequence mínimo (inclusivo). Alternativa a `from_ts` |
| `to_seq` | int64 | Sequence máximo (inclusivo). Alternativa a `to_ts` |
| `cursor` | string | Token de paginación del response anterior |
| `limit` | int | Máximo de eventos a devolver. Default: 20. Máximo: 100 |
| `verify_chain` | bool | Si `true`, el servidor verifica integridad de la cadena antes de responder. Default: `false` |

No se puede combinar `from_ts`/`to_ts` con `from_seq`/`to_seq` en el mismo request.

### Response 200

```json
{
  "ver": "1.0",
  "institution_id": "org.example.banking",
  "events": [
    {
      "ver": "1.0",
      "event_id": "<uuid>",
      "event_type": "AUTHORIZATION",
      "sequence": 1547,
      "timestamp": 1718920000,
      "institution_id": "org.example.banking",
      "prev_hash": "<sha256_base64url>",
      "payload": {},
      "hash": "<sha256_base64url>",
      "sig": "<firma_institucional>"
    }
  ],
  "pagination": {
    "cursor": "<cursor_opaco_base64url>",
    "has_more": true,
    "returned_count": 20,
    "total_count": null
  },
  "integrity": {
    "chain_valid": true,
    "verified_from_seq": 1547,
    "verified_to_seq": 1566,
    "policy_context": "v1.1"
  }
}
```

`total_count` es siempre `null` — el ledger es append-only y el conteo exacto requiere full scan. Los clientes MUST NOT asumir que `null` significa cero.

`policy_context` es `"v1.1"` si todos los eventos del segmento incluyen `policy_snapshot_ref`. Si algún evento no lo tiene, es `"mixed"`. Si ninguno lo tiene, es `"legacy"`.

`chain_valid` es `null` cuando `verify_chain` fue `false`. Es `true` o `false` cuando `verify_chain` fue `true`.

### Cursor

El cursor es `base64url(JSON({seq: N, ts: T}))` donde N es el sequence del último evento devuelto y T es su timestamp. Es opaco para el cliente — su formato interno MUST NOT ser dependido por implementaciones cliente.

El cursor expira después de 24 horas. Un cursor expirado devuelve HIST-E005.

### Errores

| Código | HTTP | Condición |
|--------|------|-----------|
| HIST-E001 | 400 | Parámetros de filtro inválidos o incompatibles |
| HIST-E002 | 400 | `limit` fuera de rango (< 1 o > 100) |
| HIST-E003 | 400 | Combinación `ts` y `seq` simultánea |
| HIST-E004 | 403 | Rol insuficiente para el alcance solicitado |
| HIST-E005 | 400 | Cursor expirado o inválido |
| HIST-E006 | 500 | Fallo de verificación de cadena durante `verify_chain: true` |

---

## 5. Endpoint de Evento Individual — `GET /acp/v1/audit/events/{event_id}`

Retorna un evento único por su `event_id` (UUID v4).

### Response 200

```json
{
  "ver": "1.0",
  "event": {
    "ver": "1.0",
    "event_id": "<uuid>",
    "event_type": "LIABILITY_RECORD",
    "sequence": 1548,
    "timestamp": 1718920010,
    "institution_id": "org.example.banking",
    "prev_hash": "<sha256_base64url>",
    "payload": {},
    "hash": "<sha256_base64url>",
    "sig": "<firma_institucional>"
  },
  "integrity": {
    "hash_valid": true,
    "sig_valid": true
  }
}
```

`hash_valid` y `sig_valid` son siempre verificados en este endpoint (no hay toggle).

### Errores

| Código | HTTP | Condición |
|--------|------|-----------|
| HIST-E010 | 404 | `event_id` no encontrado |
| HIST-E011 | 403 | Sin permiso para ver este evento |

---

## 6. Endpoint de Historial de Agente — `GET /acp/v1/audit/agents/{agent_id}/history`

Vista consolidada de la actividad de un agente específico. Devuelve solo los event types relevantes a la trayectoria del agente.

### Parámetros de query

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `from_ts` | int64 | Timestamp inicio |
| `to_ts` | int64 | Timestamp fin |
| `cursor` | string | Token de paginación |
| `limit` | int | Default: 20. Máximo: 100 |
| `include_types` | string (multi) | Subset de event types a incluir. Default: todos los relevantes al agente |

### Event types incluidos por defecto

`AUTHORIZATION`, `RISK_EVALUATION`, `REVOCATION`, `TOKEN_ISSUED`, `EXECUTION_TOKEN_ISSUED`, `EXECUTION_TOKEN_CONSUMED`, `LIABILITY_RECORD`, `REPUTATION_UPDATED`, `AGENT_STATE_CHANGE`, `ESCALATION_CREATED`, `ESCALATION_RESOLVED`

### Response 200

```json
{
  "ver": "1.0",
  "agent_id": "<AgentID>",
  "institution_id": "org.example.banking",
  "events": [],
  "summary": {
    "total_authorizations": 142,
    "approved": 138,
    "denied": 3,
    "escalated": 1,
    "executions_successful": 135,
    "executions_failed": 3,
    "current_rep_score": 82,
    "first_event_ts": 1710000000,
    "last_event_ts": 1718920000
  },
  "pagination": {
    "cursor": "<cursor_opaco>",
    "has_more": false,
    "returned_count": 142
  },
  "integrity": {
    "chain_valid": null
  }
}
```

`summary` refleja el estado calculado al momento de la consulta a partir de todos los eventos del agente, no solo los devueltos en la página actual.

---

## 7. Exportación Portátil — `POST /acp/v1/audit/export`

Genera un ExportBundle firmado: un segmento del ledger encapsulado y auto-verificable, diseñado para compartirse con terceros (instituciones externas, auditores, reguladores).

### Request body

```json
{
  "scope": {
    "from_ts": 1718000000,
    "to_ts": 1718999999,
    "agent_id": "<AgentID_opcional>",
    "event_types": ["AUTHORIZATION", "LIABILITY_RECORD", "REPUTATION_UPDATED"]
  },
  "format": "full | hashes_only",
  "include_anchor": true,
  "ttl_seconds": 86400
}
```

`format`:
- `full` — eventos completos con payload, hash y sig
- `hashes_only` — solo `event_id`, `sequence`, `hash` y `sig` por evento (para verificación sin exposición de payload)

`include_anchor` — si `true`, incluye el evento inmediatamente anterior al rango para anclar la verificación de cadena sin requerir el ledger completo.

`ttl_seconds` — tiempo de validez del bundle. Default: 86400 (24h). Máximo: 604800 (7 días).

### Response 200 — ExportBundle

```json
{
  "ver": "1.0",
  "bundle_id": "<uuid>",
  "issuer": "org.example.banking",
  "issued_at": 1718920000,
  "expires_at": 1719006400,
  "scope": {
    "from_ts": 1718000000,
    "to_ts": 1718999999,
    "agent_id": "<AgentID>",
    "event_types": ["AUTHORIZATION", "LIABILITY_RECORD", "REPUTATION_UPDATED"]
  },
  "format": "full",
  "anchor_event": {
    "event_id": "<uuid>",
    "sequence": 1540,
    "hash": "<sha256_base64url>"
  },
  "events": [],
  "event_count": 28,
  "chain_valid": true,
  "bundle_hash": "<sha256_base64url_de_bundle_sin_bundle_sig>",
  "bundle_sig": "<firma_institucional_sobre_bundle_hash>"
}
```

`bundle_sig` es `base64url(Sign(sk_institucional, SHA-256(JCS(bundle sin bundle_sig))))`.

### Verificación de ExportBundle por el receptor

```
1. Obtener pk de issuer via ACP-ITA-1.0: GET /ita/v1/institutions/{issuer}
2. Verificar bundle_sig con pk del issuer
3. Verificar que bundle.expires_at > now()
4. Verificar chain desde anchor_event:
   a. primer evento: E.prev_hash MUST coincidir con anchor_event.hash
   b. verificar cadena interna según ACP-LEDGER-1.2 §7
5. Verificar sig individual de cada evento con pk del issuer
```

Un receptor puede verificar el bundle sin acceso al ledger original del emisor.

### Errores

| Código | HTTP | Condición |
|--------|------|-----------|
| HIST-E020 | 400 | Rango de exportación inválido (`from_ts` ≥ `to_ts`) |
| HIST-E021 | 400 | `ttl_seconds` fuera de rango |
| HIST-E022 | 403 | Rol insuficiente para exportar |
| HIST-E023 | 422 | Scope produce cero eventos — bundle vacío no permitido |
| HIST-E024 | 500 | Error firmando bundle institucional |

---

## 8. Interacción con ACP-REP-1.2

El motor ERS de ACP-REP-1.2 consulta eventos `REPUTATION_UPDATED` del ledger usando `GET /acp/v1/audit/query` con `event_type=REPUTATION_UPDATED&agent_id={id}`. El formato de respuesta definido en este documento es el contrato que ACP-REP-1.2 consume.

Para reputación cross-institucional, la institución destino puede solicitar un ExportBundle filtrado por `event_types=["REPUTATION_UPDATED","LIABILITY_RECORD"]` a la institución origen como fuente de evidencia para bootstrapear ERS externo.

---

## 9. Retención y Cobertura

Las consultas cubren todos los eventos dentro del período de retención activa de ACP-LEDGER-1.2 (90 días en almacenamiento caliente). Eventos archivados en almacenamiento frío (entre 90 días y 7 años) SHOULD estar disponibles con latencia adicional declarada en el header `X-ACP-Archive-Latency-Seconds`.

Si un segmento consultado incluye eventos archivados, la respuesta incluye:

```json
"integrity": {
  "chain_valid": true,
  "archive_segments": true,
  "archive_retrieval_latency_seconds": 3600
}
```

---

## 10. Errores Generales

| Código | HTTP | Condición |
|--------|------|-----------|
| HIST-E030 | 401 | Sin autenticación ACP válida |
| HIST-E031 | 429 | Rate limit excedido |
| HIST-E032 | 503 | Ledger temporalmente no disponible |

Rate limit por defecto: 60 rpm por caller para `/audit/query` y `/audit/agents/*/history`. 10 rpm para `/audit/export`.

---

## 11. Conformidad

Una implementación es ACP-HIST-1.0 conforme si:

- Expone `GET /acp/v1/audit/query` con todos los parámetros de §4
- Implementa paginación por cursor con expiración de 24h
- Retorna `chain_valid` en todas las respuestas cuando `verify_chain: true`
- Expone `GET /acp/v1/audit/events/{event_id}` con verificación de hash y sig
- Expone `GET /acp/v1/audit/agents/{agent_id}/history` con summary calculado
- Expone `POST /acp/v1/audit/export` generando ExportBundle firmado verificable independientemente
- Implementa modelo de autorización por rol de §3
- Respeta rate limits de §10
- Soporta cobertura de eventos archivados según §9
