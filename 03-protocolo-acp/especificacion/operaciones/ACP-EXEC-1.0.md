# ACP-EXEC-1.0
## Execution Token Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** ACP-SIGN-1.0, ACP-CT-1.0, ACP-API-1.0
**Required-by:** ACP-LEDGER-1.0, ACP-CONF-1.0

---

## 1. Alcance

Este documento define el Execution Token (ET), su estructura, lifecycle, emisión, validación, e invalidación. El ET es el artefacto que prueba ante el sistema objetivo que una acción específica fue autorizada por ACP y puede ser ejecutada exactamente una vez.

El sistema objetivo no necesita conocer el protocolo ACP completo para validar un ET. Solo necesita la clave pública institucional ACP (obtenida via ACP-ITA-1.0) y este documento.

---

## 2. Definiciones

**Execution Token (ET):** Artefacto criptográfico de un solo uso que autoriza la ejecución de una instancia específica de una acción autorizada por ACP.

**Sistema Objetivo:** Sistema, API, o servicio que recibe y valida el ET antes de ejecutar la acción.

**Ventana de ejecución:** Período de validez del ET. Máximo 300 segundos (5 minutos).

**Consumo:** Acto de presentar el ET al sistema objetivo. Irreversible.

---

## 3. Principios de Diseño

```
1. Un ET autoriza exactamente una acción, una vez, en una ventana corta
2. El sistema objetivo valida con una sola operación criptográfica
3. No hay delegación
4. No hay renovación
5. No hay estados intermedios
6. Lifecycle exactamente: issued → used → expired
```

---

## 4. Estructura del Execution Token

```json
{
  "ver": "1.0",
  "et_id": "<uuid_v4>",
  "agent_id": "<AgentID>",
  "authorization_id": "<request_id_de_la_decision_APPROVED>",
  "capability": "acp:cap:financial.payment",
  "resource": "org.example/accounts/ACC-001",
  "action_parameters_hash": "<SHA-256_base64url_de_JCS(action_parameters)>",
  "issued_at": 1718920000,
  "expires_at": 1718920300,
  "used": false,
  "sig": "<base64url_firma_institucional_ACP>"
}
```

---

## 5. Especificación de Campos

**5.1 `et_id`** — UUID v4 CSPRNG. MUST ser único globalmente. Es el identificador de consumo.

**5.2 `agent_id`** — MUST coincidir con agent_id de la AuthorizationDecision que originó el ET.

**5.3 `authorization_id`** — MUST ser el `request_id` de la AuthorizationDecision APPROVED. Permite trazabilidad directa al Audit Ledger.

**5.4 `capability`** — MUST ser idéntico al campo capability de la ActionRequest original.

**5.5 `resource`** — MUST ser idéntico al campo resource de la ActionRequest original. El sistema objetivo MUST verificar que coincide con el recurso sobre el que ejecuta.

**5.6 `action_parameters_hash`** — MUST ser `base64url(SHA-256(JCS(action_parameters)))`. El sistema objetivo MAY verificar este hash. Si verifica y no coincide MUST rechazar.

**5.7 `expires_at`** — MUST ser `issued_at + N`, N MUST NOT exceder 300 segundos.

Ventanas recomendadas por capacidad:

| Capacidad | Ventana |
|-----------|---------|
| financial.payment, financial.transfer | 60s |
| infrastructure.delete | 30s |
| infrastructure.deploy | 120s |
| *.read | 300s |
| otros | 120s |

**5.8 `used`** — MUST ser `false` en el ET emitido. El estado de consumo vive en el registro del sistema objetivo, no en el token.

**5.9 `sig`** — Firma de la institución ACP según ACP-SIGN-1.0. El sistema objetivo valida con pk institucional de ACP-ITA-1.0.

---

## 6. Lifecycle

```
┌─────────┐
│  ISSUED │
└────┬────┘
     │
┌────┴──────────────────┐
│                       │
presentado          expires_at
al objetivo         alcanzado
│                       │
┌─▼──────┐        ┌──────▼──────┐
│  USED  │        │   EXPIRED   │
└────────┘        └─────────────┘
```

Desde USED y EXPIRED no hay transiciones posibles.

---

## 7. Emisión

El ET es emitido exclusivamente como parte de una AuthorizationDecision APPROVED:

```
POST /acp/v1/authorize → APPROVED → ET incluido en response
POST /acp/v1/authorize/escalations/{id}/resolve → APPROVED → ET incluido
```

**Proceso:**
```
1. Generar et_id UUID v4
2. Copiar agent_id, capability, resource de la ActionRequest
3. Calcular action_parameters_hash = base64url(SHA-256(JCS(action_parameters)))
4. issued_at = timestamp actual
5. expires_at = issued_at + ventana_configurada
6. used = false
7. Construir objeto sin sig
8. Firmar según ACP-SIGN-1.0
9. Registrar en ET Registry interno
10. Incluir en response
```

---

## 8. Validación por el Sistema Objetivo

Pasos MUST en orden exacto:

```
Paso 1: Verificar ver == "1.0"
Paso 2: Verificar sig con pk institucional ACP (ACP-SIGN-1.0)
Paso 3: Verificar expires_at > timestamp_actual
Paso 4: Verificar agent_id coincide con agente que presenta el ET
Paso 5: Verificar capability es la acción solicitada
Paso 6: Verificar resource coincide con recurso objetivo
Paso 7: Verificar et_id NO está en registro local de ETs consumidos
Paso 8: Si verifica action_parameters → calcular hash y comparar
Paso 9: Registrar et_id como USED con timestamp
Paso 10: Ejecutar acción
```

Los pasos 1–9 MUST completarse antes del paso 10. Un fallo en cualquier paso MUST cancelar la ejecución.

**El paso 7 es crítico.** El sistema objetivo MUST mantener registro local de et_id consumidos. El registro MUST persistir al menos hasta `expires_at + 60 segundos`.

---

## 9. ET Registry

El sistema ACP MUST mantener:

```json
{
  "et_id": "<uuid>",
  "authorization_id": "<uuid>",
  "agent_id": "<AgentID>",
  "capability": "acp:cap:financial.payment",
  "resource": "org.example/accounts/ACC-001",
  "issued_at": 1718920000,
  "expires_at": 1718920300,
  "state": "issued | used | expired",
  "consumed_at": null,
  "consumed_by_system": null
}
```

**Reporte de consumo (SHOULD):**
```http
POST /acp/v1/exec-tokens/{et_id}/consume
```

```json
{
  "et_id": "<uuid>",
  "consumed_at": 1718920150,
  "execution_result": "success | failure | unknown",
  "sig": "<firma_del_sistema_objetivo>"
}
```

SHOULD y no MUST porque el sistema objetivo puede ser externo y no ACP-conforme.

**Limpieza:** El sistema MAY limpiar entradas USED o EXPIRED después de 30 días. MUST mover al Audit Ledger antes de limpiar.

---

## 10. Comportamiento ante Condiciones Anómalas

| Condición | Comportamiento |
|-----------|---------------|
| ET expirado | Rechazar EXEC-003 |
| ET ya consumido | Rechazar EXEC-004 |
| Firma inválida | Rechazar EXEC-002 |
| agent_id no coincide | Rechazar EXEC-005 |
| resource no coincide | Rechazar EXEC-006 |
| action_parameters_hash no coincide | Rechazar EXEC-007 |
| et_id no encontrado | Rechazar EXEC-008 |
| Sistema ACP no disponible para reportar consumo | Continuar — registrar localmente, sincronizar después |

El último caso es el único donde el sistema objetivo puede proceder sin confirmación del sistema ACP. Esto es intencional — la disponibilidad de ACP no debe ser punto de fallo único para la ejecución.

---

## 11. Errores

| Código | Condición |
|--------|-----------|
| EXEC-001 | Versión no soportada |
| EXEC-002 | Firma inválida |
| EXEC-003 | ET expirado |
| EXEC-004 | ET ya consumido |
| EXEC-005 | agent_id no coincide |
| EXEC-006 | resource no coincide |
| EXEC-007 | action_parameters_hash no coincide |
| EXEC-008 | et_id no encontrado en registry |
| EXEC-009 | Sistema objetivo no autorizado para consumir ET |

---

## 12. Conformidad

Una implementación es ACP-EXEC-1.0 conforme si:

- Emite ETs exclusivamente como resultado de AuthorizationDecision APPROVED
- Firma ETs con clave institucional ACP según ACP-SIGN-1.0
- Mantiene ET Registry con estados de §9
- Implementa endpoint de consumo POST /acp/v1/exec-tokens/{et_id}/consume
- Aplica ventana de ejecución máxima de 300 segundos
- Rechaza ETs consumidos o expirados sin excepción
- Produce los códigos de error de §11
