Submission Draft — IEEE S&P / NDSS

> **Nota de estado:** Este paper describe **ACP-D**, la extensión descentralizada de la especificación ACP, orientada a la hoja de ruta arquitectónica v2.0. La especificación de producción actual (ACP v1.x) utiliza un emisor centralizado con firma unilateral Ed25519 y verificación criptográfica local. ACP-D — con firma de umbral, consenso BFT y gobernanza descentralizada — es una evolución arquitectónica planificada, aún no implementada.

Title

ACP-D: A Byzantine-Resilient Decentralized Capability Authorization Architecture

Abstract

Proponemos ACP-D, una extensión descentralizada de la arquitectura de autorización basada en capacidades del Agent Control Protocol (ACP). Construida sobre el modelo criptográfico de capacidades de ACP v1.x, ACP-D elimina el emisor centralizado y reemplaza la firma unilateral por consenso criptográfico tolerante a fallos bizantinos. ACP-D integra gobernanza verificable, reputación adaptativa y vinculación económica opcional. Demostramos formalmente su seguridad bajo modelo n ≥ 3f+1 y validamos propiedades mediante modelado TLA+.

1. Introduction

Problema:

RBAC depende de autoridad central.

Zero Trust depende de policy engines centralizados.

Sistemas distribuidos carecen de modelo de autorización bizantino nativo.

Contribuciones:

Modelo formal de capability bajo consenso.

Gobernanza criptográfica de autoridades.

Integración reputacional adaptativa.

Vinculación económica verificable.

Modelo formal TLA+ probado.

2. Background

Capability-based security

Byzantine Fault Tolerance

Threshold Signatures

Decentralized Identity

3. System Model

Define:

n autoridades

f bizantinas

Red parcialmente síncrona

Adversario adaptativo

4. Protocol Design

Describe:

Token structure

Threshold signing

zk proof

Revocation tree

Governance

5. Formal Security Analysis

Teorema principal:

Mientras Byzantine ≤ f, ningún token válido puede ser generado por nodos bizantinos únicamente.

Prueba basada en:

Cardinalidad

Propiedades de threshold signature

Invariantes TLA+

6. Adversarial Evaluation

Analizamos:

Collusion ≤ f

Collusion ≥ 2f+1

Key compromise

Replay

Long-term governance capture

7. Comparison

Comparación contra:

RBAC

Zero Trust

OAuth-based models

Blockchain access control

8. Implementation Considerations

Coste de BLS

Coste de zk proof

Latencia quorum

Overhead reputacional

9. Limitations

Dependencia de mayoría honesta

Complejidad criptográfica

Costo computacional zk

10. Conclusion

ACP-D introduce autorización tolerante a fallos bizantinos como primitiva nativa en sistemas distribuidos, extendiendo el modelo de capacidades de ACP v1.x hacia una arquitectura de gobernanza completamente descentralizada.
