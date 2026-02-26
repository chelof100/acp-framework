Especificación Técnica Normativa
Estado: Propuesta Estándar
1. Introducción

ACP-D define un sistema de autorización criptográfica descentralizado basado en:

Identificadores descentralizados (DID)

Credenciales verificables

Tokens de capacidad derivados criptográficamente

Verificación sin emisor central

El protocolo elimina el punto único de fallo presente en arquitecturas con issuer central.

2. Terminología Normativa

Las palabras MUST, MUST NOT, REQUIRED, SHALL, SHOULD, SHOULD NOT, MAY se interpretan según IETF RFC 2119.

3. Arquitectura General

ACP-D consta de cuatro roles:

Subject

Resource Server (Verifier)

Authority Set (quorum descentralizado)

Revocation Network

No existe issuer único.

4. Identidad
4.1 Identificadores

Todo participante MUST poseer un DID conforme al modelo del World Wide Web Consortium (W3C DID Core).

Formato:

did:acpd:<method-specific-id>
5. Modelo de Capability Descentralizada

Una Capability ACP-D se define como:

Cap = (subject, resource, action_set, constraints, expiry)

Un token es válido si:

El Subject posee credencial válida.

La credencial fue emitida por autoridad miembro del quorum.

Se cumple política de consenso.

Se presenta prueba criptográfica válida.

6. Estructura del Token ACP-D
ACP-D-Token = {
    header,
    capability_claim,
    zk_proof,
    multi_signature
}
6.1 Header
{
  "alg": "BLS12-381",
  "typ": "ACP-D-CAP",
  "ver": "1.0"
}
6.2 Capability Claim
{
  sub: DID,
  res: ResourceID,
  act: [Action],
  ctx: ContextObject,
  exp: Timestamp,
  jti: UniqueID
}
7. Firma Multi-Authority
7.1 Requisito de Quorum

Sea:

n = número total de autoridades

f = número máximo de nodos bizantinos tolerables

El sistema MUST cumplir:

n ≥ 3f + 1

Un token es válido si al menos t firmas están presentes:

t ≥ 2f + 1
7.2 Algoritmo

El protocolo SHOULD utilizar:

BLS12-381 threshold signature
o

Multi-Ed25519 agregada

La firma agregada MUST verificarse contra el conjunto público autorizado.

8. Prueba de Posesión de Credencial

El Subject MUST generar una prueba criptográfica que demuestre:

Posee credencial válida.

La credencial contiene autorización para la capability solicitada.

No está revocada.

El protocolo SHOULD utilizar:

zk-SNARK

zk-STARK

Bulletproofs

La prueba MUST ser no interactiva.

9. Revocación Descentralizada
9.1 Modelo

La red mantiene un Merkle Tree de revocaciones.

Cada bloque de revocación MUST incluir:

{
  revoked_token_id,
  timestamp,
  revocation_reason,
  authority_signature
}
9.2 Validación

El Verifier MUST:

Verificar prueba Merkle de no inclusión.

Verificar firma del bloque de revocación.

Confirmar que bloque pertenece a cadena válida.

10. Flujo de Autorización
Paso 1: Solicitud

Subject solicita capability.

Paso 2: Generación de prueba

Subject genera zk_proof.

Paso 3: Recolección de firmas

Autoridades firman bajo política de quorum.

Paso 4: Presentación

Subject presenta ACP-D-Token al Resource Server.

Paso 5: Verificación

El Verifier MUST:

Verificar multi_signature

Verificar zk_proof

Verificar expiry

Verificar no revocación

Evaluar constraints

Si todas las validaciones son correctas → acceso concedido.

11. Modelo de Seguridad

ACP-D es seguro si:

La fracción de nodos bizantinos < 1/3.

La criptografía subyacente es segura.

No se compromete mayoría de claves privadas.

Resiste:

Compromiso parcial de autoridades

Collusión limitada

Token forgery

Replay (con nonce y expiración)

Escalada de privilegios

12. Ataques Considerados
12.1 Compromiso de Autoridad

Si f autoridades son comprometidas:

No pueden generar token válido sin quorum.

12.2 Collusión Verifier + Authority

Mitigado por:

Validación independiente

Auditoría pública

Registro verificable

12.3 Ataque Replay

Mitigado por:

nonce obligatorio

exp corto

registro distribuido opcional

13. Consideraciones de Implementación
13.1 Lenguajes Recomendados

Rust

Go

TypeScript (solo capa cliente)

13.2 Librerías Criptográficas

blst (BLS12-381)

arkworks

dalek (Ed25519)

14. Interoperabilidad

ACP-D MAY integrarse con:

Sistemas de identidad DID

Infraestructuras SSI

Sistemas blockchain permissioned

Sistemas Web2 legacy vía gateway

15. Extensiones Futuras

Soporte Post-Quantum (Dilithium)

Proof-of-Validation verificable públicamente

Auditoría zk de verificadores

Delegación criptográfica de capabilities

Conclusión Técnica

ACP-D elimina el issuer central.

La autoridad se distribuye bajo modelo bizantino tolerante.

La autorización pasa de ser una firma unilateral a un consenso criptográfico verificable.

Esto convierte el control de acceso en:

Verificable

Distribuido

Audit-able

Resistente a colusión parcial