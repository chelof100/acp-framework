# ACP-LIA-1.0
## Liability Traceability Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** ACP-EXEC-1.0, ACP-LEDGER-1.0, ACP-CT-1.0, ACP-PSN-1.0
**Required-by:** ACP-LEDGER-1.1, ACP-REP-1.2

---

## 1. Alcance

Este documento define el mecanismo de trazabilidad de responsabilidad (liability traceability) en el ecosistema ACP. Especifica la estructura del evento `LIABILITY_RECORD`, las reglas de asignación de `liability_assignee`, el proceso de construcción de la cadena de delegación, y los endpoints de consulta.

El objetivo es materializar, por cada Execution Token (ET) consumido, un registro auditable que permita a reguladores, auditores y contrapartes financieras identificar de forma determinista quién es el responsable legal de cada acción ejecutada por un agente autónomo.

---

## 2. Definiciones

**LIABILITY_RECORD:** Evento ACP que materializa la cadena de delegación y el responsable asignado para una ejecución específica. Se emite una vez por ET consumido.

**liability_assignee:** Agente o entidad a quien se asigna la responsabilidad legal de la ejecución. Determinado por reglas definidas en §6.

**delegation_chain:** Array ordenado por `depth` ASC que reconstruye la cadena completa de delegación desde el token raíz (institucional) hasta el agente ejecutor.

**chain_incomplete:** Indicador booleano. `true` si no fue posible reconstruir la cadena completa. Registra degradación auditada.

**Bankability:** Propiedad de un sistema de ser modelable para riesgo, auditable, predecible y con responsabilidad asignable. El LIABILITY_RECORD es el instrumento técnico que habilita bankability.

---

## 3. Principios

**3.1 Un registro por ejecución** — Se emite exactamente un `LIABILITY_RECORD` por cada ET consumido con resultado final (`success`, `failure`, `unknown`).

**3.2 Inmutabilidad** — El LIABILITY_RECORD es append-only. Una vez emitido, no puede ser modificado ni eliminado.

**3.3 Determinismo** — Dado el mismo ET y los mismos tokens de delegación en el ledger, el LIABILITY_RECORD producido MUST ser idéntico.

**3.4 Degradación auditada** — Si la cadena no puede reconstruirse completamente, el registro se emite igualmente con `chain_incomplete: true`. No se omite el registro.

**3.5 Dependencia de PSN** — Todo LIABILITY_RECORD MUST referenciar el Policy Snapshot vigente en el momento de la ejecución mediante `policy_snapshot_ref`.

---

## 4. Estructura del Evento LIABILITY_RECORD

```json
{
  "ver": "1.0",
  "event_id": "<uuid_v4>",
  "event_type": "LIABILITY_RECORD",
  "sequence": 1587,
  "timestamp": 1718920150,
  "institution_id": "org.example.banking",
  "prev_hash": "<SHA-256_base64url_del_evento_anterior>",
  "payload": {
    "liability_id": "<uuid_v4>",
    "et_id": "<uuid>",
    "authorization_id": "<uuid>",
    "agent_id": "<AgentID>",
    "capability": "acp:cap:financial.payment",
    "resource": "org.example/accounts/ACC-001",
    "delegation_chain": [
      {
        "depth": 0,
        "token_nonce": "<nonce_root>",
        "agent_id": "<AgentID_institucion>",
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
        "agent_id": "<AgentID_ejecutor>",
        "issued_at": 1718920000
      }
    ],
    "delegation_depth": 2,
    "liability_assignee": "<AgentID>",
    "policy_snapshot_ref": "<uuid>",
    "execution_result": "success",
    "executed_at": 1718920150,
    "consumed_by_system": "org.example/systems/payment-processor",
    "chain_incomplete": false
  },
  "hash": "<SHA-256_base64url_de_este_evento>",
  "sig": "<firma_institucional>"
}
```

---

## 5. Especificación de Campos del Payload

**5.1 `liability_id`** — UUID v4 único por registro. Clave primaria de consulta.

**5.2 `et_id`** — UUID del Execution Token consumido. Referencia directa a ACP-EXEC-1.0. MUST existir en el ledger como evento `EXECUTION_TOKEN_CONSUMED`.

**5.3 `authorization_id`** — UUID del evento `AUTHORIZATION` previo que autorizó la ejecución. MUST existir en el ledger.

**5.4 `agent_id`** — AgentID del agente que ejecutó la acción. Corresponde al agente en `depth` máximo de `delegation_chain`.

**5.5 `capability`** — Capacidad ejercida. Formato `acp:cap:<dominio>.<acción>`. Derivada del ET referenciado.

**5.6 `resource`** — Recurso sobre el que actuó el agente. Derivado del ET referenciado.

**5.7 `delegation_chain`** — Array de objetos ordenado por `depth` ASC:
- `depth`: Entero ≥ 0. `depth 0` = token raíz institucional.
- `token_nonce`: Nonce del token de delegación en ese nivel.
- `agent_id`: AgentID del agente que emitió el token en ese nivel.
- `issued_at`: Unix timestamp de emisión del token.

La longitud del array MUST coincidir con `delegation_depth + 1`.

**5.8 `delegation_depth`** — Entero ≥ 0. Profundidad del agente ejecutor en la cadena. `0` = acción directa institucional.

**5.9 `liability_assignee`** — AgentID del responsable asignado. Determinado por reglas de §6.

**5.10 `policy_snapshot_ref`** — UUID del Policy Snapshot (ACP-PSN-1.0) vigente en `executed_at`. MUST corresponder a un snapshot con `effective_from ≤ executed_at` y `effective_until = null` o `effective_until > executed_at`.

**5.11 `execution_result`** — Enum: `success` | `failure` | `unknown`. `unknown` se usa cuando el resultado no pudo determinarse antes del timeout del ET.

**5.12 `executed_at`** — Unix timestamp de la ejecución. Tomado del evento `EXECUTION_TOKEN_CONSUMED` referenciado.

**5.13 `consumed_by_system`** — Identificador del sistema externo que consumió el ET. Tomado del campo correspondiente en `EXECUTION_TOKEN_CONSUMED`.

**5.14 `chain_incomplete`** — Boolean. `false` por defecto. `true` si algún token de la cadena no pudo recuperarse del ledger. Cuando `true`, `delegation_chain` puede ser parcial.

---

## 6. Reglas de Asignación de liability_assignee

Las reglas se evalúan en orden. Se aplica la primera que coincide.

**Regla 1 — Escalación resuelta por humano:**
```
IF evento ESCALATION_RESOLVED existe para este et_id
AND ESCALATION_RESOLVED.resolver_type == "human"
THEN liability_assignee = ESCALATION_RESOLVED.resolver_agent_id
```

**Regla 2 — Autonomy level < 2:**
```
IF delegation_chain[delegation_depth - 1].agent_id es supervisor identificable
AND autonomy_level del agente ejecutor < 2
THEN liability_assignee = delegation_chain[delegation_depth - 1].agent_id
```
*(El supervisor inmediato asume la responsabilidad cuando el ejecutor opera con autonomía restringida)*

**Regla 3 — Default (ejecutor autónomo):**
```
ELSE liability_assignee = agent_id  (el agente ejecutor)
```

**Nota:** Cuando `chain_incomplete: true`, si no puede determinarse el supervisor por la cadena truncada, se aplica Regla 3.

---

## 7. Reglas de Construcción de delegation_chain

**7.1 Fuente de datos** — La cadena se construye exclusivamente desde eventos en el Audit Ledger (ACP-LEDGER-1.0). No se acepta input externo para la construcción.

**7.2 Orden de construcción** — Se recorre el árbol de delegación desde el ET hacia atrás, siguiendo referencias `parent_token_nonce` hasta alcanzar el token raíz (`depth 0`).

**7.3 Token raíz** — El token en `depth 0` MUST ser emitido por la institución (`institution_id`). Si no se alcanza un token institucional, `chain_incomplete` MUST ser `true`.

**7.4 Consistencia de AgentIDs** — El `agent_id` en `delegation_chain[depth_max]` MUST coincidir con el campo `agent_id` del LIABILITY_RECORD.

**7.5 Timestamps** — `issued_at` en `delegation_chain` MUST ser monotónicamente creciente con `depth`. Un token hijo no puede haber sido emitido antes que su padre.

---

## 8. Proceso de Emisión

**8.1 Trigger** — El LIABILITY_RECORD se emite al detectar el evento `EXECUTION_TOKEN_CONSUMED` en el ledger con `status = final` (es decir, `execution_result` determinado o timeout alcanzado).

**8.2 Secuencia:**
1. Leer evento `EXECUTION_TOKEN_CONSUMED` para el `et_id`.
2. Leer evento `AUTHORIZATION` referenciado por el ET.
3. Reconstruir `delegation_chain` desde el ledger (§7).
4. Obtener Policy Snapshot activo en `executed_at` desde ACP-PSN-1.0.
5. Aplicar reglas de §6 para determinar `liability_assignee`.
6. Construir payload del LIABILITY_RECORD.
7. Computar `hash` = `base64url(SHA-256(JCS(evento sin hash y sig)))`.
8. Firmar con clave institucional → campo `sig`.
9. Escribir evento en ledger (append-only).

**8.3 Atomicidad** — Los pasos 7-9 MUST ser atómicos. Si la escritura falla, el proceso se reintenta con el mismo `liability_id` (idempotente por `liability_id`).

**8.4 Latencia máxima** — El LIABILITY_RECORD SHOULD emitirse dentro de los 5 segundos posteriores al trigger. Implementaciones en entornos de alta carga MAY usar hasta 30 segundos.

---

## 9. Endpoints

### 9.1 `GET /acp/v1/liability/{liability_id}`

Recupera un LIABILITY_RECORD por su identificador único.

**Response 200:**
```json
{
  "liability_id": "<uuid>",
  "et_id": "<uuid>",
  "authorization_id": "<uuid>",
  "agent_id": "<AgentID>",
  "capability": "acp:cap:financial.payment",
  "resource": "org.example/accounts/ACC-001",
  "delegation_chain": [...],
  "delegation_depth": 2,
  "liability_assignee": "<AgentID>",
  "policy_snapshot_ref": "<uuid>",
  "execution_result": "success",
  "executed_at": 1718920150,
  "consumed_by_system": "org.example/systems/payment-processor",
  "chain_incomplete": false,
  "ledger_event_id": "<uuid>",
  "ledger_sequence": 1587
}
```

**Response 404:** `LIA-001`

---

### 9.2 `GET /acp/v1/liability/by-et/{et_id}`

Recupera el LIABILITY_RECORD asociado a un ET específico.

**Response 200:** Mismo schema que §9.1.
**Response 404:** `LIA-001` si el ET no tiene LIABILITY_RECORD aún (puede estar en proceso de emisión).
**Response 202:** Si el ET fue consumido pero el LIABILITY_RECORD aún no fue emitido (estado `LIA-007`).

---

### 9.3 `GET /acp/v1/liability/by-agent/{agent_id}`

Lista LIABILITY_RECORDs donde `agent_id` o `liability_assignee` coinciden con el agente dado.

**Query params:**
- `role`: `executor` | `assignee` | `any` (default: `any`)
- `from`: Unix timestamp inicio (default: 0)
- `to`: Unix timestamp fin (default: now)
- `limit`: Máx registros (default: 100, max: 1000)
- `cursor`: Paginación opaca

**Response 200:**
```json
{
  "items": [...],
  "next_cursor": "<opaque>",
  "total_count": 47
}
```

---

## 10. Verificación Externa

**10.1 Flujo de auditoría** — Un auditor externo puede verificar un LIABILITY_RECORD de la siguiente forma:

1. Obtener LIABILITY_RECORD via `GET /acp/v1/liability/{liability_id}`.
2. Verificar que `ledger_event_id` existe en el ledger y corresponde al LIABILITY_RECORD.
3. Verificar integridad del ledger desde el genesis hasta el evento (ACP-LEDGER-1.0 §8).
4. Verificar firma institucional `sig` sobre el evento.
5. Verificar que `policy_snapshot_ref` corresponde a un Policy Snapshot válido y vigente en `executed_at` (ACP-PSN-1.0 §10).
6. Verificar que `delegation_chain` es consistente con los tokens en el ledger.
7. Re-aplicar reglas de §6 para confirmar `liability_assignee`.

**10.2 Exportación para regulador** — Las implementaciones MAY proveer un endpoint de exportación que retorne el LIABILITY_RECORD junto con todos los eventos del ledger necesarios para su verificación independiente (AUTHORIZATION, EXECUTION_TOKEN_CONSUMED, tokens de delegación relevantes).

---

## 11. Comportamiento Anómalo

**11.1 ET consumido sin AUTHORIZATION previa** — `chain_incomplete: true`, `authorization_id: null`, `liability_assignee` = Regla 3 (ejecutor). Se registra igual.

**11.2 Policy Snapshot no disponible** — Error `LIA-003`. El proceso de emisión MUST reintentarse. No se emite LIABILITY_RECORD con `policy_snapshot_ref: null`.

**11.3 Ciclo en delegation_chain** — Si se detecta un ciclo (token que referencia a un ancestro), la construcción se detiene, `chain_incomplete: true`, y el nivel donde se detectó el ciclo no se incluye.

**11.4 Timeout de construcción** — Si la construcción de `delegation_chain` supera 10 segundos, se emite con la cadena parcial disponible y `chain_incomplete: true`.

---

## 12. Códigos de Error

| Código | Condición |
|---|---|
| `LIA-001` | LIABILITY_RECORD no encontrado para el identificador dado |
| `LIA-002` | delegation_chain no reconstruible: tokens insuficientes en ledger |
| `LIA-003` | Policy Snapshot no disponible para `executed_at` dado |
| `LIA-004` | ET no encontrado en ledger |
| `LIA-005` | Evento AUTHORIZATION no encontrado para el ET referenciado |
| `LIA-006` | Fallo de escritura en ledger durante emisión del LIABILITY_RECORD |
| `LIA-007` | LIABILITY_RECORD en estado transitorio: ET consumido, emisión en curso |
| `LIA-008` | liability_id duplicado: ya existe un LIABILITY_RECORD para este et_id |

---

## 13. Conformidad

Una implementación es conforme con ACP-LIA-1.0 si:

1. Emite exactamente un `LIABILITY_RECORD` por cada ET consumido con resultado final.
2. Construye `delegation_chain` exclusivamente desde datos del Audit Ledger.
3. Aplica las reglas de asignación de §6 en el orden especificado.
4. Incluye `policy_snapshot_ref` válido en todo LIABILITY_RECORD.
5. Persiste el evento como entrada append-only en el Audit Ledger (ACP-LEDGER-1.0).
6. Expone los tres endpoints de §9 con los schemas especificados.
7. Emite el evento con `chain_incomplete: true` ante cadena no reconstruible (no omite el registro).
8. Garantiza idempotencia por `liability_id` en la emisión.
