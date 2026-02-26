# ACP Framework — Agent Control Protocol

Arquitectura Constitucional para la Gobernanza de Agentes Autónomos

ACP (Agent Control Protocol) es un framework integral de gobernanza y ejecución verificable para agentes de IA autónomos.

Define un marco unificado que integra:

Fundamentos arquitectónicos de soberanía institucional

Modelo formal de gobernanza (GAT)

Protocolo criptográfico de control y delegación

Infraestructura de cumplimiento y certificación pública

ACP no es únicamente un protocolo de mensajería o firma.
Es una arquitectura constitucional que establece reglas formales bajo las cuales un agente autónomo puede actuar.

**Versión:** 1.2 | **Licencia:** Apache 2.0 | **Autor:** Marcelo Fernandez — TraslaIA | info@traslaia.com

---

## El problema que resuelve

Las organizaciones están desplegando agentes de IA autónomos sin respuesta a preguntas críticas:

- ¿Quién autorizó a este agente a ejecutar esta acción?
- ¿Puedo probarlo criptográficamente, después del hecho?
- ¿Puedo revocar o restringir esa autorización dinámicamente?
- ¿Esto funciona con cualquier proveedor de IA?

**ACP Framework** es la respuesta completa a las cuatro preguntas.

---

## Invariante fundamental

```
Execute(request) ⟹ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk
```

Ninguna acción se ejecuta sin que estas cuatro condiciones sean criptográficamente verificables.

---

## Los tres niveles del framework

```
┌──────────────────────────────────────────────────────────────┐
│  NIVEL 1 — Arquitectura Soberana de IA                        │
│                                                               │
│  El POR QUÉ.                                                  │
│  Las organizaciones necesitan independencia real de los       │
│  proveedores de IA. La soberanía no es una opción, es         │
│  un requisito arquitectónico.                                 │
│                                                               │
│  → 01-arquitectura-soberana/                                  │
├──────────────────────────────────────────────────────────────┤
│  NIVEL 2 — Modelo GAT                                         │
│  (Gobernanza Arquitectónica de Agentes)                       │
│                                                               │
│  El QUÉ.                                                      │
│  Separación formal entre decisión y ejecución.                │
│  Trazabilidad estructural. Madurez medible.                   │
│                                                               │
│  → 02-modelo-gat/                                             │
├──────────────────────────────────────────────────────────────┤
│  NIVEL 3 — Protocolo ACP v1.0                                 │
│  (Agent Control Protocol)                                     │
│                                                               │
│  El CÓMO.                                                     │
│  Implementación criptográfica de los principios anteriores.   │
│  5 capas técnicas. 5 niveles de conformidad. Certificable.    │
│                                                               │
│  → 03-protocolo-acp/                                          │
└──────────────────────────────────────────────────────────────┘
```

---

## Estructura del repositorio

### [`01-arquitectura-soberana/`](01-arquitectura-soberana/) — Nivel 1

Los fundamentos filosóficos y estratégicos. Por qué la soberanía institucional sobre agentes de IA no es opcional.

| Documento | Contenido |
|---|---|
| [Arquitectura-Soberana-de-IA.md](01-arquitectura-soberana/Arquitectura-Soberana-de-IA.md) | Framework completo de soberanía (ES) |
| [Sovereign-AI-Architecture-Framework.md](01-arquitectura-soberana/Sovereign-AI-Architecture-Framework.md) | Framework completo de soberanía (EN) |
| [Doctrina-Fundacional-ACP.md](01-arquitectura-soberana/Doctrina-Fundacional-ACP.md) | Los tres pilares criptográficos del protocolo |
| [Riesgo-sin-Arquitectura-Soberana.csv](01-arquitectura-soberana/Riesgo-sin-Arquitectura-Soberana.csv) | Matriz de riesgo sin arquitectura soberana |

---

### [`02-modelo-gat/`](02-modelo-gat/) — Nivel 2

El modelo de Gobernanza Arquitectónica de Agentes. Cómo estructurar organizaciones que operan agentes autónomos.

| Documento | Contenido |
|---|---|
| [GAT-Maturity-Model.md](02-modelo-gat/GAT-Maturity-Model.md) | Modelo GAT v1.1 — Matriz de Madurez niveles 0-5 |
| [Arquitectura-Tres-Capas.md](02-modelo-gat/Arquitectura-Tres-Capas.md) | Síntesis de los 3 niveles del framework |
| [ACP-Architecture-Specification.md](02-modelo-gat/ACP-Architecture-Specification.md) | Arquitectura técnica unificada — 5 layers |
| [Roadmap.md](02-modelo-gat/Roadmap.md) | Estado del protocolo y hoja de ruta v1.x / v2.0 |
| [matrices/](02-modelo-gat/matrices/) | Matrices de madurez GAT (CSV) |

---

### [`03-protocolo-acp/`](03-protocolo-acp/) — Nivel 3

La implementación técnica. Especificación normativa, cumplimiento y vectores de prueba.

#### Especificación técnica

**Núcleo L1 — obligatorio para cualquier implementador**

| Documento | Función |
|---|---|
| [ACP-SIGN-1.0.md](03-protocolo-acp/especificacion/nucleo/ACP-SIGN-1.0.md) | Serialización JCS + firma Ed25519 |
| [ACP-CT-1.0.md](03-protocolo-acp/especificacion/nucleo/ACP-CT-1.0.md) | Estructura y verificación de Capability Tokens |
| [ACP-CAP-REG-1.0.md](03-protocolo-acp/especificacion/nucleo/ACP-CAP-REG-1.0.md) | Registro canónico de capacidades |
| [ACP-HP-1.0.md](03-protocolo-acp/especificacion/nucleo/ACP-HP-1.0.md) | Handshake Protocol — prueba de posesión |
| [ACP-DCMA-1.0.md](03-protocolo-acp/especificacion/nucleo/ACP-DCMA-1.0.md) | Delegación encadenada multi-agente — no-escalación + revocación transitiva |
| [ACP-AGENT-SPEC-0.3.md](03-protocolo-acp/especificacion/nucleo/ACP-AGENT-SPEC-0.3.md) | Ontología formal del agente — `A=(ID,C,P,D,L,S)` |
| [ACP-MESSAGES-1.0.md](03-protocolo-acp/especificacion/nucleo/ACP-MESSAGES-1.0.md) | Wireformat del protocolo — 5 tipos de mensajes normalizados |

**Seguridad L2 — emisores de tokens**

| Documento | Función |
|---|---|
| [ACP-RISK-1.0.md](03-protocolo-acp/especificacion/seguridad/ACP-RISK-1.0.md) | Motor de riesgo determinístico (RS 0-100) |
| [ACP-REV-1.0.md](03-protocolo-acp/especificacion/seguridad/ACP-REV-1.0.md) | Protocolo de revocación (endpoint + CRL) |
| [ACP-ITA-1.0.md](03-protocolo-acp/especificacion/seguridad/ACP-ITA-1.0.md) | Institutional Trust Anchor — modelo centralizado |
| [ACP-ITA-1.1.md](03-protocolo-acp/especificacion/seguridad/ACP-ITA-1.1.md) | Trust Anchor Governance — modelo BFT distribuido |
| [ACP-REP-1.1.md](03-protocolo-acp/especificacion/seguridad/ACP-REP-1.1.md) | Reputation Extension — score adaptativo [0,1] |

**Operaciones L3 — sistema completo**

| Documento | Función |
|---|---|
| [ACP-API-1.0.md](03-protocolo-acp/especificacion/operaciones/ACP-API-1.0.md) | HTTP API formal con todos los endpoints |
| [ACP-EXEC-1.0.md](03-protocolo-acp/especificacion/operaciones/ACP-EXEC-1.0.md) | Execution Tokens — uso único, 300s |
| [ACP-LEDGER-1.0.md](03-protocolo-acp/especificacion/operaciones/ACP-LEDGER-1.0.md) | Audit Ledger append-only hash-encadenado |
| [ACP-PAY-1.0.md](03-protocolo-acp/especificacion/operaciones/ACP-PAY-1.0.md) | Payment Extension — capability con liquidación verificable |

**Gobernanza — niveles de conformidad**

| Documento | Función |
|---|---|
| [ACP-CONF-1.1.md](03-protocolo-acp/especificacion/gobernanza/ACP-CONF-1.1.md) | **Conformidad 5 niveles acumulativos L1-L5** (normativo) |
| [ACP-CONF-1.0.md](03-protocolo-acp/especificacion/gobernanza/ACP-CONF-1.0.md) | ⚠️ Deprecated — supersedido por CONF-1.1 |

**Descentralizado L5 — ACP-D**

| Documento | Función |
|---|---|
| [ACP-D-Especificacion.md](03-protocolo-acp/especificacion/descentralizado/ACP-D-Especificacion.md) | Especificación técnica completa ACP-D |
| [Arquitectura-Sin-Issuer-Central.md](03-protocolo-acp/especificacion/descentralizado/Arquitectura-Sin-Issuer-Central.md) | Modelo DID + VC + Self-Sovereign Capability |
| [README-ACP-D.md](03-protocolo-acp/especificacion/descentralizado/README-ACP-D.md) | Contexto y diferencias con ACP v1.0 |

#### Cumplimiento y certificación

Cadena completa: especificación → test suite → runner → certificación pública.

```
CONF-1.1 → TS-SCHEMA (forma) → TS-1.0 (qué pasar) → TS-1.1 (formato JSON)
         → IUT-PROTOCOL (contrato runner↔impl) → ACR-1.0 (ejecuta)
         → CERT-1.0 (badge público verificable)
```

| Documento | Función |
|---|---|
| [ACP-TS-SCHEMA-1.0.md](03-protocolo-acp/cumplimiento/ACP-TS-SCHEMA-1.0.md) | JSON Schema formal de test vectors (Draft 2020-12) |
| [ACP-TS-1.0.md](03-protocolo-acp/cumplimiento/ACP-TS-1.0.md) | Test Suite — casos requeridos por nivel L1-L5 |
| [ACP-TS-1.1.md](03-protocolo-acp/cumplimiento/ACP-TS-1.1.md) | Formato normativo de vectores — determinista, language-agnostic |
| [ACP-IUT-PROTOCOL-1.0.md](03-protocolo-acp/cumplimiento/ACP-IUT-PROTOCOL-1.0.md) | Contrato runner ↔ IUT — STDIN/STDOUT, timeouts, manifest |
| [ACR-1.0.md](03-protocolo-acp/cumplimiento/ACR-1.0.md) | Official Compliance Runner — ejecuta tests y emite certificaciones |
| [ACP-CERT-1.0.md](03-protocolo-acp/cumplimiento/ACP-CERT-1.0.md) | Sistema de Certificación Pública — badge ACP-CERT-YYYY-NNNN |

#### Vectores de prueba normativos

12 vectores JSON determinísticos para validar implementaciones contra ACP-TS-1.1.

| Archivo | Capa | Tipo | Resultado esperado |
|---|---|---|---|
| [TS-CORE-POS-001](03-protocolo-acp/test-vectors/TS-CORE-POS-001-valid-canonical-capability.json) | CORE | ✅ | `VALID` — capability canónica |
| [TS-CORE-POS-002](03-protocolo-acp/test-vectors/TS-CORE-POS-002-valid-multiple-actions.json) | CORE | ✅ | `VALID` — múltiples acciones |
| [TS-CORE-NEG-001](03-protocolo-acp/test-vectors/TS-CORE-NEG-001-expired-token.json) | CORE | ❌ | `REJECT / EXPIRED` |
| [TS-CORE-NEG-002](03-protocolo-acp/test-vectors/TS-CORE-NEG-002-missing-expiry.json) | CORE | ❌ | `REJECT / MALFORMED_INPUT` |
| [TS-CORE-NEG-003](03-protocolo-acp/test-vectors/TS-CORE-NEG-003-missing-nonce.json) | CORE | ❌ | `REJECT / MALFORMED_INPUT` |
| [TS-CORE-NEG-004](03-protocolo-acp/test-vectors/TS-CORE-NEG-004-invalid-signature.json) | CORE | ❌ | `REJECT / INVALID_SIGNATURE` |
| [TS-CORE-NEG-005](03-protocolo-acp/test-vectors/TS-CORE-NEG-005-revoked-token.json) | CORE | ❌ | `REJECT / REVOKED` |
| [TS-CORE-NEG-006](03-protocolo-acp/test-vectors/TS-CORE-NEG-006-untrusted-issuer.json) | CORE | ❌ | `REJECT / UNTRUSTED_ISSUER` |
| [TS-DCMA-POS-001](03-protocolo-acp/test-vectors/TS-DCMA-POS-001-valid-delegation-chain.json) | DCMA | ✅ | `VALID` — delegación single-hop |
| [TS-DCMA-NEG-001](03-protocolo-acp/test-vectors/TS-DCMA-NEG-001-privilege-escalation.json) | DCMA | ❌ | `REJECT / ACCESS_DENIED` |
| [TS-DCMA-NEG-002](03-protocolo-acp/test-vectors/TS-DCMA-NEG-002-revoked-delegator.json) | DCMA | ❌ | `REJECT / REVOKED` |
| [TS-DCMA-NEG-003](03-protocolo-acp/test-vectors/TS-DCMA-NEG-003-delegation-depth-exceeded.json) | DCMA | ❌ | `REJECT / DELEGATION_DEPTH` |

---

### [`04-analisis-formal/`](04-analisis-formal/)

Análisis formal de seguridad, amenazas y endurecimiento sistémico.

| Documento | Contenido |
|---|---|
| [Formal-Security-Model.md](04-analisis-formal/Formal-Security-Model.md) | Modelo formal con teoremas de unforgeability y replay resistance |
| [Formal-Security-Model-v2.md](04-analisis-formal/Formal-Security-Model-v2.md) | Versión actualizada — probabilistic security bounds |
| [Threat-Model.md](04-analisis-formal/Threat-Model.md) | Análisis STRIDE completo |
| [Adversarial-Analysis.md](04-analisis-formal/Adversarial-Analysis.md) | 10 vectores de ataque con mitigaciones |
| [Hardening-Sistemico.md](04-analisis-formal/Hardening-Sistemico.md) | 10 áreas de endurecimiento operacional |
| [Modelo-Matematico-Seguridad.md](04-analisis-formal/Modelo-Matematico-Seguridad.md) | Formalización S = (A, K, T, R, V) |
| [Security-Reduction-EUF-CMA.md](04-analisis-formal/Security-Reduction-EUF-CMA.md) | Reducción a seguridad EUF-CMA de Ed25519 |
| [Motor-Decision-Formal-MFMD.md](04-analisis-formal/Motor-Decision-Formal-MFMD.md) | Motor de Decisión Formal — MFMD-ACP, estados y transiciones |

---

### [`05-implementacion/`](05-implementacion/)

Guías para implementadores: del concepto al código.

| Documento | Contenido |
|---|---|
| [Arquitectura-Minima-Obligatoria.md](05-implementacion/Arquitectura-Minima-Obligatoria.md) | Los 5 componentes mínimos (AMO) para L1 |
| [MVP-Criptografico.md](05-implementacion/MVP-Criptografico.md) | Implementación mínima funcional |
| [Prototipo-Python.md](05-implementacion/Prototipo-Python.md) | PME v0.1 — prototipo en Python con 6 casos de prueba |

---

### [`06-publicaciones/`](06-publicaciones/)

Documentación académica y técnica para audiencias externas.

| Documento | Audiencia |
|---|---|
| [ACP-Whitepaper-v1.0.md](06-publicaciones/ACP-Whitepaper-v1.0.md) | CTOs, arquitectos, decisores técnicos |
| [ACP-Technical-Academic.md](06-publicaciones/ACP-Technical-Academic.md) | Investigadores, revisores técnicos formales |
| [IEEE-NDSS-Paper-Structure.md](06-publicaciones/IEEE-NDSS-Paper-Structure.md) | Draft de paper — objetivo IEEE S&P / NDSS |

---

## Niveles de conformidad

| Nivel | Nombre | Requiere | Para quién |
|---|---|---|---|
| **L1** | CORE | SIGN + CT + CAP-REG + HP | Todo implementador |
| **L2** | SECURITY | L1 + RISK + REV + ITA-1.0 | Emisores de tokens centralizados |
| **L3** | FULL | L2 + API + EXEC + LEDGER | Sistema completo centralizado |
| **L4** | EXTENDED | L3 + PAY + REP + ITA-1.1 | Con extensiones económicas y reputacionales |
| **L5** | DECENTRALIZED | L4 + ACP-D + ITA-1.1 BFT | Tolerante a fallos bizantinos |

---

## Roadmap

| Versión | Estado | Hito |
|---|---|---|
| **v1.0** | ✅ Completo | 10 documentos normativos — sistema centralizado |
| **v1.1** | ✅ Completo | PAY-1.0, REP-1.1, ITA-1.1 BFT + Architecture Spec |
| **v1.2** | ✅ Completo | CONF-1.1 (5 niveles), compliance chain completa, 12 test vectors |
| **v2.0** | 📋 Especificado | ACP-D full (BFT, ZK-proofs, DIDs) |
| **Paper** | ✍️ En preparación | Objetivo IEEE S&P / NDSS |

---

## Inicio rápido

→ [`QUICKSTART.md`](QUICKSTART.md) — 15 minutos para entender el framework completo

---

*TraslaIA — Marcelo Fernandez — 2026 — Apache 2.0*
