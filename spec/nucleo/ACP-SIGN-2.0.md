# ACP-SIGN-2.0
## Especificación de Firma Híbrida Post-Cuántica
**Estado:** Borrador
**Versión:** 2.0
**Reemplaza:** ACP-SIGN-1.0 (compatible hacia atrás — ver §11)
**Depende de:** RFC 8785 (JCS), RFC 8032 (Ed25519), NIST FIPS 204 (ML-DSA / Dilithium), RFC 4648 (base64url)
**Requerido por:** ACP-CT-1.0, ACP-LEDGER-1.3, ACP-RISK-2.0, ACP-API-1.0
**Nota de implementación:** Sin implementación Go en v1.16. Librería de referencia: `github.com/cloudflare/circl/sign/dilithium`. Implementación Go objetivo: v1.17.

---

## 1. Alcance

Este documento especifica el **esquema de firma híbrida post-cuántica** para artefactos ACP. Extiende ACP-SIGN-1.0 con soporte para ML-DSA-65 (Module Lattice Digital Signature Algorithm, NIST FIPS 204) junto al esquema Ed25519 existente, permitiendo una migración estructurada a criptografía post-cuántica sin romper despliegues existentes.

El principio de diseño es **cripto-agilidad por diseño**: ACP define el camino de migración explícitamente, con cada despliegue avanzando a través de tres modos de transición a su propio ritmo según una política configurable.

**Esta especificación no invalida ACP-SIGN-1.0.** Todos los artefactos ACP-SIGN-1.0 existentes siguen siendo válidos. Las implementaciones DEBEN continuar aceptándolos per las reglas de compatibilidad hacia atrás en §11.

---

## 2. Modelo de Amenaza y Motivación

**2.1 La amenaza harvest-now / decrypt-later**

Un adversario con acceso a artefactos ACP firmados con Ed25519 hoy podría, al adquirir una computadora cuántica suficientemente potente, forjar firmas retroactivamente, invalidando trazas de auditoría y tokens de capacidad. El plazo para computadoras cuánticas criptográficamente relevantes es incierto pero creíble en un horizonte de 10–15 años.

**2.2 Estandarización NIST**

NIST finalizó ML-DSA (Module Lattice-based Digital Signature Algorithm) en FIPS 204 (agosto 2024), basado en la propuesta CRYSTALS-Dilithium. ML-DSA-65 (Categoría de Seguridad 3, equivalente a AES-192) es seleccionado para ACP porque ofrece el mejor equilibrio entre tamaño de firma, tamaño de clave y margen de seguridad para despliegues institucionales.

**2.3 Requerimientos específicos de ACP**

| Requerimiento | Fundamento |
|---|---|
| Compatibilidad hacia atrás | Los despliegues existentes no pueden requerir actualización atómica |
| Auditabilidad | Los artefactos híbridos deben ser verificables inequívocamente por cualquier tercero |
| Determinismo | Los mismos inputs siempre deben producir el mismo resultado verificable |
| Sin proliferación de claves | El material de clave para ambos algoritmos se registra una sola vez por agente |

---

## 3. Parámetros de Algoritmo

**3.1 Componente clásico (sin cambios desde ACP-SIGN-1.0)**

| Propiedad | Valor |
|---|---|
| Algoritmo | Ed25519 (RFC 8032) |
| Clave privada | 32 bytes |
| Clave pública | 32 bytes |
| Firma | 64 bytes |
| Codificación | base64url sin padding (86 caracteres) |

**3.2 Componente post-cuántico (nuevo en v2.0)**

| Propiedad | Valor |
|---|---|
| Algoritmo | ML-DSA-65 (NIST FIPS 204, antes CRYSTALS-Dilithium3) |
| Categoría de seguridad | NIST Categoría 3 (≥ AES-192 seguridad cuántica) |
| Clave privada | 4000 bytes |
| Clave pública | 1952 bytes |
| Firma | 3309 bytes |
| Codificación | base64url sin padding |
| Librería de referencia | `github.com/cloudflare/circl/sign/dilithium` (modo `Dilithium3`) |

**3.3 Hash**

SHA-256 (FIPS 180-4) para el digest pre-firma, aplicado al payload canonicalizado con JCS. Ambos componentes de firma firman el mismo digest.

---

## 4. Modos de Transición

Un despliegue opera en exactamente uno de tres modos de transición, declarado en su configuración de política ACP.

| Modo | Identificador | Firma clásica | Firma PQC | Requisito de verificación |
|---|---|---|---|---|
| Solo clásico | `CLASSIC_ONLY` | Requerida | Ausente | Ed25519 DEBE verificar |
| Híbrido | `HYBRID` | Requerida | Requerida | AMBAS DEBEN verificar |
| Solo PQC | `PQC_ONLY` | Ausente | Requerida | ML-DSA-65 DEBE verificar |

**4.1 Modo por defecto**

A menos que se configure lo contrario, los despliegues operan en modo `CLASSIC_ONLY`. Esto es idéntico al comportamiento de ACP-SIGN-1.0.

**4.2 Progresión de modo**

Los despliegues avanzan en orden: `CLASSIC_ONLY` → `HYBRID` → `PQC_ONLY`. La reversión no está permitida una vez que las claves PQC están registradas y activas.

**4.3 Declaración de política**

El modo de transición activo se declara en la configuración de política institucional:

```json
{
  "acp_sign_mode": "HYBRID",
  "pqc_required": false,
  "pqc_required_after": "2027-01-01T00:00:00Z"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `acp_sign_mode` | string | Modo activo: `CLASSIC_ONLY`, `HYBRID`, o `PQC_ONLY` |
| `pqc_required` | boolean | Si true, rechaza artefactos sin `pqc_sig` independientemente del modo |
| `pqc_required_after` | string (ISO 8601) | Fecha después de la cual `pqc_required` se aplica automáticamente |

---

## 5. Formato Wire

**5.1 Artefactos solo clásicos (formato ACP-SIGN-1.0, sin cambios)**

```json
{
  "ver": "1.0",
  "...",
  "sig": "<base64url_firma_ed25519>"
}
```

**5.2 Artefactos híbridos (ACP-SIGN-2.0)**

```json
{
  "ver": "1.0",
  "...",
  "ed25519_sig": "<base64url_firma_ed25519_86_chars>",
  "pqc_sig": "<base64url_firma_mldsa65_4412_chars>",
  "pqc_alg": "ML-DSA-65"
}
```

| Campo | Requerido | Descripción |
|---|---|---|
| `ed25519_sig` | En `HYBRID` y `CLASSIC_ONLY` | Firma Ed25519 sobre el digest JCS. Reemplaza `sig` en artefactos híbridos v2.0. |
| `pqc_sig` | En `HYBRID` y `PQC_ONLY` | Firma ML-DSA-65 sobre el mismo digest JCS. base64url sin padding. |
| `pqc_alg` | Cuando `pqc_sig` presente | Identificador de algoritmo. DEBE ser `"ML-DSA-65"` en v2.0. Reservado para algoritmos futuros. |

**5.3 Coexistencia con el campo `sig`**

Para mantener compatibilidad hacia atrás, las implementaciones que producen artefactos híbridos DEBEN:
- Establecer `ed25519_sig` (no `sig`) para el componente clásico
- Establecer `pqc_sig` + `pqc_alg` para el componente PQC
- Dejar `sig` ausente (evitando ambigüedad con verificadores ACP-SIGN-1.0)

Los verificadores ACP-SIGN-1.0 que encuentren `ed25519_sig` en lugar de `sig` DEBEN tratar el artefacto como una versión desconocida y rechazarlo con SIGN-010.

---

## 6. Registro de Claves Públicas

**6.1 Registro de agente extendido**

Los agentes que operan en modo `HYBRID` o `PQC_ONLY` DEBEN registrar su clave pública ML-DSA-65 junto a su clave Ed25519:

```json
{
  "agent_id": "acp:agent:org.ejemplo:agente-001",
  "public_key": "<base64url_clave_publica_ed25519_32_bytes>",
  "pqc_public_key": "<base64url_clave_publica_mldsa65_2592_chars>",
  "pqc_alg": "ML-DSA-65"
}
```

**6.2 Recuperación**

Los verificadores obtienen claves PQC vía el registro de agentes:

```
GET /acp/v1/agents/{agent_id}
→ response.pqc_public_key (cuando presente)
```

**6.3 Clave institucional**

Para artefactos firmados por el sistema ACP institucional (respuestas API, eventos del ledger), la clave pública PQC se declara en el ancla de confianza ITA per ACP-ITA-1.1. Las instituciones DEBEN publicar su clave pública PQC en el documento ITA antes de activar el modo `HYBRID`.

---

## 7. Procedimiento de Firma

**7.1 Modo solo clásico (compatible ACP-SIGN-1.0)**

```
Dado: objeto JSON O, clave privada Ed25519 sk_ed

1. Verificar que O no contiene "sig", "ed25519_sig", ni "pqc_sig"
2. canonical_bytes = JCS(O)
3. h = SHA-256(canonical_bytes)
4. sig_bytes = Ed25519_Sign(sk_ed, h)
5. O["sig"] = base64url(sig_bytes)
6. Retornar O
```

**7.2 Modo híbrido**

```
Dado: objeto JSON O, clave privada Ed25519 sk_ed, clave privada ML-DSA-65 sk_pqc

1. Verificar que O no contiene "sig", "ed25519_sig", ni "pqc_sig"
2. canonical_bytes = JCS(O)
3. h = SHA-256(canonical_bytes)
4. ed_sig_bytes   = Ed25519_Sign(sk_ed, h)        [64 bytes]
5. pqc_sig_bytes  = MLDSA65_Sign(sk_pqc, h)       [3309 bytes]
6. O["ed25519_sig"] = base64url(ed_sig_bytes)
7. O["pqc_sig"]     = base64url(pqc_sig_bytes)
8. O["pqc_alg"]     = "ML-DSA-65"
9. Retornar O
```

**7.3 Modo solo PQC**

```
Dado: objeto JSON O, clave privada ML-DSA-65 sk_pqc

1. Verificar que O no contiene "sig", "ed25519_sig", ni "pqc_sig"
2. canonical_bytes = JCS(O)
3. h = SHA-256(canonical_bytes)
4. pqc_sig_bytes  = MLDSA65_Sign(sk_pqc, h)
5. O["pqc_sig"]     = base64url(pqc_sig_bytes)
6. O["pqc_alg"]     = "ML-DSA-65"
7. Retornar O
```

**Importante:** El digest `h` siempre es SHA-256 del payload canonicalizado con JCS con TODOS los campos de firma ausentes. Ambos algoritmos firman el mismo digest sobre la misma forma canónica.

---

## 8. Procedimiento de Verificación

**8.1 Determinación del modo**

Los verificadores determinan el modo de firma del artefacto inspeccionando qué campos están presentes:

| Campos presentes | Modo inferido |
|---|---|
| Solo `sig` | `CLASSIC_ONLY` (formato ACP-SIGN-1.0) |
| Solo `ed25519_sig` | Rechazar — artefacto híbrido incompleto (SIGN-012) |
| Solo `pqc_sig` | `PQC_ONLY` |
| `ed25519_sig` + `pqc_sig` | `HYBRID` |
| Ninguno | Rechazar — no se encontró firma (SIGN-007) |

**8.2 Verificación solo clásico (compatible ACP-SIGN-1.0)**

```
Dado: O con campo "sig", clave pública Ed25519 pk_ed

1. sig_bytes = base64url_decode(O["sig"])     — debe ser 64 bytes (SIGN-005)
2. O_plain   = copia de O sin "sig"
3. h         = SHA-256(JCS(O_plain))
4. result    = Ed25519_Verify(pk_ed, h, sig_bytes)
5. Si false  → rechazar SIGN-003
```

**8.3 Verificación híbrida**

```
Dado: O con "ed25519_sig" y "pqc_sig", claves públicas pk_ed + pk_pqc

1. ed_bytes  = base64url_decode(O["ed25519_sig"])  — debe ser 64 bytes (SIGN-005)
2. pqc_bytes = base64url_decode(O["pqc_sig"])      — debe ser 3309 bytes (SIGN-013)
3. O_plain   = copia de O sin "ed25519_sig", "pqc_sig", "pqc_alg"
4. h         = SHA-256(JCS(O_plain))
5. ed_ok     = Ed25519_Verify(pk_ed, h, ed_bytes)
6. pqc_ok    = MLDSA65_Verify(pk_pqc, h, pqc_bytes)
7. Si NO (ed_ok Y pqc_ok) → rechazar SIGN-003
   (ambos componentes DEBEN verificar en modo HYBRID)
```

**8.4 Verificación solo PQC**

```
Dado: O con "pqc_sig", clave pública ML-DSA-65 pk_pqc

1. pqc_bytes = base64url_decode(O["pqc_sig"])      — debe ser 3309 bytes (SIGN-013)
2. O_plain   = copia de O sin "pqc_sig", "pqc_alg"
3. h         = SHA-256(JCS(O_plain))
4. result    = MLDSA65_Verify(pk_pqc, h, pqc_bytes)
5. Si false  → rechazar SIGN-003
```

**8.5 Aplicación de política**

Después de la verificación de firma, los verificadores DEBEN comprobar el cumplimiento del modo contra la política activa:

```
modo_activo = policy.acp_sign_mode

Si modo_activo == "HYBRID" y modo_artefacto != "HYBRID":
  → rechazar SIGN-014 (discrepancia de modo)

Si policy.pqc_required == true y pqc_sig ausente:
  → rechazar SIGN-015 (firma PQC requerida)

Si ahora >= policy.pqc_required_after y pqc_sig ausente:
  → rechazar SIGN-015 (firma PQC requerida — plazo excedido)
```

---

## 9. Niveles de Conformidad

| Nivel | Requerimiento |
|---|---|
| **L1** | Implementa solo ACP-SIGN-1.0 (`CLASSIC_ONLY`). Puede leer y verificar artefactos ACP-SIGN-1.0. |
| **L2** | Implementa modo `HYBRID` de ACP-SIGN-2.0. Puede producir y verificar artefactos híbridos. Registra claves PQC. |
| **L3** | Implementa los tres modos. Aplica el plazo `pqc_required_after`. Gestiona el ciclo de vida de claves PQC. |

Todos los despliegues ACP v1.x existentes son implícitamente L1. Actualizar a L2 requiere registrar claves ML-DSA-65 y actualizar el pipeline de firma.

---

## 10. Errores

| Código | Condición |
|---|---|
| SIGN-001 | Campo de firma presente antes de firmar — objeto ya firmado o corrompido |
| SIGN-002 | JCS falló — el objeto contiene tipos no serializables |
| SIGN-003 | Verificación de firma falló (Ed25519 o ML-DSA-65) |
| SIGN-004 | Clave pública no encontrada para el emisor |
| SIGN-005 | Longitud incorrecta de firma Ed25519 — se esperaban 64 bytes |
| SIGN-006 | Decodificación base64url falló |
| SIGN-007 | No se encontró campo de firma en objeto que requiere firma |
| SIGN-008 | (Reservado) |
| SIGN-009 | (Reservado) |
| SIGN-010 | Formato de firma desconocido — `ed25519_sig` presente pero el verificador solo soporta ACP-SIGN-1.0 |
| SIGN-011 | Valor de `pqc_alg` no soportado (solo `"ML-DSA-65"` es válido en v2.0) |
| SIGN-012 | Artefacto híbrido incompleto — `ed25519_sig` presente sin `pqc_sig` |
| SIGN-013 | Longitud incorrecta de firma ML-DSA-65 — se esperaban 3309 bytes |
| SIGN-014 | Discrepancia de modo de firma — modo del artefacto no coincide con modo de política activa |
| SIGN-015 | Firma PQC requerida pero ausente — `pqc_required` aplicado |

---

## 11. Compatibilidad Hacia Atrás y Guía de Migración

**11.1 Los artefactos ACP-SIGN-1.0 siguen siendo válidos**

Los artefactos firmados con ACP-SIGN-1.0 (usando el campo `sig`) siguen siendo válidos indefinidamente en despliegues que operan en modo `CLASSIC_ONLY`. No se requiere re-firma.

**11.2 Camino de migración**

```
Fase 1 — Registrar claves PQC (sin impacto en tráfico):
  → Registrar par de claves ml-dsa-65 para cada agente e institución
  → Agregar pqc_public_key a registros de agentes en el registry
  → Agregar clave PQC institucional al documento ITA

Fase 2 — Habilitar modo HYBRID:
  → Establecer acp_sign_mode = "HYBRID" en política
  → Actualizar pipeline de firma para producir ed25519_sig + pqc_sig
  → Verificar que todos los verificadores son ACP-SIGN-2.0 L2 conformes

Fase 3 — Establecer plazo PQC:
  → Establecer pqc_required_after = "<fecha_objetivo>"
  → Monitorear: cualquier artefacto sin pqc_sig después de esa fecha es rechazado

Fase 4 (opcional, v1.17+) — Solo PQC:
  → Establecer acp_sign_mode = "PQC_ONLY"
  → El material de clave clásico puede retirarse
```

**11.3 Ventana de interoperabilidad**

Durante el período de migración (Fases 1–2), los verificadores DEBEN aceptar tanto artefactos ACP-SIGN-1.0 (campo `sig`) como artefactos híbridos ACP-SIGN-2.0 (`ed25519_sig` + `pqc_sig`). Esta ventana se espera que abarque un mínimo de 12 meses para permitir que todos los agentes desplegados actualicen.

**11.4 Sin mezcla de `sig` / `ed25519_sig`**

Un artefacto NO DEBE contener ambos `sig` (campo clásico ACP-SIGN-1.0) y `ed25519_sig` simultáneamente. La presencia de ambos es un error (SIGN-001). Actualizar significa reemplazar `sig` con `ed25519_sig` + `pqc_sig`.

---

## 12. Consideraciones de Seguridad

**12.1 Generación de claves**

Los pares de claves ML-DSA-65 DEBEN generarse usando un generador de números aleatorios criptográficamente seguro. La implementación de referencia `cloudflare/circl` provee una función de generación de claves conforme a FIPS 204.

**12.2 Consideraciones de canal lateral**

La firma ML-DSA-65 no es de tiempo constante en todas las implementaciones. Las implementaciones que operan en entornos sensibles a la seguridad DEBEN usar librerías con contramedidas de canal lateral documentadas.

**12.3 Impacto del tamaño de firma**

Los artefactos híbridos son sustancialmente más grandes que los artefactos ACP-SIGN-1.0 debido a la firma ML-DSA-65 de 3309 bytes. Los requerimientos de almacenamiento y ancho de banda aumentan correspondientemente. Las implementaciones DEBEN planificar para un aumento de ~50× en el tamaño del campo de firma al pasar al modo híbrido.

**12.4 Agilidad de algoritmo**

El campo `pqc_alg` está reservado para sustitución futura de algoritmo. En v2.0, solo `"ML-DSA-65"` es válido. Especificaciones futuras pueden agregar `"SLH-DSA-128s"` (NIST FIPS 205, SPHINCS+) u otros esquemas estandarizados por NIST. El campo `pqc_alg` permite a los verificadores enrutar a la lógica de verificación correcta sin cambios estructurales.

---

## Apéndice A — Implementaciones de Referencia

| Lenguaje | Librería | Modo ML-DSA-65 |
|---|---|---|
| Go | `github.com/cloudflare/circl/sign/dilithium` | `dilithium.Mode3` (Dilithium3 = ML-DSA-65) |
| Python | `pyca/cryptography` (≥ 43.0) | `dilithium3` |
| Rust | `pqcrypto-dilithium` | `dilithium3` |
| JavaScript | `@noble/post-quantum` | `ml_dsa_65` |

> **Nota:** Asegurarse de que la librería implementa NIST FIPS 204 (final), no la especificación anterior CRYSTALS-Dilithium ronda 3. Los tamaños de clave y firma difieren entre versiones.

---

## Apéndice B — Ejemplo Funcional (Modo Híbrido)

```
Objeto JSON de entrada (antes de firmar):
{
  "ver": "1.0",
  "iss": "did:key:z6MkekQTaq7vjX7Vdy6pxabbjgkauuzprRGbBWNAXDs1NZdQ",
  "sub": "acp:agent:org.ejemplo:agente-001",
  "iat": 1700000000
}

Paso 1 — Canonicalización JCS:
{"iat":1700000000,"iss":"did:key:z6MkekQTaq7vjX7Vdy6pxabbjgkauuzprRGbBWNAXDs1NZdQ","sub":"acp:agent:org.ejemplo:agente-001","ver":"1.0"}

Paso 2 — Digest SHA-256:
h = SHA-256(canonical_bytes)  [32 bytes]

Paso 3 — Firmar Ed25519 con sk_ed:
ed_sig = Ed25519_Sign(sk_ed, h)  [64 bytes → 86 chars base64url]

Paso 4 — Firmar ML-DSA-65 con sk_pqc:
pqc_sig = MLDSA65_Sign(sk_pqc, h)  [3309 bytes → 4412 chars base64url]

Paso 5 — Artefacto híbrido de salida:
{
  "ver": "1.0",
  "iss": "did:key:z6MkekQTaq7vjX7Vdy6pxabbjgkauuzprRGbBWNAXDs1NZdQ",
  "sub": "acp:agent:org.ejemplo:agente-001",
  "iat": 1700000000,
  "ed25519_sig": "<86 chars base64url>",
  "pqc_sig":     "<4412 chars base64url>",
  "pqc_alg":     "ML-DSA-65"
}
```

Tanto `ed25519_sig` como `pqc_sig` se computan sobre el mismo digest `h`, calculado del objeto sin ningún campo de firma.

---

## Apéndice C — Por qué ML-DSA-65 (no ML-DSA-44 ni ML-DSA-87)

| Conjunto de parámetros | Categoría NIST | Clave pública | Firma | Fundamento ACP |
|---|---|---|---|---|
| ML-DSA-44 | 2 (≈ AES-128) | 1312 bytes | 2420 bytes | Margen insuficiente para infraestructura institucional |
| **ML-DSA-65** | **3 (≈ AES-192)** | **1952 bytes** | **3309 bytes** | ✅ Recomendado — equilibrio seguridad/tamaño para empresa |
| ML-DSA-87 | 5 (≈ AES-256) | 2592 bytes | 4627 bytes | Overhead excesivo; reservado para contextos de máxima sensibilidad |

ACP selecciona ML-DSA-65 como el conjunto de parámetros obligatorio. Las implementaciones NO DEBEN sustituir ML-DSA-44 ni ML-DSA-87 sin una declaración de política explícita, ya que esto rompería la interoperabilidad.
