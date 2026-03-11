# Índice del Repositorio ACP — Especificaciones de Módulos

**Última actualización:** 2026-03-11
**Repositorios:** `chelof100/acp-framework-en` (EN) · `chelof100/acp-framework` (ES)
**Versión del protocolo:** ACP v1.x

Este índice cataloga todos los módulos del árbol de especificaciones ACP, su estado actual, su responsabilidad y su posición en el grafo de dependencias. Los módulos se agrupan por capa arquitectónica.

---

## Cómo leer este índice

| Símbolo | Significado |
|---------|-------------|
| ✅ Estable | Congelado. Sin cambios de ruptura sin nuevo número de versión. |
| 📐 Normativo | Adoptado y vinculante para la conformidad. |
| 🔧 Borrador | La especificación está completa pero aún no ha sido ratificada. |
| ⚠️ Obsoleto | Supersedido. Conservado solo como referencia histórica. |
| 🔬 Propuesto | Experimental o prospectivo. Aún no está en la ruta de conformidad v1.x. |

---

## Capa 1 — Arquitectura de IA Soberana

Doctrina fundacional. No son especificaciones de protocolo — constituyen el sustento conceptual y filosófico de toda la pila.

| Archivo | Responsabilidad |
|---------|----------------|
| `Sovereign-AI-Architecture.md` | Tesis central: los sistemas de IA que operan en entornos institucionales deben ser arquitectónicamente soberanos — portadores de autoridad, no receptores de autoridad. Define el Marco de 3 Capas. |
| `ACP-Foundational-Doctrine.md` | Enunciado invariante de la garantía constitucional de ACP: `Execute(req) ⟹ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk`. |
| `Sovereign-AI-Architecture-Framework.md` | Traducción de ingeniería de L1 a requisitos de diseño. Mapea la doctrina a obligaciones concretas de protocolo. |

---

## Capa 2 — Modelo GAT (Arquitectura de Gobernanza para Agentes de Confianza)

Referencia arquitectónica. Define cómo los componentes de ACP se ensamblan en un sistema de gobernanza completo.

| Archivo | Estado | Responsabilidad |
|---------|--------|----------------|
| `ACP-AGS-1.0.md` | 🔧 Borrador | **Agent Governance Stack** — arquitectura de referencia de 8 capas (L1 Identidad hasta L8 Cumplimiento). Posiciona cada especificación ACP dentro del sistema completo. Define "bancabilidad" como el contrato de cuatro propiedades: modelable en riesgo, auditable, predecible, responsable. El núcleo conceptual que muestra cómo encajan las especificaciones. |
| `Three-Layer-Architecture.md` | Referencia | Visión narrativa de Arquitectura Soberana → Modelo GAT → Protocolo ACP. |
| `GAT-Maturity-Model.md` | Referencia | Niveles de madurez progresiva para la adopción institucional de ACP. |
| `Roadmap.md` | Referencia | Trayectoria de desarrollo v1.x → v2.0. |

---

## Capa 3 — Especificaciones del Protocolo ACP

La capa normativa del protocolo. Organizada en cinco grupos: Core, Operaciones, Seguridad, Gobernanza y Cumplimiento.

---

### 3A. Core — Identidad, Tokens y Mensajería

Primitivas fundacionales de las que depende toda otra especificación. Deben implementarse primero.

| Especificación | Versión | Estado | Responsabilidad |
|----------------|---------|--------|----------------|
| **ACP-SIGN-1.0** | 1.0 | 🔧 Borrador | **Serialización y Firma** — Serialización canónica usando JCS (RFC 8785) + firmas Ed25519 (RFC 8032). Todo artefacto ACP que requiera firma DEBE usar esta especificación. Define `AgentID = base58(SHA-256(pubkey))`. La base criptográfica de todo el protocolo. |
| **ACP-CT-1.0** | 1.0 | 🔧 Borrador | **Capability Token** — Estructura, campos, emisión, verificación y reglas de delegación para el artefacto de autorización primario. Un CT autoriza a un agente a realizar una acción específica sobre un recurso específico. Define el modelo de cadena de delegación y el alcance de capacidades. |
| **ACP-CAP-REG-1.0** | 1.0 | 🔧 Borrador | **Registro de Tipos de Capacidad** — Espacio de nombres canónico para identificadores de capacidad (`acp:cap:<dominio>.<acción>`). Define los dominios core (datos, servicio, finanzas, cumplimiento, auditoría), líneas base de riesgo por capacidad, restricciones obligatorias y el proceso de extensión para capacidades específicas de institución. |
| **ACP-HP-1.0** | 1.0 | 🔧 Borrador | **Protocolo de Handshake** — Mecanismo de Prueba de Posesión sin estado. Requiere que el portador del CT demuestre la posesión de la clave privada del agente en cada solicitud. Cierra la vulnerabilidad de token robado: un CT válido por sí solo no es suficiente para actuar — el agente debe probar la propiedad de la clave. |
| **ACP-MESSAGES-1.0** | 1.0 | 📐 Normativo | **Especificación Formal de Mensajes** — Formato de cable para todos los mensajes ACP: campos obligatorios (`protocol_version`, `message_id`), reglas de serialización JSON, requisitos de firma y protección anti-repetición. Requerido en el nivel de conformidad L1. |
| **ACP-AGENT-1.0** | 1.0 | 📐 Normativo | **Modelo de Datos del Agente** — Definición formal de un agente ACP: campos de identidad, niveles de autonomía (L1–L4), alcance de capacidades, propiedades de seguridad demostrables y la máquina de estados del agente (ACTIVE → SUSPENDED → BANNED). Supersede ACP-AGENT-SPEC-0.3. Requerido en el nivel de conformidad L1. |
| **ACP-DCMA-1.0** | 1.0 | 📐 Normativo | **Modelo de Cadena de Delegación y Atestación** — Modelo formal para delegación encadenada: definición matemática del espacio de delegación, restricción de no escalada de privilegios, regla de revocación transitiva (revocar un padre revoca todos los descendientes) y el formato de atestación para pasos de delegación. Requerido en el nivel de conformidad L1. |

---

### 3B. Operaciones — Ejecución, Ledger y Flujos de Datos

Maquinaria de tiempo de ejecución: cómo se autorizan, ejecutan, registran, consultan y transmiten las acciones.

| Especificación | Versión | Estado | Responsabilidad |
|----------------|---------|--------|----------------|
| **ACP-EXEC-1.0** | 1.0 | 🔧 Borrador | **Execution Token** — Artefacto de un solo uso que prueba que una acción fue autorizada por ACP y puede ejecutarse exactamente una vez. Define la estructura del ET, ciclo de vida (ISSUED → CONSUMED / EXPIRED), emisión por el nodo ACP y validación por el sistema destino. Los sistemas destino solo necesitan la clave pública institucional y esta especificación — no necesitan el protocolo ACP completo. |
| **ACP-LEDGER-1.2** | 1.2 | ✅ Estable | **Ledger de Auditoría** — Almacén de eventos de solo adición con encadenamiento hash. Define 14 tipos de evento (LEDGER_GENESIS, AUTHORIZATION, RISK_EVALUATION, REVOCATION, TOKEN_ISSUED, EXECUTION_TOKEN_ISSUED, EXECUTION_TOKEN_CONSUMED, AGENT_REGISTERED, AGENT_STATE_CHANGE, ESCALATION_CREATED, ESCALATION_RESOLVED, LIABILITY_RECORD, POLICY_SNAPSHOT_CREATED, REPUTATION_UPDATED), el mecanismo de encadenamiento hash SHA-256, el formato de sobre de evento (ver, event_id, event_type, sequence, timestamp, institution_id, prev_hash, payload, sig) y la detección de corrupción. La primitiva central de auditabilidad del protocolo. |
| **ACP-LIA-1.0** | 1.0 | ✅ Estable | **Trazabilidad de Responsabilidad** — Para cada Execution Token consumido, emite un evento `LIABILITY_RECORD` que materializa la cadena de delegación completa y la parte responsable asignada (`liability_assignee`). Garantiza que reguladores y auditores puedan identificar de forma determinista quién porta la responsabilidad legal por cualquier acción del agente. |
| **ACP-PSN-1.0** | 1.0 | ✅ Estable | **Instantánea de Política** — Resuelve el problema de "deriva de política": crea instantáneas inmutables y firmadas de la política de riesgo activa en un momento en el tiempo. Garantiza que la política exacta que gobernó una decisión pasada pueda reconstruirse en tiempo de auditoría, incluso si la política ha cambiado desde entonces. |
| **ACP-HIST-1.0** | 1.0 | 🔧 Borrador | **API de Consulta de Historial** — Capa de consulta sobre el Ledger ACP. Endpoints filtrados y paginados para acceso programático al ledger. Define el formato `ExportBundle`: una colección portátil, firmada y auto-verificable de eventos del ledger para compartir segmentos de pista de auditoría entre instituciones sin requerir acceso API en tiempo real. |
| **ACP-API-1.0** | 1.0 | 🔧 Borrador | **API HTTP** — Especificación completa de la API HTTP: todos los endpoints, esquemas de solicitud/respuesta, códigos de estado, contratos de error, autenticación (HTTPS + TLS 1.2+) y comportamiento ante condiciones anómalas. La superficie de integración para implementaciones de nodo ACP. |
| **ACP-RISK-1.0** | 1.0 | 🔧 Borrador | **Modelo de Riesgo Determinista** — Define la función de evaluación de riesgo `Risk(agente, capacidad, recurso, contexto, historial) → [0, 100]`. Cuatro factores: riesgo base de capacidad, reputación del agente, sensibilidad del recurso, modificador de contexto. Umbrales de decisión: PERMIT / PERMIT_WITH_MONITOR / ESCALATE / DENY. Todas las evaluaciones son deterministas y auditables mediante el evento de ledger `RISK_EVALUATION`. |
| **ACP-DISC-1.0** | 1.0 | 🔧 Borrador | **Descubrimiento de Agentes** — Registro de capacidades públicas de adhesión voluntaria que permite a las instituciones encontrar agentes por sus capacidades anunciadas sin conocer el `agent_id` de antemano. Desacoplado del sistema de concesión de capacidades (ACP-CT-1.0): anunciar una capacidad no la concede. |
| **ACP-BULK-1.0** | 1.0 | 🔧 Borrador | **Operaciones en Masa** — Autorización por lotes (hasta 100 solicitudes por llamada) y consulta de responsabilidad en masa para despliegues de alto rendimiento (plataformas de pago, sistemas de trading, orquestadores multi-tenant). Reduce la latencia acumulada de llamadas HTTP individuales. |
| **ACP-NOTIFY-1.0** | 1.0 | 🔧 Borrador | **Notificaciones Push / Webhooks** — Entrega push en tiempo real de eventos del ledger a sistemas externos (paneles de control, sistemas de auditoría, agentes secundarios, integraciones de terceros) mediante webhooks HTTP. Elimina la necesidad de sondeo activo del ledger. |
| **ACP-PAY-1.0** | 1.0 | 🔧 Borrador | **Extensión de Pagos** — Vincula la autorización basada en capacidades con la liquidación económica verificable. Integra la prueba de liquidación dentro del modelo de capacidades sin modificar el core de ACP. Registra el evento `PAYMENT_VERIFIED` en el ledger de auditoría. Nivel de conformidad L2+. |
| **ACP-PSN-EXPORT.md** | 1.0 | 🔧 Borrador | **Exportación entre Instituciones de Instantánea de Política** — Extiende ACP-PSN-1.0 con un formato de exportación firmado y verificable para compartir Instantáneas de Política entre instituciones federadas. Garantiza la autenticidad (del origen declarado) e integridad (sin modificar en tránsito) de los estados de política exportados. |
| **ACP-CROSS-ORG-1.0** *(nuevo)* | 1.0 | 📐 Normativo | **Registro de Interacciones entre Organizaciones** — Define `CROSS_ORG_INTERACTION` como un tipo de evento de ledger de primera clase, cerrando el problema de pista de auditoría asimétrica: antes de esta especificación, las acciones inter-institucionales solo se registraban en la institución de origen. Esta especificación garantiza que cada cruce de frontera de confianza quede registrado en ambos ledgers mediante el protocolo de transmisión bilateral CrossOrgBundle. Añade 8 ActionTypes, 6 reglas de emisión, un procedimiento de validación en destino de 7 pasos, el acuse de recibo CrossOrgAck y extensiones de consulta inter-org sobre HIST-1.0. Conformidad L4. |

---

### 3C. Seguridad — Federación de Identidad, Reputación y Revocación

Confianza inter-institucional, reputación de agentes y gestión del ciclo de vida de tokens.

| Especificación | Versión | Estado | Responsabilidad |
|----------------|---------|--------|----------------|
| **ACP-ITA-1.0** | 1.0 | 🔧 Borrador | **Anchor de Confianza Institucional (Centralizado)** — Define cómo se registran las instituciones en ACP. La Root Institutional Key (RIK) es el par de claves Ed25519 almacenado en HSM de la institución. La Authority Root Key (ARK) es la clave de firma para artefactos operacionales. Establece cómo los verificadores externos resuelven las claves institucionales — la base para la confianza inter-institucional. Modelo A (centralizado): autoridad ITA única. |
| **ACP-ITA-1.1** | 1.1 | 🔧 Borrador | **Federación entre Autoridades** — Extiende ITA-1.0 con el Modelo B Federado: múltiples autoridades ITA operadas de forma independiente que se reconocen mutuamente mediante `FederationRecord`s firmados bilateralmente. Habilita la verificación entre autoridades sin un punto único de confianza. Define FederationRegistry (público), resolución entre autoridades (1 salto, no transitiva), propagación de revocación y quórum BFT (n ≥ 3f+1) para el consenso entre autoridades. |
| **ACP-RISK-1.0** | 1.0 | 🔧 Borrador | *(véase 3B — también listado en Operaciones por su rol en la ruta de ejecución)* |
| **ACP-REV-1.0** | 1.0 | 🔧 Borrador | **Protocolo de Revocación** — Define mecanismos de revocación para Capability Tokens y agentes (evento de ledger REVOCATION). Especifica el protocolo de consulta de estado, comportamiento fuera de línea (falla cerrada por defecto) y revocación transitiva: revocar un token en una cadena de delegación invalida todos los tokens descendientes derivados de él. |
| **ACP-REP-1.1** | 1.1 | ⚠️ Obsoleto | **Extensión de Reputación (supersedida)** — Modelo de reputación original. Define el modelo de puntuación, la máquina de estados del agente, la taxonomía de eventos y la API de consulta. Mantenido como referencia histórica. **Las nuevas implementaciones deben usar ACP-REP-1.2.** |
| **ACP-REP-1.2** | 1.2 | ✅ Estable | **Capa de Reputación y Confianza** — Supersede REP-1.1 con tres adiciones: (1) `ExternalReputationScore (ERS)` — puntuación inter-institucional portátil derivada de eventos LEDGER-1.2; (2) Arranque de Confianza Dual — los nuevos agentes inicializan ERS desde una atestación institucional firmada (techo ERS ≤ 0.195); (3) Decaimiento de Reputación — degradación temporal por inactividad. Fórmula compuesta: `0.6·ITS + 0.4·ERS`. Compatible con REP-1.1. AGS L7. |
| **ACP-REP-PORTABILITY-1.0** *(nuevo)* | 1.0 | 📐 Normativo | **Portabilidad de Reputación** — Implementa ACP-REP-1.1 §12.1. Define el protocolo bilateral para transportar la reputación de un agente desde su institución de origen a una institución destino. Emite una `ReputationAttestation` firmada (techo de puntuación: 0.85) con requisitos mínimos de elegibilidad (`event_count ≥ 10`, `ITS ≥ 0.50`). La institución destino calcula el ERS inicial usando una fórmula de descuento: `puntuación × (1 - 1/(1 + refs/10)) × 0.85`. No transitiva: las atestaciones no pueden ser re-atestadas hacia adelante. Dos nuevos tipos de evento de ledger: `REPUTATION_ATTESTATION_ISSUED`, `REPUTATION_ATTESTATION_RECEIVED`. Conformidad L4. |

---

### 3D. Gobernanza — Conformidad y Proceso RFC

Marco de conformidad y proceso de evolución del protocolo.

| Especificación | Versión | Estado | Responsabilidad |
|----------------|---------|--------|----------------|
| **ACP-CONF-1.0** | 1.0 | ⚠️ Obsoleto | **Conformidad v1.0** — Marco de conformidad original de 3 niveles (L1–L3). Supersedido por ACP-CONF-1.1. Mantenido como referencia histórica de ACP v1.0. |
| **ACP-CONF-1.1** | 1.1 | 📐 Normativo | **Conformidad v1.1** — Marco de conformidad acumulativa de 5 niveles: **L1-CORE** (SIGN, CT, HP, AGENT, MESSAGES, DCMA) → **L2-SECURITY** (RISK, REV, ITA-1.1, REP-1.2) → **L3-OPERATIONS** (EXEC, LEDGER-1.2, LIA, API) → **L4-FEDERATION** (federación ITA-1.1, CROSS-ORG, REP-PORTABILITY) → **L5-DECENTRALIZED** (ACP-D). Cada nivel incluye todos los niveles inferiores. Reemplaza el modelo de perfiles de v1.0. |
| **ACR-1.0** | 1.0 | 🔧 Borrador | **ACP Compliance Runner** — Especificación de herramienta de línea de comandos para ejecutar suites de prueba ACP-TS-1.1 contra una implementación. Permite la verificación automatizada de conformidad e integración CI/CD. |
| `RFC-PROCESS.md` | — | Activo | Define cómo las especificaciones ACP se proponen, revisan, ratifican y se vuelven obsoletas a través del proceso RFC. Reglas de gobernanza para la evolución del protocolo. |
| `RFC-REGISTRY.md` | — | Activo | Lista canónica de todos los RFCs activos, aceptados, diferidos y retirados. |

---

### 3E. Cumplimiento — Pruebas, Certificación y Protocolo IUT

Maquinaria operacional para verificar y certificar la conformidad.

| Especificación | Versión | Estado | Responsabilidad |
|----------------|---------|--------|----------------|
| **ACP-TS-1.0** | 1.0 | ⚠️ Supersedido | Formato original de suite de pruebas. Reemplazado por ACP-TS-1.1. |
| **ACP-TS-1.1** | 1.1 | 📐 Normativo | **Formato de Vectores de Prueba** — Formato normativo para vectores de prueba de cumplimiento ACP. Determinista, reproducible, independiente del lenguaje. Todos los casos de prueba de conformidad deben expresarse en este formato. Requerido para la certificación. |
| **ACP-IUT-PROTOCOL-1.0** | 1.0 | 📐 Normativo | **Protocolo de Comunicación IUT** — Define cómo el Compliance Runner (ACR-1.0) se comunica con una Implementación Bajo Prueba: canales STDIN/STDOUT/STDERR, formato JSON UTF-8, un objeto JSON por ejecución. Permite pruebas independientes del runner para cualquier implementación ACP. |
| **ACP-CERT-1.0** | 1.0 | 🔧 Borrador | **Certificación** — Proceso para publicar conformidad verificable: el implementador ejecuta el runner oficial, genera `report.json`, lo envía a la Autoridad de Certificación ACP, se verifica la reproducibilidad y se emite el certificado firmado. Define el formato del identificador de certificación y la gobernanza. |

---

### 3F. Descentralizado — ACP-D (Objetivo v2.0)

Extensión de ACP a entornos descentralizados sin emisor central. No está en la ruta de conformidad v1.x.

| Especificación | Versión | Estado | Responsabilidad |
|----------------|---------|--------|----------------|
| **ACP-D-Specification.md** | — | 🔬 Propuesto | **ACP Descentralizado** — Elimina el emisor ITA central reemplazándolo con: Decentralized Identifiers (DIDs), Verifiable Credentials (VCs) y tokens de capacidad criptográficamente derivados que pueden verificarse sin consultar una autoridad central. Modelo de Capacidad Auto-Soberana. Nivel de conformidad objetivo: L5-DECENTRALIZED en ACP-CONF-1.1. Diseño v2.0. |
| `Architecture-Without-Central-Issuer.md` | — | 🔬 Propuesto | Análisis de diseño para ACP sin emisor. Modelo de amenazas, arranque de confianza y cambios de protocolo requeridos para la descentralización. |

---

## Capa 4 — Análisis Formal

Modelos de seguridad matemáticos. No son especificaciones — son pruebas y análisis adversariales.

| Archivo | Responsabilidad |
|---------|----------------|
| `Formal-Security-Model.md` / `v2` | Modelo de seguridad formal: modelo adversarial, propiedades de seguridad como predicados matemáticos, invariantes de seguridad. |
| `Security-Reduction-EUF-CMA.md` | Reducción EUF-CMA (Infalsificabilidad Existencial bajo Ataque de Mensaje Elegido) para ACP-SIGN-1.0. Prueba que romper la integridad del token ACP requiere romper Ed25519. |
| `Adversarial-Analysis.md` | Análisis adversarial sistemático: clases de ataque, mitigaciones, riesgos residuales. |
| `Threat-Model.md` | Taxonomía de actores de amenaza, superficies de ataque y límites de seguridad. |
| `Formal-Decision-Engine-MFMD.md` | Modelo formal del motor de decisión Multi-Factor Multi-Domain que sustenta ACP-RISK-1.0. |
| `Systemic-Hardening.md` | Medidas de defensa en profundidad para despliegues en producción. |
| `Security-Mathematical-Model.md` | Formalización matemática de las propiedades de seguridad del protocolo. |
| `Logical-Architectural-View.md` | Arquitectura lógica como sistema formal. |

---

## Capa 5 — Implementación

| Directorio | Responsabilidad |
|------------|----------------|
| `05-implementation/` | MVP criptográfico, arquitectura mínima requerida y prototipo Python. Guía de implementación derivada de las especificaciones formales. |
| `07-reference-implementation/acp-go/` | Implementación de referencia en Go. Paquetes: `ledger`, `reputation`, `token`, `risk`, `sign`. Traducción ejecutable autoritativa de las especificaciones core. |
| `07-reference-implementation/sdk/python/` | SDK Python. Biblioteca cliente para interactuar con un nodo ACP. |
| `07-reference-implementation/sdk/typescript/` | SDK TypeScript. Biblioteca cliente para entornos de navegador y Node.js. |

---

## Capa 6 — Publicaciones

| Archivo | Responsabilidad |
|---------|----------------|
| `ACP-Whitepaper-v1.0.md` | Whitepaper de nivel ejecutivo: motivación, visión general de la arquitectura, casos de uso. |
| `ACP-Technical-Academic.md` | Artículo técnico académico. Tratamiento formal del protocolo para revisión por pares. |
| `IEEE-NDSS-ACP-1.0.md` | Envío al congreso IEEE NDSS. |

---

## Grafo de Dependencias (abreviado)

```
ACP-CONF-1.1
├── L1-CORE
│   ├── ACP-SIGN-1.0          ← base criptográfica
│   ├── ACP-CT-1.0            ← tokens de capacidad
│   ├── ACP-CAP-REG-1.0       ← espacio de nombres de capacidades
│   ├── ACP-HP-1.0            ← prueba de posesión
│   ├── ACP-MESSAGES-1.0      ← formato de cable
│   ├── ACP-AGENT-1.0         ← modelo de datos del agente
│   └── ACP-DCMA-1.0          ← cadenas de delegación
│
├── L2-SECURITY
│   ├── ACP-RISK-1.0          ← evaluación de riesgo
│   ├── ACP-REV-1.0           ← revocación de token/agente
│   ├── ACP-ITA-1.0/1.1       ← anchors de confianza institucionales
│   └── ACP-REP-1.2           ← reputación y confianza
│       └── (supersede ACP-REP-1.1)
│
├── L3-OPERATIONS
│   ├── ACP-EXEC-1.0          ← tokens de ejecución
│   ├── ACP-LEDGER-1.2        ← ledger de auditoría (14 tipos de evento)
│   │   ├── ACP-LIA-1.0       ← registros de responsabilidad
│   │   ├── ACP-PSN-1.0       ← instantáneas de política
│   │   └── ACP-HIST-1.0      ← capa de consulta + ExportBundle
│   └── ACP-API-1.0           ← API HTTP
│
├── L4-FEDERATION
│   ├── ACP-CROSS-ORG-1.0     ← registro de interacciones inter-org [NUEVO]
│   └── ACP-REP-PORTABILITY-1.0 ← portabilidad de reputación [NUEVO]
│
└── L5-DECENTRALIZED
    └── ACP-D                 ← DID + VC + capacidad auto-soberana [v2.0]

Extensiones (cualquier nivel):
├── ACP-BULK-1.0              ← operaciones en masa
├── ACP-DISC-1.0              ← descubrimiento de agentes
├── ACP-NOTIFY-1.0            ← webhooks
├── ACP-PAY-1.0               ← liquidación de pagos
└── ACP-PSN-EXPORT.md         ← exportación inter-org de instantánea de política
```

---

## Recuento de Módulos

| Grupo | Cantidad |
|-------|----------|
| L1 Arquitectura Soberana | 3 |
| L2 Modelo GAT | 4 |
| L3A Core | 7 |
| L3B Operaciones | 11 |
| L3C Seguridad | 6 |
| L3D Gobernanza | 4 |
| L3E Cumplimiento | 4 |
| L3F Descentralizado | 2 |
| L4 Análisis Formal | 8 |
| L5 Implementación | 3 |
| L6 Publicaciones | 4 |
| **Total** | **56** |
