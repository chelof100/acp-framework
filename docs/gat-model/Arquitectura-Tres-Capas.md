# El Framework de Tres Capas

**ACP — Agent Control Protocol | Documento de Visión**
**TraslaIA | Marcelo Fernandez | 2026**

---

## El problema que este framework resuelve

La mayoría de las iniciativas de gobernanza de IA saltan directamente a herramientas y protocolos sin definir primero el marco estratégico ni el modelo arquitectónico. El resultado es automatización frágil, dependiente de proveedores y no auditable.

Este framework impone la secuencia correcta:

> **Decisión Estratégica → Diseño Arquitectónico → Ejecución Operativa**

---

## Las tres capas

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   NIVEL 1 — ARQUITECTURA SOBERANA DE IA                        │
│                                                                 │
│   El POR QUÉ                                                    │
│   Decisión estratégica de toda organización que opera agentes   │
│                                                                 │
│   • Independencia de proveedor de modelo                        │
│   • Capacidad de sustitución sin rediseño                       │
│   • Control institucional real sobre ejecución                  │
│   • Trazabilidad local preservada                               │
│                                                                 │
│   Responsables: Board, CTO, liderazgo ejecutivo                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   NIVEL 2 — MODELO GAT                                         │
│   (Gobernanza Arquitectónica de Agentes)                        │
│                                                                 │
│   El QUÉ                                                        │
│   Principios de diseño que hacen gobernable cualquier agente    │
│                                                                 │
│   • Separación estricta decisión / ejecución                    │
│   • Trazabilidad estructural obligatoria                        │
│   • Control de permisos dinámico y graduado                     │
│   • Observabilidad continua                                     │
│   • Gobernanza multiagente con límites de delegación            │
│                                                                 │
│   Responsables: Equipos de arquitectura                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   NIVEL 3 — PROTOCOLO ACP                                      │
│   (Agent Control Protocol)                                      │
│                                                                 │
│   El CÓMO                                                       │
│   Implementación técnica verificable del Nivel 2                │
│                                                                 │
│   • Identidad criptográfica del agente (Ed25519)                │
│   • Capability Tokens — permisos con firma digital              │
│   • Handshake Protocol — prueba de posesión stateless           │
│   • Motor de riesgo determinístico (score 0-100)                │
│   • Execution Tokens — autorización de un solo uso              │
│   • Audit Ledger — registro append-only hash-encadenado         │
│   • Revocación transitiva                                       │
│                                                                 │
│   Responsables: Equipos de ingeniería                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Relación entre capas

ACP no es una alternativa al Modelo GAT ni a la Arquitectura Soberana. Es su implementación operativa.

```
Arquitectura Soberana de IA
    define la política y los objetivos estratégicos
    ↓
Modelo GAT
    traduce esa política en principios de diseño verificables
    ↓
Protocolo ACP
    implementa esos principios con criptografía y mensajes formales
```

**Sin Nivel 1:** Los equipos construyen sin mandato estratégico, cada uno a su manera.
**Sin Nivel 2:** El protocolo se aplica sin coherencia arquitectónica entre sistemas.
**Sin Nivel 3:** Los principios quedan en documentos sin implementación verificable.

---

## Las seis capas internas de un agente (Nivel 2)

Todo agente construido bajo este framework expone estas seis capas de forma explícita:

| # | Capa | Función | Implementada por |
|---|---|---|---|
| 1 | **Decisión** | LLM / motor de inferencia — propone acciones | Proveedor de modelo |
| 2 | **Validación Estructural** | Convierte output probabilístico en JSON verificable | Equipo de integración |
| 3 | **Política** | Evalúa permisos, riesgo y contexto determinísticamente | **ACP** |
| 4 | **Ejecución** | Interactúa con sistemas reales solo si la política aprueba | Equipo de integración |
| 5 | **Estado** | Persistencia de memoria contextual e historial | Equipo de integración |
| 6 | **Observabilidad** | Logging estructurado, métricas, alertas | **ACP Audit Ledger** |

**Principio P1:** La Capa de Decisión nunca accede directamente a la Capa de Ejecución.
Entre ellas siempre existe la Capa de Política — implementada por ACP.

---

## Matriz de Madurez GAT

El camino de implementación se mide en seis niveles:

| Nivel | Nombre | Capacidad clave | Tiempo típico |
|---|---|---|---|
| 0 | Automatización básica | Decisión y ejecución acopladas | — |
| 1 | Validación estructural | Separación básica de capas | 4–6 semanas |
| 2 | Trazabilidad completa | Logs + Audit Ledger ACP | 8–12 semanas |
| 3 | Control dinámico | Permisos en tiempo real | 12–16 semanas |
| 4 | Gobernanza multiagente | Orquestación + límites de delegación | 4–6 meses |
| 5 | Arquitectura soberana | Desacoplamiento total de proveedor | 6–9 meses |

> La mayoría de implementaciones actuales no supera el Nivel 1.
> ACP habilita directamente los niveles 2, 3 y 4.

---

## Por qué esta secuencia importa

La alternativa — adoptar herramientas sin framework — produce:

- **Dependencia tecnológica profunda:** cambiar de proveedor requiere rediseño total
- **Automatización no auditable:** no hay forma de reconstruir qué decidió el agente y por qué
- **Escalación silenciosa de privilegios:** los agentes adquieren más acceso del declarado
- **Fragmentación de responsabilidad:** en sistemas multiagente, nadie sabe quién ejecutó qué

La Arquitectura Soberana de IA impone la disciplina estructural antes de la implementación técnica.

---

## Documentos por nivel

| Nivel | Documentos clave |
|---|---|
| **1 — Soberana** | [Arquitectura-Soberana-de-IA.md](../01-arquitectura-soberana/Arquitectura-Soberana-de-IA.md) · [Sovereign-AI-Architecture-Framework.md](../01-arquitectura-soberana/Sovereign-AI-Architecture-Framework.md) |
| **2 — GAT** | [GAT-Maturity-Model.md](GAT-Maturity-Model.md) · [Doctrina-Fundacional-ACP.md](../01-arquitectura-soberana/Doctrina-Fundacional-ACP.md) |
| **3 — ACP** | [ACP-Whitepaper-v1.0.md](../06-publicaciones/ACP-Whitepaper-v1.0.md) · [03-protocolo-acp/especificacion/](../03-protocolo-acp/especificacion/) |

---

*TraslaIA — Marcelo Fernandez — 2026*
