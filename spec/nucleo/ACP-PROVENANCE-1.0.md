# ACP-PROVENANCE-1.0
## Especificación de Procedencia de Autoridad

**Estado:** Borrador
**Versión:** 1.0
**Tipo:** Especificación de Protocolo Central
**Depende-de:** ACP-SIGN-1.0, ACP-DCMA-1.0, ACP-EXEC-1.0, ACP-LEDGER-1.2
**Requerido-por:** ACP-CONF-1.1 (L3-FULL), ACP-LIA-1.0

> Esta especificación es **normativa**. Define el objeto de Procedencia de Autoridad — el artefacto estructurado que prueba, en el momento de ejecución, la cadena completa de autoridad detrás de una acción de agente. Las implementaciones que afirmen conformidad L3-FULL DEBEN producir un objeto `AutoridadProcedencia` válido para cada ejecución.

---

## 1. Alcance

Este documento define:

1. El **objeto de Procedencia de Autoridad** (`AutoridadProcedencia`) — su estructura, campos requeridos y contrato de firma.
2. El **algoritmo de validación de procedencia** — cómo un verificador reconstruye y comprueba la cadena.
3. **Reglas de vinculación** — cómo `AutoridadProcedencia` se adjunta a Tokens de Ejecución y entradas del Libro Mayor.
4. **Semántica de auditoría** — cómo la procedencia habilita la reconstrucción retroactiva de autoridad.

### Lo que esto NO es

- No es un mecanismo de delegación. La delegación se define en ACP-DCMA-1.0.
- No es un mecanismo de aplicación de políticas. La aplicación de políticas se define en ACP-EXEC-1.0.
- No es un mecanismo de revocación. La revocación se define en ACP-REV-1.0.

`AutoridadProcedencia` es un **artefacto de prueba retroactivo** — responde: *¿con qué autoridad se tomó esta acción, en este momento, a través de esta cadena?*

---

## 2. Motivación

El invariante central de ACP es:

```
Execute(req) ⟹ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk
```

ACP-DCMA-1.0 garantiza que `ValidDelegationChain` se mantenga en el momento de la delegación. Sin embargo, en el momento de auditoría o disputa, un verificador necesita reconstruir la cadena de autoridad completa a partir de la evidencia disponible en el momento de la ejecución — no a partir de una consulta al sistema en vivo. Esto crea un requisito distinto: una instantánea autocontenida, firmada y verificable del estado de autoridad que existía cuando se autorizó la acción.

Sin `AutoridadProcedencia`, las siguientes preguntas no pueden responderse solo con la pista de auditoría:
- ¿Quién era el principal original que autorizó la capacidad?
- ¿Qué delegadores intermedios estaban activos en el momento de la ejecución?
- ¿Bajo qué versión de política era válida la delegación?
- ¿La propia delegación del delegador seguía siendo válida en ese momento?

---

## 3. Definiciones

**Principal:** La institución o persona que origina la autoridad. La raíz de cada cadena de delegación.

**Delegador:** Un agente que posee una capacidad y pasa un subconjunto de ella a un ejecutor mediante ACP-DCMA-1.0.

**Ejecutor:** El agente que presenta `AutoridadProcedencia` en el momento de la ejecución.

**Paso de delegación:** Una tupla `(delegador, ejecutor, subconjunto_capacidad, delegation_id, válido_en)` en la cadena.

**Alcance de autoridad:** La intersección de todos los subconjuntos de capacidad a lo largo de la cadena de delegación. DEBE ser igual o más estrecha que la capacidad solicitada del Token de Ejecución.

**Firma de procedencia:** Una firma Ed25519 sobre la serialización JSON canónica del objeto `AutoridadProcedencia`, producida por la clave institucional ACP (ACP-ITA-1.0).

---

## 4. Objeto AutoridadProcedencia

### 4.1 Estructura de alto nivel

```json
{
  "ver": "1.0",
  "provenance_id": "<uuid_v4>",
  "execution_id": "<et_id del Token de Ejecución vinculado>",
  "captured_at": "<unix_segundos>",
  "principal": "<institution_id>",
  "executor": "<AgentID>",
  "authority_scope": "<cadena de capacidad ACP>",
  "chain": [ <PasoDelegacion>, ... ],
  "policy_ref": "<policy_id>:<policy_version>",
  "policy_hash": "<sha256_hex>",
  "sig": "<base64url firma Ed25519>"
}
```

### 4.2 Definiciones de campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `ver` | string | DEBE | Siempre `"1.0"` |
| `provenance_id` | UUID v4 | DEBE | Identificador único para este objeto de procedencia |
| `execution_id` | string | DEBE | `et_id` del Token de Ejecución al que está vinculado este objeto |
| `captured_at` | integer | DEBE | Unix segundos. Marca de tiempo de captura de procedencia. DEBE estar dentro de la ventana de validez del ET |
| `principal` | string | DEBE | ID de institución que es la fuente de autoridad raíz |
| `executor` | string | DEBE | AgentID del agente que presenta el ET |
| `authority_scope` | string | DEBE | Cadena de capacidad ACP que representa el alcance efectivo. DEBE ser ≤ alcance en ET |
| `chain` | array | DEBE | Pasos de delegación ordenados del principal al ejecutor. Mínimo 1 elemento |
| `policy_ref` | string | DEBE | `<policy_id>:<policy_version>` de la política institucional en vigor |
| `policy_hash` | string | DEBE | Resumen hex SHA-256 del documento de política en `captured_at` |
| `sig` | string | DEBE | Firma Ed25519 base64url del JSON canónico (excluyendo el campo `sig`) |

### 4.3 Objeto PasoDelegacion

```json
{
  "step": 1,
  "delegator": "<AgentID o institution_id>",
  "executor": "<AgentID>",
  "delegation_id": "<DEL-XXXX>",
  "capability_subset": "<cadena de capacidad ACP>",
  "delegated_at": "<unix_segundos>",
  "valid_until": "<unix_segundos>",
  "delegation_sig": "<firma Ed25519 base64url de este paso>"
}
```

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `step` | integer | DEBE | Posición en la cadena, comenzando en 1 |
| `delegator` | string | DEBE | AgentID o institution_id de la parte delegante. El delegador del Paso 1 DEBE ser `principal` |
| `executor` | string | DEBE | AgentID que recibe autoridad en este paso |
| `delegation_id` | string | DEBE | Referencia al registro de delegación en ACP-DCMA-1.0 |
| `capability_subset` | string | DEBE | Subconjunto de capacidad pasado en este paso. DEBE ser ⊆ `capability_subset` del paso anterior |
| `delegated_at` | integer | DEBE | Unix segundos cuando se creó la delegación |
| `valid_until` | integer | DEBE | Unix segundos del vencimiento de la delegación. DEBE ser ≥ `captured_at` |
| `delegation_sig` | string | DEBE | Firma Ed25519 de este paso por la clave del `delegator` |

---

## 5. Propiedades Formales

### P1 — Completitud de cadena
La cadena DEBE formar un camino continuo desde `principal` hasta `executor`:

```
chain[1].delegator = principal
chain[i].executor = chain[i+1].delegator  (para todo i < len(chain))
chain[ultimo].executor = executor
```

### P2 — Restricción monotónica de capacidad
Cada paso NO DEBE expandir la capacidad:

```
capability_subset(step_i+1) ⊆ capability_subset(step_i)
authority_scope ⊆ capability_subset(step_ultimo)
```

### P3 — Validez temporal
Cada paso DEBE ser válido en `captured_at`:

```
∀ step ∈ chain: step.valid_until ≥ captured_at
```

### P4 — Vinculación de procedencia
El `execution_id` DEBE coincidir con el `et_id` del Token de Ejecución que desencadenó la acción. Un objeto de procedencia NO DEBE reutilizarse entre diferentes ejecuciones.

### P5 — Integridad de firma
El campo `sig` cubre el JSON canónico del objeto `AutoridadProcedencia` con `sig` establecido en `""` (cadena vacía), serializado con claves en orden lexicográfico, sin espacios en blanco, codificación UTF-8.

---

## 6. Algoritmo de Validación

```
ValidarProcedencia(ap, et, almacen_politicas):
  1. Verificar ap.ver == "1.0"
  2. Verificar ap.execution_id == et.et_id
  3. Verificar ap.captured_at está dentro de et.valid_from..et.expires_at
  4. Verificar P1: completitud de cadena
  5. Verificar P2: restricción monotónica de capacidad
  6. Verificar P3: validez temporal (todos los pasos válidos en ap.captured_at)
  7. Verificar cada step.delegation_sig contra la clave pública registrada del delegador (ACP-AGENT-1.0)
  8. Verificar ap.policy_hash contra almacen_politicas.get(ap.policy_ref, en=ap.captured_at)
  9. Verificar ap.sig (firma institucional) sobre JSON canónico
  → VÁLIDO | INVÁLIDO(razón)
```

Un `AutoridadProcedencia` inválido DEBE causar que la entrada del libro mayor asociada sea marcada como `provenance_invalid`. NO anula retroactivamente la ejecución (que puede haber ocurrido), pero es una falla de conformidad bajo ACP-CONF-1.1 L3.

---

## 7. Vinculación al Token de Ejecución

El Token de Ejecución (ACP-EXEC-1.0) DEBE incluir el campo `provenance_id` cuando la implementación apunte a L3-FULL o superior:

```json
{
  "et_id": "...",
  "provenance_id": "<uuid_v4 que coincide con AutoridadProcedencia.provenance_id>",
  ...
}
```

El objeto `AutoridadProcedencia` DEBE almacenarse en el Libro Mayor de Auditoría (ACP-LEDGER-1.2) como un tipo de evento `PROVENANCE`, vinculado al evento `EXECUTION` mediante `execution_id`.

---

## 8. Vinculación al Libro Mayor de Auditoría

La entrada del libro mayor para el evento de ejecución DEBE referenciar la procedencia:

```json
{
  "event_type": "EXECUTION",
  "et_id": "...",
  "provenance_id": "...",
  "provenance_status": "valid | invalid | missing"
}
```

`provenance_status: missing` solo está permitido para implementaciones L1-CORE y L2-SECURITY. L3-FULL y superiores NO DEBEN producir `missing`.

---

## 9. Procedencia Mínima vs. Completa

Para implementaciones que apunten a L1-CORE o L2-SECURITY, una estructura de **procedencia mínima** es RECOMENDADA pero no requerida:

```json
{
  "ver": "1.0",
  "provenance_id": "<uuid_v4>",
  "execution_id": "<et_id>",
  "captured_at": "<unix_segundos>",
  "principal": "<institution_id>",
  "executor": "<AgentID>",
  "authority_scope": "<capacidad>",
  "chain": []
}
```

Una procedencia mínima con `chain: []` indica autorización institucional directa sin delegación intermedia. Aun así DEBE incluir una `sig` válida.

---

## 10. Códigos de Error

| Código | Significado |
|--------|-------------|
| `PROV-001` | Cadena incompleta — ruptura detectada entre pasos |
| `PROV-002` | Escalada de capacidad — el paso expande la capacidad del anterior |
| `PROV-003` | Paso de delegación vencido — `valid_until` < `captured_at` |
| `PROV-004` | Firma de paso inválida |
| `PROV-005` | Firma institucional inválida |
| `PROV-006` | Discrepancia de hash de política |
| `PROV-007` | `execution_id` no coincide con el ET vinculado |
| `PROV-008` | `captured_at` fuera de la ventana de validez del ET |
| `PROV-009` | Discrepancia de ejecutor — `chain[ultimo].executor` ≠ `executor` |

---

## 11. Conformidad

| Nivel de Conformidad | Requisito |
|---------------------|-----------|
| L1-CORE | PUEDE omitir la procedencia completamente |
| L2-SECURITY | DEBERÍA producir procedencia mínima (chain: []) |
| L3-FULL | DEBE producir procedencia completa con cadena completa |
| L4-EXTENDED | DEBE producir procedencia completa + vincular a consulta de reputación (ACP-REP-1.2) |
| L5-DECENTRALIZED | DEBE producir procedencia completa con pasos de delegación basados en DID |

---

## 12. Referencias Normativas

- ACP-SIGN-1.0 — Serialización y firma
- ACP-DCMA-1.0 — Modelo de cadena de delegación y atestación
- ACP-EXEC-1.0 — Especificación del token de ejecución
- ACP-LEDGER-1.2 — Libro mayor de auditoría
- ACP-LIA-1.0 — Atribución de responsabilidad (consume AutoridadProcedencia)
- ACP-CONF-1.1 — Niveles de conformidad
