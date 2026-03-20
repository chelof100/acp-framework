# ACP-REP-PORTABILITY-1.1 — Snapshot de Reputación Firmado

**Versión:** 1.1
**Estado:** Activo
**Reemplaza:** ACP-REP-PORTABILITY-1.0 (archivada)
**Dependencias:** ACP-SIGN-1.0, ACP-REP-1.2
**Implementa:** ACP-CONF-1.2 Nivel de Conformidad L4
**Relacionado:** ACP-CROSS-ORG-1.1, ACP-REP-1.2

---

## §1 Resumen

ACP-REP-PORTABILITY-1.1 define el `ReputationSnapshot`: un registro compacto y firmado criptográficamente que transporta la puntuación de reputación de un agente entre organizaciones. A diferencia del protocolo de attestation bilateral de la v1.0, esta especificación se enfoca en el **objeto snapshot en sí mismo** — su estructura, procedimiento de firma, algoritmo de validación y semántica de expiración — permitiendo que cualquier verificador valide independientemente un snapshot sin necesidad de confiar en un intermediario.

Un `ReputationSnapshot` es emitido por una institución puntuadora (el **emisor**), firmado con Ed25519 sobre un payload canónico JCS, y lleva un timestamp de expiración obligatorio (`valid_until`). Los verificadores comprueban la firma y, para snapshots v1.1, aplican la expiración. Los snapshots emitidos bajo v1.0 siguen siendo válidos sin aplicación de expiración (§12).

---

## §2 Alcance

Este documento define:

- El objeto `ReputationSnapshot` y sus campos
- El procedimiento de firma (JCS + SHA-256 + Ed25519)
- El algoritmo de validación, incluyendo compatibilidad hacia atrás con v1.0
- Semántica de divergencia para comparación de puntuaciones entre organizaciones
- Códigos de error y advertencia
- Reglas de extensibilidad

Este documento **no** define:

- El motor de puntuación interno ni la fórmula EWA (ver ACP-REP-1.2)
- El protocolo de solicitud de attestation bilateral (ver ACP-REP-PORTABILITY-1.0, archivada)
- Protocolos de transporte para intercambio de snapshots
- Descubrimiento de claves entre organizaciones o federación (ver ACP-CROSS-ORG-1.1)
- Un campo de confianza o límites probabilísticos (diferido a extensibilidad, §14)
- Flujos de trabajo multi-org de demostración (ver GAP-14)

---

## §3 Modelo de Datos

### 3.1 ReputationSnapshot

```json
{
  "ver": "1.1",
  "rep_id": "3f7a1c9e-0b2d-4e8a-a5f6-1234567890ab",
  "subject_id": "agente.ejemplo.pagos",
  "issuer": "inst-alpha",
  "score": 0.82,
  "scale": "0-1",
  "model_id": "risk-v3",
  "evaluated_at": 1741200000,
  "valid_until": 1741203600,
  "signature": "Ed25519-base64url..."
}
```

### 3.2 signableReputation (payload canónico)

El payload de firma es el snapshot sin el campo `signature`:

```json
{
  "ver": "1.1",
  "rep_id": "3f7a1c9e-0b2d-4e8a-a5f6-1234567890ab",
  "subject_id": "agente.ejemplo.pagos",
  "issuer": "inst-alpha",
  "score": 0.82,
  "scale": "0-1",
  "model_id": "risk-v3",
  "evaluated_at": 1741200000,
  "valid_until": 1741203600
}
```

La canonicalización DEBE usar JCS (RFC 8785). Las implementaciones NO DEBEN usar `json.Marshal` directamente como forma canónica — el orden de campos no está garantizado por las librerías JSON estándar y difiere entre lenguajes.

---

## §4 Campos

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `ver` | string | ✓ | Versión de la spec. DEBE ser `"1.0"` o `"1.1"`. |
| `rep_id` | string (UUID v4) | ✓ | Identificador único para este snapshot. Los emisores NO DEBEN reutilizar valores de `rep_id`. |
| `subject_id` | string | ✓ | Identificador del agente ACP sujeto de esta puntuación de reputación. |
| `issuer` | string | ✓ | Identificador de la institución emisora. NO DEBE estar vacío. |
| `score` | float64 | ✓ | Puntuación de reputación. DEBE estar dentro de los límites definidos por `scale`. |
| `scale` | string | ✓ (v1.1) | Rango de la puntuación. Valores soportados: `"0-1"` (score ∈ [0.0, 1.0]) o `"0-100"` (score ∈ [0.0, 100.0]). |
| `model_id` | string | ✓ (v1.1) | Identificador del modelo de puntuación utilizado. Opaco al verificador; usado para auditoría y trazabilidad. |
| `evaluated_at` | int64 | ✓ | Timestamp Unix (segundos) de cuando se calculó la puntuación. |
| `valid_until` | int64 | ✓ (v1.1) | Timestamp Unix (segundos) después del cual este snapshot está expirado. DEBE ser ≥ `evaluated_at`. |
| `signature` | string | ✓ | Firma Ed25519 sobre el `signableReputation` canónico JCS, codificada en base64url (sin padding). |

**Campos v1.0:** `ver`, `rep_id`, `subject_id`, `issuer`, `score`, `evaluated_at`, `signature`. Los campos `scale`, `model_id` y `valid_until` están ausentes en snapshots v1.0.

---

## §5 Invariantes

Estas invariantes DEBEN cumplirse para que un snapshot sea considerado válido.

| § | Invariante | Aplica a | Error |
|---|-----------|----------|-------|
| 5.1 | `evaluated_at ≤ valid_until` | solo v1.1 | REP-001 |
| 5.2 | `now ≤ valid_until` | solo v1.1 | REP-011 |
| 5.3 | `score` dentro de los límites de `scale` | solo v1.1 | REP-002 |
| 5.4 | `issuer` no está vacío | todas las versiones | REP-004 |
| 5.5 | `signature` es criptográficamente válida | todas las versiones | REP-010 |

**Nota sobre límites de escala en 5.3:**
- `scale = "0-1"`: score DEBE satisfacer `0.0 ≤ score ≤ 1.0`
- `scale = "0-100"`: score DEBE satisfacer `0.0 ≤ score ≤ 100.0`
- Cualquier otro valor de `scale` es rechazado con REP-002

---

## §6 Algoritmo de Validación

```
ValidateReputationSnapshot(rep, now):
  1. Verificar rep.ver ∈ {"1.0", "1.1"}
       → si versión desconocida, retornar error (versión no soportada)
  2. Verificar rep.issuer ≠ ""
       → REP-004 si vacío
  3. Verificar rep.evaluated_at ≤ rep.valid_until  [solo v1.1]
       → REP-001 si viola
  4. Si rep.ver == "1.1":
       Verificar now.Unix() ≤ rep.valid_until
       → REP-011 si expirado
  5. Si rep.ver == "1.1":
       Verificar rep.score dentro de límites de rep.scale
       → REP-002 si fuera de límites o escala no soportada
  6. Verificar rep.signature ≠ ""
       → REP-010 si vacío
  7. Retornar VÁLIDO

VerifySig(rep, pubKey):
  1. Construir signableReputation (todos los campos excepto signature)
  2. canonical = JCS(json.Marshal(signableReputation))
  3. digest = SHA-256(canonical)
  4. sigBytes = base64url_decode(rep.signature)
  5. Verificar Ed25519(pubKey, digest, sigBytes)
       → REP-010 si falla la verificación
  6. Retornar VÁLIDO
```

**Nota de diseño:** `Validate()` y `VerifySig()` son operaciones intencionalmente separadas. `Validate()` comprueba invariantes estructurales sin requerir la clave pública del emisor. `VerifySig()` se llama por separado cuando el verificador tiene la clave del emisor. Esta separación permite validación estructural liviana en el momento de ingesta y validación criptográfica completa cuando la clave está disponible.

---

## §7 Semántica de Divergencia

Cuando un verificador recibe snapshots del mismo `subject_id` de múltiples emisores, PUEDE calcular la divergencia para detectar inconsistencias de puntuación.

### 7.1 ComputeDivergence

```
ComputeDivergence(a, b) → float64:
  retornar |a.score - b.score|
```

Ambos snapshots DEBEN usar la misma `scale`. Comparar snapshots con escalas diferentes es comportamiento indefinido y NO DEBE realizarse.

### 7.2 CheckDivergence

```
CheckDivergence(a, b, threshold) → (exceeded bool, divergence float64):
  div = ComputeDivergence(a, b)
  retornar (div > threshold), div
```

### 7.3 Advertencia REP-WARN-002

Si `CheckDivergence` retorna `exceeded = true`, el verificador DEBERÍA emitir advertencia `REP-WARN-002` (divergencia detectada). Esta es una advertencia no bloqueante — el verificador continúa el procesamiento. La decisión de política de si aceptar, rechazar o escalar queda en la lógica de negocio del verificador.

Umbrales predeterminados recomendados: `0.30` para `scale="0-1"`, `30.0` para `scale="0-100"`.

---

## §8 Integración Cross-Org

ACP-REP-PORTABILITY-1.1 está diseñado para operar dentro del modelo de confianza entre organizaciones definido en ACP-CROSS-ORG-1.1. Uso típico:

1. **Emisión:** La institución de origen puntúa al agente y llama a `Capture()` para producir un `ReputationSnapshot` firmado. El snapshot se entrega al agente o a un endpoint designado.
2. **Presentación:** El agente presenta el snapshot a una institución extranjera como parte de un flujo de autorización u onboarding.
3. **Verificación:** La institución extranjera llama a `ValidateReputationSnapshot(rep, now)` y `VerifySig(rep, issuerPubKey)`. La clave pública del emisor se resuelve via descubrimiento de claves ACP-CROSS-ORG-1.1 (o un ancla de confianza pre-compartida).
4. **Comprobación de divergencia (opcional):** Si la institución extranjera tiene su propia puntuación para el agente, PUEDE llamar a `CheckDivergence` y emitir REP-WARN-002 si se supera el umbral.

La **decisión de política** de la institución extranjera (si otorgar acceso basado en una puntuación determinada) está fuera del alcance. El verificador aplica su propio umbral — esto es soberanía institucional intencional. ACP no impone qué valor de puntuación es "suficientemente bueno."

---

## §9 Códigos de Error

| Código | Descripción | HTTP (si aplica) |
|--------|-------------|------------------|
| REP-001 | `evaluated_at > valid_until`: orden temporal violado | 422 |
| REP-002 | Puntuación fuera de los límites de escala, o valor de escala no soportado | 422 |
| REP-004 | Campo `issuer` faltante o vacío | 422 |
| REP-010 | Firma inválida (bytes incorrectos, vacía, o verificación fallida) | 422 |
| REP-011 | Snapshot expirado: `now > valid_until` (solo v1.1) | 410 |

---

## §10 Códigos de Advertencia

Los códigos de advertencia son no bloqueantes. Las implementaciones DEBERÍAN registrarlos y PUEDEN exponerlos a los puntos de decisión de política.

| Código | Descripción |
|--------|-------------|
| REP-WARN-002 | Divergencia detectada: diferencia de puntuación entre dos snapshots supera el umbral |

---

## §11 Versionado

| Ver | `valid_until` | `scale` | `model_id` | Expiración aplicada |
|-----|--------------|---------|------------|---------------------|
| 1.0 | ausente | ausente | ausente | No |
| 1.1 | requerido | requerido | requerido | Sí |

La versión se determina por el campo `ver` en el snapshot. Una implementación que encuentra una versión desconocida DEBE rechazar el snapshot con un error de versión no soportada.

---

## §12 Compatibilidad hacia Atrás

Un validador v1.1 DEBE aceptar snapshots v1.0 con los siguientes ajustes:

- **Expiración NO aplicada:** La invariante 5.2 (`now ≤ valid_until`) se omite para snapshots v1.0. `valid_until` está ausente y por defecto es `MaxInt64` (nunca expira en el validador).
- **Invariante 5.1** (`evaluated_at ≤ valid_until`) se omite para snapshots v1.0.
- **Invariante 5.3** (límites de puntuación) se omite para snapshots v1.0 — `scale` está ausente.
- **Verificación de firma** aplica a todas las versiones usando el mismo procedimiento JCS + SHA-256 + Ed25519.
- **Comprobación de emisor** (invariante 5.4) aplica a todas las versiones.

---

## §13 Seguridad

### 13.1 Firma

El procedimiento de firma es:

```
1. raw      = json.Marshal(signableReputation)
2. canonical = jcs.Transform(raw)          // JCS RFC 8785
3. digest   = sha256.Sum256(canonical)
4. sig      = ed25519.Sign(privKey, digest[:])
5. snapshot.Signature = base64url_encode(sig)  // sin padding (RawURLEncoding)
```

Las implementaciones DEBEN usar JCS (RFC 8785) para canonicalización. Usar `json.Marshal` directamente como forma canónica **no está permitido** — el orden de claves difiere entre implementaciones de lenguajes y producirá fallos de verificación en despliegues cross-org.

### 13.2 Autoridad sobre `valid_until`

El emisor tiene autoridad exclusiva sobre `valid_until`. El verificador:
- NO DEBE extender `valid_until` más allá de lo que el emisor estableció
- NO DEBE reducir `valid_until` para forzar una expiración más temprana
- DEBE rechazar snapshots expirados (v1.1) con REP-011

### 13.3 Protección contra replay

`rep_id` (UUID v4) DEBE tratarse como un identificador de un solo uso. Las implementaciones que requieren protección contra replay DEBEN mantener un registro de nonces y rechazar snapshots cuyo `rep_id` ya ha sido visto, sujeto a `valid_until` como TTL del registro.

### 13.4 Gestión de claves

Los emisores DEBEN usar claves Ed25519 dedicadas para snapshots de reputación. La rotación de claves está fuera del alcance — las implementaciones DEBERÍAN seguir las guías de gestión de claves de ACP-SIGN-1.0.

---

## §14 Extensibilidad

Las versiones futuras PUEDEN agregar campos a `ReputationSnapshot`. Un validador v1.1 que encuentre campos desconocidos DEBE ignorarlos (política permisiva de campos desconocidos). Esto permite compatibilidad hacia adelante con snapshots v1.2+ en entornos que aún no han actualizado.

Campos explícitamente diferidos de v1.1:

| Campo | Razón del diferimiento |
|-------|------------------------|
| `confidence` | Requiere modelo de puntuación probabilístico — trabajo futuro |
| `verifier_override_until` | No aplicable — el emisor tiene autoridad total (§13.2) |

---

## §15 Principios de Diseño

**Soberanía del emisor:** El emisor define la puntuación, la escala, el modelo y la ventana de validez. Los verificadores aceptan o rechazan basándose en sus propios umbrales — no alteran las afirmaciones del emisor.

**Payload mínimo:** Un `ReputationSnapshot` lleva solo lo necesario para la verificación. El historial de puntuación interno, los registros de eventos y los registros de comportamiento nunca se exportan.

**Firma determinista:** La canonicalización JCS garantiza que dos implementaciones (Go, Python, TypeScript) que firman el mismo snapshot producen payloads idénticos y por tanto firmas idénticas. La interoperabilidad cross-org depende de esta propiedad.

**Separación de responsabilidades:** La validación estructural (`Validate`) y la verificación criptográfica (`VerifySig`) son operaciones separadas. Esto permite comprobaciones ligeras en el momento de ingesta sin requerir material de clave.

**Compatibilidad hacia atrás:** Los snapshots v1.0 continúan validándose sin modificación. El camino de actualización de v1.0 a v1.1 es aditivo (nuevos campos requeridos solo en snapshots nuevos).
