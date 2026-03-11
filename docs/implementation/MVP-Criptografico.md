Objetivo

Construir una versión mínima operativa del sistema ACP que permita:

Emisión de Capability Tokens

Verificación criptográfica

Validación contextual

Revocación básica

Prevención de replay

Sin dependencia de infraestructura compleja.

1.1 Componentes del MVP
A. Issuer

Servicio que:

Genera clave Ed25519

Emite tokens firmados

Asigna:

subject_id

capability_set

constraints

expiry

nonce

B. Verifier

Servicio que:

Verifica firma

Verifica expiry

Verifica nonce

Evalúa constraints

Consulta lista de revocación

C. Revocation Store

Implementación simple:

Lista hash de token_id revocados

Opcional: Bloom filter para eficiencia

1.2 Especificación del Token (MVP)

Formato serializado JSON canónico:

{
  "iss": "did:acp:issuer01",
  "sub": "did:acp:user123",
  "iat": 1730000000,
  "exp": 1730003600,
  "nonce": "b64_random_128bit",
  "cap": [
    {
      "resource": "db.customer",
      "action": ["read"],
      "constraints": {
        "ip_range": "10.0.0.0/24",
        "mfa": true
      }
    }
  ]
}

Firmado con:

Ed25519
signature = Sign(sk_issuer, hash(canonical_token))
1.3 Flujo Operativo
Emisión

Cliente autenticado

Issuer construye payload

Firma

Devuelve token firmado

Acceso

Cliente presenta token

Verifier:

Verifica firma

Verifica exp

Verifica nonce no usado

Evalúa constraints

Verifica no revocado

Si todo válido → acceso

1.4 Código de Referencia (Pseudo)
Firma
from nacl.signing import SigningKey
from nacl.encoding import Base64Encoder

sk = SigningKey.generate()
signed = sk.sign(token_bytes)
Verificación
from nacl.signing import VerifyKey

vk = VerifyKey(pubkey_bytes)
vk.verify(signed_token)
1.5 Seguridad del MVP

Protege contra:

Falsificación

Replay (con nonce store)

Escalada de privilegios

Token forging

Token tampering

No protege aún contra:

Issuer malicioso

Compromiso de clave privada

Collusión verificadores