# ACP-CAP-REG-1.0
## Capability Type Registry Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** ACP-CT-1.0
**Required-by:** ACP-RISK-1.0, ACP-API-1.0

---

## 1. Alcance

Este documento define el formato de los identificadores de capacidad, los dominios core del protocolo v1.0, los baselines de riesgo por capacidad, los constraints obligatorios, y el proceso de extensión para capacidades institucionales.

---

## 2. Formato de Identificador

```
acp:cap:<domain>.<action>
```

Reglas:
- Prefijo `acp:cap:` obligatorio
- `domain` y `action`: alfanumérico minúsculas, guión permitido, sin espacios
- Subdominio permitido: `acp:cap:<domain>.<subdomain>.<action>`
- Longitud máxima total: 128 caracteres
- Capacidades extendidas: `acp:cap:ext.<institution_id>.<domain>.<action>`

---

## 3. Dominios Core v1.0

Los siguientes dominios son inmutables en v1.0. No pueden ser modificados por instituciones.

### 3.1 `financial`

| Capacidad | Baseline RS | Constraints obligatorios |
|-----------|-------------|--------------------------|
| financial.read | 0 | — |
| financial.write | 10 | — |
| financial.payment | 35 | max_amount, currency |
| financial.transfer | 40 | max_amount, currency |
| financial.approve | 25 | — |
| financial.cancel | 15 | — |
| financial.report | 5 | — |

### 3.2 `identity`

| Capacidad | Baseline RS | Constraints obligatorios |
|-----------|-------------|--------------------------|
| identity.read | 0 | — |
| identity.verify | 5 | — |
| identity.create | 20 | — |
| identity.modify | 20 | — |
| identity.revoke | 30 | — |
| identity.delegate | 25 | — |

### 3.3 `infrastructure`

| Capacidad | Baseline RS | Constraints obligatorios |
|-----------|-------------|--------------------------|
| infrastructure.read | 0 | — |
| infrastructure.deploy | 30 | — |
| infrastructure.modify | 25 | — |
| infrastructure.scale | 20 | — |
| infrastructure.delete | 55 | — |
| infrastructure.restart | 15 | — |
| infrastructure.monitor | 0 | — |

### 3.4 `data`

| Capacidad | Baseline RS | Constraints obligatorios |
|-----------|-------------|--------------------------|
| data.read | 0 | — |
| data.write | 10 | — |
| data.delete | 30 | — |
| data.export | 25 | destination_domain |
| data.import | 15 | — |
| data.classify | 10 | — |
| data.anonymize | 15 | — |

### 3.5 `communication`

| Capacidad | Baseline RS | Constraints obligatorios |
|-----------|-------------|--------------------------|
| communication.internal | 0 | — |
| communication.external | 20 | allowed_endpoints |
| communication.broadcast | 25 | — |
| communication.webhook | 15 | allowed_endpoints |
| communication.notify | 5 | — |

### 3.6 `agent`

| Capacidad | Baseline RS | Constraints obligatorios |
|-----------|-------------|--------------------------|
| agent.register | 20 | — |
| agent.read | 0 | — |
| agent.modify | 25 | — |
| agent.suspend | 30 | — |
| agent.revoke | 40 | — |
| agent.delegate | 20 | — |

### 3.7 `audit`

| Capacidad | Baseline RS | Constraints obligatorios |
|-----------|-------------|--------------------------|
| audit.read | 5 | — |
| audit.query | 5 | — |
| audit.export | 20 | destination_domain |
| audit.verify | 5 | — |

---

## 4. Capacidades Extendidas

Las instituciones pueden definir capacidades propias usando el prefijo:

```
acp:cap:ext.<institution_id>.<domain>.<action>
```

Ejemplo: `acp:cap:ext.org.example.banking.credit.approve`

Reglas para capacidades extendidas:
- Solo pueden ser usadas por la institución que las define
- MUST ser registradas en el directorio interno institucional
- Cuando un verificador externo encuentra una capacidad extendida desconocida, MUST escalar (no denegar)
- El baseline RS para capacidades extendidas desconocidas es 40 (umbral de escalación)

---

## 5. Especificación de Constraints

Los constraints son campos adicionales en el objeto `constraints` del token.

### 5.1 `max_amount`

Requerido por: `financial.payment`, `financial.transfer`

```json
"constraints": {
  "max_amount": 1000.00,
  "currency": ["USD", "EUR"]
}
```

- `max_amount`: número positivo. La acción MUST ser rechazada si el amount supera este valor.
- `currency`: array de códigos ISO 4217. La acción MUST usar una de estas monedas.

### 5.2 `destination_domain`

Requerido por: `data.export`, `audit.export`

```json
"constraints": {
  "destination_domain": ["org.example.partner"]
}
```

Array de institution_ids autorizados como destino.

### 5.3 `allowed_endpoints`

Requerido por: `communication.external`, `communication.webhook`

```json
"constraints": {
  "allowed_endpoints": ["https://api.partner.com", "https://webhook.example.com"]
}
```

Array de URLs o dominios autorizados.

---

## 6. Validación de Capacidad

Proceso de validación al recibir un capability identifier:

```
Paso 1: Verificar prefijo "acp:cap:"
Paso 2: Verificar longitud ≤ 128 caracteres
Paso 3: Verificar caracteres válidos en domain y action
Paso 4: Si prefijo "acp:cap:ext." → capacidad extendida, ir a paso 7
Paso 5: Verificar domain ∈ dominios core (§3)
Paso 6: Verificar action ∈ acciones del domain → si no existe: CAP-002
Paso 7: Capacidad extendida desconocida → baseline RS = 40, ESCALATED
Paso 8: Verificar constraints obligatorios presentes → si faltan: CAP-004
```

---

## 7. Errores

| Código | Condición |
|--------|-----------|
| CAP-001 | Formato de capability inválido |
| CAP-002 | Capability core no registrada |
| CAP-003 | Capability extendida desconocida (no es error — produce ESCALATED) |
| CAP-004 | Constraint obligatorio ausente |
| CAP-005 | Valor de constraint fuera de rango |
| CAP-006 | institution_id en extended capability inválido |

---

## 8. Conformidad

Una implementación es ACP-CAP-REG-1.0 conforme si:

- Valida formato de capability según §2
- Reconoce todos los dominios core de §3
- Aplica baselines RS definidos en §3
- Escala (no deniega) ante capacidades extendidas desconocidas
- Valida presencia de constraints obligatorios según §5
- Produce los códigos de error de §7
