# ACP-PAY-1.0
## Payment Extension — Extensión de Pago Verificable

**Status:** Draft
**Version:** 1.0
**Type:** Protocol Extension
**Depends-on:** ACP-CT-1.0, ACP-EXEC-1.0, ACP-LEDGER-1.2
**Conformance-level:** L2+ (requiere ACP-EXEC-1.0 y ACP-LEDGER-1.2)
**Related:** ACP-AGS-1.0 (L6 — Economic Layer)

---

## Abstract

ACP-PAY-1.0 define un mecanismo para vincular autorización basada en capacidades con liquidación económica verificable. Integra prueba de pago dentro del modelo de capability sin modificar el núcleo ACP, y registra el evento `PAYMENT_VERIFIED` en el ledger de auditoría.

---

## 1. Introduction

Algunos recursos requieren pago verificable antes de conceder acceso. ACP-PAY integra prueba de liquidación dentro del modelo de capability sin modificar el núcleo ACP.

Un agente que desee acceder a un recurso protegido por pago debe:
1. Obtener una capability con `payment_condition` embebida
2. Efectuar la liquidación en el mecanismo de pago correspondiente
3. Adjuntar `settlement_proof` al token de capability
4. Presentar el `ACP-PAY-Token` al Resource Server
5. El Resource Server emite el evento `PAYMENT_VERIFIED` en ACP-LEDGER-1.2

---

## 2. Terminology

Interpretación conforme a IETF RFC 2119 (MUST, SHOULD, MAY, MUST NOT).

| Término | Definición |
|---|---|
| `payment_condition` | Condición económica embebida en una capability |
| `settlement_proof` | Evidencia criptográfica de liquidación exitosa |
| `proof_id` | Identificador único del settlement_proof |
| `ACP-PAY-Token` | Token de capability extendido con condición de pago |
| `Resource Server` | Servidor que valida capabilities y pruebas de pago |

---

## 3. Extended Capability Format

### 3.1 payment_condition

```json
{
  "amount": "<decimal>",
  "currency": "<ISO-4217 | crypto-ticker>",
  "settlement_proof": "<ProofReference>",
  "expiration": "<ISO-8601 timestamp>"
}
```

### 3.2 ACP-PAY-Token

```json
{
  "capability_claim": {
    "capability_id": "<CapabilityID>",
    "holder": "<AgentID>",
    "issuer": "<AgentID>",
    "resource": "<URI>",
    "action": "<action>",
    "constraints": {}
  },
  "payment_condition": {
    "amount": "100.00",
    "currency": "USD",
    "settlement_proof": "<proof_id>",
    "expiration": "2025-12-31T23:59:59Z"
  },
  "proof": "<JWS-signature>",
  "multi_signature": ["<sig1>", "<sig2>"]
}
```

La presencia de `payment_condition` indica que el acceso al recurso está condicionado a liquidación verificable.

---

## 4. Settlement Proof

### 4.1 Requisitos

`settlement_proof` MUST demostrar:
- Transferencia válida al destinatario correcto
- Ausencia de doble gasto
- Confirmación suficiente según el mecanismo de pago

### 4.2 Tipos soportados

| Tipo | Descripción |
|---|---|
| `on-chain` | Prueba en blockchain pública o permisionada |
| `off-chain-channel` | Prueba de canal de pago Lightning/similar |
| `corporate-ledger` | Registro firmado en ledger corporativo |

ACP-PAY no impone red específica. El Resource Server MUST soportar al menos un tipo.

### 4.3 Estructura del settlement_proof

```json
{
  "proof_id": "<UUID>",
  "type": "on-chain | off-chain-channel | corporate-ledger",
  "amount": "100.00",
  "currency": "USD",
  "recipient": "<AgentID | wallet-address>",
  "timestamp": "<ISO-8601>",
  "confirmation_data": "<type-specific>",
  "signature": "<JWS>"
}
```

---

## 5. API Endpoints

### 5.1 POST /acp/v1/payment/verify

Verifica un `ACP-PAY-Token` y emite el evento `PAYMENT_VERIFIED` en el ledger si la verificación es exitosa.

**Request:**
```http
POST /acp/v1/payment/verify
Content-Type: application/json
Authorization: Bearer <token>

{
  "pay_token": {
    "capability_claim": { ... },
    "payment_condition": {
      "amount": "100.00",
      "currency": "USD",
      "settlement_proof": "proof_9f4a2b1c",
      "expiration": "2025-12-31T23:59:59Z"
    },
    "proof": "<JWS>",
    "multi_signature": []
  }
}
```

**Response 200 OK:**
```json
{
  "status": "verified",
  "proof_id": "proof_9f4a2b1c",
  "ledger_event_id": "evt_abc123",
  "verified_at": "2025-06-15T10:30:00Z"
}
```

**Response errores:** ver §6.

### 5.2 GET /acp/v1/payment/{proof_id}

Recupera el estado y metadatos de un settlement_proof previamente verificado.

**Request:**
```http
GET /acp/v1/payment/proof_9f4a2b1c
Authorization: Bearer <token>
```

**Response 200 OK:**
```json
{
  "proof_id": "proof_9f4a2b1c",
  "status": "verified | pending | rejected | expired",
  "type": "on-chain",
  "amount": "100.00",
  "currency": "USD",
  "recipient": "agent:org.example/payment-receiver",
  "timestamp": "2025-06-15T10:29:55Z",
  "verified_at": "2025-06-15T10:30:00Z",
  "ledger_event_id": "evt_abc123",
  "expiration": "2025-12-31T23:59:59Z"
}
```

**Response 404:** proof_id no encontrado.

---

## 6. Error Codes

| Código | HTTP | Descripción |
|---|---|---|
| `PAY-001` | 400 | `payment_condition` malformado o campos faltantes |
| `PAY-002` | 402 | Settlement proof inválido o no verificable |
| `PAY-003` | 402 | Monto insuficiente (amount < requerido) |
| `PAY-004` | 410 | Payment condition expirado (`expiration` en el pasado) |
| `PAY-005` | 409 | Double-spend detectado: proof_id ya utilizado |
| `PAY-006` | 503 | Sistema de verificación de pago no disponible |

**Formato de error:**
```json
{
  "error": "PAY-003",
  "message": "Payment amount 50.00 USD is below required 100.00 USD",
  "required_amount": "100.00",
  "provided_amount": "50.00",
  "currency": "USD"
}
```

---

## 7. Verification Requirements

Un Resource Server MUST:
1. Verificar la capability base (ACP-CT-1.0 §4)
2. Verificar `settlement_proof` contra el mecanismo declarado
3. Confirmar `amount` ≥ monto mínimo requerido por el recurso
4. Confirmar que `expiration` no ha pasado
5. Verificar ausencia de double-spend (proof_id no reutilizado)
6. Emitir evento `PAYMENT_VERIFIED` en ACP-LEDGER-1.2 (§8)

---

## 8. LEDGER-1.2 Integration

### 8.1 Nuevo evento: PAYMENT_VERIFIED

Tras verificación exitosa, el Resource Server MUST registrar:

```json
{
  "event_id": "<UUID>",
  "event_type": "PAYMENT_VERIFIED",
  "timestamp": "<ISO-8601>",
  "agent_id": "<AgentID>",
  "institution_id": "<InstitutionID>",
  "proof_id": "proof_9f4a2b1c",
  "amount": "100.00",
  "currency": "USD",
  "resource": "<URI>",
  "capability_id": "<CapabilityID>",
  "prev_hash": "<SHA-256 del evento anterior>",
  "signature": "<JWS del Resource Server>"
}
```

### 8.2 Cadena de auditoría

El evento `PAYMENT_VERIFIED` se encadena en el ledger hash-chained de ACP-LEDGER-1.2. El campo `prev_hash` MUST corresponder al hash del último evento registrado por la misma institución.

---

## 9. Conformance

### 9.1 Nivel mínimo requerido

ACP-PAY-1.0 requiere **Conformance Level L2+**:
- L1: ACP-CT-1.0 (Capability Token)
- L2: ACP-EXEC-1.0 (Execution Token)
- L2+PAY: ACP-PAY-1.0 (este documento) + ACP-LEDGER-1.2

### 9.2 Declaración de conformance

Una implementación conforme MUST declarar:
```
Conforms-to: ACP-PAY-1.0
Conformance-level: L2+
Settlement-types: [on-chain | off-chain-channel | corporate-ledger]
```

### 9.3 Requisitos obligatorios

| Requisito | MUST / SHOULD |
|---|---|
| Verificar capability base antes de payment | MUST |
| Rechazar proof_id reutilizados | MUST |
| Rechazar tokens con expiration pasada | MUST |
| Emitir PAYMENT_VERIFIED en LEDGER-1.2 | MUST |
| Soportar al menos un tipo de settlement | MUST |
| Retornar error PAY-00x según fallo específico | MUST |
| Soportar GET /acp/v1/payment/{proof_id} | MUST |

---

## 10. Security Considerations

### 10.1 Amenazas mitigadas

| Amenaza | Mitigación |
|---|---|
| Acceso sin pago | Verificación obligatoria pre-acceso (§7) |
| Reutilización de prueba caducada | Validación de `expiration` (PAY-004) |
| Manipulación de monto | Verificación amount ≥ requerido (PAY-003) |
| Double-spend | Detección por proof_id único (PAY-005) |
| Falsificación de proof | Firma JWS del Resource Server en LEDGER-1.2 |

### 10.2 Dependencias de seguridad

El sistema hereda la seguridad del ledger subyacente utilizado para `settlement_proof`. Implementaciones SHOULD utilizar mecanismos de confirmación irreversibles cuando el monto supere umbrales definidos por la institución.

---

## 11. IANA Considerations

Ninguna en esta versión.

---

## 12. Normative References

- RFC 2119 — Key words for use in RFCs (IETF)
- ACP-CT-1.0 — Capability Token
- ACP-EXEC-1.0 — Execution Token
- ACP-LEDGER-1.2 — Hash-chained Audit Ledger
- ACP-AGS-1.0 — Agent Governance Stack (L6 Economic Layer)
