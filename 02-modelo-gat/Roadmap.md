# ACP-ROADMAP
## Estado del Proyecto
**Version:** 1.0
**Last updated:** 2026-02-23

---

## Estado General

La especificación técnica ACP v1.0 está completa. Los 10 documentos están finalizados y son consistentes entre sí.

```
ACP-SIGN-1.0     ✅  Core — serialización y firma
ACP-CT-1.0       ✅  Core — capability tokens
ACP-CAP-REG-1.0  ✅  Core — registro de capacidades
ACP-HP-1.0       ✅  Core — prueba de posesión stateless
ACP-RISK-1.0     ✅  Security — modelo de riesgo determinístico
ACP-REV-1.0      ✅  Security — protocolo de revocación
ACP-ITA-1.0      ✅  Security — institutional trust anchor
ACP-API-1.0      ✅  Operations — HTTP API formal
ACP-EXEC-1.0     ✅  Operations — execution tokens
ACP-LEDGER-1.0   ✅  Operations — audit ledger
ACP-CONF-1.0     ✅  Governance — conformidad
```

---

## Cambios Aplicados en Cierre v1.0

### ACP-API-1.0 — Hallazgos de revisión de consistencia

Todos los hallazgos identificados en la revisión cruzada fueron aplicados:

- **§2.3** — Agregado `X-ACP-PoP` como header obligatorio en endpoints autenticados (ACP-HP-1.0)
- **§2.3** — `POST /acp/v1/handshake/challenge` declarado como endpoint sin autenticación
- **§5 /authorize paso 2.5** — Autonomy_level 0 → DENIED inmediato AUTH-008
- **§5 /authorize paso 6** — Validación de nonce anti-replay con ventana 5 minutos
- **§10 condiciones anómalas** — Capacidad core desconocida → 403 CAP-002; extended desconocida → ESCALATED
- **§10** — Rev endpoint offline aplica ACP-REV-1.0 §5 sin excepciones
- **§12** — Agregados códigos HP-004, HP-007, HP-009, HP-010, HP-014
- **§12** — Agregados AUTH-007 (nonce replay), AUTH-008 (autonomy_level 0)
- **§13 conformidad** — Requisito de verificación de X-ACP-PoP

### ACP-HP-1.0 — Reescritura completa

El documento legacy ACP-HP fue reescrito para:
- Adoptar modelo stateless (sin sesiones, sin session_id)
- Referenciar ACP-SIGN-1.0 para serialización de PoP
- Definir binding explícito: challenge + method + path + body hash
- Definir challenge registry con reglas de gestión precisas
- Definir códigos de error HP-001 a HP-015
- Integrar con ACP-API-1.0 §15

### ACP-CONF-1.0

- ACP-HP-1.0 incorporado en Nivel 1 CORE
- Sección de requisitos L1-HP-001 a L1-HP-009 agregada
- Tabla resumen actualizada
- Declaración de Conformidad actualizada

---

## Trabajo Pendiente v1.1

Los siguientes ítems fueron identificados durante el desarrollo de v1.0 y se reservan para la siguiente versión menor:

### ACP-REP-1.1 — Módulo de Reputación
Campo `trust_score` reservado en `GET /acp/v1/agents/{agent_id}`. En v1.0 el servidor retorna null. ACP-REP-1.1 definirá el cálculo y actualización del score.

### ACP-ITA-1.1 — Reconocimiento Mutuo entre Autoridades
El Modelo B (federado) de ACP-ITA-1.0 §11 está definido en interfaz pero el protocolo de reconocimiento mutuo entre autoridades ITA no está especificado. Requerido para despliegues B2B multi-autoridad.

### Integración de pagos
ACP gobierna la autorización de `acp:cap:financial.payment`. El mecanismo de pago efectivo es responsabilidad de la capa de aplicación. Documentar la interfaz de integración recomendada.

---

## Trabajo Pendiente v2.0

- Evaluación de migración de Ed25519 a algoritmos post-cuánticos
- Modelo de confianza federado completo
- Protocolo de negociación de versión entre implementaciones

---

## Documentos de Referencia en 05-Reference

Los siguientes documentos del proyecto original se mantienen como referencia histórica. No son conformes con v1.0 y no deben usarse como especificación.

| Archivo | Nota |
|---------|------|
| ACP-LEGACY-HP.md | Reemplazado por ACP-HP-1.0 |
| ACP-LEGACY-DCMA.md | Parcialmente incorporado en ACP-CT-1.0 §7 |
| ACP-LEGACY-THREAT.md | Base conceptual para ACP-RISK-1.0 |
| ACP-LEGACY-MFMD.md | Fundamento matemático de ACP-RISK-1.0 |
| ACP-LEGACY-MATH.md | Fundamento criptográfico de ACP-SIGN-1.0 |
| ACP-LEGACY-AGENT-v03.md | Precursor de ACP-CT-1.0 |
| ACP-LEGACY-MESSAGES.md | Incorporado en ACP-API-1.0 |
| ACP-LEGACY-AMO.md | Marco estructural superado |
| ACP-LEGACY-PME.md | Base para implementación futura |
