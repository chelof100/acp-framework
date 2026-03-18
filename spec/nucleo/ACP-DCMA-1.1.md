# ACP-DCMA-1.1
## Delegation Chain Model & Attestation — Modelo Formal de Delegación Encadenada

**Status:** Normativo
**Version:** 1.1
**Type:** Especificación de Protocolo Core
**Supersede:** ACP-DCMA-1.0
**Depends-on:** ACP-CT-1.0, ACP-SIGN-1.0, ACP-HIST-1.0
**Required-by:** ACP-CONF-1.2 (L1 — Core Conformance)
**Integration note:** Los payloads DCMA se incluyen en eventos `AUTHORIZATION` y `LIABILITY_RECORD` del ledger (ACP-LEDGER-1.3 §5.2, §5.12). Esta es una integración operacional de solo escritura; ACP-LEDGER-1.3 no es requerido para que el modelo formal de delegación de DCMA sea correcto.

> Esta especificación es **normativa**. Define el modelo formal de delegación encadenada, no-escalación, revocación transitiva, límite máximo de profundidad de delegación y el esquema de registro de delegación requerido para interoperabilidad con ACP-PROVENANCE-1.0. Toda implementación ACP v1.x que soporte delegación MUST cumplir las propiedades formales aquí definidas.
>
> **Cambios respecto a DCMA-1.0:**
> - §6: `δ_max` es ahora un tope máximo normativo global (7 hops), no un parámetro puramente institucional.
> - §11: La propiedad "Profundidad limitada" ahora referencia §15 normativo.
> - §15 (NUEVO): Profundidad Máxima de Delegación — límite normativo, código de error DCMA-006.
> - §16 (NUEVO): Esquema de Registro de Delegación — formato canónico para interoperabilidad con PROVENANCE-1.0 y consultas cross-institucionales.
> - §14.4: Precisión de timestamp de revocación clarificada; precisión millisegundo RECOMENDADA.

---

## 1. Extensión del Espacio Formal

Añadimos:

𝐷 → conjunto de delegaciones

𝐼 → conjunto de instituciones

Un agente ahora pertenece a una institución:

Owner(a) ∈ I

## 2. Definición Formal de Delegación

Una delegación es una tupla:

d = (aᵢ, aⱼ, c, σ, τ)

Donde:

aᵢ = agente delegante

aⱼ = agente delegado

c = capacidad delegada

σ = restricciones adicionales

τ = intervalo de validez temporal

Interpretación:

El agente aᵢ delega la capacidad c al agente aⱼ bajo restricciones σ y tiempo τ.

## 3. Predicado de Delegación Válida

ValidDelegation(d)

Es verdadero si:

ValidID(aᵢ)

ValidID(aⱼ)

HasCapability(aᵢ, c)

Firma criptográfica válida de aᵢ

Tiempo actual ∈ τ

Restricciones σ compatibles con los límites originales

## 4. Capacidad Delegada

Definimos:

DelegatedCapability(aⱼ, c)

Verdadero si existe una delegación válida:

∃d ∈ D tal que d = (aᵢ, aⱼ, c, σ, τ) ∧ ValidDelegation(d)

El predicado de capacidad se redefine entonces como:

HasCapability′(aⱼ, c) ⟺ HasCapability(aⱼ, c) ∨ DelegatedCapability(aⱼ, c)

## 5. Restricción de No-Escalación

La delegación no puede expandir privilegios.

Formalmente:

Constraints(c_delegada) ⊆ Constraints(c_original)

Y:

σ ⊆ OriginalLimits(aᵢ, c)

Si el delegado intenta ejecutar fuera de esas restricciones:

Decision(req) = Denied

## 6. Delegación Encadenada

Permite transitividad controlada.

Cadena:

a₁ → a₂ → a₃

Es válida si:

Cada delegación intermedia es válida.

No se viola ninguna restricción acumulada.

Profundidad de delegación ≤ min(δ_institucional, δ_global)

Donde:
- `δ_global = 7` es el **tope máximo normativo** definido en §15 de esta especificación.
- `δ_institucional` es un límite específico por institución que PUEDE ser menor a 7 pero NO DEBE exceder 7.

Definimos:

DelegationDepth(aₖ) ≤ δ_max

Donde `δ_max = min(δ_institucional, 7)`.

Ver §15 para el cumplimiento normativo de profundidad, código de error DCMA-006 y justificación.

## 7. Evaluación Formal con Delegación

La regla de autorización se modifica:

Authorized(req) ⟺ ValidID(a) ∧ HasCapability′(a, c) ∧ PolicySatisfied(...) ∧ WithinLimits(...) ∧ AcceptableRisk(...)

La diferencia reside en HasCapability′.

## 8. Encadenamiento de Responsabilidad

Cada delegación genera un registro:

eₐ = (aᵢ, aⱼ, c, σ, τ, hash_prev)

Para una acción ejecutada bajo delegación, el ledger debe poder reconstruir:

a₁ → a₂ → ... → aₖ

Propiedad obligatoria:

Execution(aₖ, c) ⇒ TraceableChain(a₁, ..., aₖ)

Si no puede reconstruirse → no válido.

Ver §16 para el formato canónico de registro de delegación requerido para trazabilidad completa.

## 9. Revocación Transitiva

Si:

Revoke(aᵢ)

Entonces:

∀d donde delegator = aᵢ ⇒ Invalid(d)

Y recursivamente:

Toda cadena dependiente se invalida.

Esto previene delegaciones zombie.

## 10. Modelo Inter-Institucional

Para delegación entre instituciones:

Owner(aᵢ) ≠ Owner(aⱼ)

Requiere:

TrustAnchor(Owner(a_i), Owner(a_j))

Validación cruzada de certificados

Registro auditable por ambas partes

La delegación B2B solo es válida si ambas instituciones pueden verificar la firma.

## 11. Propiedades de Seguridad

La delegación ACP garantiza:

Sin escalación de privilegios.

Revocación propagada.

Trazabilidad completa.

Profundidad limitada (tope máximo normativo: 7 hops — ver §15).

Firma obligatoria en cada hop (ver §16).

## 12. Diferencia Estructural respecto a RBAC

RBAC permite asignación de roles.
No modela:

Delegación con restricciones dinámicas.

Encadenamiento verificable.

Revocación transitiva formal.

Responsabilidad multi-institucional.

ACP sí.

## 13. Punto Crítico

ACP ahora tiene:

Modelo de decisión formal

Modelo de identidad

Modelo de delegación encadenada

Propiedades de seguridad demostrables

Estructura auditable

---

## 14. Revocación Transitiva — Timing Normativo

La sección 9 define la propiedad formal de revocación transitiva. Esta sección establece los requisitos de timing de propagación que toda implementación conforme MUST satisfacer.

### 14.1 Propagación Máxima

Desde el momento en que Revoke(aᵢ) queda registrado en el sistema de revocación:

El verificador MUST garantizar que toda verificación posterior dentro de τ_propagation ≤ 60 segundos rechace:

- Tokens emitidos por aᵢ
- Tokens de cualquier cadena de delegación donde aᵢ es delegante (directo o transitivo)

El verificador MUST consultar el estado de revocación en cada decisión de autorización, sin excepción.

### 14.2 Caché de Estado de Revocación

Si el verificador usa un caché de estado de revocación:

- El TTL del caché MUST ser ≤ 30 segundos.
- Las entradas vencidas MUST invalidarse antes de la siguiente consulta de autorización.
- El verificador MUST aceptar un refresco forzado del caché ante cualquier notificación de revocación recibida vía canal de eventos.

Una implementación que no usa caché MUST consultar el almacén de revocación en tiempo real en cada decisión.

### 14.3 Solicitudes en Vuelo

Si ocurre una revocación mientras una solicitud de ejecución está en progreso:

- El verificador MUST re-evaluar el estado de revocación del agente y su cadena de delegación antes de emitir la confirmación de ejecución final.
- Una solicitud aprobada antes de la revocación MUST ser denegada si la revocación se detecta antes de la confirmación final.
- El sistema MUST emitir un error REVOKED con referencia al jti del token afectado.

### 14.4 Atomicidad de la Revocación

Revoke(aᵢ) tiene efecto atómico sobre el estado del sistema:

- No existe estado intermedio donde aᵢ esté parcialmente revocado.
- Todas las delegaciones dependientes (directas y transitivas) se invalidan simultáneamente desde el timestamp de revocación.
- El timestamp de revocación MUST registrarse con precisión de segundo y SHOULD registrarse con precisión de milisegundo para entornos de auditoría de alta frecuencia.
- El timestamp de revocación MUST ser consultable por auditores.

### 14.5 No-Conformidad por Timing

Una implementación NO es conforme respecto a la revocación transitiva si:

- Acepta tokens emitidos por un agente revocado más de 60 segundos después del timestamp de revocación.
- Usa un caché de revocación con TTL > 30 segundos.
- Confirma ejecuciones sin re-evaluar el estado de revocación cuando la revocación ocurrió durante el procesamiento de la solicitud.
- No registra el timestamp de revocación con al menos precisión de segundo.

---

## 15. Profundidad Máxima de Delegación

### 15.1 Tope Máximo Normativo

Toda implementación ACP conforme MUST hacer cumplir una profundidad máxima de cadena de delegación de **7 hops**.

```
δ_global = 7
```

**Requisito formal:**

```
ValidChain(chain) ⟺ len(chain) ≤ 7 ∧ ∀i ∈ chain: ValidDelegation(chain[i])
```

Cualquier solicitud que presente una cadena de delegación con `len(chain) > 7` MUST ser rechazada con el código de error:

```
DCMA-006: Profundidad máxima de delegación excedida
{
  "error": "DCMA-006",
  "message": "La cadena de delegación excede la profundidad máxima de 7 hops",
  "chain_length": <longitud_real>,
  "max_allowed": 7
}
```

### 15.2 Sub-Límites Institucionales

Una institución PUEDE configurar un límite local `δ_institucional ≤ 7`. El límite efectivo es:

```
δ_max = min(δ_institucional, 7)
```

Las instituciones NO DEBEN configurar `δ_institucional > 7`. Cualquier configuración de este tipo MUST ser rechazada al inicio con un error de configuración.

Si no se configura un límite institucional, se aplica `δ_max = 7`.

### 15.3 Conteo de Profundidad

La profundidad se cuenta como el número de eslabones de delegación en la cadena, no el número de agentes:

```
a₁ → a₂           profundidad = 1
a₁ → a₂ → a₃      profundidad = 2
...
a₁ → ... → a₈     profundidad = 7  (máximo)
a₁ → ... → a₉     profundidad = 8  (DCMA-006 — RECHAZADO)
```

El agente principal (a₁, el titular original de la capacidad) no cuenta hacia el límite de profundidad.

### 15.4 Justificación

Las cadenas de delegación institucionales reales raramente exceden 4 hops:

```
principal → jefe-de-área → team-lead → especialista → ejecutor
```

El límite de 7 proporciona margen para cadenas multi-institución complejas y al mismo tiempo acota:

1. **Costo computacional:** Complejidad de verificación O(profundidad) — acotada en O(7) = O(1) en la práctica.
2. **Superficie de DoS:** Las cadenas artificialmente profundas no pueden usarse para saturar el subsistema de verificación.
3. **Claridad de auditoría:** Las cadenas de más de 7 son difíciles de auditar manualmente; indican un problema estructural en el modelo de delegación.

### 15.5 Adición al Registro de Códigos de Error

| Código | Significado | HTTP status |
|--------|-------------|-------------|
| DCMA-001 | Identidad del delegante inválida | 401 |
| DCMA-002 | Escalación de capacidad detectada | 403 |
| DCMA-003 | Delegación expirada | 401 |
| DCMA-004 | Cadena rota (delegación intermedia faltante) | 400 |
| DCMA-005 | Delegación revocada en la cadena | 401 |
| **DCMA-006** | **Profundidad máxima de delegación excedida (> 7 hops)** | **400** |

---

## 16. Esquema de Registro de Delegación

### 16.1 Propósito

Esta sección define el formato canónico de **Registro de Delegación**. Toda implementación conforme MUST almacenar registros de delegación en este formato para habilitar:

1. Consulta de delegaciones cross-institucionales.
2. Interoperabilidad con la construcción de `DelegationStep` de ACP-PROVENANCE-1.0.
3. Consultas de auditoría retrospectiva vía ACP-HIST-1.0.

### 16.2 Esquema Canónico

```json
{
  "delegation_id": "DEL-<institution_id>-<local_id>",
  "delegator": "<AgentID>",
  "delegatee": "<AgentID>",
  "capability": "<cadena de capacidad ACP>",
  "constraints": {},
  "issued_at": "<unix_seconds>",
  "expires_at": "<unix_seconds>",
  "depth": <entero 1..7>,
  "parent_delegation_id": "<DEL-... o null si es raíz>",
  "sig": "<firma Ed25519 base64url>"
}
```

**Definición de campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `delegation_id` | string | MUST | ID único global. Formato: `DEL-<institution_id>-<local_id>` |
| `delegator` | string | MUST | AgentID ACP del agente delegante |
| `delegatee` | string | MUST | AgentID ACP del agente delegado |
| `capability` | string | MUST | Cadena de capacidad ACP (subconjunto de la capacidad del delegante) |
| `constraints` | object | MUST | Restricciones adicionales (objeto vacío si ninguna) |
| `issued_at` | integer | MUST | Timestamp Unix (segundos) cuando se emitió la delegación |
| `expires_at` | integer | MUST | Timestamp Unix (segundos) cuando expira la delegación |
| `depth` | integer | MUST | Profundidad en la cadena (1 = delegación directa desde el principal) |
| `parent_delegation_id` | string\|null | MUST | ID de la delegación padre, o null si es raíz |
| `sig` | string | MUST | Firma Ed25519 del delegante sobre todos los campos excepto `sig`, en forma canónica JCS |

### 16.3 Formato del ID de Delegación

```
delegation_id = "DEL-" + institution_id + "-" + local_id
```

- `institution_id`: El identificador de institución ACP (registrado en ACP-ITA-1.0).
- `local_id`: Un identificador único local dentro de la institución. PUEDE ser un UUID, un entero monotónicamente creciente, o cualquier otra cadena única localmente. NO DEBE contener guiones que se parsearían ambiguamente como separadores de institution_id.
- El `delegation_id` completo MUST ser único globalmente.

**Ejemplo:** `DEL-acme-corp-8a4f2b1c-00a3-4d2e-b9f1-2c3d4e5f6a7b`

### 16.4 Cómputo de la Firma

El campo `sig` cubre todos los demás campos en forma canónica JCS (RFC 8785):

```
sig = Ed25519Sign(clave_privada_delegante, JCS(registro_sin_sig))
```

Esta firma es lo que PROVENANCE-1.0 usa como `delegation_sig` en los objetos `DelegationStep`.

### 16.5 Almacén de Registros de Delegación

Toda implementación conforme MUST mantener un Almacén de Registros de Delegación consultable:

- **Escritura:** Los registros se escriben atómicamente cuando se emite una delegación.
- **Lectura:** Los registros MUST ser consultables por `delegation_id`, por `delegator` y por `delegatee`.
- **Retención:** Los registros MUST retenerse durante el período de auditoría completo (mínimo según regulaciones aplicables; por defecto 7 años).
- **Consulta cross-institucional:** Una delegación emitida por la Institución A y usada en una cadena presentada a la Institución B MUST ser recuperable por la Institución B vía consulta ACP-HIST-1.0 `?type=delegation&id=<delegation_id>`.

### 16.6 Integración con ACP-PROVENANCE-1.0

Al construir un `ProvenanceRecord` (PROVENANCE-1.0 §4.3), cada `DelegationStep.delegation_id` MUST referenciar un registro válido en el Almacén de Registros de Delegación, y `DelegationStep.delegation_sig` MUST ser igual al campo `sig` de ese registro.

Esto crea un vínculo criptográficamente verificable entre la prueba de provenance y los registros de delegación subyacentes.

---

## Apéndice: Resumen de Códigos de Error

| Código | Introducido | Significado |
|--------|-------------|-------------|
| DCMA-001 | 1.0 | Identidad del delegante inválida |
| DCMA-002 | 1.0 | Escalación de capacidad detectada |
| DCMA-003 | 1.0 | Delegación expirada |
| DCMA-004 | 1.0 | Cadena rota (intermedio faltante) |
| DCMA-005 | 1.0 | Delegación revocada en la cadena |
| DCMA-006 | **1.1** | Profundidad máxima de delegación excedida (> 7 hops) |
