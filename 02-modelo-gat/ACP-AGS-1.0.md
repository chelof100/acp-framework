# ACP-AGS-1.0
## Agent Governance Stack — Architecture Reference
**Status:** Draft
**Version:** 1.0
**Type:** Architecture Reference Document
**Depends-on:** ACP-CT-1.0, ACP-SIGN-1.0, ACP-RISK-1.0, ACP-EXEC-1.0, ACP-LEDGER-1.1, ACP-LIA-1.0, ACP-PSN-1.0, ACP-REV-1.0, ACP-ITA-1.0, ACP-CONF-1.0
**Related:** ACP-REP-1.2 (forward reference)

---

## 1. Alcance

Este documento define la arquitectura de referencia del Agent Governance Stack (AGS): el modelo de capas que posiciona a ACP dentro de un sistema completo de gobierno de agentes autónomos en entornos financieros.

El AGS no es un nuevo protocolo. Es el marco conceptual que describe cómo los componentes ACP se articulan entre sí y con capas externas para producir un sistema que sea: auditable, seguro, regulatoriamente conforme, y —en el sentido de Carly Martin/ARAF— **bankable**.

Un sistema es bankable cuando cumple cuatro propiedades simultáneas:
1. **Risk-modelable** — El riesgo de cada acción puede cuantificarse a priori.
2. **Auditable** — Toda acción puede reconstruirse y verificarse independientemente.
3. **Predictable** — El comportamiento del sistema es determinista dados los mismos inputs.
4. **Accountable** — Existe siempre un responsable identificable y asignable por cada acción.

El AGS es la arquitectura que hace posible las cuatro propiedades en un despliegue real.

---

## 2. El Agent Governance Stack — 8 Capas

```
┌─────────────────────────────────────────────────────────────┐
│  L8 — Risk Architecture                                      │
│       Modelo cuantitativo de riesgo (ACP-RISK-1.0)          │
│       Policy Snapshots (ACP-PSN-1.0)                        │
├─────────────────────────────────────────────────────────────┤
│  L7 — Reputation Layer                                       │
│       Score histórico de agentes (ACP-REP-1.2 →)            │
│       Alimentado por LIABILITY_RECORDs y execution_result    │
├─────────────────────────────────────────────────────────────┤
│  L6 — Liability Traceability                                 │
│       Materialización de responsabilidad (ACP-LIA-1.0)       │
│       Un LIABILITY_RECORD por ET consumido                   │
├─────────────────────────────────────────────────────────────┤
│  L5 — Verifiable History                                     │
│       Audit Ledger hash-chained (ACP-LEDGER-1.1)            │
│       Registro append-only de todos los eventos ACP          │
├─────────────────────────────────────────────────────────────┤
│  L4 — Execution Governance       ◄── ACP Core               │
│       Execution Tokens (ACP-EXEC-1.0)                       │
│       Authorization flow (ACP-API-1.0)                      │
│       Revocación (ACP-REV-1.0)                              │
├─────────────────────────────────────────────────────────────┤
│  L3 — Delegation                                             │
│       Capability Tokens delegados (ACP-CT-1.0 §7)           │
│       Árbol de delegación con depth y nonce                  │
├─────────────────────────────────────────────────────────────┤
│  L2 — Capabilities                                           │
│       Capability Registry (ACP-CAP-REG-1.0)                 │
│       Modelo de capabilities y namespaces                    │
├─────────────────────────────────────────────────────────────┤
│  L1 — Identity                                               │
│       Institutional Trust Anchor (ACP-ITA-1.0)              │
│       Proof of Possession (ACP-HP-1.0)                      │
│       Serialización y firma (ACP-SIGN-1.0)                   │
└─────────────────────────────────────────────────────────────┘
```

Las capas son dependientes hacia abajo: L6 requiere L5, L5 requiere L4, etc. Una implementación parcial es válida hasta el nivel implementado, pero no puede reclamar bankability completa sin L6.

---

## 3. Descripción de Capas

### L1 — Identity

**Propósito:** Anclar la identidad de cada agente e institución a una raíz criptográfica verificable.

**Specs ACP:** ACP-ITA-1.0, ACP-HP-1.0, ACP-SIGN-1.0

**Componentes clave:**
- `AgentID`: Identificador único derivado de clave pública (ACP-SIGN-1.0).
- `institution_id`: Identificador de la institución raíz (ACP-ITA-1.0).
- `X-ACP-PoP`: Header de Proof of Possession en cada request HTTP (ACP-HP-1.0).
- JCS (RFC 8785): Serialización determinista para hashing consistente entre implementaciones.

**Garantía:** Un actor externo puede verificar la identidad de cualquier agente sin confiar en la institución, usando únicamente la clave pública publicada.

---

### L2 — Capabilities

**Propósito:** Definir el espacio de acciones posibles del sistema y los namespaces que las organizan.

**Specs ACP:** ACP-CAP-REG-1.0, ACP-CT-1.0 §§1-6

**Componentes clave:**
- Namespace `acp:cap:<dominio>.<acción>`: Formato canónico de capability.
- Capability Registry: Autoridad de definición de capabilities válidas.
- `capability_baselines` en ACP-PSN-1.0: Score base por capability.

**Garantía:** Toda acción ejecutable está enumerada y definida. No pueden ejecutarse acciones fuera del espacio definido.

---

### L3 — Delegation

**Propósito:** Modelar la cadena de autorización desde la institución hasta el agente ejecutor.

**Specs ACP:** ACP-CT-1.0 §7

**Componentes clave:**
- Capability Token con `parent_token_nonce`: Vincula delegaciones en árbol.
- `delegation_depth`: Profundidad del agente en la jerarquía.
- `autonomy_level`: Nivel de autonomía del agente (0-4), afecta thresholds de riesgo.

**Garantía:** Toda ejecución puede rastrearse hasta el token raíz institucional. No es posible ejecutar una acción sin una cadena de delegación válida desde la institución.

---

### L4 — Execution Governance (ACP Core)

**Propósito:** Controlar en tiempo real qué acciones se ejecutan, bajo qué condiciones, y con qué resultado.

**Specs ACP:** ACP-EXEC-1.0, ACP-API-1.0, ACP-REV-1.0, ACP-RISK-1.0

**Componentes clave:**
- Execution Token (ET): Autorización atómica por acción específica. One-time use.
- `AUTHORIZATION` flow: Evaluación de riesgo → decisión (APPROVED/ESCALATED/DENIED).
- Revocación: Invalidación de tokens antes de consumo (ACP-REV-1.0).
- `policy_snapshot_ref`: Referencia al snapshot de política vigente en la evaluación.

**Garantía:** Ninguna acción puede ejecutarse sin un ET válido y no revocado. El resultado de la evaluación de riesgo es determinista y auditable.

---

### L5 — Verifiable History

**Propósito:** Registrar de forma permanente, ordenada e inmutable todos los eventos ACP.

**Specs ACP:** ACP-LEDGER-1.1

**Componentes clave:**
- Hash-chained append-only ledger: `prev_hash` vincula eventos criptográficamente.
- 14 tipos de eventos documentados (genesis, AUTHORIZATION, RISK_EVALUATION, ET_ISSUED, ET_CONSUMED, REVOCATION, LIABILITY_RECORD, POLICY_SNAPSHOT_CREATED, REPUTATION_UPDATED, y otros).
- Firma institucional por evento: Garantiza no-repudio.
- Verificación de integridad: Reconstruible desde el genesis.

**Garantía:** Ningún evento puede ser eliminado o modificado retroactivamente sin invalidar la cadena. Una auditoría externa puede verificar la integridad completa del historial.

---

### L6 — Liability Traceability

**Propósito:** Materializar, por cada ejecución, quién es el responsable legal asignable.

**Specs ACP:** ACP-LIA-1.0

**Componentes clave:**
- `LIABILITY_RECORD`: Un evento por ET consumido. Incluye `delegation_chain` completa y `liability_assignee`.
- Reglas de assignee: Escalación humana → supervisor si autonomy_level < 2 → ejecutor.
- `chain_incomplete`: Degradación auditada cuando la cadena no puede reconstruirse.
- `policy_snapshot_ref`: Contexto de política en el momento de la ejecución.

**Garantía:** Para toda acción ejecutada existe un responsable identificable. Esto es el requisito técnico de accountability que habilita bankability.

---

### L7 — Reputation Layer

**Propósito:** Construir un historial cuantitativo de comportamiento de cada agente para informar decisiones futuras de riesgo.

**Specs ACP:** ACP-REP-1.2 (forward reference — pendiente)

**Componentes clave (proyectados):**
- `trust_score`: Score continuo derivado de LIABILITY_RECORDs históricos.
- Alimentado por `execution_result` en LIABILITY_RECORDs.
- Evento `REPUTATION_UPDATED` en ledger (ACP-LEDGER-1.1 §5.14).
- Input para calibración de `capability_baselines` en ACP-PSN-1.0.

**Garantía (proyectada):** El riesgo de autorizar a un agente específico es informado por su historial real de ejecuciones, no solo por sus atributos estáticos.

---

### L8 — Risk Architecture

**Propósito:** Proporcionar el modelo cuantitativo que convierte atributos de una ejecución en un score de riesgo accionable.

**Specs ACP:** ACP-RISK-1.0, ACP-PSN-1.0

**Componentes clave:**
- Función de score determinista: `score = baseline + Σ(context_factors) + resource_factor`.
- Policy Snapshots: Estado inmutable de los parámetros del modelo en cada momento.
- Thresholds por `autonomy_level`: APPROVED / ESCALATED / DENIED.
- Temporal determinism: El mismo score DEBE producirse dado el mismo snapshot, siempre.

**Garantía:** El modelo de riesgo es risk-modelable en el sentido ARAF: puede auditarse qué parámetros produjeron qué decisión, en cualquier momento futuro.

---

## 4. Flujo de Transacción Completo

Ejemplo: Agente ejecutor (`autonomy_level = 2`) solicita ejecutar `acp:cap:financial.payment`.

```
1. [L1] Agente presenta X-ACP-PoP al sistema ACP.
        Sistema verifica identidad criptográficamente (ACP-HP-1.0).

2. [L3] Sistema recupera Capability Token del agente.
        Verifica delegation_chain hasta token raíz institucional (ACP-CT-1.0).

3. [L8] Sistema obtiene Policy Snapshot activo (ACP-PSN-1.0).
        Calcula risk_score = 35 (baseline payment) + 15 (off_hours) + 15 (sensitive) = 65.
        Threshold para autonomy_level 2: approved_max=39, escalated_max=69.
        Decisión: ESCALATED (score 65 ≤ 69).

4. [L4] Sistema emite Execution Token con status ESCALATED (ACP-EXEC-1.0).
        Registra evento AUTHORIZATION en ledger (ACP-LEDGER-1.1).
        AUTHORIZATION incluye policy_snapshot_ref.

5. [L5] Ledger append-only registra AUTHORIZATION con prev_hash y sig institucional.

6. [L4] Proceso de escalación. Supervisor humano aprueba.
        Sistema registra ESCALATION_RESOLVED en ledger.
        ET actualizado a APPROVED.

7. [L4] Sistema externo consume ET (ACP-EXEC-1.0 §8).
        Ledger registra EXECUTION_TOKEN_CONSUMED con execution_result=success.

8. [L6] Sistema emite LIABILITY_RECORD (ACP-LIA-1.0).
        delegation_chain reconstruida desde ledger.
        Regla 1 se aplica (escalación resuelta por humano) → liability_assignee = supervisor.
        Evento LIABILITY_RECORD añadido al ledger.

9. [L7] Sistema actualiza trust_score del agente (ACP-REP-1.2, futuro).
        Evento REPUTATION_UPDATED en ledger.
```

**Resultado:** La transacción es completamente auditable, el responsable está asignado (supervisor), y el modelo de riesgo usado está preservado en el snapshot referenciado.

---

## 5. Tabla de Cobertura por Spec

| Spec | Capa(s) | Bankability |
|---|---|---|
| ACP-SIGN-1.0 | L1 | Auditable (firmas verificables) |
| ACP-ITA-1.0 | L1 | Auditable (raíz de confianza) |
| ACP-HP-1.0 | L1 | Auditable (autenticación verificable) |
| ACP-CAP-REG-1.0 | L2 | Predictable (espacio de acciones definido) |
| ACP-CT-1.0 | L2, L3 | Predictable (delegación determinista) |
| ACP-RISK-1.0 | L4, L8 | Risk-modelable (score determinista) |
| ACP-REV-1.0 | L4 | Predictable (revocación garantizada) |
| ACP-EXEC-1.0 | L4 | Auditable (ET one-time-use) |
| ACP-API-1.0 | L4 | Auditable (interfaces formales) |
| ACP-PSN-1.0 | L8 | Risk-modelable (política inmutable) |
| ACP-LEDGER-1.1 | L5 | Auditable (historial verificable) |
| ACP-LIA-1.0 | L6 | Accountable (responsable asignable) |
| ACP-REP-1.2 | L7 | Risk-modelable (historial de comportamiento) |
| ACP-CONF-1.0 | Todas | Auditable (certificación formal) |

---

## 6. Guía de Implementación por Fases

Las instituciones pueden adoptar el AGS incrementalmente. Cada fase produce valor por sí misma.

### Fase 1 — Identity & Capabilities (L1 + L2)
**Specs:** ACP-SIGN-1.0, ACP-ITA-1.0, ACP-HP-1.0, ACP-CAP-REG-1.0
**Resultado:** Agentes con identidad criptográfica verificable y catálogo de capacidades definido.
**Bankability:** Ninguna aún — es la base necesaria.

### Fase 2 — Delegation (L3)
**Specs:** ACP-CT-1.0
**Resultado:** Árbol de delegación auditable desde la institución hasta cada agente ejecutor.
**Bankability:** Parcial — predictable (quién puede hacer qué está definido).

### Fase 3 — Execution Governance (L4) — ACP Core
**Specs:** ACP-RISK-1.0, ACP-EXEC-1.0, ACP-API-1.0, ACP-REV-1.0
**Resultado:** Control en tiempo real de cada acción ejecutada. Ningún agente puede actuar sin ET válido.
**Bankability:** Risk-modelable + Predictable. Sistema operable en producción.

### Fase 4 — Verifiable History (L5)
**Specs:** ACP-LEDGER-1.1, ACP-PSN-1.0
**Resultado:** Registro inmutable de toda la historia del sistema. Policy Snapshots para reconstrucción histórica.
**Bankability:** + Auditable. Sistema auditado por terceros.

### Fase 5 — Liability Traceability (L6) — Bankability completa
**Specs:** ACP-LIA-1.0
**Resultado:** Por cada ejecución, existe un responsable legal identificado y registrado.
**Bankability:** + Accountable. **Sistema plenamente bankable.**

### Fase 6 — Reputation (L7)
**Specs:** ACP-REP-1.2
**Resultado:** Score histórico de cada agente informa futuros cálculos de riesgo.
**Bankability:** Risk-modelable mejorado. Riesgo calibrado por historial real.

---

## 7. Interoperabilidad Cross-Institución

**7.1 Modelo de confianza federado** — Cuando dos instituciones operan con agentes entre sí (escenario B2B), cada institución mantiene su propio ledger, sus propios snapshots y sus propias LIABILITY_RECORDs. La interoperabilidad se habilita via ACP-ITA-1.0 (reconocimiento mutuo, pendiente en v1.1).

**7.2 `institution_id` como barrera** — Todo evento ACP está anclado a un `institution_id`. Un LIABILITY_RECORD de institución A no puede reclamar responsabilidad sobre una ejecución en institución B.

**7.3 Cross-institution execution** — Cuando un agente de institución A ejecuta en el contexto de institución B:
- El ET se emite bajo la autoridad de institución B.
- El LIABILITY_RECORD se registra en el ledger de institución B.
- La `delegation_chain` incluye el token de cross-institution trust emitido por ITA.

**7.4 Auditoría federada** — Un regulador con acceso a ambos ledgers puede reconstruir el flujo completo cross-institution. No requiere confianza en ninguna de las instituciones individualmente.

---

## 8. Mapeo a Marcos Regulatorios

| Marco | Requisito | Capa AGS | Spec ACP |
|---|---|---|---|
| Basel III / IV | Trazabilidad de riesgo | L8, L5 | ACP-RISK-1.0, ACP-LEDGER-1.1 |
| DORA (EU) | Resiliencia operacional y registros | L5, L4 | ACP-LEDGER-1.1, ACP-EXEC-1.0 |
| MiCA | Responsabilidad en servicios de activos digitales | L6 | ACP-LIA-1.0 |
| SR 11-7 (Fed) | Validación y gobernanza de modelos de IA | L8, L6 | ACP-PSN-1.0, ACP-LIA-1.0 |
| ARAF (Carly Martin) | Bankability de sistemas agénticos | L6, L8 | ACP-LIA-1.0, ACP-PSN-1.0 |
| MIR (Richard Whitney) | Auditabilidad de agentes en mercados | L5, L6 | ACP-LEDGER-1.1, ACP-LIA-1.0 |
| GDPR Art. 22 | Decisiones automatizadas significativas | L4, L6 | ACP-EXEC-1.0, ACP-LIA-1.0 |

---

## 9. Relación con Documentos de Arquitectura Existentes

| Documento | Relación con AGS |
|---|---|
| ACP-Architecture-Specification.md | Arquitectura técnica unificada de ACP v1.0 (pre-AGS). AGS extiende su modelo de capas. |
| Arquitectura-Tres-Capas.md | Modelo conceptual de tres capas (Identidad, Autorización, Operación). Mapeado a L1-L4 del AGS. |
| GAT-Maturity-Model.md | Modelo de madurez de implementación. Alineado con las 6 fases de §6. |
| ACP-CONF-1.0 | Define los requisitos de conformidad formales por nivel. AGS §6 es la guía de adopción práctica. |

---

## 10. Evolución del Stack

**v1.7.0 (actual):** L1-L6 especificados. L7 con interfaz definida (REPUTATION_UPDATED en ledger) pendiente de spec formal.

**v1.8.0 (próxima):**
- ACP-REP-1.2: Especificación completa de L7 (Reputation Layer).
- Consumo formal de REPUTATION_UPDATED desde ACP-LEDGER-1.1.
- Calibración de `capability_baselines` en PSN basada en scores de reputación.

**v2.0.0 (roadmap):**
- ACP-ITA-1.1: Reconocimiento mutuo cross-institution (habilita §7 completo).
- Post-quantum cryptography: Migración de Ed25519 a algoritmos post-cuánticos.
- Protocolo de negociación de versión entre implementaciones.
