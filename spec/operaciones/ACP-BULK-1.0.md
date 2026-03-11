# ACP-BULK-1.0 — Operaciones en Lote

| Campo | Valor |
|---|---|
| **Estado** | Borrador |
| **Versión** | 1.0 |
| **Tipo** | Extensión de Protocolo |
| **Depende de** | ACP-CT-1.0, ACP-EXEC-1.0, ACP-LIA-1.0, ACP-LEDGER-1.2 |
| **Fecha** | 2026-03-10 |

---

## 1. Propósito

Este documento especifica las operaciones de autorización en lote y consulta masiva de responsabilidad para despliegues ACP de alto rendimiento.

En entornos con grandes volúmenes de transacciones (plataformas de pagos, sistemas de trading, orquestadores de agentes multi-tenant), el modelo de autorización unitaria de ACP-CT-1.0 puede resultar en latencia acumulada significativa si cada autorización requiere una llamada HTTP independiente. ACP-BULK-1.0 aborda este problema permitiendo:

- **Autorización en lote**: hasta 100 solicitudes de autorización en una única llamada HTTP.
- **Consulta masiva de responsabilidad**: recuperar registros de responsabilidad para múltiples agentes o rangos temporales en una sola operación con paginación.

Las operaciones en lote no modifican la semántica de las decisiones individuales. Cada solicitud dentro de un lote es evaluada de forma independiente según las mismas reglas de ACP-CT-1.0 y ACP-EXEC-1.0.

---

## 2. API de Autorización en Lote

### 2.1 Endpoint

```
POST /acp/v1/bulk/authorize
```

### 2.2 Solicitud

```json
{
  "batch_id": "bat-uuid-7f3a1b",
  "requests": [
    {
      "request_id": "req-001",
      "agent_id": "agt-uuid-aaa",
      "action_type": "acp:action:financial.payment",
      "resource": "acp:res:account:12345",
      "context": {
        "amount": 500.00,
        "currency": "USD",
        "timestamp": "2026-03-10T14:00:00Z"
      }
    },
    {
      "request_id": "req-002",
      "agent_id": "agt-uuid-bbb",
      "action_type": "acp:action:data.read",
      "resource": "acp:res:dataset:analytics",
      "context": {
        "purpose": "reporting"
      }
    }
  ],
  "options": {
    "fail_fast": false,
    "partial_results": true
  }
}
```

#### Campos de la solicitud

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `batch_id` | UUID | Sí | Identificador único del lote. Generado por el cliente. Usado para idempotencia. |
| `requests` | Array | Sí | Lista de solicitudes de autorización individuales. Máximo 100. |
| `requests[].request_id` | String | Sí | Identificador de la solicitud dentro del lote. Único en el lote, no global. |
| `requests[].agent_id` | UUID | Sí | Agente que solicita la autorización. |
| `requests[].action_type` | String | Sí | Tipo de acción ACP a autorizar. |
| `requests[].resource` | String | Sí | Recurso sobre el que se solicita la acción. |
| `requests[].context` | Objeto | No | Contexto adicional para la evaluación (importe, propósito, etc.). |
| `options.fail_fast` | Boolean | No | Si `true`, detener al primer DENIED o ESCALATED. Default: `false`. |
| `options.partial_results` | Boolean | No | Si `true`, retornar resultados parciales cuando `fail_fast` se activa. Default: `true`. |

### 2.3 Respuesta

```json
{
  "batch_id": "bat-uuid-7f3a1b",
  "processed": 2,
  "results": [
    {
      "request_id": "req-001",
      "decision": "APPROVED",
      "risk_score": 12,
      "reason_code": "CAPABILITY_MATCH"
    },
    {
      "request_id": "req-002",
      "decision": "DENIED",
      "risk_score": 87,
      "reason_code": "CAPABILITY_NOT_GRANTED"
    }
  ]
}
```

#### Campos de la respuesta

| Campo | Tipo | Descripción |
|---|---|---|
| `batch_id` | UUID | Mismo valor que en la solicitud. |
| `processed` | Integer | Número de solicitudes procesadas (puede ser menor a `requests.length` si `fail_fast: true`). |
| `results` | Array | Lista de resultados individuales. |
| `results[].request_id` | String | ID de la solicitud correspondiente. |
| `results[].decision` | Enum | `APPROVED`, `DENIED`, o `ESCALATED`. |
| `results[].risk_score` | Integer | Puntuación de riesgo 0-100 calculada por ACP-EXEC-1.0. |
| `results[].reason_code` | String | Código de razón de la decisión. |

### 2.4 Comportamiento con `fail_fast: true`

Cuando `fail_fast: true`, el servidor detiene el procesamiento al encontrar el primer resultado `DENIED` o `ESCALATED`. Las solicitudes no procesadas no aparecen en `results`. El campo `processed` refleja cuántas se evaluaron antes de detenerse.

---

## 3. API de Consulta Masiva de Responsabilidad

### 3.1 Endpoint

```
POST /acp/v1/bulk/liability-query
```

### 3.2 Solicitud

```json
{
  "query_id": "qry-uuid-...",
  "agent_ids": [
    "agt-uuid-aaa",
    "agt-uuid-bbb",
    "agt-uuid-ccc"
  ],
  "time_range": {
    "from": "2026-01-01T00:00:00Z",
    "to": "2026-03-10T23:59:59Z"
  },
  "limit": 1000,
  "cursor": null
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `query_id` | UUID | Sí | Identificador de la consulta. Usado para recuperar páginas adicionales. |
| `agent_ids` | Array[UUID] | Sí | IDs de agentes a consultar. Mínimo 1. |
| `time_range.from` | ISO 8601 | Sí | Inicio del rango temporal. |
| `time_range.to` | ISO 8601 | Sí | Fin del rango temporal. |
| `limit` | Integer | No | Máximo de registros por página. Default y máximo: 1000. |
| `cursor` | String | No | Cursor opaco de la respuesta anterior para obtener la siguiente página. |

### 3.3 Respuesta

```json
{
  "query_id": "qry-uuid-...",
  "total": 3450,
  "cursor": "eyJwYWdlIjoyLCJvZmZzZXQiOjEwMDB9",
  "records": [
    {
      "event_id": "evt-uuid-...",
      "agent_id": "agt-uuid-aaa",
      "event_type": "LIABILITY_INCURRED",
      "amount": 500.00,
      "currency": "USD",
      "timestamp": "2026-02-15T10:30:00Z",
      "institution_id": "inst-uuid-acme",
      "status": "SETTLED"
    }
  ]
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `query_id` | UUID | ID de la consulta. |
| `total` | Integer | Total de registros que coinciden con la consulta (en todas las páginas). |
| `cursor` | String | Cursor para la siguiente página. `null` si es la última página. |
| `records` | Array | Registros de responsabilidad de ACP-LIA-1.0 para esta página. |

---

## 4. Límites

| Límite | Valor |
|---|---|
| Máximo de items por solicitud de autorización en lote | 100 |
| Máximo de items por página de consulta de responsabilidad | 1000 |
| Rate limit de solicitudes bulk por institución | 10 solicitudes bulk/segundo |
| Tamaño máximo del cuerpo de solicitud | 1 MB |

Superar el límite de 100 items en una autorización en lote resulta en HTTP 400 con código de error `BULK-001`.

---

## 5. Atomicidad

### 5.1 Atomicidad parcial

Las operaciones de autorización en lote utilizan **atomicidad parcial**: cada solicitud dentro del lote es evaluada de forma independiente.

El lote **NO** es atómico en el sentido todo-o-nada. Si 50 de las 100 solicitudes son aprobadas y las otras 50 son rechazadas, las 50 aprobadas son válidas y las 50 rechazadas son inválidas. No existe rollback de las aprobadas por las rechazadas.

### 5.2 Uso de `fail_fast: true`

Para casos donde se requiere que todo el lote sea válido antes de proceder, el cliente DEBE:

1. Usar `fail_fast: true` para detener el procesamiento al primer fallo.
2. Evaluar el resultado: si `processed < total_requests`, hubo un fallo prematuro.
3. En ese caso, no proceder con las acciones y resolver el fallo antes de reintentar.

### 5.3 Idempotencia del `batch_id`

Si se envía el mismo `batch_id` dos veces, el servidor DEBE retornar la misma respuesta que en la primera solicitud (idempotencia). Esto protege contra reintentos accidentales en caso de error de red.

---

## 6. Manejo de Errores

### 6.1 Errores de nivel lote (afectan al lote completo)

| Código | HTTP | Descripción |
|---|---|---|
| `BULK-001` | 400 | El lote supera el tamaño máximo de 100 items |
| `BULK-002` | 429 | Rate limit de solicitudes bulk excedido (10/seg por institución) |
| `BULK-004` | 400 | El resultado de la consulta es demasiado grande; usar cursor para paginar |

### 6.2 Errores de nivel item (dentro de un lote exitoso)

| Código | Descripción |
|---|---|
| `BULK-003` | Una o más solicitudes dentro del lote fallaron (ver resultados individuales) |

Cuando se produce `BULK-003`, la respuesta HTTP es `207 Multi-Status` y el cuerpo contiene los resultados individuales, incluyendo los que fallaron. Los resultados que sí se evaluaron correctamente tienen su `decision` en el campo correspondiente.

### 6.3 Formato de error de nivel lote

```json
{
  "error": "BULK-001",
  "message": "Batch size exceeds maximum of 100 items. Provided: 143.",
  "batch_id": "bat-uuid-..."
}
```

---

## 7. Paginación de Consultas

### 7.1 Mecanismo de cursor

Los resultados de consulta masiva de responsabilidad se paginan mediante un **cursor opaco**. El cursor:

- Se incluye en la respuesta cuando hay más páginas disponibles.
- Es válido durante **10 minutos** desde su generación.
- Se envía en la siguiente solicitud POST con el mismo `query_id` y los mismos parámetros de filtro.
- Si el cursor expira, la consulta debe reiniciarse desde el principio.

### 7.2 Solicitud de página siguiente

```json
{
  "query_id": "qry-uuid-...",
  "agent_ids": ["agt-uuid-aaa", "agt-uuid-bbb", "agt-uuid-ccc"],
  "time_range": {
    "from": "2026-01-01T00:00:00Z",
    "to": "2026-03-10T23:59:59Z"
  },
  "limit": 1000,
  "cursor": "eyJwYWdlIjoyLCJvZmZzZXQiOjEwMDB9"
}
```

Los campos `agent_ids` y `time_range` DEBEN ser idénticos a la solicitud original. El servidor PUEDE retornar HTTP 400 si difieren.

### 7.3 Última página

Cuando la respuesta incluye `"cursor": null`, no hay más páginas disponibles.

---

## 8. Integración con el Ledger

Las operaciones en lote **no generan eventos de ledger separados** para el lote en sí. Cada solicitud de autorización aprobada dentro de un lote genera un evento `AUTHORIZATION` individual en ACP-LEDGER-1.2, exactamente de la misma forma que una autorización unitaria.

Esto significa:

- Un lote de 100 autorizaciones aprobadas genera 100 eventos `AUTHORIZATION` en el ledger.
- No existe un evento `BULK_AUTHORIZATION` en el schema del ledger.
- Las auditorías del ledger son equivalentes para autorizaciones unitarias y en lote.
- El campo `batch_id` de la solicitud puede incluirse en el contexto del evento de ledger como metadato opcional, para facilitar la correlación de eventos originados en el mismo lote.
