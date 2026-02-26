ACP v1.0
Especificación Formal de Mensajes
1. Principios Generales

Todos los mensajes deben ser serializables en JSON.

Todos los mensajes deben incluir protocol_version.

Todos los mensajes deben incluir message_id único.

Todos los mensajes deben incluir timestamp en formato ISO 8601 UTC.

Todos los mensajes críticos deben estar firmados digitalmente.

Formato base obligatorio:

{
  "protocol_version": "1.0",
  "message_id": "uuid",
  "timestamp": "ISO-8601-UTC",
  "type": "MESSAGE_TYPE",
  "payload": { },
  "signature": "base64_signature"
}
2. Tipos de Mensajes Obligatorios

ACP v1.0 define 5 mensajes fundamentales:

AgentRegistration

ActionRequest

AuthorizationDecision

AgentStateChange

AuditQuery

3. AgentRegistration
Propósito

Registrar un agente en el Agent Identity Registry.

Payload Obligatorio
{
  "agent_id": "string",
  "public_key": "string",
  "institution_id": "string",
  "autonomy_level": "integer",
  "authority_domain": "string"
}
Reglas

agent_id debe ser único.

public_key debe cumplir estándar criptográfico declarado.

Registro debe generar evento en Action Ledger.

No puede sobrescribirse sin revocación previa.

4. ActionRequest
Propósito

Solicitar autorización para ejecutar acción crítica.

Payload Obligatorio
{
  "request_id": "uuid",
  "agent_id": "string",
  "action_type": "string",
  "target_resource": "string",
  "action_parameters": { },
  "context": {
    "ip": "string",
    "geo": "string",
    "device_id": "string"
  }
}
Reglas

Debe estar firmado por clave privada del agente.

request_id debe ser único.

No puede ejecutarse sin AuthorizationDecision explícita.

5. AuthorizationDecision
Propósito

Emitir decisión formal del sistema ACP.

Payload Obligatorio
{
  "request_id": "uuid",
  "agent_id": "string",
  "decision": "APPROVED | DENIED | ESCALATED",
  "risk_score": "integer",
  "reason_code": "string",
  "policy_reference": "string"
}
Reglas

Debe estar firmado por clave institucional ACP.

Debe registrarse en Action Ledger.

Solo APPROVED permite ejecución.

6. AgentStateChange
Propósito

Modificar estado operativo del agente.

Payload Obligatorio
{
  "agent_id": "string",
  "previous_state": "string",
  "new_state": "string",
  "reason_code": "string",
  "authorized_by": "string"
}
Estados válidos

active

restricted

suspended

revoked

Regla crítica

Si estado = suspended o revoked
→ todas las ActionRequest futuras deben recibir DENIED automáticamente.

7. AuditQuery
Propósito

Permitir auditoría estructurada.

Payload Obligatorio
{
  "query_id": "uuid",
  "agent_id": "string",
  "time_range": {
    "from": "ISO-8601",
    "to": "ISO-8601"
  }
}
Respuesta debe incluir

Lista ordenada de eventos

Hash encadenado verificable

Firma institucional

8. Firma Digital Obligatoria

Reglas mínimas:

ActionRequest → firmada por agente

AuthorizationDecision → firmada por ACP Authority

AgentStateChange → firmada por Control Authority

AuditResponse → firmada por institución

Sin firma válida → mensaje inválido.

9. Códigos de Error Estándar

ACP v1.0 debe soportar al menos:

ACP-001 Invalid Signature

ACP-002 Agent Suspended

ACP-003 Permission Denied

ACP-004 Risk Threshold Exceeded

ACP-005 Invalid Message Format

ACP-006 Replay Detected

ACP-007 Unknown Agent

10. Protección contra Replay

Toda ActionRequest debe incluir:

request_id único

timestamp validado

Ventana máxima configurable (ej. 30s)

Si se detecta reutilización de request_id → ACP-006.

11. Versionado

El campo:

"protocol_version": "1.0"

Es obligatorio.

Cambios incompatibles deben incrementar versión mayor.

12. Propiedades Críticas del Protocolo

Una implementación ACP v1.0 debe garantizar:

Determinismo en evaluación.

Integridad criptográfica.

No repudio.

Trazabilidad completa.

Fail-closed por defecto.

13. Resultado

Ahora ACP tiene:

Arquitectura mínima

Componentes obligatorios

Flujo formal

Modelo de mensajes

Códigos de error

Reglas de firma

Reglas anti-replay

Esto ya se parece a un protocolo real.