Submission Draft — IEEE S&P / NDSS

Ahora estructuramos el paper académico.

Title

ACP: A Byzantine-Resilient Decentralized Capability Authorization Architecture

Abstract

Proponemos ACP, un sistema de autorización basado en capacidades que elimina emisores centralizados y reemplaza la firma unilateral por consenso criptográfico tolerante a fallos bizantinos. ACP integra gobernanza verificable, reputación adaptativa y vinculación económica opcional. Demostramos formalmente su seguridad bajo modelo n ≥ 3f+1 y validamos propiedades mediante modelado TLA+.

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

ACP introduce autorización tolerante a fallos bizantinos como primitiva nativa en sistemas distribuidos.