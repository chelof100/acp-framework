# ACP-CT-1.0
## Capability Token Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** ACP-SIGN-1.0, ACP-CAP-REG-1.0
**Required-by:** ACP-RISK-1.0, ACP-REV-1.0, ACP-API-1.0

---

## 1. Alcance

Este documento define la estructura, campos, procedimiento de verificación, y reglas de delegación de los Capability Tokens ACP. Un Capability Token es el artefacto principal que autoriza a un agente a realizar acciones sobre recursos específicos.

---

## 2. Definiciones

**AgentID:** Identificador único de un agente. MUST ser `base58(SHA-256(pk_bytes))` donde `pk_bytes` son los 32 bytes de la clave pública Ed25519 del agente.

**Issuer:** Agente que emite el token y firma con su clave privada.

**Subject:** Agente al que se otorgan las capacidades del token.

**Capability:** Identificador de una acción autorizada. Formato según ACP-CAP-REG-1.0.

**Delegation chain:** Secuencia de tokens donde cada token es emitido por el sujeto del token anterior.

---

## 3. Formato de AgentID

```
AgentID = base58(SHA-256(pk_bytes))
```

donde:
- `pk_bytes` = clave pública Ed25519, 32 bytes en formato raw
- `SHA-256` produce 32 bytes
- `base58` usa alfabeto Bitcoin: `123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`

Output típico: 43-44 caracteres.

---

## 4. Estructura del Token

```json
{
  "ver": "1.0",
  "iss": "<AgentID_emisor>",
  "sub": "<AgentID_sujeto>",
  "cap": ["acp:cap:financial.payment"],
  "res": "org.example/accounts/ACC-001",
  "iat": 1718920000,
  "exp": 1718923600,
  "nonce": "<128bit_CSPRNG_base64url>",
  "deleg": {
    "allowed": false,
    "max_depth": 0
  },
  "parent_hash": null,
  "constraints": {},
  "rev": {
    "type": "endpoint",
    "uri": "https://acp.example.com/acp/v1/rev/check"
  },
  "sig": "<base64url_firma_Ed25519>"
}
```

---

## 5. Especificación de Campos

**5.1 `ver`** — MUST ser `"1.0"`.

**5.2 `iss`** — AgentID del emisor. MUST ser AgentID válido según §3. El emisor firma el token con su `sk_iss`.

**5.3 `sub`** — AgentID del sujeto. MUST ser AgentID válido. El sujeto MUST demostrar posesión de `sk_sub` durante el handshake según ACP-HP-1.0.

**5.4 `cap`** — Array no vacío de capability identifiers. Cada elemento MUST ser válido según ACP-CAP-REG-1.0. MUST NOT estar vacío.

**5.5 `res`** — Identificador del recurso sobre el que aplican las capacidades. Formato: `<institution_domain>/<resource_path>`. MUST ser string no vacío.

**5.6 `iat`** — Unix timestamp en segundos. Momento de emisión. MUST ser ≤ timestamp actual en verificación (tolerancia máxima: 300 segundos para drift de reloj).

**5.7 `exp`** — Unix timestamp en segundos. Momento de expiración. MUST ser > `iat`. MUST ser > timestamp actual en verificación.

**5.8 `nonce`** — 128 bits generados por CSPRNG, codificados en base64url sin padding. MUST ser único. Usado para prevención de replay.

**5.9 `deleg`** — Objeto con dos campos:
- `allowed`: boolean. Si `false`, el sujeto no puede delegar este token.
- `max_depth`: entero ≥ 0. Profundidad máxima de delegación restante. MUST ser 0 si `allowed` es `false`.

**5.10 `parent_hash`** — Null para tokens raíz. Para tokens delegados, MUST ser `base64url(SHA-256(JCS(token_padre_sin_sig)))`.

**5.11 `constraints`** — Objeto con restricciones adicionales según la capacidad. Puede estar vacío `{}`. Constraints obligatorios por capacidad definidos en ACP-CAP-REG-1.0 §5.

**5.12 `rev`** — Objeto con información de revocación:
- `type`: MUST ser `"endpoint"` o `"crl"`
- `uri`: URL del endpoint de verificación o CRL según ACP-REV-1.0

**5.13 `sig`** — Firma del emisor según ACP-SIGN-1.0. Cubre todos los campos excepto `sig`.

---

## 6. Procedimiento de Verificación

Los siguientes pasos MUST ejecutarse en orden exacto:

```
Paso 1: Verificar ver == "1.0"
Paso 2: Verificar firma sig con pk_iss según ACP-SIGN-1.0
Paso 3: Verificar timestamp actual <= exp
Paso 4: Verificar timestamp actual >= iat - 300
Paso 5: Verificar estado de revocación según ACP-REV-1.0
Paso 6: Verificar que capability solicitada ∈ cap
Paso 7: Verificar que recurso solicitado está cubierto por res
Paso 8: Si token es delegado, verificar parent_hash
Paso 9: Verificar constraints según ACP-CAP-REG-1.0
```

Un fallo en cualquier paso MUST producir rechazo inmediato sin continuar.

---

## 7. Reglas de Delegación

Cuando el sujeto S1 de un token T1 emite un token delegado T2 para sujeto S2:

```
Restricciones obligatorias:
  cap(T2) ⊆ cap(T1)              — subset de capacidades
  res(T2) ⊆ res(T1)              — subset de recursos
  exp(T2) ≤ exp(T1)              — no puede extender expiración
  max_depth(T2) < max_depth(T1)  — profundidad se reduce en 1
  parent_hash(T2) = SHA-256(JCS(T1 sin sig))
```

Si cualquier restricción es violada, T2 MUST ser rechazado.

**Límite absoluto de profundidad:** max_depth MUST NOT exceder 8 en ningún token. Este límite es fijo y no configurable.

---

## 8. Errores

| Código | Condición |
|--------|-----------|
| CT-001 | ver no soportado |
| CT-002 | Firma inválida |
| CT-003 | Token expirado |
| CT-004 | Token no válido aún (iat en el futuro) |
| CT-005 | Capability no presente en token |
| CT-006 | Recurso no cubierto por token |
| CT-007 | Delegación no permitida (deleg.allowed == false) |
| CT-008 | max_depth excedido |
| CT-009 | parent_hash inválido |
| CT-010 | Token revocado |
| CT-011 | Constraint violado |
| CT-012 | cap array vacío |
| CT-013 | AgentID mal formado |

---

## 9. Conformidad

Una implementación es ACP-CT-1.0 conforme si:

- Genera AgentIDs según §3
- Produce tokens con todos los campos MUST
- Ejecuta verificación en el orden exacto de §6
- Aplica reglas de delegación de §7
- Verifica cadena completa de delegación hasta token raíz
- Rechaza tokens con max_depth > 8
- Produce los códigos de error de §8
