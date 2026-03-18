# Changelog — ACP (Agent Control Protocol)

Todos los cambios notables a la especificación ACP se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
El versionado sigue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.12.0] — 2026-03-17

### Agregado
- `compliance/test-vectors/TS-PROV-*` — 9 nuevos vectores de conformidad para ACP-PROVENANCE-1.0: TS-PROV-POS-001 (cadena 2-hop válida), TS-PROV-POS-002 (autorización institucional directa), TS-PROV-NEG-001..007 (códigos PROV-001/002/003/004/005/007/009). Firmas Ed25519 reales sobre SHA-256(JCS). **Total: 51 vectores** (8 CORE + 4 DCMA + 10 HP + 11 LEDGER + 9 EXEC + 9 PROV)
- `impl/go/cmd/gen-prov-vectors/main.go` — generador de vectores TS-PROV-* usando clave de prueba RFC 8037 A
- `paper/arxiv/` — fuente LaTeX (`main.tex`), bibliografía (`references.bib`), guía de submission (`SUBMIT.md`) para arXiv cs.CR + cs.AI

### Corregido
- Circularidad en grafo de dependencias (S-3): `ACP-DCMA-1.0` — removido `ACP-LEDGER-1.2` de Depends-on; `ACP-LEDGER-1.3` — removidos `ACP-LIA-1.0` y `ACP-PSN-1.0` de Depends-on; `ACP-EXEC-1.0` — removido `ACP-API-1.0` de Depends-on. El grafo de dependencias es ahora acíclico y resolvible.

### Modificado
- `README.md` — fila de cobertura de vectores actualizada: CORE · DCMA · HP · LEDGER · EXEC · PROV; 42→51 vectores; badge DOI actualizado a `10.5281/zenodo.19077019`
- `paper/draft/ACP-Whitepaper-v1.0.md` — actualizado a v1.12: 42→51 vectores, cobertura PROV añadida
- `paper/arxiv/main.tex` — 42→51 vectores en todas las tablas

---

## [1.11.0] — 2026-03-16

### Agregado

#### Especificación
- `spec/gobernanza/ACP-CONF-1.2.md` — especificación normativa de conformidad que supersede CONF-1.1. Corrige L1 (añade AGENT-1.0, DCMA-1.0, MESSAGES-1.0), L3 (añade PROVENANCE-1.0, POLICY-CTX-1.0, PSN-1.0), L4 (añade GOV-EVENTS-1.0, LIA-1.0, HIST-1.0, NOTIFY-1.0, DISC-1.0, BULK-1.0, CROSS-ORG-1.0, REP-PORTABILITY-1.0; actualiza REP-1.1→1.2, LEDGER-1.2→1.3). Apéndice A: mapeo desde CONF-1.1. Apéndice B: perfiles obsoletos.
- `spec/operaciones/ACP-LEDGER-1.3.md` — supersede LEDGER-1.2. `sig` es MUST normativo en todos los eventos de producción. Código de error LEDGER-012 para firma ausente. Elimina ambigüedad dev-mode del §4.4.
- `archive/specs/` — specs supersedidas movidas aquí con encabezados Superseded: ACP-CONF-1.0, ACP-CONF-1.1, ACP-LEDGER-1.2, ACP-REP-1.1, ACP-AGENT-SPEC-0.3. `archive/specs/README.md` creado.
- `openapi/acp-api-1.0.yaml` — OpenAPI 3.1.0 para todos los endpoints de ACP-API-1.0 (12 endpoints). Seguridad: ACPAgent (header Authorization) + ACPPoP (header X-ACP-PoP). Esquemas completos y respuestas de error reutilizables.
- `ARCHITECTURE.md` — modelo de dominio formal: 8 conceptos, stack de gobernanza de 8 capas, grafo de dependencias dirigido (ASCII), ciclo de vida de ejecución de 10 pasos, 7 propiedades formales.

#### Compliance — Vectores de prueba (42 total)
- `TS-HP-POS-001/002`, `TS-HP-NEG-001..008` — 10 vectores para ACP-HP-1.0 (códigos HP-004/006/007/008/009/010/011/014). Firmas Ed25519 reales.
- `TS-LEDGER-POS-001..003`, `TS-LEDGER-NEG-001..008` — 11 vectores para ACP-LEDGER-1.3 (LEDGER-002/003/004/005/006/008/010/012). Cadenas hash SHA-256, firmas Ed25519 reales.
- `TS-EXEC-POS-001/002`, `TS-EXEC-NEG-001..007` — 9 vectores para ACP-EXEC-1.0 (EXEC-001..007). Tokens de ejecución Ed25519 reales.
- `impl/go/cmd/gen-ledger-vectors/main.go` — generador de vectores LEDGER
- `impl/go/cmd/gen-exec-vectors/main.go` — generador de vectores EXEC

#### Implementación de Referencia — Go (23 paquetes)
- `impl/go/pkg/provenance/` — ACP-PROVENANCE-1.0: `Issue()`, `VerifySig()`, `ValidateChain()`. Centinelas PROV-001..009.
- `impl/go/pkg/policyctx/` — ACP-POLICY-CTX-1.0: `Capture()`, `VerifySig()`, `VerifyPolicyHash()`. Centinelas PCTX-001..008.
- `impl/go/pkg/govevents/` — ACP-GOV-EVENTS-1.0: `Emit()`, `InMemoryEventStream` con `List(QueryFilter)`. 10 tipos de payload normativos. Centinelas GEVE-001..007.
- `impl/go/pkg/lia/` — ACP-LIA-1.0: `Emit()` con resolución de asignatario §6 (3 reglas). Centinelas LIA-001..008.
- `impl/go/pkg/hist/` — ACP-HIST-1.0: `Query()` con filtrado completo + paginación cursor, `Export()` (ExportBundle firmado). Centinelas HIST-001..007.
- `impl/go/pkg/notify/` — ACP-NOTIFY-1.0: `Subscribe()`, `BuildPayload()` firmado, rotación de secreto. Centinelas NOTI-001..005.
- `impl/go/pkg/disc/` — ACP-DISC-1.0: `Register()` con TTL, `Query(QueryFilter)` con awareness de expiración. Centinelas DISC-001..004.
- `impl/go/pkg/bulk/` — ACP-BULK-1.0: `ValidateBatchRequest()` (máx. 100), `ValidateLiabilityQuery()` (máx. 1000). Centinelas BULK-001..005.
- `impl/go/pkg/crossorg/` — ACP-CROSS-ORG-1.0: `VerifyBundle()`, `SignBundle()`, `BuildAck()`, `VerifyAck()`. Centinelas CROSS-001..010.
- `impl/go/pkg/pay/` — ACP-PAY-1.0: `VerifyToken()` con detección de doble gasto por ProofID. Centinelas PAY-001..006+010.
- `impl/go/pkg/psn/` — ACP-PSN-1.0: `Create()`, `Transition()` atómico, `VerifySig()`. Centinelas PSN-001..007.

#### Python SDK e Integraciones
- `impl/python/examples/admission_control_demo.py` — patrón `ACPAdmissionGuard`, modos offline + online, 4 escenarios.
- `impl/python/examples/langchain_agent_demo.py` — decorador `@acp_tool()` para LangChain. 5 escenarios. Flag `--with-llm` para agente ReAct.
- `impl/python/examples/pydantic_ai_demo.py` — `ACPAdmissionGuard` como `deps` de Pydantic AI. DENIED/ESCALATED → `ModelRetry`.
- `impl/python/examples/mcp_server_demo.py` — `ACPToolDispatcher`: admission check ACP en capa de dispatch MCP. Compatible con FastMCP.
- `impl/python/README.md` — README del SDK (faltaba; causaba fallo de `pip install -e .`).

#### Documentación
- `docs/admission-flow.md` — guía completa del flujo admission check: 6 pasos, códigos de error, DCMA, cross-org, tabla L1–L4, ejemplos Go + Python.
- `paper/draft/ACP-Whitepaper-v1.0.md` — actualizado a v1.11: §1.2 framing admission control, §8 reescrito (36 specs, 23 paquetes Go, 51 vectores).
- `Makefile` — targets `make run`, `make test`, `make docker-build`.
- `.env.example` — configuración de entorno de referencia.

### Modificado
- `README.md` — reescrito: tagline "Control de admisión para acciones de agentes"; sección "ACP como Admission Control" con flujo de 6 pasos; tabla comparativa ACP vs OPA/IAM/OAuth2/SPIFFE; hoja de ruta actualizada.
- `QUICKSTART.md` — reescrito: estructura de repo correcta; Docker zero-setup; demo Python; path `impl/go` corregido.

---

## [1.10.0] — 2026-03-11

### Agregado

#### Reestructura del Repositorio
- Nueva estructura de directorios: `spec/nucleo/`, `spec/seguridad/`, `spec/operaciones/`, `spec/gobernanza/`, `spec/descentralizado/`; `impl/go/`, `impl/python/`, `impl/rust/`, `impl/typescript/`; `compliance/test-vectors/`; `paper/draft/`, `paper/figures/`; `openapi/`; `docs/`
- `archive/specs/` — placeholder para especificaciones supersedidas

#### Especificaciones de la Capa de Evidencia
- `spec/nucleo/ACP-PROVENANCE-1.0.md` — Provenance de Autoridad: artefacto estructurado que demuestra retrospectivamente el origen de la autoridad en el momento de ejecución.
- `spec/operaciones/ACP-POLICY-CTX-1.0.md` — Instantánea de Contexto de Política: captura firmada del estado exacto de las políticas activas al momento de la acción.
- `spec/gobernanza/ACP-GOV-EVENTS-1.0.md` — Stream de Eventos de Gobernanza: taxonomía formal de 10 tipos de eventos institucionales.

#### Documentación
- `ARCHITECTURE.md` — modelo de dominio formal: 8 conceptos (Actor, Agente `A=(ID,C,P,D,L,S)`, Institución, Autoridad, Interacción, Attestation, Historia, Reputación), stack de gobernanza de 8 capas, grafo de dependencias dirigido, ciclo de vida de ejecución de 10 pasos, 7 propiedades formales.
- `docs/architecture-overview.md` — Agent Governance Stack, posicionamiento de ACP, descripción de capas.
- `docs/quickstart.md` — niveles de conformidad, punteros a specs, rutas de implementación.
- `docs/faq.md` — qué es ACP, relación con MIR/ARAF, provenance vs delegación, variante descentralizada.

---

## [1.9.0] — 2026-03-09

### Added

#### ACP-HIST-1.0 — History Query API
- `GET /acp/v1/audit/query` — consulta filtrada y paginada del ledger (event_type, agent_id, institution_id, capability, resource, decision, from_ts, to_ts, from_seq, to_seq, cursor, limit, verify_chain)
- `GET /acp/v1/audit/events/{event_id}` — lookup de evento individual con verificación hash + sig
- `GET /acp/v1/audit/agents/{agent_id}/history` — historial consolidado de agente con summary calculado
- `POST /acp/v1/audit/export` — ExportBundle firmado y auto-verificable para compartir audit trail cross-institucional
- Cursor-based pagination con expiración de 24h
- Modelo de autorización por rol: SYSTEM / SUPERVISOR / AGENT / EXTERNAL_AUDITOR
- Soporte de `verify_chain` on-demand; campo `chain_valid` en todas las respuestas
- Cobertura de eventos archivados (cold storage 90d–7y) con header `X-ACP-Archive-Latency-Seconds`
- Errores HIST-E001..HIST-E032

#### ACP-ITA-1.1 — Inter-Authority Federation
- FederationRecord: acuerdo bilateral firmado con doble sig (ARK_A + ARK_B)
- Protocolo de establecimiento de 3 fases (propuesta OOB → firma bilateral → activación)
- `GET /ita/v1/federation` — lista de federaciones activas de la autoridad
- `GET /ita/v1/federation/{federation_id}` — FederationRecord completo con ambas firmas
- `GET /ita/v1/federation/resolve/{institution_id}` — resolución cross-authority de institución
- `POST /ita/v1/revocation-notify` — propagación de revocaciones a peers federados
- Algoritmo de resolución cross-authority (9 pasos, sin confiar en ITA remota directamente)
- Federación no transitiva (max 1 hop directo)
- Terminación de federación: mutua e unilateral con período de gracia de 7 días
- Integración con ACP-REP-1.2: eventos cross-institutional requieren verificación via §8 para peso 1.0 en ERS
- Errores ITA-F001..ITA-F016

---


---

## [1.8.0] — 2026-03-09

### Agregado — ACP-REP-1.2 (Reputation & Trust Layer)

- **`03-protocolo-acp/especificacion/seguridad/ACP-REP-1.2.md`** — Especificación completa que supersede ACP-REP-1.1. Cierra L7 del Agent Governance Stack (ACP-AGS-1.0)
  - **ExternalReputationScore (ERS):** score formal calculado desde eventos `REPUTATION_UPDATED` del ACP-LEDGER-1.1 via weighted moving average ponderado por contexto e inactividad
  - **Dual Trust Model:** formalización ITS (InternalTrustScore, institucional privado) vs ERS (ExternalReputationScore, ecosistema externo portable)
  - **Dual Trust Bootstrap:** TrustAttestation firmada por institución; `bootstrap_value = internal_score · discount_factor`; techo efectivo 0.195 para prevenir inflación artificial
  - **Reputation Decay:** degradación exponencial del ERS ante inactividad; grace period 90d, half-life 180d, floor 0.10; no aplica al ITS
  - **Nuevo endpoint `GET /acp/v1/rep/{agent_id}/score`:** consulta rápida para hot path; devuelve `composite_score = 0.6·ITS + 0.4·ERS`; rate limit 120 rpm
  - **Nuevo endpoint `POST /acp/v1/rep/{agent_id}/bootstrap`:** emisión de TrustAttestation institucional con validaciones completas
  - **Interface `ReputationStore` extendida:** 6 nuevos métodos para gestión ERS y attestations
  - **`ReputationConfig` extendida:** 10 nuevos parámetros (ERS, decay, composite weights, bootstrap)
  - **Errores REP-E008 a REP-E015** — 8 nuevos códigos de error
  - **Integración ACP-RISK-1.0:** mapping composite_score → reputational_risk_modifier
  - **Integración ACP-LEDGER-1.1:** consumo por `evaluation_context`; eventos de decay auditables

---

## [1.6.0] — 2026-03-06

### Corregido — Go Reference Server

- **`handleTokensIssue`**: reemplaza STUB 501 con implementación completa de delegación de Capability Token (firma Ed25519, ledger `TOKEN_ISSUED`, HTTP 201) — per ACP-CT-1.0
- **`handleAuditQuery`**: agrega filtros completos `event_type`, `agent_id`, `time_range`, `from_sequence`, `to_sequence`, `limit`, `offset` con filtrado in-memory y paginación — per ACP-LEDGER-1.0 §6
- **`handleRevRevoke`**: agrega campos `revoke_descendants` (bool) y `sig` (string) al request — per ACP-REV-1.0
- **`handleRepState`**: renombra campo `state` → `new_state` en request body — per ACP-REP-1.1 §7

### Corregido/Agregado — Python SDK v1.6.0

- **`client.py`**: reescritura completa — 18 métodos alineados a spec (era 13 con nombres incorrectos)
  - Nuevos métodos: `tokens_issue()`, `agent_register()`, `agent_get()`, `agent_state()`, `escalation_resolve()`
  - Corregidos: `reputation_state()` usa `new_state`, `revoke()` agrega `revoke_descendants` + `sig`, `audit_query()` todos los filtros spec
- **`tests/test_client.py`**: cobertura completa — 62 tests cubriendo los 18 métodos (era 5 clases de test)
- **`pyproject.toml`**: versión `1.3.0` → `1.6.0`

### Verificado

- `go build ./cmd/acp-server/...` — sin errores
- `pytest` — 123/123 tests pasando

---

## [1.4.0] — 2026-03-04

### Agregado — TypeScript SDK
- **`sdk/typescript/src/identity.ts`** — Clase `AgentIdentity`: método estático `generate()` (par de claves Ed25519 via libsodium), `agentId` (base58-SHA-256 según ACP-SIGN-1.0), `did` (formato did:key:z6Mk...)
- **`sdk/typescript/src/signer.ts`** — Clase `ACPSigner`: `signCapability()` (Ed25519 sobre SHA-256(JCS(cap))), `signPoP()` (binding `Method|Path|Challenge|base64url(SHA-256(body))` según ACP-HP-1.0)
- **`sdk/typescript/src/client.ts`** — Clase `ACPClient`: `register()`, `verify()`, `health()` con transporte de headers ACP-HP-1.0 correcto (`Authorization: Bearer`, `X-ACP-Agent-ID`, `X-ACP-Challenge`, `X-ACP-Signature`)
- **`sdk/typescript/tests/`** — 68 tests pasando: suite identity (formato AgentID, formato DID, par de claves), suite signer (firma capability, binding PoP), suite client (flujos register/verify/health)

### Agregado — Rust SDK
- **`sdk/rust/src/identity.rs`** — Struct `AgentIdentity`: `generate()` (ed25519-dalek), `agent_id()` (base58-SHA-256 según ACP-SIGN-1.0), `did()` (formato did:key:z6Mk...)
- **`sdk/rust/src/signer.rs`** — Struct `ACPSigner`: `sign_capability()` (Ed25519 sobre SHA-256(JCS(cap))), `sign_pop()` (binding PoP ACP-HP-1.0)
- **`sdk/rust/src/client.rs`** — Struct `ACPClient`: métodos async `register()`, `verify()`, `health()` via reqwest
- **`sdk/rust/tests/`** — 43 tests pasando: suites de test identity/signer/client
- **`sdk/rust/Cargo.toml`** — dependencias: ed25519-dalek, sha2, bs58, serde_json, reqwest, tokio

### Agregado — Docker CI/CD
- **`.github/workflows/docker.yml`** — Build y push automático de imagen Docker en merge a main; multi-plataforma (linux/amd64, linux/arm64); imágenes etiquetadas `chelof100/acp-go:{version}` y `chelof100/acp-go:latest`

---

## [1.3.0] — 2026-03-02

### Corregido — Python SDK (reconciliado con Go server v1.0)
- **`sdk/python/acp/identity.py`** — Formato AgentID corregido: era `"acp:agent:"+base64url(SHA-256(pk))`, ahora `base58(SHA-256(pk))` igualando Go `DeriveAgentID()`
- **`sdk/python/acp/signer.py`** — Campo de firma en capability token: era anidado `capability["proof"]["signature"]` (estilo W3C VC), ahora plano `capability["sig"]` según ACP-CT-1.0
- **`sdk/python/acp/client.py`** — Transporte HTTP para `/acp/v1/verify`: era cuerpo JSON, ahora headers HTTP (`Authorization: Bearer`, `X-ACP-Agent-ID`, `X-ACP-Challenge`, `X-ACP-Signature`); binding PoP corregido a `Method|Path|Challenge|base64url(SHA-256(body))` según ACP-HP-1.0; método `register()` añadido
- **`sdk/python/examples/agent_payment.py`** — Campos del token alineados con struct Go `CapabilityToken`; paso register añadido; demo PoP offline usa binding corregido; flag `--print-pubkey` para flujo de configuración del servidor

### Agregado — Implementación de Referencia (IUT + Runner)
- **`pkg/iut`** — Paquete IUT central: `Evaluate()` (lógica L1/L2), `SignCapability()` (Ed25519 sobre SHA-256(JCS(cap))), `resolveDIDKey()` (did:key: → clave pública Ed25519), `checkDelegation()` (reglas DCMA-1.0)
- **`cmd/acp-evaluate`** — Binario IUT conforme ACP-IUT-PROTOCOL-1.0: lee TestVector de STDIN, escribe Response en STDOUT; flag `--manifest`
- **`cmd/acp-runner`** — Compliance runner ACR-1.0: carga suite de tests, ejecuta IUT por vector, comparación estricta, genera `RunReport` + certificación automática `CertRecord`; flags `--impl --suite --level --layer --strict --performance`; 12/12 PASS → `CONFORMANT`
- **`cmd/acp-sign-vectors`** — Herramienta para reemplazar firmas PLACEHOLDER en archivos de vectores con firmas Ed25519 reales usando clave de prueba RFC 8037 A
- **`pkg/iut/evaluator_test.go`** — `TestCompliance`: carga los 12 vectores ACP-TS-1.1, firma PLACEHOLDERs en memoria, verifica decisión + error_code (12/12 PASS)
- **`go.sum`** — Checksums de dependencias (jcs v1.0.1, base58 v1.2.0)
- **`03-protocolo-acp/test-vectors/*.json`** — Firmas Ed25519 reales generadas via `acp-sign-vectors` (clave de prueba RFC 8037 A, seed `9d61b19d…`)

---

## [1.2.0] — 2026

### Added — Compliance Ecosystem
- **ACP-CONF-1.1** (`03-protocolo-acp/especificacion/gobernanza/`) — Conformance specification with 5 cumulative levels L1–L5; replaces the 4-profile model from v1.0 (Core, Extended, Governance, Full); adds L3 (API+EXEC+LEDGER) and L5 (ACP-D+BFT) previously absent; token format uses `conformance_level` instead of `profile`
- **ACP-TS-SCHEMA-1.0** (`03-protocolo-acp/cumplimiento/`) — JSON Schema (Draft 2020-12) for test vector validation
- **ACP-TS-1.0** (`03-protocolo-acp/cumplimiento/`) — Test Suite specification: required test cases per conformance level L1–L5
- **ACP-TS-1.1** (`03-protocolo-acp/cumplimiento/`) — Normative JSON format for test vectors — deterministic, language-agnostic, uses `context.current_time` instead of system time
- **ACP-IUT-PROTOCOL-1.0** (`03-protocolo-acp/cumplimiento/`) — Contract between compliance runner and Implementation Under Test (STDIN/STDOUT, 2000ms timeout, deterministic manifest)
- **ACR-1.0** (`03-protocolo-acp/cumplimiento/`) — Official Compliance Runner — executes test vectors and emits signed certification records
- **ACP-CERT-1.0** (`03-protocolo-acp/cumplimiento/`) — Public Certification System — badge format `ACP-CERT-YYYY-NNNN`, reproducible, cryptographically signed
- **03-protocolo-acp/cumplimiento/** directory — full compliance and certification pipeline

### Added — Core Specification
- **ACP-DCMA-1.0** (`03-protocolo-acp/especificacion/nucleo/`) — Multi-agent chained delegation with non-escalation guarantee and transitive revocation; formal predicate `HasCapability'(aⱼ,c)`
- **ACP-AGENT-SPEC-0.3** (`03-protocolo-acp/especificacion/nucleo/`) — Formal agent ontology `A=(ID,C,P,D,L,S)` and agent lifecycle definition
- **ACP-MESSAGES-1.0** (`03-protocolo-acp/especificacion/nucleo/`) — Protocol wire format: 5 message types (Registration, ActionRequest, AuthorizationDecision, StateChange, AuditQuery)

### Added — Security and Formal Models
- **Formal-Security-Model-v2** (`04-analisis-formal/`) — Updated formal security model with proofs covering all 5 layers
- **Motor-Decision-Formal-MFMD** (`04-analisis-formal/`) — Formal decision engine model (MFMD)

### Added — Vision
- **Estructura-Final-Documentacion** (`02-modelo-gat/`) — Canonical documentation structure map

### Added — Test Vectors
- **`03-protocolo-acp/test-vectors/`** — 12 normative JSON test vectors conforming to ACP-TS-1.1 format, covering:
  - `TS-CORE-POS-001/002` — valid capability (canonical, multi-action)
  - `TS-CORE-NEG-001` — expired token (`EXPIRED`)
  - `TS-CORE-NEG-002` — missing expiry (`MALFORMED_INPUT`)
  - `TS-CORE-NEG-003` — missing nonce (`MALFORMED_INPUT`)
  - `TS-CORE-NEG-004` — invalid signature (`INVALID_SIGNATURE`)
  - `TS-CORE-NEG-005` — revoked token jti (`REVOKED`)
  - `TS-CORE-NEG-006` — untrusted issuer (`UNTRUSTED_ISSUER`)
  - `TS-DCMA-POS-001` — valid single-hop delegation chain
  - `TS-DCMA-NEG-001` — privilege escalation attempt (`ACCESS_DENIED`)
  - `TS-DCMA-NEG-002` — revoked delegator transitive revocation (`REVOKED`)
  - `TS-DCMA-NEG-003` — delegation depth exceeded institutional max_depth (`DELEGATION_DEPTH`)
- **`test-vectors/README.md`** — test key pair documentation, PLACEHOLDER signature convention, coverage table

### Changed — Core Specification
- **ACP-DCMA-1.0 §14** added: Revocación Transitiva — Timing Normativo — τ_propagation ≤ 60 seconds, cache TTL ≤ 30 seconds, in-flight re-evaluation requirement, atomicity guarantee

### Fixed
- **ACP-CERT-1.0** — certification authority renamed to "ACP-CA" (neutral placeholder); §7 Gobernanza rewritten with explicit decentralization intent: target model is multi-sig (n-of-m) for v2.x and BFT on-chain quorum for ACP-D (L5); no single entity controls certification issuance; `"issuer"` field updated to `"ACP-CA"`
- **ACR-1.0** — signing attribution updated to "ACP Certification Authority (entidad de gobernanza a definir por la comunidad)"
- **README.md Roadmap** — IEEE S&P / NDSS paper correctly labeled as "Draft en preparación" (was misleadingly labeled "Submission")

### Added — Repository Infrastructure
- `LICENSE` — Apache 2.0 (copyright 2026 Marcelo Fernandez, TraslaIA)
- `SECURITY.md` — Vulnerability reporting policy with 90-day coordinated disclosure
- `CONTRIBUTING.md` — RFC formal numbered process (ACP-RFC-NNN) for normative changes; PR process for non-normative changes
- `CHANGELOG.md` — This file
- `QUICKSTART.md` — 4 reader paths (understand / implement / evaluate / contribute), conformance levels table, documentation map
- `.github/RFC-TEMPLATE.md` — Full RFC lifecycle template (Draft→Review→Last Call→Accepted/Rejected) with Security Analysis section

---

## [1.1.0] — 2026

### Added — Economic and Reputation Layers
- **ACP-PAY-1.0** (`03-protocolo-acp/especificacion/nucleo/`) — Economic binding layer (Layer 4): payment commitments, escrow, settlement
- **ACP-REP-1.1** (`03-protocolo-acp/especificacion/nucleo/`) — Adaptive security layer (Layer 5): reputation scoring, dynamic capability adjustment
- **ACP-ITA-1.1** (`03-protocolo-acp/especificacion/nucleo/`) — Updated Byzantine Fault Tolerant consensus; quorum rules `n ≥ 3f+1`, threshold `t ≥ 2f+1`

### Added — Architecture
- **ACP-Architecture-Specification** (`02-modelo-gat/`) — Unified 3-level / 5-layer architecture specification
- **Arquitectura-Tres-Capas** (`02-modelo-gat/`) — Strategic 3-level framework (Sovereign AI / GAT Model / ACP Protocol)

### Added — Academic
- **IEEE-NDSS-Paper-Structure** (`06-publicaciones/`) — Draft paper structure for academic publication

### Changed
- Consolidated Layer 3 (ACP-D) and centralized consensus into unified architecture
- Conformance specification updated to cover Layers 4 and 5

---

## [1.0.0] — 2026

### Added — Core Specification (10 normative documents)
- **ACP-SIGN-1.0** — Cryptographic signature scheme: Ed25519, JCS canonicalization, nonce handling
- **ACP-CT-1.0** — Capability Token format: structure, claims, issuer binding, expiry
- **ACP-CAP-REG-1.0** — Capability Registry: registration, lookup, versioning
- **ACP-HP-1.0** — Hardened Policy: policy enforcement layer
- **ACP-RISK-1.0** — Risk scoring model: dynamic threat assessment
- **ACP-REV-1.0** — Revocation protocol: token invalidation, propagation
- **ACP-ITA-1.0** — Institutional Trust Anchor: centralized issuer model
- **ACP-API-1.0** — REST API specification: endpoints, authentication, error codes
- **ACP-EXEC-1.0** — Execution protocol: action request lifecycle, anti-replay
- **ACP-LEDGER-1.0** — Audit ledger: append-only log, tamper-evidence

### Added — Decentralized Variant
- **ACP-D-Especificacion** (`03-protocolo-acp/especificacion/descentralizado/`) — ACP-D: DID + VC + Self-Sovereign Capability
- **Arquitectura-Sin-Issuer-Central** (`03-protocolo-acp/especificacion/descentralizado/`) — Decentralized architecture without central issuer

### Added — Vision and Analysis
- Strategic vision documents (`02-modelo-gat/`)
- GAT model specifications (`01-Modelo-GAT/`)
- Use cases (`02-Casos-de-Uso/`)
- Security analysis (`04-analisis-formal/`)
- Reference implementations guidance (`05-Implementaciones-de-Referencia/`)
- Adoption framework (`06-Adopción/`)

---

[1.12.0]: https://github.com/chelof100/acp-framework/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/chelof100/acp-framework/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/chelof100/acp-framework/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/chelof100/acp-framework/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/chelof100/acp-framework/compare/v1.6.0...v1.8.0
[1.6.0]: https://github.com/chelof100/acp-framework/compare/v1.4.0...v1.6.0
[1.4.0]: https://github.com/chelof100/acp-framework/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/chelof100/acp-framework/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/chelof100/acp-framework/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/chelof100/acp-framework/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/chelof100/acp-framework/releases/tag/v1.0.0
