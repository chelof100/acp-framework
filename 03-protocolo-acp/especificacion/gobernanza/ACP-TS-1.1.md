# ACP-TS-1.1 — Suite de Tests de Conformidad

| Campo | Valor |
|---|---|
| **Status** | Draft |
| **Version** | 1.1 |
| **Type** | Test Suite Specification |
| **Depends-on** | ACP-CONF-1.1, ACP-LEDGER-1.2 |
| **Required-by** | ACR-1.0 |
| **Fecha** | 2026-03-10 |

---

## 1. Alcance

Esta suite de tests cubre la verificación de conformidad de implementaciones ACP en los niveles L1 a L5, tal como se definen en ACP-CONF-1.1.

Cada nivel es acumulativo: una implementación que declara conformidad L3 debe pasar todos los casos de test de L1, L2 y L3.

Los tests de esta suite son la fuente autoritativa para determinar si una implementación cumple con un nivel de conformidad dado. La herramienta de referencia para ejecutar esta suite es `acr` (ACP Compliance Runner), definida en ACR-1.0.

---

## 2. Formato de Caso de Test

Cada caso de test sigue la siguiente estructura:

```json
{
  "test_id": "TS-L1-001",
  "level": "L1",
  "description": "Descripción breve del caso de test",
  "preconditions": ["Lista de condiciones previas requeridas"],
  "input": { "campo": "valor de entrada" },
  "expected_result": { "campo": "resultado esperado" },
  "pass_criteria": "Condición booleana o descripción del criterio de aprobación"
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `test_id` | string | Identificador único. Formato: `TS-L{N}-{NNN}` |
| `level` | enum | Nivel de conformidad: L1, L2, L3, L4, L5 |
| `description` | string | Descripción legible del comportamiento bajo test |
| `preconditions` | array | Estado del sistema requerido antes de ejecutar el test |
| `input` | object | Datos o acciones de entrada al sistema bajo test |
| `expected_result` | object | Resultado esperado del sistema |
| `pass_criteria` | string | Criterio preciso para determinar PASS |

---

## 3. Casos de Test L1 — Núcleo

### TS-L1-001: Validación de AgentRegistration

```json
{
  "test_id": "TS-L1-001",
  "level": "L1",
  "description": "El registro de agente debe incluir todos los campos obligatorios y ser rechazado si falta alguno",
  "preconditions": ["Nodo ACP operativo", "Endpoint de registro disponible"],
  "input": {
    "event": "AGENT_REGISTERED",
    "payload": {
      "agent_id": "agent-test-001",
      "capabilities": [],
      "public_key": null
    }
  },
  "expected_result": {
    "status": "rejected",
    "error_code": "ACP-001",
    "message": "public_key es obligatorio"
  },
  "pass_criteria": "El sistema rechaza el registro con error ACP-001 cuando public_key es null"
}
```

### TS-L1-002: Formato de Capability Token

```json
{
  "test_id": "TS-L1-002",
  "level": "L1",
  "description": "El capability token emitido debe cumplir el formato definido en ACP-CONF-1.1 §4",
  "preconditions": ["Agente registrado con agent_id válido"],
  "input": {
    "action": "request_capability_token",
    "agent_id": "agent-test-001",
    "capability": "READ_LEDGER"
  },
  "expected_result": {
    "token_format": "JWT",
    "required_claims": ["sub", "cap", "iat", "exp", "iss"],
    "signature_algorithm": "ES256"
  },
  "pass_criteria": "El token emitido es un JWT ES256 con todos los claims requeridos presentes y no expirado"
}
```

### TS-L1-003: Verificación de Firma de Mensaje

```json
{
  "test_id": "TS-L1-003",
  "level": "L1",
  "description": "Los mensajes con firma inválida deben ser rechazados",
  "preconditions": ["Agente registrado", "Par de claves conocido"],
  "input": {
    "message": {
      "agent_id": "agent-test-001",
      "action": "EXECUTE",
      "signature": "firma-invalida-base64"
    }
  },
  "expected_result": {
    "status": "rejected",
    "error_code": "ACP-003"
  },
  "pass_criteria": "El sistema rechaza el mensaje con error ACP-003 cuando la firma no verifica con la clave pública registrada"
}
```

### TS-L1-004: Anti-Replay — ACP-006

```json
{
  "test_id": "TS-L1-004",
  "level": "L1",
  "description": "Un mensaje con nonce ya utilizado debe ser rechazado (protección anti-replay)",
  "preconditions": ["Agente registrado", "Mensaje M1 ya procesado con nonce='nonce-abc-123'"],
  "input": {
    "message": {
      "agent_id": "agent-test-001",
      "nonce": "nonce-abc-123",
      "timestamp": "2026-03-10T10:00:00Z",
      "signature": "<firma-válida>"
    }
  },
  "expected_result": {
    "status": "rejected",
    "error_code": "ACP-006"
  },
  "pass_criteria": "El sistema rechaza el mensaje duplicado con error ACP-006"
}
```

### TS-L1-005: Comportamiento Fail-Closed

```json
{
  "test_id": "TS-L1-005",
  "level": "L1",
  "description": "Ante error de verificación indeterminado, el sistema debe denegar la operación (fail-closed)",
  "preconditions": ["Servicio de verificación de claves inaccesible"],
  "input": {
    "message": {
      "agent_id": "agent-test-001",
      "action": "EXECUTE",
      "signature": "<firma-válida>"
    }
  },
  "expected_result": {
    "status": "denied",
    "error_code": "ACP-000",
    "action_taken": "none"
  },
  "pass_criteria": "El sistema deniega la operación y no ejecuta ninguna acción cuando no puede verificar la firma"
}
```

---

## 4. Casos de Test L2 — Ejecución

### TS-L2-001: Ciclo de Vida del Execution Token

```json
{
  "test_id": "TS-L2-001",
  "level": "L2",
  "description": "Un execution token debe pasar por los estados: issued → consumed, y no ser reutilizable",
  "preconditions": ["Agente con capability EXECUTE", "Execution token ET-001 emitido"],
  "input": {
    "action": "consume_exec_token",
    "token_id": "ET-001",
    "agent_id": "agent-test-001"
  },
  "expected_result": {
    "first_consume": { "status": "accepted", "token_state": "consumed" },
    "second_consume": { "status": "rejected", "error_code": "ACP-010" }
  },
  "pass_criteria": "El primer consume es aceptado; el segundo consume del mismo token es rechazado con ACP-010"
}
```

### TS-L2-002: Endpoint de Consumo de Exec-Token

```json
{
  "test_id": "TS-L2-002",
  "level": "L2",
  "description": "El endpoint de consumo de execution token debe responder con el schema correcto",
  "preconditions": ["Execution token ET-002 en estado issued"],
  "input": {
    "method": "POST",
    "endpoint": "/v1/exec-tokens/ET-002/consume",
    "body": { "agent_id": "agent-test-001", "signature": "<firma-válida>" }
  },
  "expected_result": {
    "http_status": 200,
    "body": {
      "token_id": "ET-002",
      "status": "consumed",
      "consumed_at": "<ISO8601>",
      "agent_id": "agent-test-001"
    }
  },
  "pass_criteria": "Respuesta HTTP 200 con body que incluye token_id, status=consumed, consumed_at y agent_id"
}
```

### TS-L2-003: Aplicación del Umbral de Riesgo

```json
{
  "test_id": "TS-L2-003",
  "level": "L2",
  "description": "Una ejecución que supera el risk_threshold configurado debe ser bloqueada",
  "preconditions": ["risk_threshold configurado en 0.7", "Agente con risk_score=0.85"],
  "input": {
    "action": "request_execution",
    "agent_id": "agent-test-001",
    "operation": "DELETE_RECORDS",
    "risk_score": 0.85
  },
  "expected_result": {
    "status": "blocked",
    "error_code": "ACP-020",
    "reason": "risk_score excede risk_threshold"
  },
  "pass_criteria": "La ejecución es bloqueada con error ACP-020 cuando risk_score > risk_threshold"
}
```

---

## 5. Casos de Test L3 — Reputación

### TS-L3-001: Formato del Evento REPUTATION_UPDATED

```json
{
  "test_id": "TS-L3-001",
  "level": "L3",
  "description": "El evento REPUTATION_UPDATED debe incluir todos los campos obligatorios definidos en ACP-LEDGER-1.2",
  "preconditions": ["Agente registrado", "Evento de reputación generado"],
  "input": {
    "trigger": "execution_completed",
    "agent_id": "agent-test-001",
    "outcome": "success"
  },
  "expected_result": {
    "event_type": "REPUTATION_UPDATED",
    "required_fields": ["agent_id", "previous_score", "new_score", "delta", "reason", "timestamp", "ledger_tx_id"]
  },
  "pass_criteria": "El evento emitido contiene todos los campos requeridos con tipos correctos"
}
```

### TS-L3-002: Rango de Score de Reputación

```json
{
  "test_id": "TS-L3-002",
  "level": "L3",
  "description": "El score de reputación debe mantenerse en el rango [0.0, 1.0] en todas las condiciones",
  "preconditions": ["Agente con score=0.05"],
  "input": {
    "action": "apply_penalty",
    "agent_id": "agent-test-001",
    "penalty": 0.5
  },
  "expected_result": {
    "new_score": 0.0,
    "clamped": true
  },
  "pass_criteria": "El score resultante es 0.0 (no negativo); el sistema aplica clamping al límite inferior"
}
```

### TS-L3-003: Integración con REP-1.2

```json
{
  "test_id": "TS-L3-003",
  "level": "L3",
  "description": "Los eventos de reputación deben ser trazables en el ledger según REP-1.2",
  "preconditions": ["Ledger operativo", "Evento REPUTATION_UPDATED generado con tx_id=TX-REP-001"],
  "input": {
    "query": "get_ledger_entry",
    "tx_id": "TX-REP-001"
  },
  "expected_result": {
    "found": true,
    "event_type": "REPUTATION_UPDATED",
    "immutable": true
  },
  "pass_criteria": "El evento es recuperable del ledger, inmutable, y vinculado al agent_id correcto"
}
```

---

## 6. Casos de Test L4 — Responsabilidad

### TS-L4-001: Campo resolver_type en ESCALATION_RESOLVED

```json
{
  "test_id": "TS-L4-001",
  "level": "L4",
  "description": "El evento ESCALATION_RESOLVED debe incluir el campo resolver_type con valor válido",
  "preconditions": ["Escalación ESC-001 abierta"],
  "input": {
    "action": "resolve_escalation",
    "escalation_id": "ESC-001",
    "resolver": "human-operator-42"
  },
  "expected_result": {
    "event_type": "ESCALATION_RESOLVED",
    "resolver_type": "human",
    "valid_values": ["human", "automated", "council"]
  },
  "pass_criteria": "El evento contiene resolver_type con uno de los valores válidos"
}
```

### TS-L4-002: Trazabilidad LIA-1.0

```json
{
  "test_id": "TS-L4-002",
  "level": "L4",
  "description": "Toda acción ejecutada debe tener una cadena de responsabilidad trazable según LIA-1.0",
  "preconditions": ["Acción ACT-001 ejecutada por agent-test-001"],
  "input": {
    "query": "get_liability_chain",
    "action_id": "ACT-001"
  },
  "expected_result": {
    "chain": [
      { "role": "initiator", "entity_id": "agent-test-001", "entity_type": "agent" },
      { "role": "authorizer", "entity_id": "user-007", "entity_type": "human" }
    ]
  },
  "pass_criteria": "La cadena contiene al menos un initiator y la cadena es completa hasta el origen humano o de sistema"
}
```

### TS-L4-003: Reconstrucción de Cadena de Responsabilidad

```json
{
  "test_id": "TS-L4-003",
  "level": "L4",
  "description": "El sistema debe poder reconstruir la cadena de responsabilidad completa para una acción dada",
  "preconditions": ["Secuencia de 3 agentes delegados: A→B→C ejecutando ACT-002"],
  "input": {
    "query": "reconstruct_liability_chain",
    "action_id": "ACT-002"
  },
  "expected_result": {
    "chain_length": 3,
    "all_links_present": true,
    "root_authority": "user-007"
  },
  "pass_criteria": "La cadena reconstruida contiene los 3 eslabones en orden correcto con root_authority identificado"
}
```

---

## 7. Casos de Test L5 — Pagos

### TS-L5-001: Verificación de ACP-PAY-Token

```json
{
  "test_id": "TS-L5-001",
  "level": "L5",
  "description": "Un ACP-PAY-Token debe ser verificable criptográficamente antes de procesar el pago",
  "preconditions": ["PAY-Token PT-001 emitido por el issuer autorizado"],
  "input": {
    "action": "verify_pay_token",
    "token_id": "PT-001",
    "signature": "<firma-válida-del-issuer>"
  },
  "expected_result": {
    "valid": true,
    "issuer_verified": true,
    "not_expired": true,
    "not_spent": true
  },
  "pass_criteria": "El token pasa todas las verificaciones: firma, issuer, expiración y estado no-gastado"
}
```

### TS-L5-002: Detección de Double-Spend — PAY-005

```json
{
  "test_id": "TS-L5-002",
  "level": "L5",
  "description": "Un intento de usar el mismo PAY-Token dos veces debe ser rechazado con PAY-005",
  "preconditions": ["PAY-Token PT-002 ya usado en transacción TX-001"],
  "input": {
    "action": "process_payment",
    "token_id": "PT-002",
    "amount": 10.00,
    "recipient": "agent-test-002"
  },
  "expected_result": {
    "status": "rejected",
    "error_code": "PAY-005",
    "reason": "token_already_spent"
  },
  "pass_criteria": "El sistema rechaza el segundo uso del token con error PAY-005 y no procesa el pago"
}
```

### TS-L5-003: Evento PAYMENT_VERIFIED en Ledger

```json
{
  "test_id": "TS-L5-003",
  "level": "L5",
  "description": "Todo pago procesado exitosamente debe generar un evento PAYMENT_VERIFIED en el ledger",
  "preconditions": ["PAY-Token PT-003 válido y no gastado"],
  "input": {
    "action": "process_payment",
    "token_id": "PT-003",
    "amount": 5.00,
    "recipient": "agent-test-002"
  },
  "expected_result": {
    "payment_status": "processed",
    "ledger_event": {
      "event_type": "PAYMENT_VERIFIED",
      "required_fields": ["token_id", "amount", "sender", "recipient", "timestamp", "ledger_tx_id"]
    }
  },
  "pass_criteria": "Se genera el evento PAYMENT_VERIFIED con todos los campos requeridos y es inmutable en el ledger"
}
```

---

## 8. Formato de Resultado

Cada ejecución de test produce un resultado en el siguiente formato JSON:

```json
{
  "test_id": "TS-L1-001",
  "level": "L1",
  "status": "pass",
  "duration_ms": 142,
  "error_code": null,
  "details": {
    "actual_result": { "status": "rejected", "error_code": "ACP-001" },
    "pass_criteria_met": true,
    "notes": "Comportamiento correcto: registro rechazado por public_key nulo"
  }
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `test_id` | string | Identificador del caso de test ejecutado |
| `level` | enum | Nivel de conformidad: L1–L5 |
| `status` | enum | `pass`, `fail`, o `skip` |
| `duration_ms` | integer | Duración de la ejecución en milisegundos |
| `error_code` | string\|null | Código de error si `status=fail`; null en caso contrario |
| `details` | object | Resultado real, criterio cumplido, notas adicionales |

El runner de tests DEBE emitir resultados en este formato. Salidas en cualquier otro formato no son conformes con esta especificación.

---

## 9. Herramienta de Referencia

La herramienta de referencia para ejecutar esta suite es `acr` — ACP Compliance Runner, definida en **ACR-1.0**.

El runner `acr` es la implementación canónica del ejecutor de tests. Toda herramienta alternativa que pretenda ejecutar esta suite DEBE:

1. Aceptar como entrada un conjunto de casos de test en el formato de §2.
2. Producir resultados en el formato exacto de §8.
3. Retornar código de salida `0` si todos los tests del nivel solicitado pasan, y código `1` en caso contrario.
4. Soportar ejecución por nivel (`--level L1`, `--level L2`, etc.) y ejecución completa (`--level all`).

Referencia: ver ACR-1.0 para detalles de instalación, uso y extensión del runner.

---

## 10. Requisitos de Conformidad

Una implementación ACP se considera **conforme al nivel Lx** si y solo si **todos los casos de test de los niveles L1 hasta Lx inclusive** producen el resultado `pass`.

| Nivel declarado | Tests que deben pasar |
|---|---|
| L1 | TS-L1-001 … TS-L1-005 |
| L2 | TS-L1-001 … TS-L1-005 + TS-L2-001 … TS-L2-003 |
| L3 | L1 + L2 + TS-L3-001 … TS-L3-003 |
| L4 | L1 + L2 + L3 + TS-L4-001 … TS-L4-003 |
| L5 | L1 + L2 + L3 + L4 + TS-L5-001 … TS-L5-003 |

Un resultado `skip` en cualquier test obligatorio para el nivel declarado se considera equivalente a `fail` para efectos de certificación.

Las implementaciones pueden reportar conformidad parcial (por ejemplo, "conforme L3, tests L4 pendientes") siempre que todos los tests del nivel declarado y los anteriores hayan pasado.
