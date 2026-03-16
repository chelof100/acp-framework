# ACP — Agent Control Protocol

Gobernanza verificable para agentes autónomos.

ACP define quién autorizó a un agente, qué ejecutó y quién es responsable — entre sistemas e instituciones.

`Verificación de autoridad · Trazabilidad de ejecución · Trazabilidad institucional`

---

## Por Qué Existe ACP

Los agentes autónomos están pasando de la experimentación a la producción. Ya interactúan con APIs, sistemas empresariales, infraestructura financiera y otros agentes.

Cuando uno actúa entre organizaciones, surgen inmediatamente varias preguntas:

- ¿Quién autorizó al agente para actuar?
- ¿Qué capacidades tiene realmente el agente?
- ¿Qué política permitió la acción?
- ¿Qué se ejecutó exactamente?
- ¿Puede verificarse esa ejecución más adelante?
- ¿Puede reconstruirse el historial completo de interacciones?

Hoy, la mayoría de los sistemas no pueden responder estas preguntas de forma confiable.

ACP introduce la infraestructura para responderlas todas.

---

## ACP vs Protocolos Relacionados

Varias iniciativas abordan cómo los agentes autónomos interactúan con sistemas.
La mayoría se enfoca en **acceso a herramientas o comunicación**.
ACP se enfoca en **autoridad, verificación de ejecución y responsabilidad institucional**.

| Protocolo | Enfoque | Límite de alcance |
|---|---|---|
| MCP (Model Context Protocol) | Acceso a herramientas para LLMs | Verificación de autoridad, aplicación de políticas, auditabilidad de ejecución |
| A2A (Agent-to-Agent) | Patrones de comunicación entre agentes | Confianza institucional, gobernanza, cadena de responsabilidad |
| OpenAI Agents SDK | Orquestación de herramientas | Autoridad entre organizaciones, procedencia, responsabilidad |
| Agent Client Protocol ¹ | Integración cliente/agente en tiempo de ejecución | Gobernanza, cadenas de delegación, historial de ejecución verificable |
| **ACP (Agent Control Protocol)** | **Infraestructura de gobernanza y responsabilidad** | **—** |

ACP aborda una capa diferente: **quién autorizó la acción, bajo qué política y quién es responsable del resultado**.

---

¹ ACP (Agent Control Protocol) no está relacionado con otras iniciativas que compartan el mismo acrónimo.

---

## Cómo Funciona ACP

ACP trata las interacciones de agentes como **operaciones gobernables**, no simples solicitudes.

Cada interacción pasa por seis etapas estructuradas:

1. **Verificación de identidad** — confirmar quién es el agente
2. **Validación de capacidades** — confirmar qué está autorizado a hacer el agente
3. **Autorización por política** — confirmar que la acción está permitida bajo la política vigente
4. **Ejecución determinista** — ejecutar exactamente lo que fue autorizado, nada más
5. **Registro verificable** — producir prueba criptográfica de lo ocurrido
6. **Actualización de confianza** — actualizar reputación y estado de atestación según la interacción

Esto permite que las interacciones sean trazables, auditables y atribuibles entre organizaciones.

---

## Invariante Constitucional

La ejecución en ACP está gobernada por un único invariante arquitectónico.

```
Execute(request) ⟹
    ValidIdentity  ∧  ValidCapability  ∧  ValidDelegationChain  ∧  AcceptableRisk
```

| Condición | Significado |
|---|---|
| `ValidIdentity` | El agente tiene una identidad verificada y firmada |
| `ValidCapability` | El agente posee un Token de Capacidad autorizado |
| `ValidDelegationChain` | Cada paso de delegación es trazable hasta una raíz institucional |
| `AcceptableRisk` | La puntuación de riesgo está dentro de los umbrales de política institucional |

Ninguna acción de agente se ejecuta a menos que las cuatro condiciones se satisfagan simultáneamente.

Las capas del protocolo existen para hacer cumplir este invariante en cada límite de interacción.

---

## Arquitectura del Protocolo

ACP está organizado en cinco capas de protocolo.
Cada capa construye sobre la anterior y agrega una capacidad de gobernanza distinta.

```
                 ARQUITECTURA DEL PROTOCOLO ACP

          ┌──────────────────────────────────────┐
          │               ACTORES                │
          │      Humanos · Sistemas · Agentes    │
          └──────────────────────────────────────┘
                             │
                             ▼
==================================================================== L1 — EJECUCIÓN NÚCLEO

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
│ Ejecución determinista de comandos y manejo de interacciones     │
└──────────────────────────────────────────────────────────────────┘

==================================================================== L2 — CAPA DE CONFIANZA

┌──────────────────────────────────────────────────────────────────┐
│ GESTIÓN DE RIESGO                                                │
│ RISK · REV                                                       │
│                                                                  │
│ Puntuación de riesgo y control de revocación                     │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ CONFIANZA EN INTERACCIONES                                       │
│ ITA                                                              │
│                                                                  │
│ Atestaciones de confianza para interacciones                     │
└──────────────────────────────────────────────────────────────────┘

==================================================================== L3 — EJECUCIÓN VERIFICABLE

┌──────────────────────────────────────────────────────────────────┐
│ REGISTRO DE EJECUCIÓN                                            │
│ EXEC · POLICY-CTX                                                │
│                                                                  │
│ Prueba de ejecución y instantánea del contexto de política       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ PROCEDENCIA                                                      │
│ PROVENANCE GRAPH                                                 │
│                                                                  │
│ Linaje de interacciones y seguimiento de eventos entre sistemas  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ LEDGER                                                           │
│                                                                  │
│ Almacenamiento resistente a manipulación del historial           │
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
│ Historial de interacciones verificable a largo plazo             │
└──────────────────────────────────────────────────────────────────┘

==================================================================== L5 — FEDERACIÓN

┌──────────────────────────────────────────────────────────────────┐
│ ACP DESCENTRALIZADO                                              │
│ ACP-D                                                            │
│                                                                  │
│ Federación y verificación entre instituciones                    │
└──────────────────────────────────────────────────────────────────┘
```

→ Modelo de dominio formal y grafo de dependencias: [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Interacción Entre Instituciones

ACP está diseñado para interacciones entre sistemas independientes.
Cada paso produce un artefacto verificable que forma parte del registro permanente de interacciones.

```
   INSTITUCIÓN A                               INSTITUCIÓN B
┌─────────────────────────────┐           ┌─────────────────────────────┐
│                             │           │                             │
│          AGENTE A           │           │          AGENTE B           │
│                             │           │                             │
└──────────────┬──────────────┘           └──────────────┬──────────────┘
               │                                         │
               │  1  solicitud de interacción            │
               └────────────────────────────────────────►│
                                                         ▼
                                          ┌───────────────────────────┐
                                          │      AUTORIDAD (HP)       │
                                          │  evaluación de política   │
                                          │  validación de capacidad  │
                                          │  verificación riesgo/rev  │
                                          └─────────────┬─────────────┘
                                                        │  2  decisión
                                                        ▼
                                          ┌───────────────────────────┐
                                          │        EJECUCIÓN          │
                                          │  acción determinista      │
                                          │  ejecución de comando     │
                                          └─────────────┬─────────────┘
                                                        │  3  registro de ejecución
                                                        ▼
                                          ┌───────────────────────────┐
                                          │       PROCEDENCIA         │
                                          │  linaje de interacción    │
                                          │  atribución inter-org     │
                                          └─────────────┬─────────────┘
                                                        │  4  registro verificable
                                                        ▼
                                          ┌───────────────────────────┐
                                          │          LEDGER           │
                                          │  hash de ejecución        │
                                          │  instantánea de política  │
                                          └─────────────┬─────────────┘
                                                        │  5  actualización de confianza
                                                        ▼
                                          ┌───────────────────────────┐
                                          │       REPUTACIÓN          │
                                          │  atestación ITA           │
                                          │  actualización reputación │
                                          └───────────────────────────┘
```

---

## Principios de Diseño

### Autoridad Explícita
Toda acción de agente debe estar autorizada por una política definida.
Sin permisos implícitos. Sin acceso ambiental.

### Ejecución Determinista
La ejecución debe coincidir exactamente con el comando autorizado.
Lo que fue autorizado es lo que se ejecuta — nada más.

### Historial Verificable
Cada interacción produce artefactos criptográficamente verificables.
La ejecución puede probarse a posteriori, sin confiar en ninguna parte individual.

### Responsabilidad Institucional
La responsabilidad siempre es atribuible a un actor identificable.
Las cadenas de delegación son completas y trazables hasta una raíz institucional.

### Confianza Federada
Los sistemas independientes pueden verificarse mutuamente sin una autoridad central.
La confianza se gana a través del historial de interacciones verificable, no se asume.

---

## Componentes del Protocolo

### L1 · Ejecución Núcleo
Identidad, capacidades, aplicación de políticas y ejecución determinista.

| Componente | Rol |
|---|---|
| **SIGN** | Firma criptográfica — base de todos los objetos del protocolo |
| **AGENT** | Especificación formal de identidad de agente `A=(ID,C,P,D,L,S)` |
| **CT** | Capability Token — estructura, emisión y verificación |
| **CAP-REG** | Registro canónico de capacidades `acp:cap:*` |
| **HP** | Handshake Protocol — prueba criptográfica de posesión de capacidad |
| **DCMA** | Delegación multi-salto — no-escalación y revocación transitiva |
| **MESSAGES** | Formato de wire — 5 tipos de mensajes normalizados |

### L2 · Capa de Confianza
Evaluación dinámica de riesgo y gestión de confianza en interacciones.

| Componente | Rol |
|---|---|
| **RISK** | Motor de riesgo determinista — Puntuación de Riesgo RS (0–100) |
| **REV** | Protocolo de revocación — endpoint y CRL |
| **ITA** | Ancla de Confianza Institucional — atestaciones de confianza por interacción |

### L3 · Ejecución Verificable
Cada interacción deja un registro completo y criptográficamente verificable.

| Componente | Rol |
|---|---|
| **EXEC** | Tokens de Ejecución — uso único, validez de 300s |
| **POLICY-CTX** | Instantánea de Contexto de Política — estado de política firmado al momento de ejecución |
| **PROVENANCE** | Procedencia de Autoridad — prueba retrospectiva de cadena de delegación |
| **LEDGER** | Ledger de Auditoría — append-only, encadenado por hash |

### L4 · Gobernanza
Responsabilidad a largo plazo y supervisión institucional.

| Componente | Rol |
|---|---|
| **GOV-EVENTS** | Flujo de eventos de gobernanza — seguimiento institucional |
| **REP** | Extensión de Reputación — puntuación compuesta `0.6·ITS + 0.4·ERS` |
| **LIA** | Trazabilidad de Responsabilidad — cadena de responsabilidad atribuida |
| **HIST** | API de Consulta de Historial — historial de ejecución auditado |

### L5 · Federación
Interoperabilidad entre instituciones independientes.

| Componente | Rol |
|---|---|
| **ACP-D** | ACP Descentralizado — federación entre instituciones, quórum BFT |

---

## Versiones de Especificación Activas

Versión activa actual por especificación. Esta tabla es la referencia autoritativa para "¿qué versión debo implementar?".

| Spec | Versión activa | Nivel |
|---|---|---|
| ACP-SIGN | 1.0 | L1 |
| ACP-AGENT | 1.0 | L1 |
| ACP-CT | 1.0 | L1 |
| ACP-CAP-REG | 1.0 | L1 |
| ACP-HP | 1.0 | L1 |
| ACP-DCMA | 1.0 | L1 |
| ACP-MESSAGES | 1.0 | L1 |
| ACP-RISK | 1.0 | L2 |
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
| ACP-REP-PORTABILITY | 1.0 | L4 |
| **ACP-CONF** | **1.2** | — |

Las versiones supersedidas están archivadas en [`archivo/specs/`](archivo/specs/README.md).

---

## Niveles de Conformidad

Las implementaciones pueden adoptar ACP incrementalmente, comenzando desde L1.

| Nivel | Nombre | Qué se obtiene |
|---|---|---|
| **L1** | Núcleo | Identidad, tokens de capacidad y ejecución |
| **L2** | Seguridad | Puntuación de riesgo, revocación y anclas de confianza |
| **L3** | Ejecución Verificable | Tokens de ejecución, ledger y procedencia |
| **L4** | Gobernanza | Reputación, historial y responsabilidad |
| **L5** | Federación | Redes ACP descentralizadas |

Requisitos normativos completos por nivel:

| Nivel | Especificaciones requeridas |
|---|---|
| **L1** | SIGN · AGENT · CT · CAP-REG · HP · DCMA · MESSAGES |
| **L2** | L1 + RISK · REV · ITA-1.0 |
| **L3** | L2 + API · EXEC · LEDGER · PROVENANCE · POLICY-CTX · PSN |
| **L4** | L3 + PAY · REP-1.2 · ITA-1.1 · GOV-EVENTS · LIA · HIST · NOTIFY · DISC · BULK · CROSS-ORG · REP-PORTABILITY |
| **L5** | L4 + ACP-D · quórum BFT ITA-1.1 |

→ Definición normativa de conformidad: [`spec/gobernanza/ACP-CONF-1.2.md`](spec/gobernanza/ACP-CONF-1.2.md)

---

## Especificaciones

### L1 · Ejecución Núcleo
- [ACP-SIGN-1.0](spec/nucleo/ACP-SIGN-1.0.md) — firma criptográfica, base de todos los objetos del protocolo
- [ACP-AGENT-1.0](spec/nucleo/ACP-AGENT-1.0.md) — identidad formal de agente `A=(ID,C,P,D,L,S)`
- [ACP-CT-1.0](spec/nucleo/ACP-CT-1.0.md) — estructura, emisión y verificación del Capability Token
- [ACP-CAP-REG-1.0](spec/nucleo/ACP-CAP-REG-1.0.md) — registro canónico de capacidades `acp:cap:*`
- [ACP-HP-1.0](spec/nucleo/ACP-HP-1.0.md) — Handshake Protocol, prueba criptográfica de posesión de capacidad
- [ACP-DCMA-1.0](spec/nucleo/ACP-DCMA-1.0.md) — delegación multi-salto, no-escalación y revocación transitiva
- [ACP-MESSAGES-1.0](spec/nucleo/ACP-MESSAGES-1.0.md) — formato de wire, 5 tipos de mensajes normalizados

### L2 · Capa de Confianza
- [ACP-RISK-1.0](spec/seguridad/ACP-RISK-1.0.md) — motor de riesgo determinista, Puntuación de Riesgo RS (0–100)
- [ACP-REV-1.0](spec/seguridad/ACP-REV-1.0.md) — protocolo de revocación, endpoint y CRL
- [ACP-ITA-1.0](spec/seguridad/ACP-ITA-1.0.md) — Ancla de Confianza Institucional, modelo centralizado
- [ACP-ITA-1.1](spec/seguridad/ACP-ITA-1.1.md) — Gobernanza del Ancla de Confianza, modelo BFT distribuido

### L3 · Ejecución Verificable
- [ACP-EXEC-1.0](spec/operaciones/ACP-EXEC-1.0.md) — Tokens de Ejecución, uso único, validez de 300s
- [ACP-POLICY-CTX-1.0](spec/operaciones/ACP-POLICY-CTX-1.0.md) — estado de política firmado al momento de ejecución
- [ACP-PROVENANCE-1.0](spec/nucleo/ACP-PROVENANCE-1.0.md) — prueba retrospectiva de cadena de delegación en ejecución
- [ACP-LEDGER-1.3](spec/operaciones/ACP-LEDGER-1.3.md) — ledger de auditoría, append-only, encadenado por hash, sig institucional obligatoria
- [ACP-PSN-1.0](spec/operaciones/ACP-PSN-1.0.md) — Nodo de Proceso-Sesión, seguimiento de sesiones de ejecución
- [ACP-API-1.0](spec/operaciones/ACP-API-1.0.md) — API HTTP, todos los endpoints institucionales

### L4 · Gobernanza
- [ACP-GOV-EVENTS-1.0](spec/gobernanza/ACP-GOV-EVENTS-1.0.md) — flujo de eventos de gobernanza institucional
- [ACP-REP-1.2](spec/seguridad/ACP-REP-1.2.md) — extensión de reputación, puntuación compuesta `0.6·ITS + 0.4·ERS`
- [ACP-LIA-1.0](spec/operaciones/ACP-LIA-1.0.md) — cadena de responsabilidad atribuida
- [ACP-HIST-1.0](spec/operaciones/ACP-HIST-1.0.md) — API de consulta de historial de ejecución auditado
- [ACP-PAY-1.0](spec/operaciones/ACP-PAY-1.0.md) — extensión de capacidad financiera verificable
- [ACP-NOTIFY-1.0](spec/operaciones/ACP-NOTIFY-1.0.md) — eventos y webhooks
- [ACP-DISC-1.0](spec/operaciones/ACP-DISC-1.0.md) — registro y resolución de agentes
- [ACP-BULK-1.0](spec/operaciones/ACP-BULK-1.0.md) — ejecución de capacidades en lote
- [ACP-CROSS-ORG-1.0](spec/operaciones/ACP-CROSS-ORG-1.0.md) — interacciones de agentes entre instituciones

### L5 · Federación
- [ACP-D-1.0](spec/descentralizado/ACP-D-1.0.md) — ACP descentralizado, federación entre instituciones, quórum BFT

### Gobernanza
- [ACP-CONF-1.2](spec/gobernanza/ACP-CONF-1.2.md) — definición normativa de conformidad (actual)
- [ACP-CHANGELOG](CHANGELOG.md) — historial de versiones

---

## Estructura del Repositorio

```
acp-framework/
├── spec/
│   ├── nucleo/         ← L1: identidad, capacidad, delegación
│   ├── seguridad/      ← L2: confianza, riesgo, revocación
│   ├── operaciones/    ← L3–L4: ejecución, ledger, gobernanza
│   ├── gobernanza/     ← conformidad, eventos, proceso
│   └── descentralizado/ ← L5: ACP-D
├── openapi/
│   └── acp-api-1.0.yaml  ← especificación OpenAPI 3.1.0 para todos los endpoints de ACP-API-1.0
├── compliance/
│   ├── ACP-TS-1.1.md   ← formato de vectores de prueba
│   └── test-vectors/   ← vectores de conformidad oficiales (CORE, DCMA, HP)
├── archivo/
│   └── specs/          ← versiones de especificación supersedidas (referencia histórica)
├── impl/
│   └── go/             ← implementación de referencia
├── ARCHITECTURE.md     ← modelo de dominio formal, grafo de dependencias
├── CHANGELOG.md
└── README.md
```

---

## Inicio Rápido

```bash
cd impl/go
docker compose up
```

Verificación de estado:

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

## Hoja de Ruta

| Ítem | Estado |
|---|---|
| ACP-CONF-1.2 | ✅ Completo — restaura CONF como única fuente normativa |
| ACP-LEDGER-1.3 | ✅ Completo — sig normativa obligatoria |
| Spec OpenAPI (`openapi/acp-api-1.0.yaml`) | ✅ Completo — OpenAPI 3.1.0, todos los endpoints de ACP-API-1.0 |
| Vectores de prueba de conformidad (CORE · DCMA · HP) | ✅ Completo — 22 vectores firmados, formato ACP-TS-1.1 |
| v1.x | Protocolo núcleo e implementación de referencia — activo |
| v2.0 | ACP Descentralizado (ACP-D) — en diseño |
| futuro | Verificación ZK, gobernanza descentralizada |

---

## Licencia

Apache 2.0
