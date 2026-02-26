# Changelog — ACP (Agent Control Protocol)

All notable changes to the ACP specification are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Reference implementation (at minimum L1 compliance)

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

[Unreleased]: https://github.com/traslaia/acp-protocol/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/traslaia/acp-protocol/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/traslaia/acp-protocol/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/traslaia/acp-protocol/releases/tag/v1.0.0
