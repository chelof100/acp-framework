> **Estado:** Superado
> **Superado por:** ACP-POLICY-CTX-1.1
> **Fecha de superación:** 2026-03-19

# ACP-POLICY-CTX-1.0
## Especificación de Instantánea de Contexto de Política

**Estado:** Borrador
**Versión:** 1.0
**Tipo:** Especificación de Protocolo de Operaciones
**Depende-de:** ACP-SIGN-1.0, ACP-EXEC-1.0, ACP-LEDGER-1.2, ACP-PROVENANCE-1.0
**Requerido-por:** ACP-CONF-1.1 (L3-FULL), ACP-LIA-1.0

> Esta especificación es **normativa**. Define la Instantánea de Contexto de Política (`InstantaneaContextoPolitica`) — el registro firmado del estado exacto de la política que estaba en vigor en el momento en que se autorizó una acción de agente. Las implementaciones que afirmen conformidad L3-FULL DEBEN producir una `InstantaneaContextoPolitica` válida para cada ejecución.

---

## 1. Alcance

Este documento define:

1. El objeto **InstantaneaContextoPolitica** — su estructura, campos requeridos y registro de evaluación.
2. **Semántica de captura de instantánea** — cuándo y cómo DEBE tomarse la instantánea.
3. **Reglas de vinculación** — cómo la instantánea se adjunta a Tokens de Ejecución y entradas del Libro Mayor.
4. **Verificación retrospectiva** — cómo un verificador usa la instantánea para reconstruir la decisión de política.

### Lo que esto NO es

- No es un lenguaje de política ni un motor de aplicación de políticas. ACP no define cómo se escriben las políticas.
- No es un mecanismo de consulta de políticas en tiempo real.
- No es un mecanismo de delegación (ver ACP-DCMA-1.0).

`InstantaneaContextoPolitica` es un **artefacto de evidencia en un punto del tiempo** — preserva el estado de la política en el momento de ejecución para que, en cualquier punto futuro, un verificador pueda confirmar que la acción era conforme a la política cuando ocurrió.

---

## 2. Motivación

Las acciones de agentes autónomos pueden auditarse semanas o meses después del hecho — para revisiones de cumplimiento, disputas legales o atribución de responsabilidad (ACP-LIA-1.0). Para ese momento, la política institucional puede haber cambiado. Sin una instantánea criptográfica de la política en vigor en el momento de ejecución, es imposible demostrar retroactivamente si la acción estaba autorizada.

La `InstantaneaContextoPolitica` resuelve esto capturando:
1. Qué documento de política gobernaba la acción.
2. Qué versión y hash tenía ese documento en el momento de ejecución.
3. Cuál fue el resultado de la evaluación de política para la solicitud específica.
4. Qué pasos de evaluación produjeron ese resultado.

Esto habilita la **reconstrucción determinística retroactiva de política** — un verificador puede re-ejecutar la evaluación de política contra las entradas capturadas y confirmar el resultado capturado.

---

## 3. Definiciones

**Política:** Un documento o conjunto de reglas institucional que determina si una acción específica de agente está autorizada. ACP no impone un lenguaje de política; el formato de instantánea es agnóstico al lenguaje.

**Versión de política:** Un identificador monótonamente creciente (semver o entero) que cambia siempre que el documento de política cambia.

**Hash de política:** Un resumen SHA-256 de la representación canónica en bytes del documento de política en `snapshot_at`.

**Resultado de evaluación:** La salida de aplicar la política a la solicitud de ejecución específica — `APROBADO`, `DENEGADO` o `ESCALADO`.

**Contexto de evaluación:** El conjunto de entradas proporcionadas al motor de política: identidad del agente, capacidad solicitada, recurso, puntuación de riesgo, estado de delegación y cualquier parámetro adicional.

**Límite de instantánea:** La política DEBE capturarse tal como existía en `snapshot_at`, no como existe en el momento de verificación.

---

## 4. Objeto InstantaneaContextoPolitica

### 4.1 Estructura de alto nivel

```json
{
  "ver": "1.0",
  "snapshot_id": "<uuid_v4>",
  "execution_id": "<et_id del Token de Ejecución vinculado>",
  "provenance_id": "<provenance_id de AutoridadProcedencia vinculada>",
  "snapshot_at": "<unix_segundos>",
  "policy": {
    "policy_id": "<string>",
    "policy_version": "<string>",
    "policy_hash": "<sha256_hex>",
    "policy_engine": "<string>"
  },
  "evaluation_context": {
    "agent_id": "<AgentID>",
    "requested_capability": "<cadena de capacidad ACP>",
    "resource": "<identificador de recurso>",
    "risk_score": "<float 0.0–1.0>",
    "delegation_active": "<boolean>",
    "additional_params": { }
  },
  "evaluation_result": {
    "decision": "APROBADO | DENEGADO | ESCALADO",
    "checks": [ <VerificacionEvaluacion>, ... ],
    "denial_reason": "<string o null>"
  },
  "sig": "<base64url firma Ed25519>"
}
```

### 4.2 Definiciones de campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `ver` | string | DEBE | Siempre `"1.0"` |
| `snapshot_id` | UUID v4 | DEBE | Identificador único para esta instantánea |
| `execution_id` | string | DEBE | `et_id` del Token de Ejecución vinculado |
| `provenance_id` | string | DEBERÍA | `provenance_id` de la `AutoridadProcedencia` vinculada (DEBE en L3-FULL) |
| `snapshot_at` | integer | DEBE | Unix segundos. DEBE estar dentro de la ventana de validez del ET |
| `policy` | object | DEBE | Bloque de identificación de política |
| `evaluation_context` | object | DEBE | Entradas para la evaluación de política |
| `evaluation_result` | object | DEBE | Salida de la evaluación de política |
| `sig` | string | DEBE | Firma institucional Ed25519 base64url |

### 4.3 Bloque de política

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `policy_id` | string | DEBE | Identificador estable para la política (p.ej., `payment_policy`) |
| `policy_version` | string | DEBE | Versión en `snapshot_at` (p.ej., `v3.2`) |
| `policy_hash` | string | DEBE | Hex SHA-256 del documento de política en `snapshot_at` |
| `policy_engine` | string | DEBERÍA | Identificador del motor de política usado (p.ej., `opa`, `cedar`, `custom`) |

### 4.4 Bloque de contexto de evaluación

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `agent_id` | string | DEBE | AgentID del ejecutor |
| `requested_capability` | string | DEBE | Cadena de capacidad ACP de la solicitud de ejecución |
| `resource` | string | DEBE | Identificador de recurso al que apunta la acción |
| `risk_score` | float | DEBERÍA | Puntuación de riesgo en el momento de evaluación (de ACP-RISK-1.0). `null` si no se calculó |
| `delegation_active` | boolean | DEBE | Si la cadena de delegación estaba activa en `snapshot_at` |
| `additional_params` | object | PUEDE | Parámetros de evaluación específicos de la institución |

### 4.5 Bloque de resultado de evaluación

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `decision` | string | DEBE | `APROBADO`, `DENEGADO` o `ESCALADO` |
| `checks` | array | DEBE | Lista ordenada de verificaciones de evaluación realizadas |
| `denial_reason` | string | DEBE si DENEGADO | Razón legible de denegación. `null` si APROBADO |

### 4.6 Objeto VerificacionEvaluacion

```json
{
  "check_name": "<string>",
  "result": "passed | failed | skipped",
  "value": "<valor evaluado o null>"
}
```

Verificaciones de ejemplo:
```json
[
  { "check_name": "amount_within_limit",  "result": "passed", "value": "1500.00 <= 5000.00" },
  { "check_name": "supplier_verified",    "result": "passed", "value": "true" },
  { "check_name": "delegation_active",    "result": "passed", "value": "true" },
  { "check_name": "risk_below_threshold", "result": "passed", "value": "0.12 <= 0.30" }
]
```

---

## 5. Semántica de Captura

### 5.1 Cuándo capturar

La instantánea DEBE capturarse en el momento en que se ejecuta la evaluación de política — ni antes ni después. La marca de tiempo `snapshot_at` DEBE reflejar el momento real de evaluación.

### 5.2 Relación con el Token de Ejecución

El ET se emite solo después de que la evaluación de política devuelve `APROBADO`. Por tanto:

```
snapshot_at ≤ et.issued_at ≤ et.expires_at
execution_id hace referencia al ET emitido sobre la base de esta instantánea APROBADA
```

Una instantánea con `decision: DENEGADO` NO produce un Token de Ejecución.

### 5.3 Inmutabilidad

Una vez capturada y firmada, una `InstantaneaContextoPolitica` es inmutable. La política puede cambiar después de `snapshot_at` — la instantánea preserva el estado tal como era. Un verificador DEBE usar `policy_hash` para recuperar el documento de política histórico, no el actual.

---

## 6. Algoritmo de Validación

```
ValidarInstantaneaContextoPolitica(ics, et, almacen_politicas):
  1. Verificar ics.ver == "1.0"
  2. Verificar ics.execution_id == et.et_id
  3. Verificar ics.snapshot_at dentro de la ventana de validez del ET
  4. Recuperar policy_doc = almacen_politicas.get(ics.policy.policy_id, version=ics.policy.policy_version)
  5. Verificar sha256(policy_doc) == ics.policy.policy_hash
  6. Re-ejecutar evaluación de política con ics.evaluation_context → decision_esperada
  7. Verificar decision_esperada == ics.evaluation_result.decision
  8. Verificar ics.sig (firma institucional) sobre JSON canónico
  → VÁLIDO | INVÁLIDO(razón)
```

El Paso 6 (re-ejecución) requiere que el verificador tenga acceso al motor de política identificado en `policy_engine` y al documento de política recuperado en el Paso 4. Si el motor de política no está disponible, la validación puede proceder al Paso 7 sin el Paso 6, pero DEBE marcarse como `parcialmente_verificado`.

---

## 7. Vinculación al Libro Mayor de Auditoría

La entrada del libro mayor para cada ejecución autorizada DEBE incluir:

```json
{
  "event_type": "POLICY_SNAPSHOT",
  "snapshot_id": "...",
  "execution_id": "...",
  "decision": "APROBADO | DENEGADO | ESCALADO",
  "policy_id": "...",
  "policy_version": "...",
  "policy_hash": "..."
}
```

Para decisiones `DENEGADO`, el libro mayor DEBE registrar la instantánea aunque no se emita ET. Esto crea un registro auditable de intentos de autorización rechazados.

---

## 8. Requisitos del Almacén de Políticas

Una institución conforme con ACP DEBE mantener un **Almacén de Políticas** — un registro de solo adición de todas las versiones de política, indexado por `(policy_id, policy_version)`, con acceso por contenido direccionable mediante `policy_hash`. El Almacén de Políticas DEBE retener todas las versiones históricas de política durante al menos el período de retención institucional.

La API del Almacén de Políticas (si se expone) DEBE autenticarse según ACP-API-1.0.

---

## 9. Códigos de Error

| Código | Significado |
|--------|-------------|
| `PCTX-001` | `execution_id` no coincide con el ET vinculado |
| `PCTX-002` | `snapshot_at` fuera de la ventana de validez del ET |
| `PCTX-003` | Documento de política no encontrado en el almacén de políticas |
| `PCTX-004` | Discrepancia de hash de política |
| `PCTX-005` | La re-evaluación de política no concuerda con la decisión capturada |
| `PCTX-006` | Firma institucional inválida |
| `PCTX-007` | Campo requerido faltante |
| `PCTX-008` | `decision: APROBADO` pero no se encontró ET vinculado |

---

## 10. Conformidad

| Nivel de Conformidad | Requisito |
|---------------------|-----------|
| L1-CORE | PUEDE omitir completamente |
| L2-SECURITY | DEBERÍA registrar policy_id y policy_hash en el libro mayor |
| L3-FULL | DEBE producir `InstantaneaContextoPolitica` completa para cada ejecución |
| L4-EXTENDED | DEBE producir instantánea completa + vincular `denial_reason` a eventos de reputación (ACP-REP-1.2) |
| L5-DECENTRALIZED | DEBE producir instantánea completa con referencia de almacén de políticas descentralizado |

---

## 11. Referencias Normativas

- ACP-SIGN-1.0 — Serialización y firma
- ACP-EXEC-1.0 — Especificación del token de ejecución
- ACP-LEDGER-1.2 — Libro mayor de auditoría
- ACP-PROVENANCE-1.0 — Procedencia de autoridad (artefacto complementario)
- ACP-RISK-1.0 — Puntuación de riesgo (fuente de `risk_score`)
- ACP-LIA-1.0 — Atribución de responsabilidad (consume InstantaneaContextoPolitica)
- ACP-CONF-1.1 — Niveles de conformidad
