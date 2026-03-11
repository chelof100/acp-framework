# ACP-DISC-1.0 — Descubrimiento de Agentes

| Campo | Valor |
|---|---|
| **Estado** | Borrador |
| **Versión** | 1.0 |
| **Tipo** | Extensión de Protocolo |
| **Depende de** | ACP-AGS-1.0, ACP-CT-1.0, ACP-LEDGER-1.2 |
| **Fecha** | 2026-03-10 |

---

## 1. Propósito

Este documento especifica el mecanismo de descubrimiento de agentes ACP mediante un registro de capacidades públicas.

El descubrimiento de agentes permite que instituciones y sistemas externos encuentren agentes por las capacidades que ofrecen públicamente, sin necesidad de conocer de antemano el `agent_id` del agente en cuestión.

El descubrimiento es **opt-in** y opera de forma independiente al sistema de concesión de capacidades (ACP-CT-1.0):

- **ACP-CT-1.0** controla qué capacidades tiene autorizado usar un agente (concesiones).
- **ACP-DISC-1.0** controla qué capacidades anuncia públicamente un agente para ser encontrado.

Un agente puede tener capacidades concedidas en ACP-CT-1.0 sin exponerlas en el registro de descubrimiento, y viceversa, un agente puede anunciar una capacidad en descubrimiento solo si también la tiene concedida.

---

## 2. Registro de Descubrimiento

### 2.1 Principios

- El registro de descubrimiento es **opt-in**: los agentes no aparecen en el registro hasta que su institución los registra explícitamente.
- Las capacidades anunciadas en descubrimiento DEBEN estar registradas en ACP-CAP-REG-1.0.
- El registro de descubrimiento no otorga ni revoca capacidades; esa función pertenece exclusivamente a ACP-CT-1.0.
- La institución es responsable de validar la identidad del agente antes de registrarlo.

### 2.2 Ciclo de vida

```
No registrado → Registrado (activo) → Actualizado → Expirado / Desregistrado
```

Las entradas de descubrimiento tienen una fecha de expiración (`expires_at`). Las instituciones DEBEN renovar las entradas antes de que expiren si el agente continúa activo.

---

## 3. Endpoints de la API

### 3.1 Registrar agente para descubrimiento

```
POST /acp/v1/discovery/register
```

**Cuerpo de la solicitud:**

```json
{
  "agent_id": "agt-uuid-...",
  "public_capabilities": [
    "acp:cap:financial.payment",
    "acp:cap:financial.transfer"
  ],
  "institution_id": "inst-uuid-acme",
  "contact_endpoint": "https://agents.acme.com/acp/agt-uuid-..."
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `agent_id` | UUID | Sí | ID del agente a registrar. DEBE existir en ACP-AGS-1.0. |
| `public_capabilities` | Array[String] | Sí | Capacidades públicas a anunciar. DEBEN existir en ACP-CAP-REG-1.0. |
| `institution_id` | UUID | Sí | Institución responsable del agente. |
| `contact_endpoint` | URL | No | Endpoint de contacto para interactuar con el agente (HTTPS). |

**Respuesta exitosa (201 Created):**

```json
{
  "agent_id": "agt-uuid-...",
  "institution_id": "inst-uuid-acme",
  "public_capabilities": ["acp:cap:financial.payment", "acp:cap:financial.transfer"],
  "contact_endpoint": "https://agents.acme.com/acp/agt-uuid-...",
  "registered_at": "2026-03-10T14:00:00Z",
  "expires_at": "2027-03-10T14:00:00Z"
}
```

Si el agente ya estaba registrado, el registro existente se **sobreescribe** con los nuevos datos (idempotente).

### 3.2 Consultar agentes por capacidad

```
GET /acp/v1/discovery/agents?capability={cap_id}&institution={inst_id}
```

| Parámetro | Ubicación | Requerido | Descripción |
|---|---|---|---|
| `capability` | Query | No | Filtrar por capacidad (ej: `acp:cap:financial.payment`) |
| `institution` | Query | No | Filtrar por institución |
| `page` | Query | No | Número de página (paginación, default 1) |
| `per_page` | Query | No | Resultados por página (default 20, máximo 100) |

**Respuesta (200 OK):**

```json
{
  "total": 42,
  "page": 1,
  "per_page": 20,
  "results": [
    {
      "agent_id": "agt-uuid-...",
      "institution_id": "inst-uuid-acme",
      "public_capabilities": ["acp:cap:financial.payment"],
      "contact_endpoint": "https://agents.acme.com/acp/agt-uuid-...",
      "registered_at": "2026-03-10T14:00:00Z",
      "expires_at": "2027-03-10T14:00:00Z"
    }
  ]
}
```

### 3.3 Obtener perfil de descubrimiento de un agente

```
GET /acp/v1/discovery/agents/{agent_id}
```

**Respuesta (200 OK):** La entrada de descubrimiento del agente según el formato de §4.

**Respuesta (404 Not Found):** Si el agente no está registrado en el registro de descubrimiento.

### 3.4 Desregistrar agente del descubrimiento

```
DELETE /acp/v1/discovery/agents/{agent_id}
```

Requiere autenticación de la institución propietaria del agente.

**Respuesta (204 No Content)**

El agente deja de aparecer en resultados de búsqueda de forma inmediata.

---

## 4. Formato de Entrada de Descubrimiento

```json
{
  "agent_id": "agt-uuid-...",
  "institution_id": "inst-uuid-acme",
  "public_capabilities": [
    "acp:cap:financial.payment",
    "acp:cap:financial.transfer"
  ],
  "contact_endpoint": "https://agents.acme.com/acp/agt-uuid-...",
  "registered_at": "2026-03-10T14:00:00Z",
  "expires_at": "2027-03-10T14:00:00Z"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `agent_id` | UUID | Identificador del agente. Puede ser pseudónimo según política institucional (§5). |
| `institution_id` | UUID | Institución responsable de la entrada. |
| `public_capabilities` | Array[String] | Capacidades anunciadas públicamente. |
| `contact_endpoint` | URL | Endpoint HTTPS para contactar al agente. Opcional. |
| `registered_at` | ISO 8601 | Timestamp de creación o última actualización de la entrada. |
| `expires_at` | ISO 8601 | Timestamp de expiración. Máximo 1 año desde `registered_at`. |

---

## 5. Privacidad

### 5.1 Granularidad institucional

La institución controla qué capacidades de cada agente son públicamente descubribles. Una institución puede registrar solo un subconjunto de las capacidades reales de un agente.

### 5.2 Identidad pseudónima por defecto

Por defecto, el `agent_id` en el registro de descubrimiento es el mismo UUID asignado en ACP-AGS-1.0, que no revela información personal del agente o su operador.

Las instituciones pueden optar por divulgación completa (full disclosure) configurando la opción `discovery_full_disclosure: true` en su configuración institucional. En ese caso, el perfil de descubrimiento puede incluir campos adicionales como nombre del agente o descripción.

### 5.3 Capacidades opcionales

La institución PUEDE registrar el agente sin `contact_endpoint` si no desea exponer un punto de contacto directo. En ese caso, el contacto se realiza a través del endpoint institucional.

---

## 6. Integración con ACP-CAP-REG-1.0

Toda capacidad listada en `public_capabilities` DEBE estar registrada y activa en ACP-CAP-REG-1.0. El servidor ACP DEBE validar esto durante el registro.

Si una capacidad es eliminada de ACP-CAP-REG-1.0, las entradas de descubrimiento que la referencian DEBEN ser actualizadas automáticamente para eliminarla. Si tras la actualización el array `public_capabilities` queda vacío, la entrada de descubrimiento se marca como `status: inactive`.

---

## 7. Integración con ACP-AGS-1.0

El descubrimiento forma parte de la **capa L3 (Registro de Capacidades)** de la arquitectura de gobernanza de agentes (ACP-AGS-1.0).

Según ACP-AGS §4 (Coordinación):

- El registro de descubrimiento es consultado como parte del proceso de descubrimiento de capacidades en el flujo de coordinación entre agentes.
- Las entradas de descubrimiento son de solo lectura para sistemas externos a la institución propietaria.
- El registro de descubrimiento federado (entre instituciones) sigue las reglas de ACP-ITA-1.1 para determinar qué registros de otras instituciones son visibles.

---

## 8. Anti-abuso

### 8.1 Rate limiting en consultas

El endpoint `GET /acp/v1/discovery/agents` está sujeto a rate limiting:

- **Sin autenticación**: 60 consultas por minuto por IP.
- **Con token de institución**: 600 consultas por minuto por institución.

Superado el límite: HTTP 429 con header `Retry-After`.

### 8.2 Validación previa al registro

La institución DEBE verificar que el `agent_id` proporcionado existe en ACP-AGS-1.0 y pertenece a esa institución antes de registrarlo. El servidor ACP valida esto automáticamente.

### 8.3 Sobrescritura de registros duplicados

Si se registra un `agent_id` que ya existe en el registro de descubrimiento bajo la misma institución, el registro existente se **sobreescribe** completamente con los nuevos datos. No se crean entradas duplicadas.

### 8.4 Expiración automática

Las entradas expiradas (`expires_at` en el pasado) son automáticamente excluidas de los resultados de búsqueda. No se eliminan físicamente hasta 30 días después de expiración, para facilitar auditorías.
