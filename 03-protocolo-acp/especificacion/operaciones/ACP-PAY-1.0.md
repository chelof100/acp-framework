Adaptive Capability Protocol — Payment Extension
Internet-Draft

Status: Experimental

Abstract

ACP-PAY-1.0 define un mecanismo para vincular autorización basada en capacidades con liquidación económica verificable.

1. Introduction

Algunos recursos requieren pago verificable antes de conceder acceso. ACP-PAY integra prueba de liquidación dentro del modelo de capability sin modificar el núcleo ACP.

2. Terminology

Interpretación conforme a IETF RFC 2119.

3. Extended Capability Format

Se añade:

payment_condition = {
    amount,
    currency,
    settlement_proof,
    expiration
}

La capability completa:

ACP-PAY-Token = {
    capability_claim,
    payment_condition,
    proof,
    multi_signature
}
4. Settlement Proof

settlement_proof MUST demostrar:

Transferencia válida

No doble gasto

Confirmación suficiente

Puede ser:

Prueba on-chain

Canal off-chain

Ledger corporativo firmado

ACP-PAY no impone red específica.

5. Verification Requirements

Un Resource Server MUST:

Verificar capability base

Verificar settlement_proof

Confirmar amount ≥ requerido

Confirmar no expiración del pago

6. Security Considerations

Mitiga:

Acceso sin pago

Reutilización de prueba caducada

Manipulación de monto

El sistema depende de la seguridad del ledger subyacente.

7. IANA Considerations

No aplica.

8. Normative References

RFC 2119

Digital Payment Verification literature