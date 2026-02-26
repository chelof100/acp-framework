# ACP-REV-1.0
## Revocation Protocol Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** ACP-SIGN-1.0, ACP-CT-1.0
**Required-by:** ACP-API-1.0, ACP-LEDGER-1.0

---

## 1. Alcance

Este documento define los mecanismos de revocación de Capability Tokens y agentes, el protocolo de consulta de estado, el comportamiento offline, y la revocación transitiva en cadenas de delegación.

---

## 2. Definiciones

**agent_id:** Identificador del agente. MUST cumplir formato ACP-CT-1.0 §3.2.

**token_id:** Identificador único de un token. Corresponde al campo `nonce` del Capability Token.

**Revocación transitiva:** Cuando un token T0 es revocado, todos los tokens T1 donde `parent_chain` contiene T0 son automáticamente inválidos.

---

## 3. Mecanismos de Revocación

ACP define dos mecanismos. Cada token MUST especificar cuál usa en el campo `rev`.

### Mecanismo A — Endpoint (online)

Consulta en tiempo real al servidor de revocación.

**Request:**
```http
GET /acp/v1/rev/check?token_id=<nonce>
Authorization: ACP-Agent <token>
```

**Response 200:**
```json
{
  "token_id": "<nonce>",
  "status": "active",
  "checked_at": 1718920000,
  "sig": "<firma_institucional>"
}
```

`status` MUST ser `"active"` o `"revoked"`.

**Códigos HTTP:**

| HTTP | Condición |
|------|-----------|
| 200 | Respuesta exitosa — verificar campo status |
| 401 | No autenticado |
| 403 | Sin permiso para consultar |
| 404 | token_id no encontrado — tratar como revocado |
| 429 | Rate limit excedido |
| 503 | Servicio no disponible — aplicar política offline |

### Mecanismo B — CRL (offline-capable)

Certificate Revocation List firmada descargable.

**Estructura CRL:**
```json
{
  "ver": "1.0",
  "issuer": "org.example.banking",
  "issued_at": 1718920000,
  "next_update": 1718923600,
  "revoked": [
    {
      "token_id": "<nonce>",
      "revoked_at": 1718910000,
      "reason_code": "REV-003"
    }
  ],
  "sig": "<firma_institucional>"
}
```

La CRL MUST ser firmada según ACP-SIGN-1.0. El verificador MUST validar la firma antes de usar la CRL.

**Frecuencia de actualización:**

| Contexto | Frecuencia máxima |
|----------|------------------|
| Financiero crítico | 1 hora |
| Enterprise general | 6 horas |
| Desarrollo | 24 horas |

---

## 4. Caching

Para el Mecanismo A, el verificador MAY cachear respuestas:

| Capacidad | TTL máximo |
|-----------|-----------|
| financial.payment, financial.transfer | 60 segundos |
| infrastructure.* | 120 segundos |
| *.read | 300 segundos |
| otros | 180 segundos |

---

## 5. Política Offline

Cuando el mecanismo de verificación no está disponible:

| Condición | Decisión |
|-----------|----------|
| Respuesta cacheada dentro de TTL | Usar cache |
| CRL vigente (next_update > ahora) | Usar CRL local |
| CRL expirada hace < 1 hora | ESCALATED |
| CRL expirada hace ≥ 1 hora | DENIED |
| Sin cache ni CRL | DENIED |

No hay excepciones más permisivas a esta política. DENIED es el comportamiento seguro por defecto.

---

## 6. Revocación Transitiva

Cuando se revoca T0:

```
Para todo token T1 donde T1.parent_chain contiene T0:
  T1 es automáticamente inválido
```

El sistema MUST implementar esta propagación. Un verificador que encuentra `parent_hash` en un token MUST verificar el estado del token padre.

**Revocación de agente:**

Cuando se revoca un agente A:
- Todos los tokens donde A es `iss` son revocados
- Todos los tokens donde A es `sub` son revocados
- La revocación transitiva aplica a todos los tokens derivados

---

## 7. Emisión de Revocación

```http
POST /acp/v1/rev/revoke
Authorization: ACP-Agent <token>
```

```json
{
  "token_id": "<nonce>",
  "reason_code": "REV-003",
  "revoked_by": "<AgentID>",
  "revoke_descendants": true,
  "sig": "<firma_del_autorizador>"
}
```

`revoke_descendants: true` MUST activar revocación transitiva de todos los tokens derivados.

---

## 8. Reason Codes

| Código | Descripción |
|--------|-------------|
| REV-001 | Expiración anticipada por solicitud del emisor |
| REV-002 | Compromiso de clave privada del sujeto |
| REV-003 | Violación de política detectada |
| REV-004 | Agente dado de baja |
| REV-005 | Revocación por orden administrativa |
| REV-006 | Token padre revocado (revocación transitiva) |
| REV-007 | Expiración por inactividad |
| REV-008 | Revocación de emergencia por compromiso institucional |

---

## 9. Seguridad

- Todas las comunicaciones MUST usar HTTPS
- Las respuestas del endpoint MUST estar firmadas según ACP-SIGN-1.0
- El verificador MUST validar la firma antes de confiar en el status
- mTLS SHOULD ser usado en entornos B2B
- Rate limiting MUST ser implementado en el endpoint de verificación

---

## 10. Errores

| Código | Condición |
|--------|-----------|
| REV-E001 | token_id no encontrado — tratar como revocado |
| REV-E002 | Firma de respuesta inválida |
| REV-E003 | CRL con firma inválida |
| REV-E004 | CRL expirada |
| REV-E005 | Sin mecanismo de verificación disponible — DENIED |
| REV-E006 | Sin permiso para emitir revocación |
| REV-E007 | Reason code inválido |

---

## 11. Conformidad

Una implementación es ACP-REV-1.0 conforme si:

- Implementa al menos uno de los dos mecanismos (A o B)
- Valida firma de respuestas antes de usar
- Implementa revocación transitiva correctamente
- Aplica política offline sin excepciones más permisivas
- Produce los reason codes y códigos de error definidos
