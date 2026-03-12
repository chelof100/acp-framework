# Arquitectura ACP

**Agent Control Protocol — Modelo Conceptual y Estructural**

**Versión:** 1.10
**Estado:** Normativo
**Última actualización:** 2026-03-11

---

## Axioma Constitucional

Cada decisión arquitectónica en ACP se deriva de un único invariante:

```
Execute(request) ⟹ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk
```

Ninguna acción de un agente autónomo se ejecuta a menos que las cuatro condiciones se cumplan simultáneamente y sean **criptográficamente verificables a posteriori**. Esto no es una política — es una restricción arquitectónica dura. Cualquier sistema que no pueda probar este invariante para una acción pasada no cumple con la conformidad.

---

## Modelo de Dominio

ACP opera sobre ocho conceptos formales. No son constructos de implementación — son las entidades sobre las que razona el protocolo.

### 1. Actor

Cualquier entidad con identidad criptográfica que puede iniciar o autorizar solicitudes. Los actores son **Agentes** o **Instituciones**. Todos los actores tienen pares de claves Ed25519; todos los mensajes del protocolo llevan firmas del actor.

### 2. Agente

Una entidad computacional autónoma definida formalmente como:

```
A = (ID, C, P, D, L, S)
```

Donde:
- `ID` — identificador globalmente único (compatible con DID)
- `C` — conjunto de capacidades (subconjunto del CAP-REG institucional)
- `P` — cadena de principales (camino de delegación desde la Institución)
- `D` — alcance de delegación (subconjunto de capacidades no-escalable)
- `L` — referencia al ledger de ejecución (registro de auditoría append-only)
- `S` — estado actual del ciclo de vida (`{ACTIVE, SUSPENDED, REVOKED}`)

Los agentes no se auto-autorizan. Toda capacidad que poseen fue otorgada a través de una cadena de delegación verificable con raíz en una Institución.

**Spec:** [`spec/nucleo/ACP-AGENT-1.0.md`](spec/nucleo/ACP-AGENT-1.0.md)

### 3. Institución

El principal soberano de un despliegue ACP. Las instituciones operan el Trust Anchor, emiten Capability Tokens, mantienen el Audit Ledger y son propietarias del Policy Engine. Una Institución es la raíz de confianza de todas las cadenas de delegación bajo su jurisdicción.

Las instituciones pueden federarse a través de protocolos CROSS-ORG manteniendo soberanía independiente.

**Specs:** [`spec/nucleo/ACP-AGENT-1.0.md`](spec/nucleo/ACP-AGENT-1.0.md) (identidad institucional), [`spec/seguridad/ACP-ITA-1.0.md`](spec/seguridad/ACP-ITA-1.0.md) (trust anchor)

### 4. Autoridad

Un derecho formal, acotado y temporal para ejecutar una capacidad específica. La autoridad nunca es ambiental — debe ser otorgada explícitamente, firmada criptográficamente y trazable hasta una raíz institucional. La autoridad tiene tres propiedades estructurales:

- **Alcance:** la cadena de capacidad (`acp:cap:*`) que cubre
- **Validez temporal:** límites `delegated_at` / `valid_until`
- **Integridad de cadena:** cada paso intermedio firmado por su delegador

La autoridad se materializa como un **Capability Token** (CT) y se prueba mediante el **Handshake Protocol** (HP).

**Specs:** [`spec/nucleo/ACP-CT-1.0.md`](spec/nucleo/ACP-CT-1.0.md), [`spec/nucleo/ACP-HP-1.0.md`](spec/nucleo/ACP-HP-1.0.md)

### 5. Interacción

Un intercambio de protocolo que instancia la Autoridad en una acción ejecutada. Cada Interacción produce un **Execution Token** (ET) — un artefacto de uso único, válido 300 segundos, que vincula: identidad del agente, alcance de capacidad, recurso, puntuación de riesgo, estado de política en el momento de ejecución y firma institucional.

Las Interacciones son la unidad atómica de responsabilidad en ACP.

**Specs:** [`spec/operaciones/ACP-EXEC-1.0.md`](spec/operaciones/ACP-EXEC-1.0.md), [`spec/operaciones/ACP-POLICY-CTX-1.0.md`](spec/operaciones/ACP-POLICY-CTX-1.0.md)

### 6. Atestación

Una afirmación criptográficamente firmada sobre el estado de confianza, emitida por el Trust Anchor o un verificador autorizado. Las atestaciones incluyen:

- **Certificados ITA** — estado de confianza institucional de un agente
- **Puntuaciones de reputación** — historial conductual compuesto (ITS + ERS)
- **Hallazgos de cumplimiento** — resultados de auditoría vinculados a eventos de gobernanza
- **Procedencia de Autoridad** — prueba retroactiva de la cadena de delegación en el momento de ejecución

Las Atestaciones son la capa de evidencia. Responden: *¿quién avala a este agente, y en base a qué?*

**Specs:** [`spec/seguridad/ACP-ITA-1.0.md`](spec/seguridad/ACP-ITA-1.0.md), [`spec/seguridad/ACP-REP-1.2.md`](spec/seguridad/ACP-REP-1.2.md), [`spec/nucleo/ACP-PROVENANCE-1.0.md`](spec/nucleo/ACP-PROVENANCE-1.0.md)

### 7. Historia

El registro ordenado, append-only de todas las Interacciones y Eventos de Gobernanza de un Agente. La Historia es inmutable — las entradas están encadenadas por hash y firmadas. La Historia es la entrada para el cálculo de Reputación y el artefacto principal para auditoría y resolución de responsabilidad.

La Historia tiene dos componentes:
- **Ledger** — registro de ejecución de bajo nivel (una entrada por ET, encadenada por hash)
- **Flujo de Eventos de Gobernanza** — eventos institucionales (suspensiones, actualizaciones de política, cambios de capacidad)

**Specs:** [`spec/operaciones/ACP-LEDGER-1.2.md`](spec/operaciones/ACP-LEDGER-1.2.md), [`spec/operaciones/ACP-HIST-1.0.md`](spec/operaciones/ACP-HIST-1.0.md), [`spec/gobernanza/ACP-GOV-EVENTS-1.0.md`](spec/gobernanza/ACP-GOV-EVENTS-1.0.md)

### 8. Reputación

Una puntuación compuesta ponderada en el tiempo, derivada de Historia y Atestaciones. La Reputación tiene dos componentes:

- **ITS (Institutional Trust Score)** — suma ponderada de atestaciones ITA de trust anchors conocidos
- **ERS (Execution Reliability Score)** — ratio de ejecuciones exitosas respecto al total, con decaimiento temporal

Fórmula compuesta: `REP = 0.6 · ITS + 0.4 · ERS`

La Reputación es portable entre instituciones vía REP-PORTABILITY, que define un formato de exportación firmado y verificable para el despliegue de agentes entre instituciones.

**Specs:** [`spec/seguridad/ACP-REP-1.2.md`](spec/seguridad/ACP-REP-1.2.md), [`spec/operaciones/ACP-CROSS-ORG-1.0.md`](spec/operaciones/ACP-CROSS-ORG-1.0.md)

---

## Stack de Gobernanza

ACP está estructurado en ocho capas acumulativas. Cada capa depende de todas las capas inferiores. El invariante constitucional se aplica en la Capa 4 — cada capa superior construye profundidad evidencial.

```
┌─────────────────────────────────────────────────────────────────┐
│  CAPA 8 — ARQUITECTURA DE RIESGO                                 │
│  Puntuación probabilística de riesgo y eventos entre orgs        │
│  RISK-1.0 · PSN-1.0 · CROSS-ORG-1.0 · BULK-1.0                 │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 7 — REPUTACIÓN                                             │
│  Puntuación conductual ponderada en tiempo, portable             │
│  REP-1.2 (ITS + ERS compuesto) · REP-PORTABILITY                │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 6 — RESPONSABILIDAD Y CONFIANZA                            │
│  Quién responde, quién avala, qué cambió institucionalmente      │
│  LIA-1.0 · ITA-1.0 · ITA-1.1 (BFT) · GOV-EVENTS-1.0           │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 5 — HISTORIA VERIFICABLE                                   │
│  Registro de auditoría append-only encadenado por hash           │
│  LEDGER-1.2 · HIST-1.0                                          │
├═════════════════════════════════════════════════════════════════╡
│  CAPA 4 — GOBERNANZA DE EJECUCIÓN    ← invariante constitucional│
│  Ciclo de vida del Execution Token; captura de estado de pol.    │
│  EXEC-1.0 · POLICY-CTX-1.0 · PROVENANCE-1.0 · API-1.0          │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 3 — DELEGACIÓN                                             │
│  Prueba de posesión de autoridad; delegación multi-salto         │
│  HP-1.0 · DCMA-1.0 · MESSAGES-1.0                               │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 2 — CAPACIDAD                                              │
│  Definición formal del derecho; registro canónico de capacidades │
│  CT-1.0 · CAP-REG-1.0                                           │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 1 — IDENTIDAD                                              │
│  Identidad criptográfica; firma y serialización                  │
│  SIGN-1.0 · AGENT-1.0                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Propiedades clave:**
- Capas 1–3: establecen *quién puede hacer qué, por qué autoridad*
- Capa 4: aplica *el invariante constitucional en el momento de ejecución*
- Capas 5–8: construyen el registro evidencial *de lo que se hizo y con qué consecuencia*

La separación entre Capa 4 y Capa 5 es crítica: el invariante se aplica *antes* de la ejecución, y se verifica *desde el registro* después. Ambos deben cumplirse para conformidad total.

---

## Mapa de Dependencias entre Specs

Grafo dirigido de dependencias normativas entre especificaciones ACP. Una flecha `A → B` significa que B depende de A (B no puede implementarse sin A).

```
SIGN-1.0 ──────────────────────────────────────────────────────┐
    │                                                           │
    ├──► AGENT-1.0 ──────────────────────────────────────────┐ │
    │        │                                               │ │
    ├──► CT-1.0 ──────────────────────────────────────────┐  │ │
    │        │                                            │  │ │
    ├──► CAP-REG-1.0 ─────────────────────────────────── │─►│ │
    │                                                     │  │ │
    └──► HP-1.0 ──────────────────────────────────────┐  │  │ │
             │                                         │  │  │ │
             └──► DCMA-1.0                             │  │  │ │
                                                       │  │  │ │
    MESSAGES-1.0 ◄─────────────────────────────────────┘  │  │ │
                                                           │  │ │
    RISK-1.0 ──────────────────────────────────────────┐  │  │ │
                                                        │  │  │ │
    EXEC-1.0 ◄──────────────────────────────────────────┘──┘  │ │
        │                                                      │ │
        ├──► LEDGER-1.2 ──────────────────────────────────┐   │ │
        │        │                                         │   │ │
        │        └──► HIST-1.0                             │   │ │
        │                                                  │   │ │
        ├──► POLICY-CTX-1.0 ◄──────────────────────────── │───┘ │
        │                                                  │     │
        └──► PROVENANCE-1.0 ◄─────────────────────────────┘─────┘

    ITA-1.0 ──────────────────────────────────────────────┐
        │                                                  │
        └──► REP-1.2 ─────────────────────────────────────►──► REP-PORTABILITY
                 │
                 └──► CROSS-ORG-1.0

    LEDGER-1.2 ──────────────────────────────────────────►──► LIA-1.0

    GOV-EVENTS-1.0 ◄── {ITA-1.x, REP-1.2, EXEC-1.0, LEDGER-1.2}
        │               (consumido por HIST-1.0 y sistemas de riesgo)
        └──► HIST-1.0

    CONF-1.1 ────────────────────────────────────────────────────►
        (define qué specs se requieren en cada nivel de conformidad)
```

**Cadenas críticas para implementadores:**

| Cadena | Descripción |
|---|---|
| `SIGN → CT → HP → EXEC` | Cadena de autoridad de ejecución — camino mínimo para cualquier acción autorizada |
| `EXEC → LEDGER → HIST` | Cadena de auditoría — de la ejecución al historial consultable |
| `EXEC → POLICY-CTX + PROVENANCE` | Capa de evidencia — prueba retroactiva completa de ejecución autorizada |
| `ITA → REP → REP-PORTABILITY` | Cadena de confianza — del aval institucional a la reputación portable |
| `LEDGER → LIA` | Cadena de responsabilidad — del log de auditoría a la trazabilidad de responsabilidad |
| `GOV-EVENTS → HIST` | Cadena de gobernanza — cambios institucionales visibles en el historial del agente |

---

## Vinculación con Conformidad

Cada nivel de conformidad mapea a un conjunto específico de capas. Todos los niveles son acumulativos.

| Nivel | Nombre | Capas | Specs clave añadidas |
|---|---|---|---|
| **L1** | CORE | 1–3 | SIGN · AGENT · CT · CAP-REG · HP · DCMA · MESSAGES |
| **L2** | SECURITY | 1–3 + parcial 6 | L1 + RISK · REV · ITA-1.0 |
| **L3** | FULL | 1–5 | L2 + API · EXEC · LEDGER · PROVENANCE · POLICY-CTX |
| **L4** | EXTENDED | 1–7 | L3 + GOV-EVENTS · PAY · REP-1.2 · ITA-1.1 · LIA · HIST · NOTIFY · DISC · BULK · CROSS-ORG · REP-PORTABILITY |
| **L5** | DECENTRALIZED | 1–8 | L4 + ACP-D · quórum BFT ITA-1.1 |

**Nota sobre L3:** PROVENANCE-1.0 y POLICY-CTX-1.0 son requeridos en L3-FULL. Completan la capa de evidencia que hace posible la verificación retroactiva — sin ellos, el Audit Ledger registra *que* se tomó una acción pero no *por qué autoridad* ni *bajo qué política*. Los tres juntos (LEDGER + PROVENANCE + POLICY-CTX) constituyen la base evidencial mínima para auditorías de cumplimiento.

---

## Ciclo de Vida de Ejecución

Lo que ocurre cuando un agente ejecuta una acción bajo ACP:

```
1. VERIFICACIÓN DE IDENTIDAD    El agente presenta identidad firmada (AGENT-1.0)
         │
         ▼
2. VERIFICACIÓN DE CAPACIDAD    La institución verifica CT contra CAP-REG
         │                      Comprueba: alcance, expiración, firma del emisor
         ▼
3. VERIFICACIÓN DE DELEGACIÓN   Handshake HP prueba posesión del CT
         │                      DCMA valida la cadena si hay delegación multi-salto
         ▼
4. EVALUACIÓN DE RIESGO         Motor RISK calcula RS (0–100)
         │                      Policy engine evalúa contra la política actual
         ▼
5. INSTANTÁNEA DE POLÍTICA      POLICY-CTX captura snapshot firmado del estado de política
         │                      Snapshot vinculado a esta instancia de ejecución
         ▼
6. EXECUTION TOKEN              EXEC emite ET de uso único (ventana de 300s)
         │                      ET vincula: agente, capacidad, recurso, RS, policy_ref
         ▼
7. EJECUCIÓN DE ACCIÓN          El agente ejecuta la acción autorizada
         │
         ▼
8. CAPTURA DE PROCEDENCIA       PROVENANCE registra la cadena de delegación completa en el momento de ejecución
         │                      Propiedades P1–P5 verificadas; firmado por la institución
         ▼
9. ENTRADA EN LEDGER            LEDGER añade entrada encadenada por hash
         │                      Entrada referencia ET, PROVENANCE, POLICY-CTX
         ▼
10. ACTUALIZACIÓN DE REPUTACIÓN REP-1.2 actualiza componente ERS
          │                     ITS sin cambios salvo que cambie la atestación ITA
          ▼
    [CONSULTABLE vía HIST-1.0 · AUDITABLE vía LIA-1.0]
```

---

## Propiedades Formales Clave

Propiedades que todo sistema conforme con ACP debe preservar:

**P-INVARIANTE:** `Execute(req) ⟹ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk`

**P-NO-ESCALADA:** Una capacidad delegada es siempre un subconjunto estricto de la capacidad del delegador. Ninguna delegación puede otorgar autoridad que el delegador no posee.

**P-TEMPORAL:** Todo CT, ET y artefacto PROVENANCE tiene límites `valid_until`. Ningún artefacto autoriza acciones fuera de su ventana temporal.

**P-COMPLETITUD-DE-CADENA:** `PROVENANCE.chain` incluye cada paso desde la Institución hasta el Agente ejecutor. No se permite ninguna brecha en la cadena.

**P-INMUTABILIDAD:** Las entradas del Ledger están encadenadas por hash. Una entrada manipulada invalida todas las entradas posteriores. Las brechas en los números de secuencia son detectables.

**P-PORTABILIDAD:** Un export de REP-PORTABILITY de la Institución A es criptográficamente verificable por la Institución B sin requerir participación en línea de A.

**P-REVOCABILIDAD:** Cualquier capacidad o delegación puede revocarse con efecto inmediato. DCMA aplica revocación transitiva a través de la cadena.

---

## Mapa de Documentos

| Sección | Documento | Ruta |
|---|---|---|
| Este documento | ARCHITECTURE.md | `ARCHITECTURE.md` |
| Inicio rápido | QUICKSTART.md | `QUICKSTART.md` |
| Resumen arquitectónico | architecture-overview.md | `docs/architecture-overview.md` |
| Índice completo de specs | Ver `spec/` | `spec/` |
| Requisitos de conformidad | ACP-CONF-1.1 | `spec/gobernanza/ACP-CONF-1.1.md` |
| Cadena de cumplimiento | ACR-1.0 + TS-1.1 | `cumplimiento/` |

---

*TraslaIA — Marcelo Fernandez — 2026 — Apache 2.0*
