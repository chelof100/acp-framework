# ACP-GOV-EVENTS-1.0
## Especificación del Flujo de Eventos de Gobernanza

**Estado:** Borrador
**Versión:** 1.0
**Tipo:** Especificación de Protocolo de Gobernanza
**Depende-de:** ACP-SIGN-1.0, ACP-LEDGER-1.2, ACP-REV-1.0, ACP-HIST-1.0
**Requerido-por:** ACP-CONF-1.1 (L4-EXTENDED)

> Esta especificación es **normativa**. Define la taxonomía canónica y la estructura de los eventos de gobernanza ACP — eventos institucionales que cambian la autoridad, el estado o el contexto de política de los agentes. Las implementaciones que afirmen conformidad L4-EXTENDED DEBEN emitir eventos de gobernanza utilizando los tipos y la estructura definidos aquí.

---

## 1. Alcance

Este documento define:

1. El objeto **Evento de Gobernanza** — la estructura canónica para todos los eventos de gobernanza institucional.
2. La **taxonomía oficial de tipos de eventos** — 10 tipos de eventos normativos con semántica formal.
3. **Reglas de emisión** — qué actores del sistema DEBEN producir cada evento y cuándo.
4. **Semántica del flujo** — garantías de ordenamiento, deduplicación y entrega entre instituciones.
5. **Interfaz de consulta** — cómo se accede a los eventos de gobernanza a través de ACP-HIST-1.0.

### Relación con especificaciones existentes

| Especificación | Gobierna | Eventos de Gobernanza agrega |
|----------------|----------|------------------------------|
| ACP-REV-1.0 | Protocolo de revocación | Tipos de eventos `delegation_revoked`, `capability_suspended` |
| ACP-HIST-1.0 | Acceso a consultas del libro mayor | Filtros de eventos de gobernanza y punto final de flujo |
| ACP-LEDGER-1.2 | Estructura de almacenamiento | Categoría de evento `GOVERNANCE` |
| ACP-REP-1.2 | Puntuación de reputación | `sanction_applied`, `agent_suspended` como entradas de reputación |

Los eventos de gobernanza son emitidos *por* los mecanismos anteriores y forman un flujo unificado que los consumidores (MIR, ARAF, auditores externos) pueden suscribirse.

---

## 2. Motivación

ACP define una gobernanza sólida en tiempo de ejecución. Sin embargo, el sistema también genera eventos institucionales que cambian el panorama de autoridad entre ejecuciones — las delegaciones son revocadas, los agentes son suspendidos, las políticas se actualizan. Estos eventos:

1. Actualmente están dispersos en ACP-REV-1.0, ACP-DCMA-1.0 y registros específicos de implementación.
2. No tienen un formato canónico que los sistemas externos (MIR, ARAF) puedan consumir de manera confiable.
3. Carecen de semántica formal — el mismo concepto puede registrarse de manera diferente por diferentes instituciones.

Esta especificación crea el **Flujo de Eventos de Gobernanza**: un registro formalmente tipado, firmado y ordenado de cada cambio en el estado de autoridad del ecosistema ACP.

---

## 3. Definiciones

**Evento de gobernanza:** Un registro firmado de una acción institucional que cambia la autoridad, el estado o el contexto de política de uno o más agentes.

**Flujo:** La secuencia ordenada y de solo adición de todos los eventos de gobernanza dentro de un límite institucional.

**Productor de eventos:** El componente del sistema (servidor ACP, ejecutor de cumplimiento, motor de políticas) que DEBE emitir un evento de gobernanza en respuesta a una acción institucional.

**Consumidor de eventos:** Un sistema externo (MIR, ARAF, auditor) que se suscribe al flujo de eventos de gobernanza.

**Referencia de evidencia:** Un puntero a una entrada existente del libro mayor ACP que proporciona evidencia criptográfica para el evento.

---

## 4. Objeto Evento de Gobernanza

### 4.1 Estructura de alto nivel

```json
{
  "ver": "1.0",
  "event_id": "<uuid_v4>",
  "event_type": "<TIPO_EVENTO_GOBERNANZA>",
  "institution_id": "<institution_id>",
  "agent_id": "<AgentID o null>",
  "triggered_by": "<AgentID o institution_id>",
  "timestamp": "<unix_segundos>",
  "effective_at": "<unix_segundos>",
  "reason": "<string>",
  "evidence_ref": "<ledger_entry_id o null>",
  "payload": { },
  "sig": "<base64url firma Ed25519>"
}
```

### 4.2 Definiciones de campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `ver` | string | DEBE | Siempre `"1.0"` |
| `event_id` | UUID v4 | DEBE | Identificador único para este evento |
| `event_type` | string | DEBE | Uno de los 10 tipos normativos definidos en §5 |
| `institution_id` | string | DEBE | Institución que emite el evento |
| `agent_id` | string | DEBE si el evento apunta a un agente, en caso contrario `null` | AgentID del agente afectado |
| `triggered_by` | string | DEBE | AgentID o institution_id que causó el evento |
| `timestamp` | integer | DEBE | Unix segundos. Tiempo en que se registró el evento |
| `effective_at` | integer | DEBE | Unix segundos. Tiempo en que el cambio de gobernanza entra en vigor. PUEDE ser igual a `timestamp` |
| `reason` | string | DEBE | Razón legible para el evento |
| `evidence_ref` | string | DEBERÍA | ID de entrada del libro mayor que proporciona evidencia (p.ej., la entrada del libro mayor de la violación de política) |
| `payload` | object | DEBE | Campos específicos del tipo de evento (ver §5) |
| `sig` | string | DEBE | Firma institucional Ed25519 base64url |

---

## 5. Taxonomía Normativa de Tipos de Eventos

### 5.1 `delegation_revoked`

**Desencadenante:** Una delegación emitida bajo ACP-DCMA-1.0 es revocada antes de su vencimiento natural.

**Productor:** Subsistema de revocación ACP (ACP-REV-1.0).

**Payload:**
```json
{
  "delegation_id": "<DEL-XXXX>",
  "delegator": "<AgentID>",
  "delegatee": "<AgentID>",
  "capability_affected": "<cadena de capacidad ACP>",
  "revocation_id": "<REV-XXXX>"
}
```

**Efectos posteriores:** Todos los tokens de ejecución derivados de esta delegación que no han sido consumidos DEBEN invalidarse. El servidor ACP DEBE rechazar cualquier presentación de ET que haga referencia a la delegación revocada.

---

### 5.2 `agent_suspended`

**Desencadenante:** Un agente es suspendido administrativamente por una institución. Todas las capacidades y delegaciones activas del agente son congeladas.

**Productor:** Subsistema administrativo ACP.

**Payload:**
```json
{
  "suspension_id": "<SUSP-XXXX>",
  "suspended_until": "<unix_segundos o null>",
  "capabilities_frozen": ["<cadena de capacidad ACP>", ...],
  "active_delegations_frozen": ["<DEL-XXXX>", ...]
}
```

**Efectos posteriores:** El agente no puede iniciar nuevas solicitudes ni recibir nuevas delegaciones hasta que sea reinstaurado. Los ETs no consumidos existentes DEBEN invalidarse. `suspended_until: null` significa suspensión indefinida.

---

### 5.3 `agent_reinstated`

**Desencadenante:** Un agente suspendido es restaurado al estado activo.

**Productor:** Subsistema administrativo ACP.

**Payload:**
```json
{
  "suspension_id": "<SUSP-XXXX coincidiendo con la suspensión original>",
  "reinstated_by": "<AgentID o institution_id>",
  "capabilities_restored": ["<cadena de capacidad ACP>", ...]
}
```

**Nota:** Los agentes reinstaurados no recuperan automáticamente las delegaciones revocadas. Cada delegación revocada requiere una nueva delegación bajo ACP-DCMA-1.0.

---

### 5.4 `policy_updated`

**Desencadenante:** Una política institucional que gobierna las decisiones ACP es actualizada. Produce una nueva `policy_version`.

**Productor:** Subsistema de gestión de políticas.

**Payload:**
```json
{
  "policy_id": "<string>",
  "previous_version": "<string>",
  "new_version": "<string>",
  "new_policy_hash": "<sha256_hex>",
  "breaking_change": "<boolean>",
  "affected_capabilities": ["<cadena de capacidad ACP>", ...]
}
```

**Nota:** `breaking_change: true` indica que las ejecuciones ya autorizadas pueden verse afectadas. Todos los objetos `InstantaneaContextoPolitica` con `policy_version == previous_version` siguen siendo válidos para las acciones que ya autorizaron — NO son invalidados retroactivamente.

---

### 5.5 `authority_transferred`

**Desencadenante:** La autoridad sobre un agente (derechos de propiedad o supervisión) se transfiere de una institución o principal a otro.

**Productor:** Subsistema de gestión institucional ACP.

**Payload:**
```json
{
  "transfer_id": "<XFER-XXXX>",
  "from_institution": "<institution_id>",
  "to_institution": "<institution_id>",
  "transferred_capabilities": ["<cadena de capacidad ACP>", ...],
  "acceptance_ref": "<ledger_entry_id de prueba de aceptación>"
}
```

**Nota de seguridad:** Un evento `authority_transferred` DEBE incluir una prueba de aceptación verificable de la institución receptora. Las transferencias unilaterales son inválidas.

---

### 5.6 `sanction_applied`

**Desencadenante:** Se aplica una sanción formal a un agente o institución como resultado de una violación de cumplimiento, hallazgo de auditoría u orden legal.

**Productor:** Subsistema de cumplimiento ACP o autoridad institucional.

**Payload:**
```json
{
  "sanction_id": "<SANC-XXXX>",
  "sanction_type": "capability_restriction | delegation_limit | audit_escalation | full_suspension",
  "scope": "<AgentID o institution_id>",
  "violation_ref": "<ledger_entry_id>",
  "duration": "<unix_segundos o null>",
  "external_order_ref": "<string o null>"
}
```

**Nota:** `external_order_ref` permite referenciar una orden legal o regulatoria externa (p.ej., número de referencia de orden judicial). Este campo permite que ACP sirva como infraestructura de evidencia en procedimientos legales.

---

### 5.7 `capability_suspended`

**Desencadenante:** Una capacidad ACP específica es suspendida para un agente, sin suspender al agente en sí. El agente puede continuar usando otras capacidades.

**Productor:** Subsistema de revocación ACP.

**Payload:**
```json
{
  "capability": "<cadena de capacidad ACP>",
  "suspended_until": "<unix_segundos o null>",
  "reason_code": "<string>"
}
```

---

### 5.8 `capability_reinstated`

**Desencadenante:** Una capacidad específica previamente suspendida es restaurada para un agente.

**Productor:** Subsistema de revocación ACP.

**Payload:**
```json
{
  "capability": "<cadena de capacidad ACP>",
  "reinstated_by": "<AgentID o institution_id>"
}
```

---

### 5.9 `trust_anchor_rotated`

**Desencadenante:** Un ancla de confianza institucional (ACP-ITA-1.0/1.1) rota su material de clave. Todos los consumidores de la clave pública deben actualizar su almacén de confianza.

**Productor:** Subsistema de gestión de claves institucional ACP.

**Payload:**
```json
{
  "old_key_id": "<key_id>",
  "new_key_id": "<key_id>",
  "rotation_type": "scheduled | emergency",
  "overlap_period": "<segundos>",
  "new_public_key": "<clave pública Ed25519 base64url>"
}
```

**Nota:** Durante `overlap_period`, tanto las claves antigua como nueva son válidas. Esto permite que los ETs existentes firmados bajo la clave antigua sean consumidos sin error.

---

### 5.10 `compliance_finding`

**Desencadenante:** Una verificación de cumplimiento (ACR-1.0) o auditoría produce un hallazgo contra un agente o institución que requiere acción de gobernanza.

**Productor:** Ejecutor de cumplimiento ACP (ACR-1.0) o auditor externo.

**Payload:**
```json
{
  "finding_id": "<FIND-XXXX>",
  "severity": "critical | major | minor",
  "finding_type": "<string>",
  "affected_spec": "<ACP-SPEC-VERSION>",
  "remediation_required": "<boolean>",
  "remediation_deadline": "<unix_segundos o null>",
  "evidence_refs": ["<ledger_entry_id>", ...]
}
```

---

## 6. Semántica del Flujo

### 6.1 Garantía de ordenamiento

Dentro de una sola institución, los eventos de gobernanza DEBEN ordenarse por `timestamp` y asignarse un número de `sequence` monótonamente creciente. Los eventos con el mismo `timestamp` se ordenan por `event_id` (lexicográfico).

### 6.2 Deduplicación

Cada `event_id` es globalmente único. Un consumidor que recibe un `event_id` duplicado DEBE descartar el duplicado y registrar una advertencia.

### 6.3 Entrega entre instituciones

Cuando un evento de gobernanza en la institución A afecta a un agente o delegación que abarca la institución B, el evento DEBE reenviarse al flujo de la institución B como una copia etiquetada `CROSS_ORG` (ACP-CROSS-ORG-1.0). La institución receptora PUEDE rechazar los eventos de gobernanza entre instituciones que no incluyan una `sig` válida de la institución originante.

---

## 7. Interfaz de Consulta (vía ACP-HIST-1.0)

Los eventos de gobernanza son accesibles a través del punto final de consulta estándar ACP-HIST-1.0 con filtros `event_type` de la taxonomía definida en §5.

### Filtros adicionales específicos de gobernanza

| Filtro | Descripción |
|--------|-------------|
| `event_category=governance` | Devuelve solo eventos de gobernanza |
| `severity=critical\|major\|minor` | Filtra eventos `compliance_finding` por severidad |
| `breaking_change=true` | Devuelve solo eventos `policy_updated` con `breaking_change: true` |
| `sanction_type=<tipo>` | Filtra `sanction_applied` por tipo |

### Punto final de suscripción al flujo

```
GET /acp/v1/governance/stream
```

Parámetros:
- `since=<unix_segundos>` — devuelve eventos después de esta marca de tiempo
- `types=<tipos de eventos separados por coma>` — filtra por tipo
- `agent_id=<AgentID>` — filtra por agente afectado

Respuesta: JSON delimitado por saltos de línea, un `EventoGobernanza` por línea, ordenado por `sequence`.

---

## 8. Conformidad

| Nivel de Conformidad | Requisito |
|---------------------|-----------|
| L1-CORE | PUEDE omitir la emisión de eventos de gobernanza completamente |
| L2-SECURITY | DEBE emitir `delegation_revoked` y `trust_anchor_rotated` |
| L3-FULL | DEBE emitir todos los tipos de revocación y suspensión (5.1, 5.2, 5.3, 5.7, 5.8) |
| L4-EXTENDED | DEBE emitir los 10 tipos de eventos y exponer el punto final de flujo |
| L5-DECENTRALIZED | DEBE emitir los 10 tipos vía bus de eventos descentralizado con ordenamiento criptográfico |

---

## 9. Consumo en el Ecosistema

### MIR (Capa de Historial de Participación)
Consume: `delegation_revoked`, `agent_suspended`, `agent_reinstated`, `authority_transferred`
Propósito: Construir historial de participación verificable para agentes entre instituciones.

### ARAF (Capa de Arquitectura de Riesgo)
Consume: `sanction_applied`, `compliance_finding`, `policy_updated`, `agent_suspended`
Propósito: Alimentar señales de gobernanza en modelos de puntuación de riesgo y responsabilidad.

### Auditores externos
Consume: todos los tipos vía ExportBundle (ACP-HIST-1.0)
Propósito: Verificación de cumplimiento de terceros y procedimientos legales.

---

## 10. Códigos de Error

| Código | Significado |
|--------|-------------|
| `GEVE-001` | Tipo de evento desconocido |
| `GEVE-002` | Firma institucional inválida |
| `GEVE-003` | Campo de payload requerido faltante para el tipo de evento |
| `GEVE-004` | `effective_at` anterior a `timestamp` |
| `GEVE-005` | `evidence_ref` hace referencia a una entrada del libro mayor inexistente |
| `GEVE-006` | `event_id` duplicado recibido |
| `GEVE-007` | Evento entre instituciones sin firma de origen |

---

## 11. Referencias Normativas

- ACP-SIGN-1.0 — Serialización y firma
- ACP-LEDGER-1.2 — Almacenamiento del libro mayor de auditoría
- ACP-REV-1.0 — Protocolo de revocación (fuente de eventos de revocación)
- ACP-HIST-1.0 — API de consulta de historial (acceso al flujo)
- ACP-DCMA-1.0 — Modelo de delegación (fuente de eventos de delegación)
- ACP-ITA-1.0, ACP-ITA-1.1 — Gestión de anclas de confianza (fuente de eventos de rotación)
- ACP-REP-1.2 — Protocolo de reputación (consumidor de eventos de sanción y suspensión)
- ACP-CROSS-ORG-1.0 — Operaciones entre organizaciones (reenvío de flujo)
- ACP-CONF-1.1 — Niveles de conformidad
- ACR-1.0 — Ejecutor de Cumplimiento ACP (fuente de hallazgos de cumplimiento)
