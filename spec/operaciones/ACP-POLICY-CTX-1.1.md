# ACP-POLICY-CTX-1.1
## Especificación de Instantánea de Contexto de Política

**Estado:** Borrador
**Versión:** 1.1
**Tipo:** Especificación de Protocolo de Operaciones
**Supercede:** ACP-POLICY-CTX-1.0
**Depende-de:** ACP-SIGN-1.0, ACP-EXEC-1.0, ACP-LEDGER-1.3, ACP-PROVENANCE-1.0
**Requerido-por:** ACP-CONF-1.2 (L3-FULL), ACP-LIA-1.0

> Esta especificación es **normativa**. Define la Instantánea de Contexto de Política (`InstantaneaContextoPolitica`) — el registro firmado del estado exacto de la política que estaba en vigor en el momento en que se autorizó una acción de agente, incluyendo la validez temporal de la política en el momento de captura. Las implementaciones que afirmen conformidad L3-FULL DEBEN producir una `InstantaneaContextoPolitica` válida conforme a esta especificación para cada ejecución.

---

## 1. Alcance

Este documento define:

1. El objeto **InstantaneaContextoPolitica** — su estructura, campos requeridos y registro de evaluación.
2. **Semántica de captura de instantánea** — cuándo y cómo DEBE tomarse la instantánea.
3. **Validez temporal** — cómo se aplica la frescura de la política capturada.
4. **Modelo de aplicación de frescura** — restricción híbrida productor/verificador.
5. **Reglas de vinculación** — cómo la instantánea se adjunta a Tokens de Ejecución y entradas del Libro Mayor.
6. **Verificación retrospectiva** — cómo un verificador usa la instantánea para reconstruir la decisión de política.

### Lo que esto NO es

- No es un lenguaje de política ni un motor de aplicación de políticas. ACP no define cómo se escriben las políticas.
- No es un mecanismo de consulta de políticas en tiempo real.
- No es un mecanismo de delegación (ver ACP-DCMA-1.1).

`InstantaneaContextoPolitica` es un **artefacto de evidencia en un punto del tiempo** — preserva el estado de la política en el momento de ejecución para que, en cualquier punto futuro, un verificador pueda confirmar que la acción era conforme a la política cuando ocurrió y que la política era vigente en el momento de su evaluación.

---

## 2. Motivación

ACP-POLICY-CTX-1.0 registra `policy_hash` (qué política se usó) y `snapshot_at` (cuándo ocurrió la evaluación), pero no registra cuándo el documento de política fue obtenido del almacén de políticas. Esto crea una brecha de validez temporal: una política obsoleta en caché podría usarse para evaluación, y la instantánea pasaría todas las validaciones de la versión 1.0 sin ninguna indicación de que la política estaba desactualizada al momento de captura.

ACP-POLICY-CTX-1.1 cierra esta brecha añadiendo:

1. **`policy_captured_at`** — cuándo se obtuvo la política del almacén de políticas.
2. **`delta_max`** — la máxima obsolescencia permitida declarada por el productor.
3. **Aplicación de frescura** — un modelo híbrido que asegura que ni el productor ni un atacante puedan eludir el límite de obsolescencia del verificador.

Esto habilita la **reconstrucción retrospectiva de política temporalmente verificada** — un verificador puede confirmar no solo que la acción era conforme a la política, sino que la política era válida y vigente en el momento de evaluación.

---

## 3. Definiciones

**Política:** Un documento o conjunto de reglas institucional que determina si una acción específica de agente está autorizada. ACP no impone un lenguaje de política; el formato de instantánea es agnóstico al lenguaje.

**Versión de política:** Un identificador monótonamente creciente (semver o entero) que cambia siempre que el documento de política cambia.

**Hash de política:** Un resumen SHA-256 de la representación canónica en bytes del documento de política en `snapshot_at`.

**Resultado de evaluación:** La salida de aplicar la política a la solicitud de ejecución específica — `APPROVED`, `DENIED` o `ESCALATED`.

**Contexto de evaluación:** El conjunto de entradas proporcionadas al motor de política: identidad del agente, capacidad solicitada, recurso, puntuación de riesgo, estado de delegación y cualquier parámetro adicional.

**Límite de instantánea:** La política DEBE capturarse tal como existía en `snapshot_at`, no como existe en el momento de verificación.

**`policy_captured_at`** [NUEVO]: Marca de tiempo Unix en segundos de cuándo el documento de política fue obtenido del almacén de políticas. DEBE ser proporcionado por el llamador. NO DEBE generarse dentro de la función de creación de instantánea.

**`delta_max`** [NUEVO]: Intervalo máximo permitido en segundos entre `policy_captured_at` y `snapshot_at`, según lo declarado por el productor. Sujeto a aplicación por el verificador.

**frescura** [NUEVO]: `frescura = snapshot_at − policy_captured_at`. La antigüedad del documento de política en el momento de evaluación.

**sesgo de reloj** [NUEVO]: Pequeña deriva temporal entre relojes de diferentes sistemas. Tolerancia: 5 segundos.

**`verifier.delta_max_allowed`** [NUEVO]: Máxima obsolescencia de política aceptada por una institución verificadora. Valor normativo por defecto: 300 segundos. Las instituciones PUEDEN definir un valor menor. Las instituciones NO DEBEN establecerlo por encima de 300 segundos.

---

## 4. Objeto InstantaneaContextoPolitica

### 4.1 Estructura de alto nivel

```json
{
  "ver": "1.1",
  "snapshot_id": "<uuid_v4>",
  "execution_id": "<et_id del Token de Ejecución vinculado>",
  "provenance_id": "<provenance_id de AutoridadProcedencia vinculada>",
  "snapshot_at": "<unix_segundos>",
  "policy_captured_at": "<unix_segundos>",
  "delta_max": "<entero_segundos>",
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
    "decision": "APPROVED | DENIED | ESCALATED",
    "checks": [ "<VerificacionEvaluacion>", "..." ],
    "denial_reason": "<string o null>"
  },
  "sig": "<base64url firma Ed25519>"
}
```

### 4.2 Definiciones de campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `ver` | string | DEBE | `"1.1"` |
| `snapshot_id` | UUID v4 | DEBE | Identificador único para esta instantánea |
| `execution_id` | string | DEBE | `et_id` del Token de Ejecución vinculado |
| `provenance_id` | string | DEBERÍA | `provenance_id` de la `AutoridadProcedencia` vinculada (DEBE en L3-FULL) |
| `snapshot_at` | integer | DEBE | Unix segundos. DEBE estar dentro de la ventana de validez del ET |
| `policy_captured_at` | integer | DEBE en L3 | Unix segundos. Cuándo se obtuvo la política del almacén. Proporcionado por el llamador, no generado internamente. |
| `delta_max` | integer | DEBE en L3 | Segundos máximos de obsolescencia declarados por el productor. NO DEBE superar `verifier.delta_max_allowed`. |
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
| `decision` | string | DEBE | `APPROVED`, `DENIED` o `ESCALATED` |
| `checks` | array | DEBE | Lista ordenada de verificaciones de evaluación realizadas |
| `denial_reason` | string | DEBE si DENIED | Razón legible de denegación. `null` si APPROVED |

### 4.6 Objeto VerificacionEvaluacion

```json
{
  "check_name": "<string>",
  "result": "passed | failed | skipped",
  "value": "<valor evaluado o null>"
}
```

---

## 5. Semántica de Captura

### 5.1 Cuándo capturar

La instantánea DEBE capturarse en el momento en que se ejecuta la evaluación de política — ni antes ni después. La marca de tiempo `snapshot_at` DEBE reflejar el momento real de evaluación.

### 5.2 Relación con el Token de Ejecución

El ET se emite solo después de que la evaluación de política devuelve `APPROVED`. Por tanto:

```
snapshot_at ≤ et.issued_at ≤ et.expires_at
execution_id hace referencia al ET emitido sobre la base de esta instantánea APPROVED
```

Una instantánea con `decision: DENIED` NO produce un Token de Ejecución.

### 5.3 Validez Temporal [ACTUALIZADO]

Dos restricciones temporales DEBEN cumplirse de forma independiente:

**(a) Restricción de orden:**

```
policy_captured_at ≤ snapshot_at
```

Excepción — sesgo de reloj: si `policy_captured_at > snapshot_at` y
`(policy_captured_at − snapshot_at) ≤ 5s`, la instantánea se acepta como deriva de reloj.
Si el sesgo supera 5 segundos → PCTX-009.

**(b) Restricción de frescura:**

```
(snapshot_at − policy_captured_at) ≤ delta_max
```

Estas dos restricciones son independientes. `delta_max` NO se aplica a casos de sesgo de reloj. Un caso de sesgo de reloj es un modo de fallo distinto de la obsolescencia.

### 5.4 Modelo de Aplicación de Frescura [NUEVO]

El límite de frescura efectivo es:

```
efectivoMax = min(snapshot.delta_max, verifier.delta_max_allowed)
```

Todas las validaciones de frescura DEBEN usar `efectivoMax`, no `snapshot.delta_max` solo.

**`verifier.delta_max_allowed`:**
- Valor normativo por defecto: **300 segundos** (consistente con la ventana de validez del ET)
- Las instituciones PUEDEN definir un valor menor
- Las instituciones NO DEBEN establecerlo por encima de 300 segundos
- `snapshot.delta_max` NO DEBE superar `verifier.delta_max_allowed` → si no, PCTX-009

**Justificación:** El productor declara su tolerancia; el verificador aplica su propio límite. Un productor no puede inflar `delta_max` para eludir la política del verificador. El `min()` asegura que prevalezca el límite más estricto.

### 5.5 Restricción de Ejecución Offline [NUEVO]

En L3-FULL, una `InstantaneaContextoPolitica` cuyas restricciones de frescura no se cumplan DEBE rechazarse (PCTX-009). Esto incluye:

- Agentes operando offline con políticas obsoletas en caché
- Instantáneas diferidas capturadas horas antes de la evaluación
- Cualquier instantánea donde `(snapshot_at − policy_captured_at) > efectivoMax`

No existe bandera de anulación offline. El modo offline es incompatible con los requisitos de frescura de política de L3-FULL.

### 5.6 Responsabilidad de Captura [NUEVO]

`policy_captured_at` DEBE ser proporcionado por el sistema que obtiene la política del almacén de políticas. NO DEBE generarse dentro de la función de creación de instantánea (`Capture()`).

`delta_max` también DEBE ser proporcionado por el llamador. La función de creación de instantánea NO DEBE inferir o establecer valores predeterminados para estos campos.

---

## 6. Algoritmo de Validación [ACTUALIZADO]

```
ValidarInstantaneaContextoPolitica(ics, et, config_verificador):

  1. Verificar ics.ver ∈ {"1.0", "1.1"}
     → si no, PCTX-010

  2. Verificar ics.execution_id == et.et_id
     → si no, PCTX-001

  3. Verificar ics.snapshot_at dentro de la ventana de validez del ET
     → si no, PCTX-002

  4. Si ics.ver == "1.0":
        omitir validación de frescura (compatibilidad retroactiva §12)
        ir al paso 9

  5. Verificar ics.policy_captured_at presente (no cero)
     → si no, PCTX-009

  6. Orden temporal con tolerancia de sesgo de reloj (§5.3):
        diff = ics.snapshot_at − ics.policy_captured_at
        si diff < 0:
            si |diff| ≤ 5s → aceptar (sesgo de reloj)
            si no → PCTX-009

  7. Verificar ics.delta_max presente (no cero)
     → si no, PCTX-009

  8. Aplicación de frescura (§5.4):
        efectivoMax = min(ics.delta_max, config_verificador.delta_max_allowed)
        si ics.delta_max > config_verificador.delta_max_allowed → PCTX-009
        si diff > efectivoMax → PCTX-009

  9. Recuperar policy_doc = almacen_politicas.get(ics.policy.policy_id,
                                                   version=ics.policy.policy_version)
     → si no, PCTX-003

 10. Verificar sha256(policy_doc) == ics.policy.policy_hash
     → si no, PCTX-004

 11. Re-ejecutar evaluación de política con ics.evaluation_context → decision_esperada
     Verificar decision_esperada == ics.evaluation_result.decision
     → si no, PCTX-005

 12. Verificar ics.sig (firma institucional) sobre JSON canónico
     → si no, PCTX-006

 13. Retornar VÁLIDO
```

El Paso 11 (re-ejecución) requiere que el verificador tenga acceso al motor de política identificado en `policy_engine` y al documento de política recuperado en el Paso 9. Si el motor de política no está disponible, la validación puede proceder sin el Paso 11 pero DEBE marcarse como `parcialmente_verificado`.

---

## 7. Vinculación al Libro Mayor de Auditoría

La entrada del libro mayor para cada ejecución autorizada DEBE incluir:

```json
{
  "event_type": "POLICY_SNAPSHOT",
  "snapshot_id": "...",
  "execution_id": "...",
  "decision": "APPROVED | DENIED | ESCALATED",
  "policy_id": "...",
  "policy_version": "...",
  "policy_hash": "..."
}
```

Para decisiones `DENIED`, el libro mayor DEBE registrar la instantánea aunque no se emita ET. Esto crea un registro auditable de intentos de autorización rechazados.

---

## 8. Requisitos del Almacén de Políticas

Una institución conforme con ACP DEBE mantener un **Almacén de Políticas** — un registro de solo adición de todas las versiones de política, indexado por `(policy_id, policy_version)`, con acceso por contenido direccionable mediante `policy_hash`. El Almacén de Políticas DEBE retener todas las versiones históricas de política durante al menos el período de retención institucional.

La API del Almacén de Políticas (si se expone) DEBE autenticarse según ACP-API-1.0.

---

## 9. Requisitos de Ejecución — Aplicación entre Especificaciones [NUEVO]

### 9.1 Integración con DCMA

En L3-FULL, cualquier ejecución de agente regida por ACP-DCMA-1.1 DEBE estar acompañada por una `InstantaneaContextoPolitica` válida conforme a esta especificación (ver: `"1.1"`). Una ejecución sin una instantánea válida NO DEBE considerarse conforme con L3.

### 9.2 Integración Cross-Organizacional

En L3-FULL, los eventos `CROSS_ORG_INTERACTION` (ACP-CROSS-ORG-1.1) DEBEN incluir una `InstantaneaContextoPolitica` válida. La instantánea DEBE transmitirse como parte del paquete de interacción.

### 9.3 Validación Independiente

Las instituciones receptoras DEBEN validar de forma independiente la frescura de cualquier `InstantaneaContextoPolitica` incluida en una interacción cross-org. La institución receptora aplica su propio `verifier.delta_max_allowed`, no el del emisor.

### 9.4 Semántica de Fallo

Cualquier instantánea que falle la validación de frescura DEBE causar que la interacción o ejecución contenedora sea rechazada con el error PCTX-009.

> **Nota:** Las reglas formales por especificación (DCMA-RULE-7, CROSS-RULE-9, CROSS-RULE-10) se añadirán en versiones futuras de esas especificaciones. El §9 de esta especificación establece el requisito normativo para implementaciones conformes con L3 ahora.

---

## 10. Códigos de Error [ACTUALIZADO]

| Código | Significado |
|--------|-------------|
| `PCTX-001` | `execution_id` no coincide con el ET vinculado |
| `PCTX-002` | `snapshot_at` fuera de la ventana de validez del ET |
| `PCTX-003` | Documento de política no encontrado en el almacén de políticas |
| `PCTX-004` | Discrepancia de hash de política |
| `PCTX-005` | La re-evaluación de política no concuerda con la decisión capturada |
| `PCTX-006` | Firma institucional inválida |
| `PCTX-007` | Campo requerido faltante |
| `PCTX-008` | `decision: APPROVED` pero no se encontró ET vinculado |
| `PCTX-009` | Captura de política obsoleta o inválida — cubre: `policy_captured_at` faltante, frescura superada, `snapshot.delta_max > verifier.delta_max_allowed`, sesgo de reloj superado |

---

## 11. Conformidad [ACTUALIZADO]

| Nivel de Conformidad | Requisito |
|---------------------|-----------|
| L1-CORE | PUEDE omitir completamente |
| L2-SECURITY | DEBERÍA registrar `policy_id` y `policy_hash` en el libro mayor |
| L3-FULL | DEBE producir `InstantaneaContextoPolitica` completa (ver `"1.1"`) con `policy_captured_at`, `delta_max` y validación de frescura |
| L4-EXTENDED | DEBE producir instantánea completa + vincular `denial_reason` a eventos de reputación (ACP-REP-1.2) |
| L5-DECENTRALIZED | DEBE producir instantánea completa con referencia de almacén de políticas descentralizado |

---

## 12. Modelo de Compatibilidad [NUEVO]

ACP-POLICY-CTX-1.1 es retrocompatible con 1.0:

- Todos los campos de la versión 1.0 se conservan sin cambios.
- Las instantáneas con `ver: "1.0"` siguen siendo válidas; la validación de frescura se omite completamente.
- Las instantáneas `ver: "1.1"` añaden `policy_captured_at` y `delta_max` (DEBE en L3-FULL).
- Un verificador 1.1 DEBE aceptar tanto instantáneas `"1.0"` como `"1.1"`.
- Cuando `ver == "1.0"`, el algoritmo de validación salta del paso 3 directamente al paso 9 (§6).

---

## 13. Fuera del Alcance (ACP-POLICY-CTX-1.1)

Los siguientes aspectos están explícitamente fuera del alcance de esta versión:

- Evaluación de múltiples políticas (array de políticas por ejecución)
- Semántica de expiración de documentos de política
- Vinculación de identidad o URL del almacén de políticas
- Consistencia de distribución de políticas entre organizaciones

Estos pueden abordarse en ACP-POLICY-CTX-2.0.

---

## 14. Referencias Normativas [ACTUALIZADO]

- ACP-SIGN-1.0 — Serialización y firma
- ACP-EXEC-1.0 — Especificación del token de ejecución
- ACP-LEDGER-1.3 — Libro mayor de auditoría
- ACP-PROVENANCE-1.0 — Procedencia de autoridad (artefacto complementario)
- ACP-RISK-1.0 — Puntuación de riesgo (fuente de `risk_score`)
- ACP-LIA-1.0 — Atribución de responsabilidad (consume InstantaneaContextoPolitica)
- ACP-CONF-1.2 — Niveles de conformidad
- ACP-DCMA-1.1 — Modelo de cadena de delegación
- ACP-CROSS-ORG-1.1 — Interacciones entre organizaciones
