# ACP — Análisis de Arquitectura de Sistema
**Fecha:** 2026-03-11
**Alcance:** `chelof100/acp-framework` — árbol completo de especificaciones
**Analista:** Claude Sonnet 4.5 (pasada de arquitecto de sistema)
**Enfoque:** Integridad del protocolo · Lógica de gobernanza · Auditabilidad

---

## 1. Mapa de Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CAPA 1 — Arquitectura de IA Soberana  (01-sovereign-architecture/)     │
│  Doctrina: Execute(req) ⟹ ValidIdentity ∧ ValidCapability ∧             │
│            ValidDelegationChain ∧ AcceptableRisk                         │
│  Archivos: 3  │  No son especificaciones de protocolo — fundamento       │
│               │  filosófico                                              │
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CAPA 2 — Modelo GAT  (02-gat-model/)                                   │
│  Referencia: pila AGS de 8 capas, arquitectura de 3 capas, modelo de    │
│              madurez, hoja de ruta. Posiciona cada spec en el sistema.  │
│  Archivos: 6  (incl. 1 artefacto de planificación obsoleto — ver §3.I-9)│
└─────────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  CAPA 3 — Protocolo ACP  (03-acp-protocol/)                             │
│                                                                          │
│  3A NÚCLEO (7 specs)          3B OPERACIONES (13 specs)                 │
│  ────────────────────         ─────────────────────────                 │
│  SIGN-1.0 ←── base cript.    EXEC-1.0                                  │
│  CT-1.0   ←── cap tokens     LEDGER-1.2 ←── primitiva central de audit.│
│  CAP-REG  ←── espacio nomb.  LIA-1.0                                   │
│  HP-1.0   ←── PoP            PSN-1.0                                   │
│  MESSAGES ←── formato wire   HIST-1.0                                  │
│  AGENT    ←── modelo de dat. API-1.0                                   │
│  DCMA     ←── delegación     RISK-1.0 (mal ubicado — ver §3.I-15)      │
│                               DISC, BULK, NOTIFY, PAY, PSN-EXPORT       │
│                               CROSS-ORG-1.0 [NUEVO]                    │
│                                                                          │
│  3C SEGURIDAD (6 specs)       3D GOBERNANZA (5 specs)                  │
│  ──────────────────           ──────────────────────                   │
│  ITA-1.0, ITA-1.1             CONF-1.0 (obsoleto)                      │
│  REV-1.0                      CONF-1.1 ←── conformidad normativa       │
│  REP-1.1 (obsoleto)           ACR-1.0, RFC-PROCESS, RFC-REGISTRY       │
│  REP-1.2 ←── estable          (+ ACP-TS-1.1 duplicado — ver §3.I-8)   │
│  REP-PORTABILITY-1.0 [NUEVO]                                            │
│                                                                          │
│  3E CUMPLIMIENTO (5 specs)    3F DESCENTRALIZADO (3 docs)              │
│  ─────────────────            ──────────────────                       │
│  TS-1.0 (supersedido)         ACP-D-Specification (v2.0 propuesto)     │
│  TS-1.1, TS-SCHEMA-1.0        Arch-Without-Central-Issuer              │
│  IUT-PROTOCOL-1.0             README-ACP-D                             │
│  CERT-1.0                                                               │
└─────────────────────────────────────────────────────────────────────────┘
                             │
               ┌─────────────┼──────────────┐
               ▼             ▼              ▼
         CAPA 4           CAPA 5        CAPA 6
    Análisis Formal    Implementación  Publicaciones
    (8 docs — pruebas, (acp-go,       (Whitepaper,
    modelos de amenaza, py-sdk,        Académico,
    pruebas de reduc.)  ts-sdk)        IEEE-NDSS)
```

### 1.1 Ciclo de Vida de una Solicitud de Ejecución

```
Agente → POST /acp/v1/authorize
  │
  ├─ 1. Verificación CT          (ACP-CT-1.0 + ACP-HP-1.0)
  ├─ 2. Verificación cadena deleg.(ACP-DCMA-1.0)
  ├─ 3. Verificación de revocación(ACP-REV-1.0)
  ├─ 4. Evaluación de riesgo      (ACP-RISK-1.0) → evento RISK_EVALUATION
  ├─ 5. Decisión                  → evento AUTHORIZATION (ACP-LEDGER-1.2)
  │
  ├─ [PERMIT] → Token de ejecución emitido (ACP-EXEC-1.0) → evento ET_ISSUED
  │               │
  │               ▼
  │    Sistema destino: ET consumido    → evento ET_CONSUMED
  │               │
  │               ├─ LIABILITY_RECORD   (ACP-LIA-1.0)
  │               └─ REPUTATION_UPDATED (ACP-REP-1.2)
  │
  ├─ [ESCALATE] → evento ESCALATION_CREATED
  └─ [DENY]     → evento AUTHORIZATION(DENIED)
```

### 1.2 Jerarquía de Conformidad (según CONF-1.1)

| Nivel | Etiqueta | Componentes Especificados |
|-------|----------|---------------------------|
| L1 | CORE | SIGN + CT + CAP-REG + HP |
| L2 | SECURITY | L1 + RISK + REV + ITA-1.0 |
| L3 | FULL | L2 + API + EXEC + LEDGER |
| L4 | EXTENDED | L3 + PAY + REP + ITA-1.1 |
| L5 | DECENTRALIZED | L4 + ACP-D + ITA-1.1 BFT |

---

## 2. Módulos Principales — Resumen de Responsabilidades

| Módulo | Nivel | Rol en el Sistema |
|--------|-------|-------------------|
| **ACP-SIGN-1.0** | Núcleo/Primitiva | Base criptográfica. Ed25519 + JCS. Todo artefacto firmado se traza aquí. |
| **ACP-CT-1.0** | Núcleo/Auth | Artefacto de autorización principal. Contiene quién, qué, sobre qué y hasta cuándo. |
| **ACP-CAP-REG-1.0** | Núcleo/Espacio de nombres | Espacio de nombres canónico para IDs de capacidad. Previene colisiones, impone dominios. |
| **ACP-HP-1.0** | Núcleo/Seguridad | Proof-of-Possession en cada solicitud. Inutiliza los CT robados. |
| **ACP-MESSAGES-1.0** | Núcleo/Wire | Sobre estándar para todos los mensajes ACP. Anti-replay mediante nonce + message_id. |
| **ACP-AGENT-1.0** | Núcleo/Identidad | Modelo de datos del agente. Derivación de AgentID. Máquina de estados. Niveles de autonomía. |
| **ACP-DCMA-1.0** | Núcleo/Delegación | Modelo formal de cadena de delegación. Invariante de no-escalación. Revocación transitiva. |
| **ACP-RISK-1.0** | Seguridad/Decisión | Puntuación de riesgo determinista. Fórmula de cuatro factores. Auditable vía LEDGER. |
| **ACP-ITA-1.0** | Seguridad/Confianza | Registro de claves institucionales centralizado. Base para la confianza inter-institucional. |
| **ACP-ITA-1.1** | Seguridad/Federación | Confianza federada bilateral. No transitiva (1 salto). Quórum BFT para consenso. |
| **ACP-REV-1.0** | Seguridad/Ciclo de vida | Revocación de token y agente. Transitiva (revocación del padre invalida descendientes). |
| **ACP-REP-1.2** | Seguridad/Reputación | Modelo de puntuación dual (ITS + ERS). Decaimiento. Arranque. Compuesto: 0.6·ITS + 0.4·ERS. |
| **ACP-EXEC-1.0** | Operaciones/Ejecución | Prueba de ejecución de un solo uso. Desacopla la autorización del sistema destino. |
| **ACP-LEDGER-1.2** | Operaciones/Auditoría | Almacén de eventos append-only con encadenamiento hash. 14 tipos de evento. Auditabilidad central. |
| **ACP-LIA-1.0** | Operaciones/Responsabilidad | Materializa la responsabilidad legal por ejecución. Habilita la "bancabilidad". |
| **ACP-PSN-1.0** | Operaciones/Política | Instantáneas de política inmutables. Permite la reconstrucción retrospectiva de políticas. |
| **ACP-HIST-1.0** | Operaciones/Consulta | Capa de consulta del ledger + ExportBundle firmado para auditoría inter-institucional. |
| **ACP-API-1.0** | Operaciones/Integración | Superficie HTTP completa. El contrato de integración para implementadores del nodo ACP. |
| **ACP-CONF-1.1** | Gobernanza | Marco de conformidad cumulativa de 5 niveles. Requisito normativo de implementación. |
| **ACP-CROSS-ORG-1.0** | Operaciones/Federación | Rastro de auditoría inter-org bilateral. Cierra el problema de ledger asimétrico. L4. |
| **ACP-REP-PORTABILITY-1.0** | Seguridad/Federación | Transporte de reputación firmado entre instituciones. Techo de puntuación 0.85. L4. |

---

## 3. Inconsistencias

Las inconsistencias se clasifican como:
- 🔴 **CRÍTICA** — La integridad del protocolo o la corrección de la gobernanza está rota
- 🟠 **MAYOR** — El grafo de dependencias o la lógica de conformidad es incorrecta
- 🟡 **MENOR** — Brecha de documentación, referencia obsoleta o higiene de archivos

---

### I-1 🔴 Dependencia Circular: LEDGER-1.2 ↔ LIA-1.0 ↔ PSN-1.0

**Lo que dicen las cabeceras:**

```
ACP-LEDGER-1.2   Depends-on: ..., ACP-LIA-1.0, ACP-PSN-1.0
ACP-LIA-1.0      Depends-on: ACP-EXEC-1.0, ACP-LEDGER-1.2, ...
ACP-PSN-1.0      Depends-on: ACP-RISK-1.0, ACP-SIGN-1.0, ACP-LEDGER-1.2
```

LEDGER depende de LIA y PSN; LIA y PSN dependen ambos de LEDGER. Esto es una dependencia circular verdadera en los metadatos de cabecera.

**Causa raíz:** LEDGER-1.2 define los tipos de evento `LIABILITY_RECORD` y `POLICY_SNAPSHOT_CREATED` *en nombre de* LIA y PSN — se añadieron en la v1.1 del LEDGER. La relación semántica real es unidireccional: LIA y PSN *emiten* eventos *hacia* LEDGER. LEDGER no llama a LIA ni a PSN.

**Corrección requerida:** Eliminar `ACP-LIA-1.0` y `ACP-PSN-1.0` del `Depends-on` de LEDGER-1.2. Añadir un campo `Consumers:` o `Emitters:` para documentar la relación inversa sin crear una dependencia formal. LEDGER es el sumidero; LIA y PSN son emisores.

---

### I-2 🔴 CROSS_ORG_INTERACTION y REPUTATION_ATTESTATION_* No Registrados en LEDGER-1.2

ACP-LEDGER-1.2 define exactamente 14 tipos de evento (§5.1–§5.14). Dos nuevas especificaciones introducen tipos de evento adicionales:

- **ACP-CROSS-ORG-1.0** introduce: `CROSS_ORG_INTERACTION`
- **ACP-REP-PORTABILITY-1.0** introduce: `REPUTATION_ATTESTATION_ISSUED`, `REPUTATION_ATTESTATION_RECEIVED`

Ninguno de estos aparece en el registro de tipos de evento de LEDGER-1.2, las definiciones de esquema o los requisitos de conformidad. Esto significa:

1. Una implementación conforme con LEDGER-1.2 no tiene esquema normativo para validar estos eventos.
2. La especificación de integridad de cadena hash no dice nada sobre cómo manejarlos.
3. No existe un enlace `Required-by` de LEDGER hacia las nuevas specs.

**Corrección requerida:** Emitir **ACP-LEDGER-1.3** añadiendo §5.15, §5.16, §5.17 para los tres nuevos tipos de evento. Hasta entonces, las nuevas specs referencian un almacén de eventos que formalmente no sabe que existen.

---

### I-3 🔴 CONF-1.1 L4 Referencia ACP-REP-1.1 (Obsoleto)

CONF-1.1 §7.2 indica explícitamente:

> **7.2 Reputation Extension (ACP-REP-1.1)**
> The implementation MUST: Maintain ReputationScore ∈ [0,1] per agent...

ACP-REP-1.1 está marcado como:

> ⚠️ **DEPRECATED** — Superseded by **ACP-REP-1.2**

Una implementación conforme con L4 que siga CONF-1.1 literalmente implementaría la spec obsoleta, sin obtener ERS, Dual Trust Bootstrap ni Reputation Decay. CONF-1.1 debe actualizarse para referenciar ACP-REP-1.2 en L4.

---

### I-4 🔴 CROSS-ORG-1.0 y REP-PORTABILITY-1.0 Ausentes de CONF-1.1 L4

Ambas nuevas specs declaran en sus cabeceras:

```
**Implements:** ACP-CONF-1.1 Conformance Level L4
```

Pero la tabla de Niveles de CONF-1.1 define L4 como:

```
L4 | EXTENDED | L3 + PAY + REP + ITA-1.1
```

Sin mención de CROSS-ORG ni REP-PORTABILITY. Un implementador que lea CONF-1.1 no tiene obligación de implementar estas specs para reclamar conformidad L4. Las specs afirman estado L4 de forma unilateral, pero el documento normativo de conformidad no lo respalda.

**Corrección requerida:** Actualizar la definición L4 de CONF-1.1 a: `L3 + PAY + REP-1.2 + ITA-1.1 + CROSS-ORG-1.0 + REP-PORTABILITY-1.0`

---

### I-5 🟠 La Tabla de Niveles de CONF-1.1 Omite MESSAGES, AGENT, DCMA de L1

La tabla de Niveles dice:

```
L1 | CORE | SIGN + CT + CAP-REG + HP
```

Pero la cabecera `Depends-on` de CONF-1.1 lista `ACP-MESSAGES-1.0, ACP-DCMA-1.0`, y el SPEC-INDEX indexa AGENT, MESSAGES y DCMA como specs L1-CORE. La tabla normativa de Niveles está incompleta — omite tres specs requeridas de la definición de conformidad L1.

**Corrección requerida:** La fila L1 de la tabla debe decir: `SIGN + CT + CAP-REG + HP + MESSAGES + AGENT + DCMA`

---

### I-6 🟠 DCMA-1.0 (L1-Núcleo) Declara Dependencia de LEDGER-1.2 (L3-Operaciones)

```
ACP-DCMA-1.0  Depends-on: ACP-CT-1.0, ACP-SIGN-1.0, ACP-LEDGER-1.2
```

DCMA está clasificado como primitiva de Núcleo L1. LEDGER es L3-OPERACIONES. Si DCMA requiere genuinamente LEDGER para funcionar, entonces una implementación L1 no puede construirse sin implementar primero L3 — lo que rompe completamente el modelo de conformidad cumulativa.

**Causa raíz:** DCMA usa el ledger para registrar eventos de delegación (los payloads de `AUTHORIZATION` incluyen `delegation_chain`). Pero esta es una relación solo de escritura, unidireccional — DCMA *instruye* al ledger pero no depende de él para su propia corrección.

**Corrección requerida:** Eliminar `ACP-LEDGER-1.2` del `Depends-on` de DCMA. El modelo formal de delegación en DCMA es autocontenido. Su interacción con el ledger debe describirse como una nota de integración operacional, no como una dependencia formal.

---

### I-7 🟠 EXEC-1.0 Depende de API-1.0 / API-1.0 Lista EXEC-1.0 en Required-by

```
ACP-EXEC-1.0  Depends-on: ACP-SIGN-1.0, ACP-CT-1.0, ACP-API-1.0
ACP-API-1.0   Required-by: ACP-EXEC-1.0, ACP-LEDGER-1.2
```

EXEC depende de API porque el endpoint de emisión de ET (`POST /acp/v1/exec/issue`) está definido en API-1.0. API lista EXEC en su `Required-by` porque EXEC define el formato de token que los endpoints de API transportan. Esta es una relación de co-definición, no una dependencia semántica real de EXEC hacia API.

**Impacto:** Un implementador construyendo el formato ET (EXEC) no puede hacerlo sin "depender" de una spec (API) que está 2 niveles más arriba en la jerarquía de conformidad. Esto crea un problema de ordenamiento de implementación.

**Corrección requerida:** Extraer la especificación del endpoint ET hacia EXEC-1.0 mismo, o reestructurar para que API referencie EXEC (no al revés). El formato de token debe poder especificarse independientemente del transporte HTTP.

---

### I-8 🟠 ACP-TS-1.1 y ACR-1.0 Duplicados en Dos Directorios

Ambos archivos aparecen en:
- `03-acp-protocol/specification/governance/`
- `03-acp-protocol/compliance/`

Esto crea ambigüedad sobre cuál copia es canónica y riesgo de divergencia si se edita una sin la otra.

**Corrección requerida:** Mantener las specs de cumplimiento solo en `/compliance/`. Eliminar las copias de `/governance/`. Actualizar las referencias cruzadas.

---

### I-9 🟡 La Cláusula de Identidad L1 de CONF-1.1 Referencia "DID or equivalent"

CONF-1.1 §4.1:
> Support unique identifiers (DID or equivalent)

ACP-AGENT-1.0 §3 define:
> `AgentID = base58(SHA-256(pk_bytes))`

Esto no es un DID. La prueba de conformidad para identidad L1 usa un concepto (DID) que la spec central nunca usa. Esto haría fallar a una implementación conforme ante una lectura literal de la cláusula de conformidad.

**Corrección requerida:** Reemplazar con "ACP AgentID según ACP-AGENT-1.0 §3 (`base58(SHA-256(pk_bytes))`) o DID (requerido para L5)."

---

### I-10 🟡 CONF-1.1 L3 Denominado "FULL" — Inconsistente con SPEC-INDEX y CHANGELOG

Tabla CONF-1.1: `L3 | FULL`
SPEC-INDEX: `L3-OPERATIONS`
CHANGELOG: no usa ninguno consistentemente

Tres nombres distintos para el mismo nivel en tres documentos del mismo repositorio.

**Corrección requerida:** Estandarizar a una etiqueta única. Recomendación: `L3-OPERATIONS` (descriptivo de lo que añade) en lugar de `FULL` (implica completitud, pero existen L4 y L5).

---

### I-11 🟡 El Campo Required-by de LEDGER-1.2 Está Obsoleto

```
Required-by: ACP-CONF-1.0, ACP-REP-1.2
```

Referencias faltantes:
- `ACP-CONF-1.1` (CONF-1.0 está obsoleto y no debe ser el puntero hacia adelante)
- `ACP-CROSS-ORG-1.0` (declara LEDGER como dependencia)
- `ACP-REP-PORTABILITY-1.0` (declara LEDGER como dependencia)
- `ACP-LIA-1.0`, `ACP-PSN-1.0`, `ACP-HIST-1.0` (todos consumidores principales del ledger)

---

### I-12 🟡 RFC-REGISTRY Está Vacío — Las Nuevas Specs No Tienen Rastro RFC

```
| — | — | — | — | — | — | — | — | — | — |
*No RFCs registered as of this date.*
```

ACP-CROSS-ORG-1.0 y ACP-REP-PORTABILITY-1.0 son specs normativas L4. Según RFC-PROCESS, las especificaciones normativas deben pasar por el proceso RFC y registrarse aquí. Ninguna lo hizo. Esto significa:

1. No hay rastro de revisión formal para las dos nuevas specs.
2. El proceso de gobernanza es eludido para las adiciones más recientes al protocolo.
3. Un auditor externo no puede trazar la justificación para introducir estas specs.

---

### I-13 🟡 CHANGELOG No Tiene Entrada para CROSS-ORG-1.0 ni REP-PORTABILITY-1.0

Última entrada de CHANGELOG: v1.9.0 (2026-03-09). Las dos nuevas specs fueron añadidas después de v1.9.0 y aparecen en la sección `[Unreleased]` (que está vacía). Esto significa que el historial de versiones del repositorio está incompleto.

---

### I-14 🟡 ACP-TS-SCHEMA-1.0 No Está en SPEC-INDEX

`03-acp-protocol/compliance/ACP-TS-SCHEMA-1.0.md` es un JSON Schema normativo para vectores de prueba (complementario a ACP-TS-1.1). No está catalogado en SPEC-INDEX, no está referenciado en la cabecera de ACP-TS-1.1, y no tiene conexiones `Required-by` con nada.

---

### I-15 🟡 ACP-RISK-1.0 Está Mal Ubicado en /security/

ACP-RISK-1.0 está en `specification/security/` pero:
- Está listado en `Required-by` de LEDGER-1.2 (operaciones)
- Es una dependencia del flujo de autorización (operaciones)
- CONF-1.1 lo posiciona en L2 porque se requiere para el *motor de decisión*, no para primitivas de seguridad
- El propio SPEC-INDEX señala que "también está listado bajo Operaciones"

La spec es un módulo de evaluación/decisión, no una primitiva de seguridad. Pertenece a `/operations/`.

---

### I-16 🟡 Archivos Obsoletos/Archivados en Directorios de Specs Activas

| Archivo | Problema |
|---------|----------|
| `02-gat-model/Final-Documentation-Structure.md` | Artefacto de planificación desde el inicio del proyecto, no es una spec ni referencia. Debe archivarse. |
| `03-acp-protocol/specification/core/ACP-AGENT-SPEC-0.3.md` | Explícitamente obsoleto ("renombrado a ACP-AGENT-1.0"). Presente en directorio activo, no archivado. |
| `04-formal-analysis/Mermaid-Diagram.md` | Diagrama Mermaid de 4 líneas sin contexto, sin metadatos de autoría, sin referencia en ningún lugar. |

---

### I-17 🟡 CHANGELOG v1.8.0 Referencia "ACP-LEDGER-1.1" Inexistente

En la entrada de CHANGELOG para v1.8.0 (ACP-REP-1.2):
> "ACP-LEDGER-1.1 integration: consumption by `evaluation_context`..."

La spec del ledger está en la versión 1.2. No existe ningún documento ACP-LEDGER-1.1 en el repositorio. Este es un número de versión obsoleto en la entrada del changelog.

---

## 4. Sugerencias de Mejora

### S-1 🔴 Emitir ACP-LEDGER-1.3 para Registrar los Nuevos Tipos de Evento

Los tres tipos de evento introducidos por CROSS-ORG-1.0 y REP-PORTABILITY-1.0 necesitan registro formal en la spec del ledger. LEDGER-1.3 debe:

1. Añadir §5.15 esquema `CROSS_ORG_INTERACTION` (de CROSS-ORG-1.0 §4)
2. Añadir §5.16 esquema `REPUTATION_ATTESTATION_ISSUED`
3. Añadir §5.17 esquema `REPUTATION_ATTESTATION_RECEIVED`
4. Actualizar `Required-by` para incluir CROSS-ORG-1.0 y REP-PORTABILITY-1.0
5. Definir compatibilidad hacia atrás: las implementaciones v1.2 DEBEN tratar los tres nuevos tipos como LEDGER-008 (tipo de evento desconocido, continuar verificación de cadena)

Hasta que LEDGER-1.3 exista, los nuevos tipos de evento no tienen hogar normativo.

---

### S-2 🔴 Actualizar CONF-1.1 a una Revisión Correctiva (v1.1.1 o v1.2)

Una única revisión correctiva de CONF-1.1 debe abordar las cuatro brechas críticas/mayores de gobernanza:

| Corrección | Cambio |
|------------|--------|
| Tabla L1 | Añadir MESSAGES, AGENT, DCMA |
| Tabla L2 | Clarificar ITA-1.0 (centralizado) vs ITA-1.1 (federación añadida en L4) |
| Tabla L4 | Reemplazar REP-1.1 → REP-1.2; añadir CROSS-ORG-1.0; añadir REP-PORTABILITY-1.0 |
| Sección L4 §7.2 | Reemplazar referencia "ACP-REP-1.1" por "ACP-REP-1.2" |
| L1 §4.1 identidad | Reemplazar "DID or equivalent" por "ACP AgentID según ACP-AGENT-1.0 §3" |
| Etiqueta L3 | Renombrar "FULL" → "OPERATIONS" para consistencia |

---

### S-3 🟠 Corregir la Circularidad del Grafo de Dependencias

Tres correcciones específicas eliminan todos los problemas de dependencia circular y de capas cruzadas:

**Corrección A — cabecera LEDGER-1.2:**
```
Depends-on: ACP-SIGN-1.0, ACP-CT-1.0, ACP-RISK-1.0, ACP-REV-1.0, ACP-EXEC-1.0
# Eliminar: ACP-LIA-1.0, ACP-PSN-1.0
# Añadir nota: "Emitters: ACP-LIA-1.0 (LIABILITY_RECORD), ACP-PSN-1.0 (POLICY_SNAPSHOT_CREATED)"
```

**Corrección B — cabecera DCMA-1.0:**
```
Depends-on: ACP-CT-1.0, ACP-SIGN-1.0
# Eliminar: ACP-LEDGER-1.2
# Añadir nota: "Los payloads de DCMA se incluyen en eventos AUTHORIZATION y LIABILITY_RECORD (ACP-LEDGER-1.2 §5.2, §5.12)"
```

**Corrección C — cabecera EXEC-1.0:**
```
Depends-on: ACP-SIGN-1.0, ACP-CT-1.0
# Eliminar: ACP-API-1.0
# El endpoint ET definido en API-1.0 debe en cambio referenciar EXEC-1.0 (no al revés)
```

---

### S-4 🟠 Registrar CROSS-ORG-1.0 y REP-PORTABILITY-1.0 en RFC-REGISTRY

Incluso de forma retroactiva, ambas specs deben recibir entradas RFC. Esto proporciona:
- Un rastro de justificación (por qué se introdujo la spec, qué problema resuelve)
- Un registro de revisión formal para auditores externos
- Trazabilidad para análisis futuro de cambios incompatibles

Entradas sugeridas:

```
| RFC-2026-001 | Cross-Organizational Interaction Registry | Protocol | [Autor] | 2026-03-11 | 2026-03-11 | Implemented | No | ACP-LEDGER-1.x, ACP-CONF-1.1, ACP-HIST-1.0 | ./rfcs/RFC-2026-001.md |
| RFC-2026-002 | Reputation Portability Protocol          | Protocol | [Autor] | 2026-03-11 | 2026-03-11 | Implemented | No | ACP-REP-1.2, ACP-LEDGER-1.x, ACP-CONF-1.1  | ./rfcs/RFC-2026-002.md |
```

---

### S-5 🟠 Reubicar ACP-RISK-1.0 en /operations/

Mover `specification/security/ACP-RISK-1.0.md` → `specification/operations/ACP-RISK-1.0.md`.

Justificación: RISK es un módulo de evaluación/decisión, no una primitiva criptográfica ni un módulo de gestión de confianza. Pertenece junto a EXEC, LEDGER y API como componente operacional. Su ubicación actual en `/security/` crea confusión conceptual para los nuevos implementadores que navegan el árbol de specs.

---

### S-6 🟡 Introducir un Campo Formal `Emitters:` en el Frontmatter de Specs

El par actual `Depends-on` / `Required-by` solo captura dependencias direccionales de tipo compilación. Para specs centradas en el ledger, existe una tercera relación distinta: *"esta spec emite eventos consumidos por LEDGER"*. Introducir un campo formal `Emitters:` en LEDGER-1.x y un campo `Emits-to:` en LIA, PSN, CROSS-ORG y REP-PORTABILITY:

1. Eliminaría la necesidad de relaciones circulares en `Depends-on`
2. Proporcionaría un mapa completo de procedencia de eventos
3. Permitiría a las herramientas verificar que cada tipo de evento tiene un emisor registrado

Campos de cabecera estándar sugeridos:
```
Depends-on:    (deps de compilación — deben construirse/especificarse primero)
Required-by:   (consumidores de los artefactos de esta spec)
Emits-to:      (tipos de evento del ledger que produce esta spec)
Emitters:      (qué specs producen los eventos registrados en esta spec)
```

---

### S-7 🟡 Añadir Entradas de CHANGELOG y Bump de Versión para Nuevas Specs

Faltan dos entradas de CHANGELOG:

```markdown
## [1.10.0] — 2026-03-11

### Added — ACP-CROSS-ORG-1.0 — Cross-Organizational Interaction Registry
- Define `CROSS_ORG_INTERACTION` como tipo de evento LEDGER-1.x de primera clase
- Protocolo de transmisión bilateral CrossOrgBundle (8 ActionTypes, 6 reglas de emisión)
- Procedimiento de validación de destino de 7 pasos, acuse de recibo CrossOrgAck
- Extensiones de consulta inter-org sobre ACP-HIST-1.0
- Cierra la brecha de rastro de auditoría asimétrica. Implementa CONF-1.1 L4.

### Added — ACP-REP-PORTABILITY-1.0 — Reputation Portability
- Formato ReputationAttestation con techo de puntuación 0.85
- Requisitos de elegibilidad: event_count ≥ 10, ITS ≥ 0.50
- Fórmula de descuento inicial ERS: score × (1 - 1/(1 + refs/10)) × 0.85
- Invariante de no-transitividad aplicado en la emisión
- Dos nuevos tipos de evento del ledger: REPUTATION_ATTESTATION_ISSUED, REPUTATION_ATTESTATION_RECEIVED
- Implementa ACP-REP-1.1 §12.1 y CONF-1.1 L4.
```

---

### S-8 🟡 Archivar Archivos Obsoletos

| Acción | Archivo |
|--------|---------|
| Mover a `/archive/` o eliminar | `02-gat-model/Final-Documentation-Structure.md` |
| Mover a `/archive/` o eliminar | `03-acp-protocol/specification/core/ACP-AGENT-SPEC-0.3.md` |
| Mover a `/archive/` o eliminar | `04-formal-analysis/Mermaid-Diagram.md` |
| Eliminar duplicado | `03-acp-protocol/specification/governance/ACP-TS-1.1.md` (conservar copia en `/compliance/`) |
| Eliminar duplicado | `03-acp-protocol/specification/governance/ACR-1.0.md` (conservar copia en `/compliance/`) |

---

### S-9 🟡 Añadir ACP-TS-SCHEMA-1.0 a SPEC-INDEX y ACP-TS-1.1

`ACP-TS-SCHEMA-1.0.md` proporciona el JSON Schema formal para vectores de prueba — este es un artefacto normativo para quien implemente ACR-1.0. Debe:
1. Referenciarse en ACP-TS-1.1 §X: "El JSON Schema formal para vectores de prueba está definido en ACP-TS-SCHEMA-1.0."
2. Añadirse a SPEC-INDEX bajo §3E Cumplimiento.

---

### S-10 🟡 Implementar Soporte de Referencia Go para CROSS-ORG y REP-PORTABILITY

La implementación de referencia Go (`acp-go`) tiene paquetes para: `ledger`, `reputation`, `token`, `risk`, `sign`, `api`, `revocation`, `delegation`, `execution`, `handshake`, `registry`.

Las dos nuevas specs de federación L4 no tienen paquetes correspondientes. Antes de que estas specs puedan reclamar `Status: Active/Normative`, debe existir una implementación de referencia. Paquetes nuevos sugeridos:

```
pkg/crossorg/      — Creación, firma, validación de CrossOrgBundle, CrossOrgAck
pkg/portability/   — Emisión, verificación, cálculo de ERS de ReputationAttestation
```

---

## 5. Lista de Correcciones por Prioridad

| Prioridad | ID | Categoría | Descripción |
|-----------|----|-----------|-------------|
| 1 | I-2 → S-1 | Integridad del Protocolo | Emitir LEDGER-1.3: registrar CROSS_ORG_INTERACTION, REPUTATION_ATTESTATION_ISSUED/RECEIVED |
| 2 | I-3 + I-4 → S-2 | Gobernanza | Actualizar CONF-1.1: corregir definición L4, corregir referencia obsoleta REP-1.1, añadir CROSS-ORG + PORTABILITY |
| 3 | I-1 + I-6 + I-7 → S-3 | Grafo de Dependencias | Corregir dependencias circulares/inter-capas: cabeceras LEDGER, DCMA, EXEC |
| 4 | I-12 → S-4 | Gobernanza/Auditoría | Registrar RFC-2026-001 y RFC-2026-002 retroactivamente |
| 5 | I-5 | Conformidad | Añadir MESSAGES, AGENT, DCMA a la tabla L1 de CONF-1.1 |
| 6 | I-9 | Conformidad | Corregir cláusula de identidad §4.1 de CONF-1.1 (AgentID, no DID) |
| 7 | I-13 → S-7 | Documentación | Añadir entradas de CHANGELOG para v1.10.0 (nuevas specs) |
| 8 | I-15 → S-5 | Organización de Archivos | Reubicar RISK-1.0 en /operations/ |
| 9 | I-8 | Organización de Archivos | Eliminar TS-1.1 y ACR-1.0 duplicados de /governance/ |
| 10 | I-14 → S-9 | Documentación | Indexar ACP-TS-SCHEMA-1.0 en SPEC-INDEX y TS-1.1 |
| 11 | I-10 | Consistencia | Estandarizar etiqueta L3: "FULL" → "OPERATIONS" |
| 12 | I-11 | Metadatos | Actualizar campo Required-by de LEDGER-1.2 |
| 13 | I-16 → S-8 | Higiene | Archivar archivos obsoletos (Final-Docs, AGENT-SPEC-0.3, Mermaid-Diagram) |
| 14 | I-17 | Documentación | Corregir referencia "LEDGER-1.1" → "LEDGER-1.2" en CHANGELOG v1.8.0 |
| 15 | S-10 | Implementación | Añadir paquetes crossorg/ y portability/ a acp-go |

---

## 6. Evaluación de Integridad del Protocolo

**Fortalezas:**
- El invariante constitucional (`Execute(req) ⟹ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk`) está coherentemente expresado en la doctrina L1, las specs centrales L3 y el ciclo de vida de ejecución. Ninguna spec lo viola.
- El mecanismo de encadenamiento hash en LEDGER-1.2 es formalmente correcto y sólido. La integridad de la cadena es verificable sin confianza en la institución.
- Los invariantes de no-transitividad en ITA-1.1 (federación de 1 salto) y REP-PORTABILITY-1.0 están correctamente especificados y aplicados consistentemente.
- La revocación transitiva (DCMA + REV-1.0) está formalmente definida y correctamente referenciada.
- ACP-HP-1.0 Proof-of-Possession cierra la vulnerabilidad de token robado sin modificar la spec CT.

**Debilidades:**
- Las dos specs L4 más recientes (CROSS-ORG, REP-PORTABILITY) son huérfanas del protocolo: afirman estado L4 pero no son reconocidas por el documento de gobernanza de L4 (CONF-1.1), y sus tipos de evento no están registrados en el ledger.
- La dependencia circular entre LEDGER, LIA y PSN es la inconsistencia estructuralmente más significativa — hace que el grafo `Depends-on` sea irresoluble por un solucionador de dependencias.
- El RFC-REGISTRY vacío significa que el protocolo no tiene rastro de gobernanza formal para sus adiciones más recientes.

**Veredicto global:** El protocolo central (L1–L3) es estructuralmente sólido. La capa de federación L4 fue añadida correctamente en diseño pero cableada de forma incompleta en el marco de gobernanza. Las 15 correcciones anteriores, priorizadas como se indica, llevarán el repositorio a plena consistencia interna.
