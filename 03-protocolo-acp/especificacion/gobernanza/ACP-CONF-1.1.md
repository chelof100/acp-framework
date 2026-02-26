ACP Conformance Specification

Version: 1.1
Status: Standards Track
Updated: 2026-02-25 (corrective revision — profile model replaced by level model)

---

1. Scope

Este documento define los requisitos de conformidad para implementaciones del protocolo ACP (Agent Control Protocol) versión 1.1.

Establece:

- Niveles de conformidad cumulativos
- Requisitos mínimos obligatorios por nivel
- Reglas de interoperabilidad
- Criterios de validación

Una implementación MUST declarar explícitamente el nivel de conformidad que soporta.

---

2. Terminología

Las palabras MUST, MUST NOT, REQUIRED, SHALL, SHOULD, SHOULD NOT y MAY se interpretan conforme a IETF RFC 2119.

---

3. Modelo de Niveles

ACP 1.1 define cinco niveles de conformidad cumulativos:

| Nivel | Nombre        | Capas requeridas                         |
|-------|---------------|------------------------------------------|
| L1    | CORE          | SIGN + CT + CAP-REG + HP                 |
| L2    | SECURITY      | L1 + RISK + REV + ITA-1.0               |
| L3    | FULL          | L2 + API + EXEC + LEDGER                 |
| L4    | EXTENDED      | L3 + PAY + REP + ITA-1.1                 |
| L5    | DECENTRALIZED | L4 + ACP-D + ITA-1.1 BFT                 |

Los niveles son cumulativos. Una implementación que declara nivel Lk MUST satisfacer todos los requisitos de niveles Li donde i ≤ k.

Una implementación MAY soportar múltiples niveles, pero MUST declarar el nivel máximo que soporta.

---

4. L1 — CORE (Obligatorio para toda implementación ACP)

Una implementación conforme a L1 MUST:

4.1 Identity Layer

- Soportar identificadores únicos (DID o equivalente)
- Validar identidad del Subject antes de emisión

4.2 Capability Structure

Cada token MUST contener:

- header
- claim
- signature

El claim MUST incluir:

- sub
- resource
- action_set
- exp
- jti (unique identifier)
- nonce (mínimo 128 bits aleatorios)

4.3 Firma

- La firma MUST ser verificable criptográficamente.
- El algoritmo MUST ser Ed25519 o equivalente de seguridad ≥ 128 bits.
- La firma MUST cubrir header + claim completos.

4.4 Expiración

- Los tokens MUST tener expiración obligatoria.
- El verificador MUST rechazar tokens expirados.

4.5 Anti-Replay

El verificador MUST:

- Validar nonce
- Detectar reuse de jti o nonce dentro del período de validez

4.6 Revocación Básica

Una implementación L1 MUST soportar al menos uno:

- Lista de revocación firmada
- Base de datos de tokens revocados

El verificador MUST consultar estado de revocación antes de conceder acceso.

---

5. L2 — SECURITY (L1 + Trust Anchor + Risk + Revocation)

Una implementación conforme a L2 MUST cumplir L1 y además:

5.1 Trust Registry (ACP-ITA-1.0)

- Mantener registro de autoridades de confianza
- Registrar public_key por autoridad
- Registrar estado por autoridad: active / suspended / revoked

5.2 Admisión de Autoridades

Una nueva autoridad MUST requerir quorum definido por política institucional.

5.3 Rotación de Claves

La rotación MUST:

- Ser firmada por la clave anterior
- Ser registrada en el Trust Registry
- Ser verificable por cualquier verificador

5.4 Remoción de Autoridades

Una autoridad removida MUST:

- No poder emitir tokens válidos
- No ser aceptada en verificaciones posteriores

5.5 Risk Scoring (ACP-RISK-1.0)

- Calcular score de riesgo por solicitud de acción
- Bloquear acciones que superen el umbral de riesgo configurado

5.6 Revocación Avanzada (ACP-REV-1.0)

- Soportar revocación individual de tokens por jti
- Soportar revocación por emisor (revocar todos los tokens de una autoridad)

---

6. L3 — FULL (L2 + API + Execution + Ledger)

Una implementación conforme a L3 MUST cumplir L2 y además:

6.1 HTTP API (ACP-API-1.0)

- Exponer los endpoints definidos en ACP-API-1.0
- Autenticar todas las llamadas entrantes mediante Capability Token válido
- Devolver códigos de error normalizados conforme a ACP-API-1.0

6.2 Execution Tokens (ACP-EXEC-1.0)

- Emitir Execution Tokens de uso único con TTL ≤ 300s
- Invalidar un Execution Token inmediatamente tras su primer uso
- Rechazar reutilización de Execution Tokens

6.3 Audit Ledger (ACP-LEDGER-1.0)

- Mantener ledger append-only de todas las acciones ejecutadas
- Encadenar entradas mediante hash del registro anterior
- Garantizar tamper-evidence verificable

---

7. L4 — EXTENDED (L3 + Payment + Reputation + ITA-1.1)

Una implementación conforme a L4 MUST cumplir L3 y además:

7.1 Payment Extension (ACP-PAY-1.0)

Si payment_condition está presente en el token:

El verificador MUST:

- Validar settlement_proof
- Validar monto ≥ requerido
- Validar no expiración del pago

Una implementación MAY operar sin condición de pago si el recurso no lo requiere.

7.2 Reputation Extension (ACP-REP-1.1)

La implementación MUST:

- Mantener ReputationScore ∈ [0,1] por agente
- Actualizar reputación tras eventos verificables
- Permitir consulta de reputación en tiempo real

El cálculo de reputación MUST ser determinista.

7.3 BFT Trust Anchor (ACP-ITA-1.1)

La implementación MUST:

- Operar el Trust Anchor como quorum BFT con n ≥ 3f+1 nodos
- Requerir umbral t ≥ 2f+1 para decisiones de emisión
- Tolerar f nodos Byzantine sin comprometer la integridad del quorum

---

8. L5 — DECENTRALIZED (L4 + ACP-D)

Una implementación conforme a L5 MUST cumplir L4 y además satisfacer la especificación ACP-D definida en `../descentralizado/ACP-D-Especificacion.md`.

Esto incluye:

- Identidad basada en DIDs (sin issuer central)
- Verifiable Credentials para capabilities
- Consenso BFT distribuido sin punto de control único

---

9. Interoperabilidad

Para interoperar, dos implementaciones MUST:

- Declarar el mismo nivel mínimo de conformidad
- Soportar al menos un algoritmo común de firma
- Usar formato de serialización canónico acordado (JCS)

---

10. Versionado de Tokens

Cada token MUST incluir:

```json
{
  "ver": "1.1",
  "conformance_level": "L1|L2|L3|L4|L5"
}
```

Un verificador MUST rechazar tokens con versión no soportada.

Un verificador MUST rechazar tokens cuyo conformance_level declare capacidades no soportadas por el verificador.

---

11. Compliance Validation

Una implementación ACP conforme MUST:

- Pasar todos los test vectors oficiales del nivel declarado (ACP-TS-1.1)
- Rechazar todos los tokens inválidos definidos en la suite
- Producir firmas deterministas reproducibles

La certificación ACP requiere ejecución exitosa del compliance runner oficial (ACR-1.0) para el nivel declarado.

---

12. Non-Conformance

Una implementación NO es conforme si:

- Omite expiración de tokens
- Omite nonce
- Permite tokens sin firma válida
- Ignora revocación
- No declara nivel de conformidad soportado
- Declara un nivel sin satisfacer todos los requisitos de los niveles inferiores

---

13. Security Considerations

La conformidad NO garantiza seguridad si:

- Claves privadas están comprometidas
- Revocación no se actualiza con propagación oportuna
- Nonce no se verifica correctamente
- El quorum BFT (L4/L5) opera con menos nodos de los requeridos

---

14. Implementation Claim Format

Una implementación conforme SHOULD declarar:

```
ACP Implementation:
  Version: 1.1
  Conformance-Level: L3
  Algorithms: Ed25519, SHA-256
  Compliance-Suite: Passed ACP-TS-1.1
```

---

Apéndice A — Mapeo de Perfiles Anteriores (Informativo)

La versión 1.0 de esta especificación definía perfiles de conformidad. Dicho modelo queda reemplazado íntegramente por el modelo de niveles. La siguiente tabla es informativa y no debe usarse en declaraciones de certificación:

| Perfil (deprecado) | Nivel equivalente |
|--------------------|-------------------|
| Core               | L1                |
| Governance         | L2                |
| Extended           | L4                |
| Full v1.1          | L4                |
