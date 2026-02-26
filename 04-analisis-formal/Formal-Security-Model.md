Abstract

We formalize the security properties of the Agent Control Protocol (ACP), a cryptographically verifiable capability-based authorization system for inter-agent environments. We define the system model, adversarial capabilities, token semantics, delegation invariants, and prove that ACP enforces non-escalation and authenticity under standard cryptographic assumptions. Security reduces to EUF-CMA security of Ed25519 and collision resistance of SHA-256.

1. Preliminaries
1.1 Notation

Let:

λ be the security parameter.

H: {0,1}* → {0,1}^256 be SHA-256.

Sign, Verify be Ed25519 signature algorithms.

PPT denote probabilistic polynomial time.

We assume Ed25519 is EUF-CMA secure and SHA-256 is collision-resistant and preimage-resistant.

2. System Model
2.1 Agents

Let A be a finite set of agents.

Each agent a ∈ A possesses:

(pk_a, sk_a) ← KeyGen(1^λ)

Agent identity is defined as:

AgentID_a = H(pk_a)

This binds identity to key material.

2.2 Resources and Operations

Let:

R be the set of resources.

O be the set of operations.

A capability is defined as a pair:

c = (o, r) ∈ O × R

2.3 Capability Token

A token τ is defined as:

τ = (hdr, body, σ)

Where:

hdr includes version

body includes fields:
(iss, sub, Cap, Res, iat, exp, nonce, deleg, parent, rev)

σ = Sign_sk_iss ( H(hdr || body) )

We define:

ValidSig(τ) = Verify_pk_iss (σ, H(hdr || body))

3. Authorization Semantics

Define authorization predicate:

Auth(τ, o, r, t_now) ∈ {0,1}

Auth returns 1 if and only if:

ValidSig(τ) = 1

iat ≤ t_now ≤ exp

o ∈ Cap

r ∈ Res

Delegation chain valid

Not revoked

4. Delegation Model

Define delegation chain:

τ₀ → τ₁ → … → τₙ

Where:

τᵢ.body.parent = H(τᵢ₋₁)

depth ≤ max_depth

Define:

Cap(τᵢ) ⊆ Cap(τᵢ₋₁)
Res(τᵢ) ⊆ Res(τᵢ₋₁)

This is enforced by verification rules.

5. Adversarial Model

We consider adversary 𝒜 with capabilities:

Intercept network traffic

Replay messages

Generate arbitrary tokens

Adaptively request signatures from honest agents (chosen-message attacks)

Corrupt a subset of agents

𝒜 does NOT break:

EUF-CMA security of Ed25519

Collision resistance of SHA-256

6. Security Definitions
6.1 Token Unforgeability

Definition:

ACP is unforgeable if no PPT adversary 𝒜 can produce a token τ such that:

ValidSig(τ) = 1

iss is honest and not corrupted

τ was never issued by iss

With non-negligible probability.

6.2 Non-Escalation of Privilege

Definition:

ACP enforces non-escalation if for any valid delegation chain:

τ₀ → … → τₙ

It holds that:

Cap(τₙ) ⊆ Cap(τ₀)
Res(τₙ) ⊆ Res(τ₀)

6.3 Authentic Proof of Possession

During handshake, subject must compute:

σ_ch = Sign_sk_sub(challenge)

Security definition:

No PPT adversary without sk_sub can produce valid σ_ch for fresh challenge with non-negligible probability.

7. Security Theorems
Theorem 1 — Unforgeability Reduction

If Ed25519 is EUF-CMA secure, then ACP tokens are unforgeable.

Proof Sketch

Assume adversary 𝒜 forges τ with ValidSig(τ)=1 for honest issuer.

Construct adversary 𝔅 that:

Uses 𝒜 as subroutine.

Simulates ACP environment.

When 𝒜 outputs forged τ, 𝔅 extracts signature σ over unseen message.

This contradicts EUF-CMA security.

Therefore forging ACP token implies forging Ed25519 signature.

QED.

Theorem 2 — Delegation Confinement

If verification enforces:

Cap_child ⊆ Cap_parent
Res_child ⊆ Res_parent

Then by induction over chain length n:

Cap(τₙ) ⊆ Cap(τ₀)

Proof

Base case:

n = 1
Cap(τ₁) ⊆ Cap(τ₀)

Inductive step:

Assume Cap(τᵢ) ⊆ Cap(τ₀)

Given Cap(τᵢ₊₁) ⊆ Cap(τᵢ)

Then by transitivity:

Cap(τᵢ₊₁) ⊆ Cap(τ₀)

Thus holds for all n.

QED.

Theorem 3 — Replay Resistance (Challenge Model)

If:

Challenge space ≥ 2^128

Challenges unique and time-bounded

Signature scheme secure

Then replay attack without sk_sub succeeds with negligible probability.

8. Corruption Analysis

If issuer private key is compromised:

All tokens signed by that key become forgeable.

ACP security reduces to key protection.

If subject private key is compromised:

Attacker can exercise but not expand capabilities.

Delegation confinement still holds.

9. Revocation Model

Revocation function Rev(τ) is external oracle.

Security guarantee holds provided:

Rev is correct and consistent.

Formal security is conditional on revocation oracle integrity.

10. Security Reduction Summary

ACP security reduces to:

EUF-CMA security of Ed25519

Collision resistance of SHA-256

Correct implementation

Secure key management

No additional cryptographic assumptions required.

11. Formal Security Statement

Under stated assumptions, ACP satisfies:

Existential unforgeability of tokens

Non-escalation of delegated privileges

Authentic proof of possession

Replay resistance under challenge freshness

Authorization correctness