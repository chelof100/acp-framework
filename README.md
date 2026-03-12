# ACP Framework — Agent Control Protocol

**Arquitectura Constitucional para Gobernanza de Agentes Autónomos**

ACP (Agent Control Protocol) es un protocolo formal de gobernanza y ejecución verificable para agentes de IA autónomos que operan en entornos institucionales.

No es un formato de mensajería ni una librería de firma. Es una **arquitectura constitucional**: un conjunto de reglas formales que determina bajo qué condiciones un agente autónomo puede actuar, por autoridad de quién, con qué responsabilidad y con qué prueba retroactiva.

**Versión:** 1.10 | **Licencia:** Apache 2.0 | **Autor:** Marcelo Fernandez — TraslaIA | info@traslaia.com

→ Modelo arquitectónico completo: [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## El problema que resuelve

Las organizaciones que despliegan agentes de IA autónomos enfrentan cuatro preguntas sin respuesta en la industria actual:

- **¿Quién autorizó** a este agente a ejecutar esta acción?
- **¿Puedo probarlo criptográficamente**, a posteriori?
- **¿Puedo revocar o restringir** esa autorización dinámicamente?
- **¿Funciona** con cualquier proveedor de IA o entorno de ejecución?

ACP es la respuesta completa a las cuatro.

---

## Invariante Constitucional

```
Execute(request) ⟹ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk
```

Ninguna acción de agente se ejecuta a menos que las cuatro condiciones se cumplan simultáneamente y sean verificables a posteriori desde el registro de auditoría. Esta es la restricción arquitectónica de la que se deriva toda spec.

---

## Arquitectura: Stack de Gobernanza de 8 Capas

ACP está organizado en ocho capas acumulativas. Cada capa depende de todas las capas inferiores.

```
┌─────────────────────────────────────────────────────────────────┐
│  CAPA 8 — ARQUITECTURA DE RIESGO                                 │
│  RISK-1.0 · PSN-1.0 · CROSS-ORG-1.0 · BULK-1.0                 │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 7 — REPUTACIÓN                                             │
│  REP-1.2 (ITS + ERS compuesto) · REP-PORTABILITY                │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 6 — RESPONSABILIDAD Y CONFIANZA                            │
│  LIA-1.0 · ITA-1.0 · ITA-1.1 (BFT) · GOV-EVENTS-1.0           │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 5 — HISTORIA VERIFICABLE                                   │
│  LEDGER-1.2 · HIST-1.0                                          │
├═════════════════════════════════════════════════════════════════╡
│  CAPA 4 — GOBERNANZA DE EJECUCIÓN    ← núcleo constitucional    │
│  EXEC-1.0 · POLICY-CTX-1.0 · PROVENANCE-1.0 · API-1.0          │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 3 — DELEGACIÓN                                             │
│  HP-1.0 · DCMA-1.0 · MESSAGES-1.0                               │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 2 — CAPACIDAD                                              │
│  CT-1.0 · CAP-REG-1.0                                           │
├─────────────────────────────────────────────────────────────────┤
│  CAPA 1 — IDENTIDAD                                              │
│  SIGN-1.0 · AGENT-1.0                                           │
└─────────────────────────────────────────────────────────────────┘
```

Capas 1–3: *quién puede hacer qué, por qué autoridad*
Capa 4: *aplicación del invariante constitucional*
Capas 5–8: *profundidad evidencial — qué se hizo, con qué consecuencia, por quién*

---

## Cómo se Conectan las Specs

Las cadenas de dependencia críticas que todo implementador debe entender:

| Cadena | Rol |
|---|---|
| `SIGN → CT → HP → EXEC` | Autoridad de ejecución — camino mínimo para cualquier acción autorizada |
| `EXEC → LEDGER → HIST` | Registro de auditoría — de la ejecución al historial consultable e inmutable |
| `EXEC → POLICY-CTX + PROVENANCE` | Capa de evidencia — prueba retroactiva: *bajo qué política, a través de qué cadena* |
| `ITA → REP → REP-PORTABILITY` | Cadena de confianza — del aval institucional a la puntuación conductual portable |
| `LEDGER → LIA` | Cadena de responsabilidad — del log de auditoría a la trazabilidad de responsabilidad |
| `GOV-EVENTS → HIST` | Cadena de gobernanza — eventos institucionales visibles en el historial del agente |

→ Grafo de dependencias completo con propiedades formales: [`ARCHITECTURE.md`](ARCHITECTURE.md)

---

## Niveles de Conformidad

| Nivel | Nombre | Capas | Specs requeridas |
|---|---|---|---|
| **L1** | CORE | 1–3 | SIGN · AGENT · CT · CAP-REG · HP · DCMA · MESSAGES |
| **L2** | SECURITY | 1–3 + parcial 6 | L1 + RISK · REV · ITA-1.0 |
| **L3** | FULL | 1–5 | L2 + API · EXEC · LEDGER · **PROVENANCE · POLICY-CTX** |
| **L4** | EXTENDED | 1–7 | L3 + **GOV-EVENTS** · PAY · REP-1.2 · ITA-1.1 · LIA · HIST · NOTIFY · DISC · BULK · CROSS-ORG · REP-PORTABILITY |
| **L5** | DECENTRALIZED | 1–8 | L4 + ACP-D · quórum BFT ITA-1.1 |

→ Definición normativa de conformidad: [`spec/gobernanza/ACP-CONF-1.1.md`](spec/gobernanza/ACP-CONF-1.1.md)

---

## Índice de Especificaciones

### [`spec/nucleo/`](spec/nucleo/) — Identidad, Capacidad, Delegación (L1)

| Spec | Función |
|---|---|
| [ACP-SIGN-1.0](spec/nucleo/ACP-SIGN-1.0.md) | Serialización JCS + firma Ed25519 — fundamento de todos los objetos del protocolo |
| [ACP-AGENT-1.0](spec/nucleo/ACP-AGENT-1.0.md) | Ontología formal del agente — `A=(ID,C,P,D,L,S)` |
| [ACP-CT-1.0](spec/nucleo/ACP-CT-1.0.md) | Capability Token — estructura, emisión, verificación |
| [ACP-CAP-REG-1.0](spec/nucleo/ACP-CAP-REG-1.0.md) | Registro canónico de capacidades — espacio de nombres `acp:cap:*` |
| [ACP-HP-1.0](spec/nucleo/ACP-HP-1.0.md) | Handshake Protocol — prueba criptográfica de posesión de capacidad |
| [ACP-DCMA-1.0](spec/nucleo/ACP-DCMA-1.0.md) | Delegación multi-salto — no-escalada + revocación transitiva |
| [ACP-MESSAGES-1.0](spec/nucleo/ACP-MESSAGES-1.0.md) | Formato wire — 5 tipos de mensaje normalizados |
| [ACP-PROVENANCE-1.0](spec/nucleo/ACP-PROVENANCE-1.0.md) | Procedencia de Autoridad — prueba retroactiva de la cadena de delegación en ejecución |

### [`spec/seguridad/`](spec/seguridad/) — Confianza, Riesgo, Revocación (L2)

| Spec | Función |
|---|---|
| [ACP-RISK-1.0](spec/seguridad/ACP-RISK-1.0.md) | Motor de riesgo determinístico — Risk Score RS (0–100) |
| [ACP-REV-1.0](spec/seguridad/ACP-REV-1.0.md) | Protocolo de revocación — endpoint + CRL |
| [ACP-ITA-1.0](spec/seguridad/ACP-ITA-1.0.md) | Institutional Trust Anchor — modelo centralizado |
| [ACP-ITA-1.1](spec/seguridad/ACP-ITA-1.1.md) | Gobernanza del Trust Anchor — modelo BFT distribuido |
| [ACP-REP-1.2](spec/seguridad/ACP-REP-1.2.md) | Extensión de Reputación — modelo dual ITS+ERS, score compuesto `0.6·ITS + 0.4·ERS` |

### [`spec/operaciones/`](spec/operaciones/) — Gobernanza de Ejecución, Historia (L3–L4)

| Spec | Función |
|---|---|
| [ACP-API-1.0](spec/operaciones/ACP-API-1.0.md) | API HTTP — todos los endpoints institucionales |
| [ACP-EXEC-1.0](spec/operaciones/ACP-EXEC-1.0.md) | Execution Tokens — uso único, validez de 300s |
| [ACP-LEDGER-1.2](spec/operaciones/ACP-LEDGER-1.2.md) | Audit Ledger — append-only, encadenado por hash |
| [ACP-POLICY-CTX-1.0](spec/operaciones/ACP-POLICY-CTX-1.0.md) | Instantánea de Contexto de Política — estado de política firmado en el momento de ejecución |
| [ACP-HIST-1.0](spec/operaciones/ACP-HIST-1.0.md) | History Query API — historial de ejecución auditado |
| [ACP-LIA-1.0](spec/operaciones/ACP-LIA-1.0.md) | Liability Traceability — cadena de responsabilidad atribuida |
| [ACP-PAY-1.0](spec/operaciones/ACP-PAY-1.0.md) | Extensión de Pago — capacidad financiera verificable |
| [ACP-PSN-1.0](spec/operaciones/ACP-PSN-1.0.md) | Policy Snapshot — estado de política en punto de tiempo firmado |
| [ACP-NOTIFY-1.0](spec/operaciones/ACP-NOTIFY-1.0.md) | Notification Extension — eventos y webhooks |
| [ACP-DISC-1.0](spec/operaciones/ACP-DISC-1.0.md) | Discovery Extension — registro y resolución de agentes |
| [ACP-BULK-1.0](spec/operaciones/ACP-BULK-1.0.md) | Bulk Operations — ejecución de capacidades en lote |
| [ACP-CROSS-ORG-1.0](spec/operaciones/ACP-CROSS-ORG-1.0.md) | Protocolo Cross-Org — interacciones entre agentes de distintas instituciones |

### [`spec/gobernanza/`](spec/gobernanza/) — Conformidad, Proceso, Eventos (L1–L4)

| Spec | Función |
|---|---|
| [ACP-CONF-1.1](spec/gobernanza/ACP-CONF-1.1.md) | **Conformidad** — 5 niveles acumulativos L1-L5 (normativo) |
| [ACP-TS-1.1](spec/gobernanza/ACP-TS-1.1.md) | Test Suite 1.1 — formato normativo de vectores |
| [RFC-PROCESS](spec/gobernanza/RFC-PROCESS.md) | Proceso de especificación — cómo evoluciona ACP |
| [RFC-REGISTRY](spec/gobernanza/RFC-REGISTRY.md) | Registro de RFCs — todas las propuestas de cambio activas |
| [ACR-1.0](spec/gobernanza/ACR-1.0.md) | Compliance Runner — ejecuta pruebas y emite certificaciones |
| [ACP-GOV-EVENTS-1.0](spec/gobernanza/ACP-GOV-EVENTS-1.0.md) | Flujo de Eventos de Gobernanza — taxonomía formal de 10 tipos de eventos institucionales |

### [`spec/descentralizado/`](spec/descentralizado/) — ACP-D (L5)

| Spec | Función |
|---|---|
| ACP-D-Especificacion | Especificación completa de ACP-D — DID + VC + Self-Sovereign Capability |
| Arquitectura-Sin-Issuer-Central | Modelo tolerante a fallas bizantinas sin emisor central |

---

## Cumplimiento y Certificación

Cadena completa: especificación → vectores de prueba → runner → badge de certificación público.

```
CONF-1.1 → TS-SCHEMA (forma) → TS-1.0 (casos) → TS-1.1 (formato JSON)
         → IUT-PROTOCOL (contrato runner↔impl) → ACR-1.0 (ejecuta)
         → CERT-1.0 (badge público verificable ACP-CERT-YYYY-NNNN)
```

| Documento | Función |
|---|---|
| [ACP-TS-SCHEMA-1.0](compliance/ACP-TS-SCHEMA-1.0.md) | JSON Schema para vectores de prueba (Draft 2020-12) |
| [ACP-TS-1.0](compliance/ACP-TS-1.0.md) | Suite de pruebas — casos requeridos por nivel L1-L5 |
| [ACP-TS-1.1](compliance/ACP-TS-1.1.md) | Formato normativo de vectores — determinístico, independiente del lenguaje |
| [ACP-IUT-PROTOCOL-1.0](compliance/ACP-IUT-PROTOCOL-1.0.md) | Contrato runner ↔ IUT — STDIN/STDOUT, timeouts, manifest |
| [ACR-1.0](compliance/ACR-1.0.md) | Compliance Runner oficial |
| [ACP-CERT-1.0](compliance/ACP-CERT-1.0.md) | Sistema de Certificación Pública |

**Vectores de prueba normativos:** [`compliance/test-vectors/`](compliance/test-vectors/) — 12 vectores JSON determinísticos (8 CORE + 4 DCMA).

---

## Inicio Rápido

```bash
# Iniciar el servidor ACP de referencia (Go)
cd impl/go
export ACP_INSTITUTION_PUBLIC_KEY=cA4s58S2dEJ-qye6ggvPbw-uvmjgn-hWQpIRTkHcakE
docker compose up -d

curl http://localhost:8080/acp/v1/health
# {"status":"ok","version":"1.0.0"}
```

```python
from acp import AgentIdentity, ACPSigner, ACPClient

agent = AgentIdentity.generate()
client = ACPClient("http://localhost:8080", agent, ACPSigner(agent))
client.register()

token = {
    "ver": "1.0", "iss": "did:key:z<institución>",
    "sub": agent.agent_id, "cap": ["acp:cap:financial.read"],
    "resource": "account:12345", "iat": 1700000000, "exp": 1700003600, "nonce": "abc123"
}
result = client.verify(ACPSigner(agent).sign_capability(token))
print(result)  # {"decision": "PERMIT", ...}
```

→ Guía completa: [`QUICKSTART.md`](QUICKSTART.md) | Implementaciones de referencia: [`impl/`](impl/)

---

## Hoja de Ruta

| Versión | Estado | Hito |
|---|---|---|
| **v1.0** | ✅ | 10 specs normativas — sistema centralizado |
| **v1.1** | ✅ | PAY-1.0 · REP-1.1 · ITA-1.1 BFT |
| **v1.2** | ✅ | CONF-1.1 (5 niveles) · cadena de cumplimiento · 12 vectores de prueba |
| **v1.3** | ✅ | Binario IUT (12/12 PASS) · ACR-1.0 · Python SDK |
| **v1.4** | ✅ | TypeScript SDK · Rust SDK · Docker CI/CD |
| **v1.5** | ✅ | Go Reference Server — 9 specs implementadas |
| **v1.6** | ✅ | AGENT-1.0 (ontología formal) · MESSAGES-1.0 · DCMA-1.0 |
| **v1.7** | ✅ | LIA-1.0 · PSN-1.0 · LEDGER-1.1 — capa de bankability |
| **v1.8** | ✅ | REP-1.2 (ITS+ERS) · LEDGER-1.2 (tipos de evento extendidos) |
| **v1.9** | ✅ | HIST-1.0 · NOTIFY-1.0 · DISC-1.0 · BULK-1.0 · CROSS-ORG-1.0 |
| **v1.10** | ✅ | PROVENANCE-1.0 · POLICY-CTX-1.0 · GOV-EVENTS-1.0 — capa de evidencia |
| **Paper** | ✍️ | Objetivo IEEE S&P / NDSS |
| **v2.0** | 📋 | ACP-D completo (BFT · ZK-proofs · DIDs) |

---

*TraslaIA — Marcelo Fernandez — 2026 — Apache 2.0*
