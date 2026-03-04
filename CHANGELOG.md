# Changelog — ACP (Agent Control Protocol)

Todos los cambios notables a la especificación ACP se documentan en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
El versionado sigue [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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

[Unreleased]: https://github.com/chelof100/acp-framework/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/chelof100/acp-framework/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/chelof100/acp-framework/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/chelof100/acp-framework/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/chelof100/acp-framework/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/chelof100/acp-framework/releases/tag/v1.0.0
