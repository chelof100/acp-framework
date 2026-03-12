ACP Conformance Specification

Version: 1.2
Status: Standards Track
Updated: 2026-03-12
Supersedes: ACP-CONF-1.1
Depends-on: ACP-SIGN-1.0, ACP-CT-1.0, ACP-CAP-REG-1.0, ACP-HP-1.0,
            ACP-AGENT-1.0, ACP-DCMA-1.0, ACP-MESSAGES-1.0,
            ACP-RISK-1.0, ACP-REV-1.0, ACP-ITA-1.1,
            ACP-API-1.0, ACP-EXEC-1.0, ACP-LEDGER-1.3,
            ACP-PROVENANCE-1.0, ACP-POLICY-CTX-1.0, ACP-PSN-1.0,
            ACP-PAY-1.0, ACP-REP-1.2, ACP-REP-PORTABILITY-1.0,
            ACP-GOV-EVENTS-1.0, ACP-LIA-1.0, ACP-HIST-1.0,
            ACP-NOTIFY-1.0, ACP-DISC-1.0, ACP-BULK-1.0, ACP-CROSS-ORG-1.0,
            ACP-DCMA-1.0
Required-by: —

---

1. Alcance

Este documento define los requisitos de conformidad para implementaciones del
protocolo ACP (Agent Control Protocol) versión 1.2.

Establece:

- Niveles de conformidad cumulativos
- Requisitos mínimos obligatorios por nivel
- Reglas de interoperabilidad
- Criterios de validación

ACP-CONF-1.2 reemplaza a ACP-CONF-1.1. Restaura esta especificación como la
única fuente normativa para los requisitos por nivel, incorporando todas las
especificaciones de protocolo introducidas desde CONF-1.1 (especificaciones P4:
PROVENANCE, POLICY-CTX, PSN, GOV-EVENTS y las specs de gobernanza extendida de
L4). También corrige la definición de L1 (agrega AGENT, DCMA, MESSAGES), corrige
la referencia de reputación en L4 (REP-1.1 → REP-1.2) y actualiza la referencia
del ledger en L3 (LEDGER-1.2 → LEDGER-1.3).

Una implementación MUST declarar explícitamente el nivel de conformidad que
soporta.

---

2. Terminología

Las palabras MUST, MUST NOT, REQUIRED, SHALL, SHOULD, SHOULD NOT y MAY se
interpretan conforme a IETF RFC 2119.

---

3. Modelo de Niveles

ACP 1.2 define cinco niveles de conformidad cumulativos:

| Nivel | Nombre        | Capas requeridas                                                         |
|-------|---------------|--------------------------------------------------------------------------|
| L1    | CORE          | SIGN + CT + CAP-REG + HP + AGENT + DCMA + MESSAGES                      |
| L2    | SECURITY      | L1 + RISK + REV + ITA-1.0                                               |
| L3    | FULL          | L2 + API + EXEC + LEDGER + PROVENANCE + POLICY-CTX + PSN                |
| L4    | EXTENDED      | L3 + PAY + REP-1.2 + ITA-1.1 + GOV-EVENTS + LIA + HIST +               |
|       |               | NOTIFY + DISC + BULK + CROSS-ORG + REP-PORTABILITY                      |
| L5    | DECENTRALIZED | L4 + ACP-D + ITA-1.1 BFT                                                |

Los niveles son cumulativos. Una implementación que declara nivel Lk MUST
satisfacer todos los requisitos de niveles Li donde i ≤ k.

Una implementación MAY soportar múltiples niveles, pero MUST declarar el nivel
máximo que soporta.

---

4. L1 — CORE (Obligatorio para toda implementación ACP)

Una implementación conforme a L1 MUST satisfacer las secciones 4.1 a 4.9.

4.1 Capa de Identidad

- Soportar identificadores únicos (DID o equivalente)
- Validar identidad del Subject antes de emisión

4.2 Estructura de Capability

Cada token MUST contener:

- header
- claim
- signature

El claim MUST incluir:

- sub
- resource
- action_set
- exp
- jti (identificador único)
- nonce (mínimo 128 bits aleatorios)

4.3 Firma

- La firma MUST ser verificable criptográficamente.
- El algoritmo MUST ser Ed25519 o equivalente de seguridad ≥ 128 bits.
- La firma MUST cubrir el header + claim completos.

4.4 Expiración

- Los tokens MUST tener expiración obligatoria.
- El verificador MUST rechazar tokens expirados.

4.5 Anti-Replay

El verificador MUST:

- Validar nonce
- Detectar reutilización de jti o nonce dentro del período de validez

4.6 Revocación Básica

Una implementación L1 MUST soportar al menos uno de:

- Lista de revocación firmada
- Base de datos de tokens revocados

El verificador MUST consultar el estado de revocación antes de conceder acceso.

4.7 Registro de Agentes (ACP-AGENT-1.0)

- Cada agente MUST estar registrado en el Agent Registry antes de recibir
  Capability Tokens.
- El registro MUST producir un agent_id único.
- Los registros de agente MUST incluir: agent_id, public_key, status,
  created_at e issuing_authority.
- El verificador MUST validar que el agent_id existe y que su status es
  active antes de conceder acceso.
- Un token emitido a un agente no registrado o inactivo MUST ser rechazado.

4.8 Cadenas de Delegación (ACP-DCMA-1.0)

- Las cadenas de delegación MUST ser validadas de extremo a extremo antes
  de aceptar un token delegado.
- Cada eslabón de la cadena MUST estar firmado por la autoridad delegante.
- La profundidad de la cadena MUST NOT exceder el max_delegation_depth
  especificado en el token raíz.
- Las delegaciones circulares MUST ser detectadas y rechazadas.
- Un verificador MUST rechazar un token cuya cadena de delegación contenga
  un eslabón expirado, revocado o inválido.

4.9 Formato de Mensajes (ACP-MESSAGES-1.0)

- Todos los mensajes de protocolo MUST conformar con el esquema canónico
  definido en ACP-MESSAGES-1.0.
- El campo de versión del mensaje MUST ser validado antes del procesamiento.
- Las implementaciones MUST declarar si operan en modo estricto (campos
  desconocidos rechazados) o modo tolerante (campos desconocidos ignorados).
- Los mensajes que fallen la validación de esquema MUST ser rechazados con
  el código de error ACP-MESSAGES correspondiente.

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

6. L3 — FULL (L2 + API + Execution + Ledger + Provenance + Policy + PSN)

Una implementación conforme a L3 MUST cumplir L2 y además:

6.1 HTTP API (ACP-API-1.0)

- Exponer los endpoints definidos en ACP-API-1.0
- Autenticar todas las llamadas entrantes mediante Capability Token válido
- Devolver códigos de error normalizados conforme a ACP-API-1.0

6.2 Execution Tokens (ACP-EXEC-1.0)

- Emitir Execution Tokens de uso único con TTL ≤ 300s
- Invalidar un Execution Token inmediatamente tras su primer uso
- Rechazar reutilización de Execution Tokens

6.3 Audit Ledger (ACP-LEDGER-1.3)

- Mantener ledger append-only de todas las acciones ejecutadas
- Encadenar entradas mediante hash del registro anterior
- Garantizar tamper-evidence verificable
- Cada entrada del ledger MUST llevar firma institucional válida (sig MUST
  estar presente y no vacía; ver ACP-LEDGER-1.3 §4.4)

6.4 Provenance (ACP-PROVENANCE-1.0)

- Generar un artefacto de provenance firmado por cada acción ejecutada.
- Cada artefacto MUST incluir: action_id, agent_id, capability_token_jti,
  timestamp, resource e inputs_hash.
- Los artefactos MUST almacenarse en el audit ledger y ser recuperables
  por action_id.
- Un verificador MUST poder reconstruir la cadena de provenance completa
  para cualquier acción completada.

6.5 Contexto de Política (ACP-POLICY-CTX-1.0)

- Capturar un snapshot de política en el momento de cada decisión de
  autorización.
- El snapshot MUST incluir: policy_version, effective_date y el conjunto
  de reglas aplicables evaluadas para la decisión.
- El snapshot MUST estar vinculado al registro de autorización mediante el
  jti del token.
- Los snapshots de política MUST ser inmutables una vez creados.

6.6 Process-Session Node (ACP-PSN-1.0)

- Crear un registro PSN para cada sesión de ejecución.
- El PSN MUST incluir: session_id, agent_id, started_at y ledger_ref
  (hash del primer evento del ledger en la sesión).
- El PSN MUST ser finalizado con ended_at y final_ledger_ref al cierre
  de la sesión.
- Los registros PSN MUST almacenarse en el audit ledger y ser consultables
  por session_id.

---

7. L4 — EXTENDED (L3 + Payment + Reputation + Federation + Governance)

Una implementación conforme a L4 MUST cumplir L3 y además:

7.1 Payment Extension (ACP-PAY-1.0)

Si payment_condition está presente en el token:

El verificador MUST:

- Validar settlement_proof
- Validar monto ≥ requerido
- Validar no expiración del pago

Una implementación MAY operar sin condición de pago si el recurso no lo
requiere.

7.2 Reputation Extension (ACP-REP-1.2)

La implementación MUST:

- Mantener ReputationScore ∈ [0,1] por agente
- Actualizar reputación tras eventos verificables
- Permitir consulta de reputación en tiempo real

El cálculo de reputación MUST ser determinista.

7.3 Federation Trust (ACP-ITA-1.1)

La implementación MUST:

- Operar el Federation Trust Anchor según ACP-ITA-1.1
- Requerir umbral t ≥ 2f+1 para decisiones de emisión
- Tolerar f nodos Byzantine sin comprometer la integridad del quorum

7.4 Flujo de Eventos de Gobernanza (ACP-GOV-EVENTS-1.0)

La implementación MUST:

- Emitir un evento de gobernanza estructurado por cada decisión de
  autorización.
- Cada evento MUST incluir: event_id, timestamp, actor, action, resource,
  decision (granted / denied / escalated) y rationale_code.
- Los eventos MUST estar firmados por la clave institucional.
- Los eventos MUST ser consultables mediante la API de auditoría con
  filtros por actor, resource y rango de tiempo.

7.5 Rastreo de Responsabilidad (ACP-LIA-1.0)

La implementación MUST:

- Crear un registro de responsabilidad por cada acción ejecutada.
- Cada registro MUST referenciar el jti del Capability Token originador.
- Los registros de responsabilidad MUST ser inmutables una vez creados.
- Los registros MUST ser consultables por agent_id y por jti de token.

7.6 Historial de Auditoría (ACP-HIST-1.0)

La implementación MUST:

- Mantener historial de auditoría consultable por agente.
- El historial MUST ser append-only.
- La retención MUST ser ≥ 90 días, salvo que la política institucional
  requiera un período mayor.
- El historial MUST soportar paginación y consultas por rango de tiempo.

7.7 Notificaciones (ACP-NOTIFY-1.0)

La implementación MUST:

- Emitir notificaciones ante disparadores de eventos configurables (como
  mínimo: emisión de token, revocación y finalización de ejecución).
- La entrega de notificaciones MUST ser confirmada por el endpoint receptor.
- Los fallos de entrega MUST reintentarse con backoff exponencial conforme
  a ACP-NOTIFY-1.0.

7.8 Descubrimiento (ACP-DISC-1.0)

La implementación MUST:

- Exponer un endpoint de descubrimiento para registro de agentes y
  capabilities.
- Los registros de descubrimiento MUST incluir: agent_id,
  available_capabilities, status y updated_at.
- El descubrimiento MUST soportar paginación.
- El endpoint de descubrimiento MUST estar autenticado mediante Capability
  Token.

7.9 Operaciones en Lote (ACP-BULK-1.0)

La implementación MUST:

- Soportar solicitudes de autorización en lote hasta los límites definidos
  en ACP-BULK-1.0.
- Cada ítem del lote MUST evaluarse de forma independiente.
- El éxito parcial MUST ser soportado: la respuesta MUST incluir estado
  por ítem para cada elemento del lote.

7.10 Cross-Organization (ACP-CROSS-ORG-1.0)

La implementación MUST:

- Soportar delegación de capabilities entre organizaciones.
- Los tokens cross-org MUST incluir org_id en el claim.
- El verificador MUST validar los trust anchors cross-org según ACP-ITA-1.1
  antes de aceptar tokens cross-org.

7.11 Portabilidad de Reputación (ACP-REP-PORTABILITY-1.0)

La implementación MUST:

- Soportar exportación de registros de reputación firmados por agente.
- Los registros exportados MUST estar firmados por la clave de la
  institución originadora.
- Una institución importadora MUST verificar la firma de origen antes de
  incorporar un registro de reputación portátil.

---

8. L5 — DECENTRALIZED (L4 + ACP-D)

Una implementación conforme a L5 MUST cumplir L4 y además satisfacer la
especificación ACP-D definida en
`../descentralizado/ACP-D-Especificacion.md`.

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
  "ver": "1.2",
  "conformance_level": "L1|L2|L3|L4|L5"
}
```

Un verificador MUST rechazar tokens con versión no soportada.

Un verificador MUST rechazar tokens cuyo conformance_level declare
capacidades no soportadas por el verificador.

---

11. Validación de Cumplimiento

Una implementación ACP conforme MUST:

- Pasar todos los test vectors oficiales del nivel declarado (ACP-TS-1.1)
- Rechazar todos los tokens inválidos definidos en la suite
- Producir firmas deterministas reproducibles

La certificación ACP requiere ejecución exitosa del compliance runner
oficial (ACR-1.0) para el nivel declarado.

---

12. Non-Conformance

Una implementación NO es conforme si:

- Omite expiración de tokens
- Omite nonce
- Permite tokens sin firma válida
- Ignora revocación
- No declara nivel de conformidad soportado
- Declara un nivel sin satisfacer todos los requisitos de los niveles
  inferiores
- Emite tokens a agentes no registrados (viola §4.7)
- Acepta tokens delegados sin validar la cadena completa (viola §4.8)
- Almacena eventos de ledger sin firma institucional (viola §6.3)

---

13. Consideraciones de Seguridad

La conformidad NO garantiza seguridad si:

- Claves privadas están comprometidas
- Revocación no se actualiza con propagación oportuna
- Nonce no se verifica correctamente
- El quorum BFT (L4/L5) opera con menos nodos de los requeridos
- Los trust anchors cross-org no se validan de forma independiente

---

14. Formato de Declaración de Implementación

Una implementación conforme SHOULD declarar:

```
ACP Implementation:
  Version: 1.2
  Conformance-Level: L3
  Algorithms: Ed25519, SHA-256
  Compliance-Suite: Passed ACP-TS-1.1
```

---

Apéndice A — Mapeo desde CONF-1.1 (Informativo)

La siguiente tabla mapea las definiciones de nivel de CONF-1.1 a sus
equivalentes en CONF-1.2. Esta tabla es informativa y NO DEBE usarse en
declaraciones de certificación.

| Definición de nivel CONF-1.1        | Estado en CONF-1.2                                      |
|-------------------------------------|---------------------------------------------------------|
| L1: SIGN+CT+CAP-REG+HP              | Expandido: + AGENT + DCMA + MESSAGES                   |
| L2: L1+RISK+REV+ITA-1.0            | Sin cambios                                             |
| L3: L2+API+EXEC+LEDGER-1.2         | Expandido: + PROVENANCE + POLICY-CTX + PSN; LEDGER → 1.3 |
| L4: L3+PAY+REP-1.1+ITA-1.1        | REP corregido a 1.2; + 8 specs de gobernanza            |
| L5: L4+ACP-D+ITA-1.1 BFT          | Sin cambios                                             |

---

Apéndice B — Mapeo de Perfiles Anteriores (Informativo)

La versión 1.0 de esta especificación definía perfiles de conformidad. Ese
modelo fue reemplazado por el modelo de niveles en CONF-1.1. La siguiente
tabla es informativa y NO DEBE usarse en declaraciones de certificación:

| Perfil (deprecado) | Nivel equivalente |
|--------------------|-------------------|
| Core               | L1                |
| Governance         | L2                |
| Extended           | L4                |
| Full v1.1          | L4                |
