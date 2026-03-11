# ACP-NOTIFY-1.0 — Notificaciones Push / Webhooks

| Campo | Valor |
|---|---|
| **Estado** | Borrador |
| **Versión** | 1.0 |
| **Tipo** | Extensión de Protocolo |
| **Depende de** | ACP-LEDGER-1.2, ACP-SIGN-1.0 |
| **Fecha** | 2026-03-10 |

---

## 1. Propósito

Este documento especifica el sistema de notificaciones push para eventos del ledger ACP mediante webhooks HTTP.

Las notificaciones push permiten que sistemas externos (dashboards, sistemas de auditoría, agentes secundarios, integraciones de terceros) reciban alertas en tiempo real cuando ocurren eventos relevantes en el ledger ACP, sin necesidad de realizar polling activo.

Los casos de uso principales incluyen:

- Sistemas de monitoreo que necesitan reaccionar a registros de nuevos agentes.
- Plataformas de auditoría que deben procesar cada evento de pago verificado.
- Sistemas de escalado que responden a resoluciones de disputas.
- Tableros de reputación que actualizan métricas en tiempo real.

---

## 2. API de Suscripciones

### 2.1 Crear suscripción

```
POST /acp/v1/webhooks
```

**Cuerpo de la solicitud:**

```json
{
  "webhook_url": "https://mi-sistema.com/acp/events",
  "events": ["AGENT_REGISTERED", "PAYMENT_VERIFIED", "*"],
  "secret": "s3cr3t-hmac-key-aqui",
  "institution_id": "inst-uuid-acme"
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `webhook_url` | String (URL) | Sí | URL HTTPS donde se entregarán los eventos. DEBE usar HTTPS. |
| `events` | Array[String] | Sí | Lista de tipos de evento a recibir. `"*"` suscribe a todos. |
| `secret` | String | Sí | Clave secreta compartida para HMAC-SHA256. Mínimo 32 caracteres. |
| `institution_id` | UUID | Sí | Institución a la que pertenece la suscripción. |

**Respuesta exitosa (201 Created):**

```json
{
  "webhook_id": "wh-uuid-...",
  "webhook_url": "https://mi-sistema.com/acp/events",
  "events": ["AGENT_REGISTERED", "PAYMENT_VERIFIED"],
  "institution_id": "inst-uuid-acme",
  "status": "active",
  "created_at": "2026-03-10T14:00:00Z"
}
```

### 2.2 Obtener detalles de suscripción

```
GET /acp/v1/webhooks/{webhook_id}
```

Retorna el objeto de suscripción. El campo `secret` NUNCA se incluye en la respuesta.

**Respuesta (200 OK):**

```json
{
  "webhook_id": "wh-uuid-...",
  "webhook_url": "https://mi-sistema.com/acp/events",
  "events": ["AGENT_REGISTERED", "PAYMENT_VERIFIED"],
  "institution_id": "inst-uuid-acme",
  "status": "active",
  "created_at": "2026-03-10T14:00:00Z",
  "last_delivered_at": "2026-03-10T15:30:00Z",
  "failure_count": 0
}
```

### 2.3 Eliminar suscripción

```
DELETE /acp/v1/webhooks/{webhook_id}
```

**Respuesta (204 No Content)**

Las suscripciones eliminadas no reciben más entregas. Los eventos en cola para reintento son descartados.

---

## 3. Payload del Webhook

Cada entrega de evento enviada al `webhook_url` tiene el siguiente formato:

```json
{
  "webhook_id": "wh-uuid-...",
  "event_type": "AGENT_REGISTERED",
  "event_id": "evt-uuid-...",
  "timestamp": "2026-03-10T15:30:00Z",
  "institution_id": "inst-uuid-acme",
  "data": {
    "agent_id": "agt-uuid-...",
    "agent_type": "financial",
    "registered_by": "usr-uuid-...",
    "capabilities": ["acp:cap:financial.payment"]
  },
  "signature": "sha256=abc123def456..."
}
```

### 3.1 Campos del payload

| Campo | Tipo | Descripción |
|---|---|---|
| `webhook_id` | UUID | ID de la suscripción que origina esta entrega |
| `event_type` | String | Tipo de evento (ej: `AGENT_REGISTERED`) |
| `event_id` | UUID | ID único del evento en el ledger ACP |
| `timestamp` | ISO 8601 | Timestamp del evento original en el ledger |
| `institution_id` | UUID | Institución que originó el evento |
| `data` | Objeto | Payload específico del tipo de evento |
| `signature` | String | HMAC-SHA256 del payload (ver §4) |

### 3.2 Campo `data` por tipo de evento

El campo `data` varía según `event_type`. Los campos específicos de cada evento siguen la estructura definida en ACP-LEDGER-1.2 para ese tipo de evento.

---

## 4. Autenticación y Verificación

### 4.1 Header de firma

Cada entrega de webhook DEBE incluir el header:

```
X-ACP-Signature: sha256=<hmac_hex>
```

Donde `<hmac_hex>` es el HMAC-SHA256 del cuerpo completo del payload (como string UTF-8), calculado usando el `secret` de la suscripción como clave.

### 4.2 Cálculo del HMAC

```
signature = HMAC-SHA256(secret, raw_body_utf8)
header_value = "sha256=" + hex(signature)
```

### 4.3 Verificación por el receptor

El sistema receptor DEBE:

1. Leer el cuerpo de la solicitud como bytes crudos (no parsear JSON primero).
2. Calcular `HMAC-SHA256(secret, raw_body)`.
3. Comparar el resultado con el valor en `X-ACP-Signature` usando comparación de tiempo constante (para evitar timing attacks).
4. Rechazar la entrega si la firma no coincide (retornar HTTP 401).

### 4.4 Protección contra replay

El receptor DEBERÍA verificar que `event_id` no fue procesado previamente, almacenando los IDs recibidos en los últimos 24 horas.

---

## 5. Política de Reintentos

### 5.1 Condición de reintento

ACP-NOTIFY reintenta la entrega cuando el endpoint del receptor responde con un código HTTP no-2xx, o cuando la conexión falla (timeout, error de red).

### 5.2 Calendario de reintentos

| Intento | Espera antes del intento |
|---|---|
| Intento inicial | Inmediato |
| Reintento 1 | 5 segundos |
| Reintento 2 | 30 segundos |
| Reintento 3 | 5 minutos |

Tras 3 reintentos fallidos (total 4 intentos), el webhook se marca con `status: "failed"`.

### 5.3 Webhook fallido

Cuando un webhook alcanza `status: "failed"`:

- El administrador de la institución suscriptora recibe una notificación por el canal de administración configurado.
- No se realizan más intentos de entrega para ese webhook.
- Los nuevos eventos NO se encolan para ese webhook.
- El webhook puede ser reactivado via `PUT /acp/v1/webhooks/{webhook_id}/reactivate`.

### 5.4 Timeout por intento

Cada intento de entrega tiene un timeout de 10 segundos. Si el receptor no responde dentro de ese plazo, el intento se considera fallido.

---

## 6. Filtrado de Eventos

### 6.1 Suscripción a todos los eventos

```json
{ "events": ["*"] }
```

El comodín `"*"` suscribe a todos los tipos de evento actuales y futuros. Se recomienda usar con precaución en entornos de alta actividad.

### 6.2 Suscripción a eventos específicos

```json
{
  "events": [
    "AGENT_REGISTERED",
    "PAYMENT_VERIFIED",
    "ESCALATION_RESOLVED",
    "REPUTATION_UPDATED"
  ]
}
```

### 6.3 Catálogo de tipos de evento

| Tipo de evento | Descripción |
|---|---|
| `AGENT_REGISTERED` | Un nuevo agente fue registrado en el sistema |
| `AGENT_DEREGISTERED` | Un agente fue dado de baja |
| `CAPABILITY_GRANTED` | Una capacidad fue concedida a un agente |
| `CAPABILITY_REVOKED` | Una capacidad fue revocada |
| `PAYMENT_VERIFIED` | Un pago fue verificado en el ledger |
| `PAYMENT_DISPUTED` | Un pago fue disputado |
| `ESCALATION_CREATED` | Se creó una nueva escalada |
| `ESCALATION_RESOLVED` | Una escalada fue resuelta |
| `REPUTATION_UPDATED` | El score de reputación de un agente fue actualizado |
| `POLICY_SNAPSHOT_EXPORTED` | Un snapshot de política fue exportado (ACP-PSN-EXPORT) |
| `INSTITUTION_FEDERATED` | Una nueva institución se unió a la federación |

### 6.4 Actualización de filtros

Los filtros de evento de una suscripción existente pueden actualizarse via:

```
PATCH /acp/v1/webhooks/{webhook_id}
```

Con cuerpo `{ "events": [...] }`.

---

## 7. Seguridad

### 7.1 HTTPS obligatorio

El campo `webhook_url` DEBE comenzar con `https://`. El servidor ACP DEBE rechazar con HTTP 422 cualquier intento de crear una suscripción con URL no-HTTPS.

### 7.2 Versión TLS mínima

Las conexiones salientes del servidor ACP hacia `webhook_url` DEBEN usar TLS 1.2 como mínimo. TLS 1.3 es recomendado.

### 7.3 Rotación del secreto

El secreto HMAC puede rotarse sin interrumpir la suscripción:

```
PUT /acp/v1/webhooks/{webhook_id}/rotate-secret
```

**Cuerpo:**
```json
{ "new_secret": "nuevo-secreto-aqui" }
```

Durante la rotación existe una ventana de gracia de 5 minutos en la que el servidor ACP acepta firmas calculadas con el secreto anterior o el nuevo, para evitar pérdida de eventos durante el cambio.

### 7.4 Confidencialidad del secreto

El campo `secret` NUNCA se incluye en respuestas de la API (GET, LIST). Solo se transmite en el momento de creación (POST) y rotación (PUT).

### 7.5 Control de acceso

Solo la institución propietaria de una suscripción (`institution_id`) puede leer, modificar o eliminar ese webhook. El token de autenticación DEBE pertenecer a esa institución.
