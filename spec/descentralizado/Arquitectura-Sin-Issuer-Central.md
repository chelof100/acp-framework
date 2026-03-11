ACP-D (Decentralized Capability Protocol)
4.1 Emisión Basada en DID + VC

Modelo:

Identidades DID

Credenciales verificables

Autoridad distribuida

4.2 Emisión Colectiva

Token válido si:

Firmado por quorum

O derivado de credenciales verificables

4.3 Modelo Alternativo: Self-Sovereign Capability

El usuario genera:

cap_token = ZK-Proof(
    poseo credencial válida
    tengo derecho a capability X
)

Verificador valida la prueba.

No hay issuer central.

4.4 Arquitectura Final

Tres capas:

Identidad descentralizada (DID)

Credenciales verificables

Capability derivada vía prueba criptográfica

4.5 Seguridad

Resistente a:

Compromiso de un nodo

Collusión parcial

Ataques bizantinos < 1/3 red