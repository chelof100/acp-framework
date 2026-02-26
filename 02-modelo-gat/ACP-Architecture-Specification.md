Adaptive Capability Protocol — Unified Architecture

Version 1.0
Status: Candidate Standard

1. Scope

Este documento consolida:

ACP 1.0 (Core Capability Model)

ACP-D 1.0 (Decentralized Model)

ACP-ITA 1.1 (Trust Anchor Governance)

ACP-PAY 1.0 (Payment Binding)

ACP-REP 1.1 (Reputation Layer)

Define la arquitectura integral del ecosistema ACP.

2. Design Principles

ACP se basa en cinco principios:

Capabilities explícitas

Verificación criptográfica obligatoria

Tolerancia bizantina

Modularidad extensible

Minimización de confianza implícita

3. Layered Architecture

ACP se organiza en cinco capas:

Layer 1 — Identity Layer

Basada en DIDs compatibles con el modelo del World Wide Web Consortium.

Define:

Subject identifiers

Authority identifiers

Verifier identifiers

Layer 2 — Capability Layer (ACP Core)

Define:

Cap = (subject, resource, action_set, constraints, expiry)

Las capabilities MUST:

Estar firmadas

Tener expiración

Tener identificador único (jti)

Tener nonce anti-replay

Layer 3 — Consensus & Governance (ACP-D + ACP-ITA)

Modelo bizantino:

n ≥ 3f + 1
Token válido si ≥ 2f+1 firmas

ACP-ITA define:

Registro de autoridades

Admisión

Remoción

Rotación de claves

El Trust Registry es la raíz de confianza del sistema.

Layer 4 — Economic Binding (ACP-PAY)

Opcional.

Añade:

payment_condition

Un recurso puede requerir:

Pago previo verificable

Micropago por acceso

SLA económico

Layer 5 — Adaptive Security (ACP-REP)

Cada entidad tiene:

ReputationScore ∈ [0,1]

Se usa para:

Ajustar expiraciones

Incrementar quorum dinámico

Activar auditoría

4. System Roles

Subject

Authority Node

Resource Server

Revocation Network

Governance Participants

5. Token Taxonomy

ACP define tres tipos:

ACP-CAP (centralizado)

ACP-D-CAP (descentralizado)

ACP-PAY-CAP (económico)

Todos comparten estructura base:

header
claim
proof
signature_set
6. Security Model

El sistema es seguro si:

≤ f autoridades bizantinas

Hash resistente a colisión

Firmas no forjables

Revocación consistente

Falla si ≥ 2f+1 autoridades coluden.

7. Failure Domains
Dominio	Mitigación
Issuer comprometido	Eliminado en ACP-D
Collusión parcial	Tolerado hasta f
Replay	nonce + expiración
Escalada	Capability explícita
Captura lenta	ACP-REP
8. Formal Guarantees

ACP garantiza:

No creación unilateral de capability

No escalado sin quorum

No validez tras revocación

Seguridad bajo modelo bizantino

9. Interoperability

ACP puede integrarse con:

Infraestructura DID

Sistemas Zero-Trust

Blockchains permissioned

Infraestructura empresarial legacy

10. Extensibility Model

Nuevas extensiones MUST:

No romper invariantes bizantinos

No introducir issuer central

Mantener verificabilidad criptográfica

11. Reference Implementation Guidance

Lenguajes recomendados:

Rust (core)

Go (network layer)

WASM (client proof)

Criptografía:

BLS12-381

Ed25519

SHA-256