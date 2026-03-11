# ACP-D — Versión Descentralizada

**Estado:** Diseño conceptual completo — Prevista para v2.0
**Dependencia:** Requiere ecosistema maduro de DIDs, BLS y ZK-proofs en producción

---

## Por qué existe ACP-D

ACP v1.0 tiene un punto crítico de riesgo: el **Issuer Central** (ITA — Institutional Trust Anchor).

Si la clave raíz del issuer se compromete, toda la autoridad criptográfica del sistema colapsa. El análisis adversarial de v1.0 identifica esto explícitamente como el único vector de ataque no mitigable dentro del modelo centralizado.

ACP-D elimina ese punto único de falla.

---

## Diferencias fundamentales con ACP v1.0

| Aspecto | ACP v1.0 (centralizado) | ACP-D (descentralizado) |
|---|---|---|
| **Identidad** | `AgentID = base58(SHA-256(pk))` | DID — Decentralized Identifiers |
| **Credenciales** | Capability Token firmado por issuer | Verifiable Credentials (VC) |
| **Emisión de tokens** | Issuer central (ITA con HSM) | Quorum distribuido (BFT) |
| **Firma** | Ed25519 individual | BLS12-381 threshold o Multi-Ed25519 agregada |
| **Prueba de posesión** | Challenge + firma Ed25519 | zk-SNARK / zk-STARK / Bulletproofs |
| **Revocación** | CRL centralizada + endpoint online | Merkle tree de no-inclusión |
| **Confianza raíz** | Root Institutional Key (RIK) en HSM | Sin issuer — autoridad distribuida |
| **Tolerancia a fallas** | Depende de disponibilidad del issuer | BFT: resiste compromiso de < 1/3 de nodos |

---

## Arquitectura de ACP-D

### Roles

| Rol | Función |
|---|---|
| **Subject** | Agente que solicita autorización |
| **Resource Server / Verifier** | Sistema que recibe y verifica el token |
| **Authority Set** | Conjunto de nodos que emiten tokens por quorum |
| **Revocation Network** | Red distribuida de revocación |

### Requisito de quorum

```
Nodos totales:     n ≥ 3f + 1
Firmas requeridas: t ≥ 2f + 1
```

Donde `f` es el número de nodos bizantinos tolerados.

Ejemplo mínimo seguro: n=4 nodos, t=3 firmas, tolera f=1 nodo comprometido.

### Estructura del token ACP-D

```json
{
  "header": {
    "alg": "BLS12-381-threshold",
    "typ": "ACP-D-TOKEN",
    "ver": "2.0"
  },
  "capability_claim": {
    "sub": "did:acp:org:agent-001",
    "cap": ["acp:cap:financial.read"],
    "res": ["payments/*"],
    "iat": 1700000000,
    "exp": 1700003600,
    "nonce": "<128-bit CSPRNG>"
  },
  "zk_proof": "<prueba de posesión sin revelar clave privada>",
  "multi_signature": "<t-of-n threshold signature del Authority Set>"
}
```

---

## Flujo de autorización ACP-D

```
1. Subject solicita token al Authority Set
2. Subject genera zk_proof de posesión de credencial válida
3. Subject recolecta firmas del quorum (≥ t nodos)
4. Subject presenta ACP-D-Token al Resource Server
5. Resource Server verifica:
   ├── multi_signature válida (≥ t firmas de nodos conocidos)
   ├── zk_proof válida (sin revelar credenciales)
   ├── Token no expirado
   ├── No-inclusión en Merkle tree de revocaciones
   └── Capability y resource dentro del scope declarado
```

---

## Modelo alternativo: Self-Sovereign Capability

Para casos donde no hay Authority Set disponible, ACP-D define un modelo alternativo donde el token es una prueba ZK directa:

```
cap_token = ZK-Proof(
    "poseo una credencial verificable válida"
    ∧ "esa credencial me otorga la capability X"
    ∧ "no está revocada"
)
```

El Verifier valida la prueba sin necesidad de comunicarse con ningún issuer.

---

## Primitivas criptográficas requeridas

| Componente | Primitiva | Estado de madurez (2026) |
|---|---|---|
| Threshold signatures | BLS12-381 | Maduro en Ethereum ecosystem |
| ZK-proofs de posesión | zk-SNARK (Groth16) / Bulletproofs | Maduro en producción |
| ZK-proofs de no-revocación | Merkle non-inclusion proof | Estándar |
| Identidades descentralizadas | W3C DID spec | Estándar aprobado |
| Credenciales verificables | W3C VC Data Model | Estándar aprobado |

---

## Propiedades de seguridad

| Propiedad | Garantía |
|---|---|
| **Token forgery** | Imposible sin comprometer ≥ t nodos del Authority Set |
| **Replay attacks** | Nonce único + window temporal |
| **Escalación de privilegios** | Confinamiento formal — `cap_delegated ⊆ cap_original` |
| **Collusión parcial** | Resistente hasta f = ⌊(n-1)/3⌋ nodos comprometidos |
| **Privacidad del agente** | ZK-proof no revela credenciales, solo posesión |
| **Issuer único comprometido** | No aplicable — no hay issuer único |

---

## Por qué ACP-D es v2.0 y no v1.1

ACP-D no es una extensión incremental. Es un cambio de modelo de confianza:

1. **Complejidad operacional:** Las organizaciones necesitan operar un conjunto de nodos de Authority Set coordinados con BFT.
2. **Overhead de ZK-proofs:** La generación de pruebas tiene costo computacional no trivial.
3. **Ecosistema requerido:** Requiere infraestructura de DIDs y VCs que aún no es estándar en entornos enterprise.
4. **Adopción:** ACP v1.0 ya es implementable hoy con criptografía estándar (Ed25519, SHA-256, TLS 1.3).

ACP-D es la dirección correcta a largo plazo. ACP v1.0 es el camino de adopción hoy.

---

## Documentos

| Documento | Contenido |
|---|---|
| [ACP-D-Especificacion.md](ACP-D-Especificacion.md) | Especificación técnica normativa completa |
| [Arquitectura-Sin-Issuer-Central.md](Arquitectura-Sin-Issuer-Central.md) | Modelo DID + VC + Self-Sovereign Capability |

---

*TraslaIA — Marcelo Fernandez — 2026*
