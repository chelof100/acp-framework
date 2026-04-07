# ACP — Agent Control Protocol

**Control de admisión para acciones de agentes.**

Antes de que un agente mute el estado del sistema, ACP responde cuatro preguntas: *¿Quién es este agente? ¿Qué está autorizado a hacer? ¿Esta acción cumple la política vigente? ¿Puede el resultado atribuirse a una institución responsable?*

`Identidad criptográfica · Tokens de capacidad con scope · Cadenas de delegación verificables · Prueba de ejecución`

## Sitio Web Oficial

https://agentcontrolprotocol.xyz

## Paper

**Agent Control Protocol: Admission Control for Agent Actions**
Marcelo Fernandez (TraslaIA), 2026

DOI: [10.5281/zenodo.19449650](https://doi.org/10.5281/zenodo.19449650) — Zenodo (v1.23)

arXiv: [2603.18829](https://arxiv.org/abs/2603.18829) — v7 (v1.23)

---

## Por Qué Existe ACP

Los agentes autónomos están pasando de la experimentación a la producción. Ya interactúan con APIs, sistemas empresariales, infraestructura financiera y otros agentes.

Cuando un agente actúa entre organizaciones, surgen inmediatamente varias preguntas:

- ¿Quién autorizó al agente a actuar?
- ¿Qué capacidades tiene realmente el agente?
- ¿Qué política permitió la acción?
- ¿Qué se ejecutó exactamente?
- ¿Puede verificarse esa ejecución después?
- ¿Puede reconstruirse el historial completo de interacción?

Hoy, la mayoría de los sistemas no pueden responder estas preguntas de forma confiable.

ACP introduce la infraestructura para responderlas todas.

---

## ACP vs Protocolos Relacionados

Varias iniciativas abordan cómo los agentes autónomos interactúan con los sistemas.
La mayoría se centra en **acceso a herramientas o comunicación**.
ACP se centra en **autoridad, verificación de ejecución y responsabilidad institucional**.

| Protocolo | Enfoque | Límite de scope |
|---|---|---|
| MCP (Model Context Protocol) | Acceso a herramientas para LLMs | Verificación de autoridad, aplicación de políticas, auditabilidad de ejecución |
| A2A (Agent-to-Agent) | Patrones de comunicación entre agentes | Confianza institucional, gobernanza, cadena de responsabilidad |
| OpenAI Agents SDK | Orquestación de herramientas | Autoridad cross-organization, provenance, responsabilidad |
| Agent Client Protocol ¹ | Integración runtime cliente/agente | Gobernanza, cadenas de delegación, historial de ejecución verificable |
| **ACP (Agent Control Protocol)** | **Infraestructura de gobernanza y responsabilidad** | **—** |

ACP aborda una capa diferente: **quién autorizó la acción, bajo qué política y quién es responsable del resultado**.

### ACP vs Sistemas de Política y Auth

Los ingenieros que evalúan ACP frecuentemente preguntan: "¿por qué no usar OPA?" Estos sistemas son complementarios, no competitivos.

| Sistema | Qué hace | Qué agrega ACP |
|---|---|---|
| **OPA** (Open Policy Agent) | Evalúa políticas a partir de datos y reglas | Identidad criptográfica del agente + cadena de delegación + prueba de ejecución |
| **AWS IAM / Azure RBAC** | Modelo de permisos estático para recursos cloud | Delegación dinámica agente-a-agente con cadena verificable + ledger |
| **OAuth 2.0 + OIDC** | Autorización de usuarios y servicios vía tokens | Delegación multi-hop de agentes con no-escalación + responsabilidad institucional |
| **SPIFFE / SPIRE** | Identidad criptográfica de workloads | ACP construye sobre identidad de workload para agregar scope de capacidades + gobernanza |
| **ACP** | Control de admisión para acciones de agentes | — |

OPA puede usarse como motor de evaluación de políticas *dentro* de un sistema ACP-conforme. ACP no reemplaza a OPA — agrega la capa de identidad del agente, la cadena de delegación y la prueba de ejecución que OPA no provee.

---

¹ ACP (Agent Control Protocol) no está relacionado con otras iniciativas que comparten el mismo acrónimo.

---

## ACP como Control de Admisión

Kubernetes usa un Admission Controller para interceptar solicitudes a la API antes de que lleguen al cluster — evaluando políticas, aplicando cuotas, rechazando operaciones no conformes. ACP aplica el mismo patrón a las acciones de agentes.

```
intención del agente
    ↓
[1] Verificación de identidad   →  pkg/agent + pkg/hp       (ACP-AGENT-1.0, ACP-HP-1.0)
    ↓
[2] Verificación de capacidad   →  pkg/ct + pkg/dcma         (ACP-CT-1.0, ACP-DCMA-1.0)
    ↓
[3] Verificación de política    →  pkg/risk + pkg/psn        (ACP-RISK-3.0, ACP-PSN-1.0)
    ↓
[4] ADMIT / DENY / ESCALATE
    ↓  (si ADMIT)
[5] Token de ejecución          →  pkg/exec                  (ACP-EXEC-1.0)
    ↓
[6] Registro en ledger          →  pkg/ledger                (ACP-LEDGER-1.3)
    ↓
mutación del estado del sistema
```

La diferencia con Kubernetes: ACP opera entre fronteras institucionales. Un agente del Banco A puede ser admitido por el Banco B sin que el Banco B confíe en la infraestructura interna del Banco A — solo importa la prueba criptográfica.

---

## Cómo Funciona ACP

ACP trata las interacciones de agentes como **operaciones gobernadas**, no como simples solicitudes.

Cada interacción pasa por seis etapas estructuradas:

1. **Verificación de identidad** — confirma quién es el agente (`ACP-AGENT-1.0`, `ACP-HP-1.0`)
2. **Validación de capacidad** — confirma qué está autorizado a hacer el agente (`ACP-CT-1.0`, `ACP-DCMA-1.0`)
3. **Autorización de política** — confirma que la acción está permitida bajo la política actual (`ACP-RISK-3.0`, `ACP-PSN-1.0`)
4. **Ejecución determinística** — ejecuta exactamente lo que fue autorizado, nada más (`ACP-EXEC-1.0`)
5. **Registro verificable** — produce prueba criptográfica de lo ocurrido (`ACP-LEDGER-1.3`, `ACP-PROVENANCE-1.0`)
6. **Actualización de confianza** — actualiza el estado de reputación y attestation basado en la interacción (`ACP-REP-1.2`, `ACP-LIA-1.0`)

Esto permite que las interacciones sean trazables, auditables y atribuibles entre organizaciones.

---

## Invariante Constitucional

La ejecución de ACP está gobernada por un único invariante arquitectónico.

```
Execute(request) ⟹
    ValidIdentity  ∧  ValidCapability  ∧  ValidDelegationChain  ∧  AcceptableRisk
```

| Condición | Significado |
|---|---|
| `ValidIdentity` | El agente tiene una identidad verificada y firmada |
| `ValidCapability` | El agente posee un Capability Token autorizado |
| `ValidDelegationChain` | Cada paso de delegación es trazable a una raíz institucional |
| `AcceptableRisk` | El risk score está dentro de los umbrales de política institucional |

Ninguna acción de agente se ejecuta a menos que las cuatro condiciones se satisfagan simultáneamente.

Las capas del protocolo existen para aplicar este invariante en cada frontera de interacción.

---

## Arquitectura del Protocolo

ACP está organizado en cinco capas de protocolo.
Cada capa construye sobre la anterior y agrega una capacidad de gobernanza distinta.

```
                    ARQUITECTURA DEL PROTOCOLO ACP

             ┌──────────────────────────────────────┐
             │                ACTORES               │
             │       Humanos · Sistemas · Agentes   │
             └──────────────────────────────────────┘
                                │
                                ▼
==================================================================== L1 — EJECUCIÓN CORE

┌──────────────────────────────────────────────────────────────────┐
│ IDENTIDAD Y CAPACIDADES                                          │
│ SIGN · AGENT · CT · CAP-REG                                      │
│                                                                  │
│ Identidad del agente, verificación de credenciales y registro    │
│ de capacidades                                                   │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ POLÍTICA Y AUTORIDAD                                             │
│ HP · DCMA                                                        │
│                                                                  │
│ Evaluación de política y decisión de autorización                │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│ EJECUCIÓN                                                        │
│ MESSAGES                                                         │
│                                                                  │
│ Ejecución determinística de comandos y manejo de interacciones   │
└──────────────────────────────────────────────────────────────────┘

==================================================================== L2 — CAPA DE CONFIANZA

┌──────────────────────────────────────────────────────────────────┐
│ GESTIÓN DE RIESGO                                                │
│ RISK · REV                                                       │
│                                                                  │
│ Scoring de riesgo y control de revocación                        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ CONFIANZA EN INTERACCIONES                                       │
│ ITA                                                              │
│                                                                  │
│ Attestations de confianza para interacciones                     │
└──────────────────────────────────────────────────────────────────┘

==================================================================== L3 — EJECUCIÓN VERIFICABLE

┌──────────────────────────────────────────────────────────────────┐
│ REGISTRO DE EJECUCIÓN                                            │
│ EXEC · POLICY-CTX                                                │
│                                                                  │
│ Prueba de ejecución y snapshot del contexto de política          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ PROVENANCE                                                       │
│ PROVENANCE GRAPH                                                 │
│                                                                  │
│ Linaje de interacción y seguimiento de eventos cross-sistema     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ LEDGER                                                           │
│                                                                  │
│ Almacenamiento resistente a manipulaciones del historial         │
│ de ejecución verificable                                         │
└──────────────────────────────────────────────────────────────────┘

==================================================================== L4 — GOBERNANZA

┌──────────────────────────────────────────────────────────────────┐
│ EVENTOS DE GOBERNANZA                                            │
│ GOV-EVENTS                                                       │
│                                                                  │
│ Seguimiento de gobernanza institucional                          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ REPUTACIÓN Y RESPONSABILIDAD                                     │
│ REP · LIA                                                        │
│                                                                  │
│ Acumulación de reputación y atribución de responsabilidad        │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ REGISTRO HISTÓRICO                                               │
│ HIST                                                             │
│                                                                  │
│ Historial de interacción verificable a largo plazo               │
└──────────────────────────────────────────────────────────────────┘

==================================================================== L5 — FEDERACIÓN

┌──────────────────────────────────────────────────────────────────┐
│ ACP DESCENTRALIZADO                                              │
│ ACP-D                                                            │
│                                                                  │
│ Federación y verificación cross-institución                      │
└──────────────────────────────────────────────────────────────────┘
```

→ **¿Nuevo en ACP? Comienza aquí:** [docs/admission-flow.md](docs/admission-flow.md) — guía completa paso a paso del control de admisión

→ Modelo de dominio formal y grafo de dependencias: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Interacción Cross-Institución

ACP está diseñado para interacciones entre sistemas independientes.
Cada paso produce un artefacto verificable que pasa a formar parte del registro permanente de interacción.

```
      INSTITUCIÓN A                               INSTITUCIÓN B
┌─────────────────────────────┐           ┌─────────────────────────────┐
│                             │           │                             │
│           AGENTE A          │           │           AGENTE B          │
│                             │           │                             │
└──────────────┬──────────────┘           └──────────────┬──────────────┘
               │                                         │
               │  1  solicitud de interacción            │
               └────────────────────────────────────────►│
                                                         ▼
                                          ┌───────────────────────────┐
                                          │       AUTORIDAD (HP)      │
                                          │  evaluación de política   │
                                          │  validación de capacidad  │
                                          │  verificación de riesgo   │
                                          └─────────────┬─────────────┘
                                                        │  2  decisión
                                                        ▼
                                          ┌───────────────────────────┐
                                          │         EJECUCIÓN         │
                                          │  acción determinística    │
                                          │  ejecución de comando     │
                                          └─────────────┬─────────────┘
                                                        │  3  registro de ejecución
                                                        ▼
                                          ┌───────────────────────────┐
                                          │         PROVENANCE        │
                                          │  linaje de interacción    │
                                          │  atribución cross-org     │
                                          └─────────────┬─────────────┘
                                                        │  4  registro verificable
                                                        ▼
                                          ┌───────────────────────────┐
                                          │           LEDGER          │
                                          │  hash de ejecución        │
                                          │  snapshot de política     │
                                          └─────────────┬─────────────┘
                                                        │  5  actualización de confianza
                                                        ▼
                                          ┌───────────────────────────┐
                                          │         REPUTACIÓN        │
                                          │  attestation ITA          │
                                          │  actualización reputación │
                                          └───────────────────────────┘
```

---

## Principios de Diseño

### Autoridad Explícita
Toda acción de agente debe estar autorizada por una política definida.
Sin permisos implícitos. Sin acceso ambiental.

### Ejecución Determinística
La ejecución debe coincidir exactamente con el comando autorizado.
Lo que fue autorizado es lo que se ejecuta — nada más.

### Historial Verificable
Toda interacción produce artefactos criptográficamente verificables.
La ejecución puede probarse a posteriori, sin confiar en ninguna parte única.

### Responsabilidad Institucional
La responsabilidad siempre es atribuible a un actor identificable.
Las cadenas de delegación son completas y trazables a una raíz institucional.

### Confianza Federada
Los sistemas independientes pueden verificarse mutuamente sin una autoridad central.
La confianza se gana a través del historial de interacción verificable, no se asume.

---

## Componentes del Protocolo

### L1 · Ejecución Core
Identidad, capacidades, aplicación de políticas y ejecución determinística.

| Componente | Rol |
|---|---|
| **SIGN** | Firma criptográfica — base de todos los objetos del protocolo |
| **AGENT** | Especificación formal de identidad del agente `A=(ID,C,P,D,L,S)` |
| **CT** | Capability Token — estructura, emisión y verificación |
| **CAP-REG** | Registro canónico de capacidades `acp:cap:*` |
| **HP** | Handshake Protocol — prueba criptográfica de posesión de capacidad |
| **DCMA** | Delegación multi-hop — no-escalación y revocación transitiva |
| **MESSAGES** | Formato wire — 5 tipos de mensajes normalizados |

### L2 · Capa de Confianza
Evaluación dinámica de riesgo y gestión de confianza en interacciones.

| Componente | Rol |
|---|---|
| **RISK** | Motor de riesgo determinístico — Risk Score RS (0–100) |
| **REV** | Protocolo de revocación — endpoint y CRL |
| **ITA** | Institutional Trust Anchor — attestations de confianza por interacción |

### L3 · Ejecución Verificable
Cada interacción deja un registro completo y criptográficamente verificable.

| Componente | Rol |
|---|---|
| **EXEC** | Tokens de ejecución — single-use, 300s de validez |
| **POLICY-CTX** | Policy Context Snapshot — estado firmado de política en tiempo de ejecución |
| **PROVENANCE** | Authority Provenance — prueba retrospectiva de la cadena de delegación |
| **LEDGER** | Audit Ledger — append-only, encadenado por hash |

### L4 · Gobernanza
Responsabilidad a largo plazo y supervisión institucional.

| Componente | Rol |
|---|---|
| **GOV-EVENTS** | Flujo de eventos de gobernanza — seguimiento institucional |
| **REP** | Extensión de reputación — score compuesto `0.6·ITS + 0.4·ERS` |
| **LIA** | Liability Traceability — cadena de responsabilidad atribuida |
| **HIST** | History Query API — historial de ejecución auditado |

### L5 · Federación
Interoperabilidad entre instituciones independientes.

| Componente | Rol |
|---|---|
| **ACP-D** | ACP Descentralizado — federación cross-institución, quórum BFT |

---

## Versiones de Especificación Activas

Versión activa actual por especificación. Esta tabla es la referencia autoritativa para "qué versión implementar".

| Spec | Versión activa | Nivel |
|---|---|---|
| ACP-SIGN | **2.0** ¹ | L1 |
| ACP-AGENT | 1.0 | L1 |
| ACP-CT | 1.0 | L1 |
| ACP-CAP-REG | 1.0 | L1 |
| ACP-HP | 1.0 | L1 |
| ACP-DCMA | 1.0 | L1 |
| ACP-MESSAGES | 1.0 | L1 |
| ACP-RISK | **3.0** | L2 |
| ACP-REV | 1.0 | L2 |
| ACP-ITA | 1.1 | L2/L4 |
| ACP-API | 1.0 | L3 |
| ACP-EXEC | 1.0 | L3 |
| ACP-LEDGER | **1.3** | L3 |
| ACP-PROVENANCE | 1.0 | L3 |
| ACP-POLICY-CTX | 1.0 | L3 |
| ACP-PSN | 1.0 | L3 |
| ACP-PAY | 1.0 | L4 |
| ACP-REP | **1.2** | L4 |
| ACP-GOV-EVENTS | 1.0 | L4 |
| ACP-LIA | 1.0 | L4 |
| ACP-HIST | 1.0 | L4 |
| ACP-NOTIFY | 1.0 | L4 |
| ACP-DISC | 1.0 | L4 |
| ACP-BULK | 1.0 | L4 |
| ACP-CROSS-ORG | 1.0 | L4 |
| ACP-REP-PORTABILITY | 1.1 | L4 |
| **ACP-CONF** | **1.2** | — |

¹ ACP-SIGN-1.0 permanece activo como baseline Ed25519. ACP-SIGN-2.0 agrega la extensión post-cuántica (ML-DSA-65). Ambas están en vigencia hasta que Dilithium se despliegue en producción.

Las versiones supersedidas están archivadas en [`archive/specs/`](archive/specs/README.md).

---

## Niveles de Conformidad

Las implementaciones pueden adoptar ACP incrementalmente, comenzando desde L1.

| Nivel | Nombre | Qué se obtiene |
|---|---|---|
| **L1** | Core | Identidad, capability tokens y ejecución |
| **L2** | Security | Scoring de riesgo, revocación y trust anchors |
| **L3** | Verifiable Execution | Tokens de ejecución, ledger y provenance |
| **L4** | Governance | Reputación, historial y responsabilidad |
| **L5** | Federation | Redes ACP descentralizadas |

Requerimientos normativos completos por nivel:

| Nivel | Specs requeridas |
|---|---|
| **L1** | SIGN · AGENT · CT · CAP-REG · HP · DCMA · MESSAGES |
| **L2** | L1 + RISK · REV · ITA-1.0 |
| **L3** | L2 + API · EXEC · LEDGER · PROVENANCE · POLICY-CTX · PSN |
| **L4** | L3 + PAY · REP-1.2 · ITA-1.1 · GOV-EVENTS · LIA · HIST · NOTIFY · DISC · BULK · CROSS-ORG · REP-PORTABILITY |
| **L5** | L4 + ACP-D · quórum BFT ITA-1.1 |

→ Definición normativa de conformidad: [`spec/governance/ACP-CONF-1.2.md`](spec/governance/ACP-CONF-1.2.md)

---

## Especificaciones

### L1 · Ejecución Core
- [ACP-SIGN-1.0](spec/core/ACP-SIGN-1.0.md) — firma criptográfica, baseline Ed25519
- [ACP-SIGN-2.0](spec/core/ACP-SIGN-2.0.md) — firma híbrida post-cuántica (Ed25519 + ML-DSA-65)
- [ACP-AGENT-1.0](spec/core/ACP-AGENT-1.0.md) — identidad formal del agente `A=(ID,C,P,D,L,S)`
- [ACP-CT-1.0](spec/core/ACP-CT-1.0.md) — estructura, emisión y verificación de Capability Token
- [ACP-CAP-REG-1.0](spec/core/ACP-CAP-REG-1.0.md) — registro canónico de capacidades `acp:cap:*`
- [ACP-HP-1.0](spec/core/ACP-HP-1.0.md) — Handshake Protocol, prueba criptográfica de posesión de capacidad
- [ACP-DCMA-1.0](spec/core/ACP-DCMA-1.0.md) — delegación multi-hop, no-escalación y revocación transitiva
- [ACP-MESSAGES-1.0](spec/core/ACP-MESSAGES-1.0.md) — formato wire, 5 tipos de mensajes normalizados

### L2 · Capa de Confianza
- [ACP-RISK-2.0](spec/security/ACP-RISK-2.0.md) — motor de riesgo determinístico, Risk Score RS (0–100), `F_anom` + cooldown
- [ACP-RISK-3.0](spec/security/ACP-RISK-2.0.md) — enforcement de anomalías con scope de contexto; Rule 1 indexada por `PatternKey(agentID, cap, res)`, elimina state-mixing cross-context
- [ACP-REV-1.0](spec/security/ACP-REV-1.0.md) — protocolo de revocación, endpoint y CRL
- [ACP-ITA-1.0](spec/security/ACP-ITA-1.0.md) — Institutional Trust Anchor, modelo centralizado
- [ACP-ITA-1.1](spec/security/ACP-ITA-1.1.md) — Trust Anchor Governance, modelo BFT distribuido

### L3 · Ejecución Verificable
- [ACP-EXEC-1.0](spec/operations/ACP-EXEC-1.0.md) — Tokens de ejecución, single-use, 300s de validez
- [ACP-POLICY-CTX-1.0](spec/operations/ACP-POLICY-CTX-1.0.md) — estado firmado de política en tiempo de ejecución
- [ACP-PROVENANCE-1.0](spec/core/ACP-PROVENANCE-1.0.md) — prueba retrospectiva de la cadena de delegación en ejecución
- [ACP-LEDGER-1.3](spec/operations/ACP-LEDGER-1.3.md) — audit ledger, append-only, encadenado por hash, firma institucional obligatoria
- [ACP-PSN-1.0](spec/operations/ACP-PSN-1.0.md) — Process-Session Node, seguimiento de sesión de ejecución
- [ACP-API-1.0](spec/operations/ACP-API-1.0.md) — API HTTP, todos los endpoints institucionales

### L4 · Gobernanza
- [ACP-GOV-EVENTS-1.0](spec/governance/ACP-GOV-EVENTS-1.0.md) — flujo de eventos de gobernanza institucional
- [ACP-REP-1.2](spec/security/ACP-REP-1.2.md) — extensión de reputación, score compuesto `0.6·ITS + 0.4·ERS`
- [ACP-LIA-1.0](spec/operations/ACP-LIA-1.0.md) — cadena de responsabilidad atribuida
- [ACP-HIST-1.0](spec/operations/ACP-HIST-1.0.md) — API de consulta de historial de ejecución auditado
- [ACP-PAY-1.0](spec/operations/ACP-PAY-1.0.md) — extensión de capacidad financiera verificable
- [ACP-NOTIFY-1.0](spec/operations/ACP-NOTIFY-1.0.md) — eventos y webhooks
- [ACP-DISC-1.0](spec/operations/ACP-DISC-1.0.md) — registro y resolución de agentes
- [ACP-BULK-1.0](spec/operations/ACP-BULK-1.0.md) — ejecución de capacidades en lote
- [ACP-CROSS-ORG-1.0](spec/operations/ACP-CROSS-ORG-1.0.md) — interacciones de agentes inter-institucionales

### L5 · Federación
- [ACP-D-1.0](spec/decentralized/ACP-D-1.0.md) — ACP descentralizado, federación cross-institución, quórum BFT

### Gobernanza
- [ACP-CONF-1.2](spec/governance/ACP-CONF-1.2.md) — definición normativa de conformidad (actual)
- [ACP-CHANGELOG](CHANGELOG.md) — historial de versiones

---

## Estructura del Repositorio

```
acp-framework/
├── spec/
│   ├── core/          ← L1: identidad, capacidad, delegación
│   ├── security/      ← L2: confianza, riesgo, revocación
│   ├── operations/    ← L3–L4: ejecución, ledger, gobernanza
│   ├── governance/    ← conformidad, eventos, proceso
│   └── decentralized/ ← L5: ACP-D
├── openapi/
│   └── acp-api-1.0.yaml  ← spec OpenAPI 3.1.0 para todos los endpoints ACP-API-1.0
├── compliance/
│   ├── ACP-TS-1.1.md      ← especificación del formato de vectores de prueba
│   ├── test-vectors/      ← vectores de conformidad single-shot (CORE · DCMA · HP · LEDGER · EXEC · RISK-2.0)
│   │   └── sequence/      ← vectores de secuencia stateful (ACR-1.0, 5 escenarios)
│   ├── adversarial/       ← evaluación adversarial (Exp 1–4 + Exp 9: evasión de cooldown, multi-agente, backend stress, token replay, deviation collapse)
│   └── runner/            ← compliance runner ACR-1.0 (modo library + modo HTTP)
├── tla/
│   ├── ACP.tla                   ← modelo formal base — Safety · LedgerAppendOnly · RiskDeterminism (v1.17)
│   ├── ACP.cfg                   ← configuración TLC para ACP.tla
│   ├── ACP_Extended.tla          ← modelo extendido — F_anom · cooldown · liveness · 11 invariantes + 4 temporales (v1.25)
│   ├── ACP_Extended.cfg          ← config single-agent — 5,684,342 estados · 3,147,864 distintos · profundidad 15 · 0 violaciones
│   └── ACP_Extended_2agents.cfg  ← config two-agent — verificación de aislamiento multi-agente (Sprint J2c)
├── archive/
│   └── specs/         ← versiones de especificación supersedidas (referencia histórica)
├── impl/
│   └── go/            ← implementación de referencia
├── ARCHITECTURE.md    ← modelo de dominio formal, grafo de dependencias
├── CHANGELOG.md
└── README.md
```

---

## Quick Start

```bash
# Opción 1: Go reference server
cd impl/go
docker compose up

# Opción 6: ACR-1.0 sequence compliance runner — valida comportamiento stateful de ACP-RISK-3.0
cd compliance/runner
go run . --mode library --dir ../test-vectors/sequence --strict
# PASS 5/5 — SEQ-BENIGN-001 SEQ-BOUNDARY-001 SEQ-PRIVJUMP-001 SEQ-FANOM-RULE3-001 SEQ-COOLDOWN-001

# Opción 5: Demo multi-org — Org-A emite política+reputación firmada, Org-B valida independientemente
cd examples/multi-org-demo
docker compose up
# Org-A: http://localhost:8081  |  Org-B: http://localhost:8082

# Opción 2: Python SDK — patrón central de admission control (sin servidor requerido)
cd impl/python
pip install -e .
python examples/admission_control_demo.py

# Opción 3: Python SDK — integración LangChain (decorador @acp_tool)
cd impl/python
pip install -e .
python examples/langchain_agent_demo.py

# Opción 4: LangChain + agente LLM real
pip install langchain langchain-openai
export OPENAI_API_KEY=sk-...
python examples/langchain_agent_demo.py --with-llm
```

Health check:

```bash
curl http://localhost:8080/acp/v1/health
```

```json
{
  "acp_version": "1.0",
  "status": "operational",
  "timestamp": 1718920000,
  "components": {
    "policy_engine": "operational",
    "audit_ledger": "operational",
    "agent_registry": "operational",
    "rev_endpoint": "operational"
  }
}
```

---

## Roadmap

| Ítem | Estado |
|---|---|
| ACP-CONF-1.2 | ✅ Completo — única fuente normativa de conformidad |
| ACP-LEDGER-1.3 | ✅ Completo — sig normativamente obligatorio |
| OpenAPI spec (`openapi/acp-api-1.0.yaml`) | ✅ Completo — OpenAPI 3.1.0, todos los endpoints ACP-API-1.0 |
| Vectores de prueba de conformidad (CORE · DCMA · HP · LEDGER · EXEC · PROV · PCTX · REP · RISK-2.0) | ✅ Completo — 73 firmados + 65 RISK-2.0 sin firmar |
| Implementación de referencia — 23 paquetes Go (L1–L4) | ✅ Completo — `impl/go/pkg/` cubre todos los niveles de conformidad |
| `pkg/psn` policy snapshot | ✅ Completo — transiciones atómicas, único snapshot ACTIVE |
| Python SDK — `ACPAdmissionGuard` + `@acp_tool` (LangChain) | ✅ Completo — `impl/python/` |
| ACP-RISK-2.0 — `F_anom` + Cooldown + `pkg/risk` | ✅ Completo — determinístico, sub-µs, 65 vectores |
| ACP-RISK-3.0 — Rule 1 context-scoped (`pkg/risk/engine.go`) | ✅ Completo — v1.22 · `CountPattern(ctxKey, 60s)` reemplaza `CountRequests(agentID)` · state-mixing cross-context eliminado |
| Demo payment-agent (`examples/payment-agent/`) | ✅ Completo — v1.16 |
| ACP-SIGN-2.0 — Híbrido post-cuántico (Ed25519 + ML-DSA-65) | ✅ Completo — spec v1.16; ML-DSA-65 real vía `cloudflare/circl` `pkg/sign2/` v1.20 |
| ACR-1.0 sequence compliance runner (`compliance/runner/`) | ✅ Completo — v1.17 · modo library + HTTP · 5/5 PASS |
| Vectores de secuencia (`compliance/test-vectors/sequence/`) | ✅ Completo — v1.17 · 5 escenarios stateful |
| Modelo TLA+ base (`tla/ACP.tla`) | ✅ Completo — v1.17 · 3 invariantes · 0 violaciones |
| Modelo TLA+ extendido (`tla/ACP_Extended.tla`) | ✅ Completo — v1.25 · 11 invariantes + 4 propiedades temporales · 5,684,342 estados · 0 violaciones |
| Evaluación adversarial (`compliance/adversarial/`) | ✅ Completo — v1.23 · 9 experimentos · números reales de benchmark (N=5 corridas, media±std) |
| Redis pipelining (`compliance/adversarial/redis_pipelined.go`) | ✅ Completo — v1.20 · 2 RTTs/request · ~1.8× speedup |
| ML-DSA-65 benchmarks (`pkg/sign2/sign2_bench_test.go`) | ✅ Completo — v1.20 · Ed25519 ~25 µs sign / ~56 µs verify · ML-DSA-65 ~100–130 µs sign / ~81 µs verify |
| NullQuerier + StatelessEngine (`pkg/risk/null_querier.go`, `stateless_engine.go`) | ✅ Completo — v1.21 · baseline stateless sin estado histórico para comparación directa |
| Experimento 5: stateless vs. stateful (`pkg/risk/stateless_comparison_test.go`) | ✅ Completo — v1.21 · 500 req · stateless 500/500 vs ACP 2/500 (0.4%) · latencia de detección 11 acciones |
| Experimento 6: vulnerabilidad state-mixing (`pkg/risk/statemixing_test.go`) | ✅ Completo — v1.21 · contaminación cross-context Rule 1 · RS +20 · ESCALATED→DENIED tras 11 data.read |
| Análisis state-mixing (paper §State-Mixing Vulnerability) | ✅ Completo — v1.21 · caracterización formal · números Exp 6 · camino de mitigación ACP-RISK-3.0 |
| Fix state-mixing (Exp 7, `pkg/risk/statemixing_fix_test.go`) | ✅ Completo — v1.22 · RISK-3.0 · 3 escenarios · clean RS=50 ESCALATED · contaminado RS=50 ESCALATED · burst mismo-contexto RS=85 DENIED |
| Deviation collapse (Exp 9, `compliance/adversarial/exp_deviation_collapse.go`) | ✅ Completo — v1.23 · 3 fases: baseline BAR=0.70 → collapse BAR=0.00 → counterfactual BAR=1.00 |
| Phase D drift simulation (extensión Exp 9) | ✅ Completo — v1.25 · 5 batches × 20 casos · 0%→80% sanitización · ΔBAR early-warning dispara en batch 3 antes del umbral |
| `pkg/barmonitor` — BAR-Monitor con detección de tendencia ΔBAR | ✅ Completo — v1.24 · 18 tests · AlertThreshold + AlertTrend · ring buffer thread-safe |
| API `EvaluateCounterfactual` (`impl/go/pkg/risk/counterfactual.go`) | ✅ Completo — v1.24 · 14 tests · 3 factories (estructural/conductual/temporal) · fail-closed |
| TLA+ `FailureConditionPreservation` + `NoDegenerateAdmissibility` (11 invariantes) | ✅ Completo — v1.25 · 0 violaciones · 5,684,342 estados |
| Endpoint HTTP `POST /acp/v1/counterfactual` (`impl/go/cmd/acp-server/`) | ✅ Completo — v1.25 · 7 tests de integración · mutaciones estructurales + conductuales vía HTTP |
| Modelo de confianza ITA (paper §Trust Model and Failure Modes) | ✅ Completo — v1.20 · bootstrap / compromise window / revocation authority — claims semi-formales |
| TypeScript SDK (`impl/typescript/`) | ✅ Completo — v1.4.0 · zero-deps · 68 tests |
| Rust SDK (`impl/rust/`) | ✅ Completo — v1.4.0 · ed25519-dalek v2 · 43 tests |
| v1.x | Protocolo core e implementación de referencia — activo |
| v2.0 | ACP Descentralizado (ACP-D) — en diseño |
| futuro | Verificación ZK, gobernanza descentralizada |

---

## Licencia

Apache 2.0
