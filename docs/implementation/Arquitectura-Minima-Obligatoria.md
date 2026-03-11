ACP v1.0
Arquitectura Mínima Obligatoria (AMO)
1. Objetivo

Definir el conjunto mínimo de componentes y reglas necesarias para que una implementación pueda declararse:

“ACP v1.0 Compliant”

Todo lo que no esté aquí es extensión opcional.

2. Principio Fundamental

Ninguna acción crítica ejecutada por un agente autónomo puede ocurrir sin autorización explícita previa emitida por el sistema ACP.

Formalmente:

Decision(A) ≠ Execution(A)
Execution(A) requiere Authorization(A, Action)
3. Componentes Mínimos Obligatorios

Una implementación ACP v1.0 debe incluir los siguientes cinco componentes:

3.1 Agent Identity Registry (AIR)
Función

Registrar agentes como entidades autónomas con identidad verificable.

Requisitos mínimos

Cada agente debe tener:

agent_id único

clave pública verificable

dominio institucional

nivel de autonomía

estado operativo

Estados obligatorios

active

restricted

suspended

revoked

Requisito crítico

Toda Action Request debe estar firmada criptográficamente por la identidad del agente registrada.

3.2 Authorization Enforcement Layer (AEL)
Función

Interceptar todas las acciones críticas antes de ejecución.

Propiedad obligatoria

Debe estar técnicamente separado del runtime del agente.

El agente no puede modificar ni omitir esta capa.

Responsabilidades

Validar identidad

Validar estado operativo

Validar permisos

Enviar a evaluación de riesgo

Emitir decisión formal

Si el AEL falla, la acción debe ser denegada por defecto.

Fail-closed obligatorio.

3.3 Policy and Risk Engine (PRE)
Función

Evaluar si una acción debe:

Approved

Denied

Escalated

Requisitos mínimos

Debe evaluar:

Alcance de permiso

Restricciones cuantitativas

Contexto operativo

Umbral de riesgo

Modelo mínimo de decisión
if not valid_permission:
    Denied
elif risk_score >= threshold:
    Escalated
else:
    Approved

El cálculo de riesgo puede variar, pero debe producir:

risk_score numérico

reason_code estructurado

3.4 Action Ledger (AL)
Función

Registrar todas las decisiones.

Debe registrar

request_id

agent_id

timestamp

decision

risk_score

reason_code

execution_status

Propiedad obligatoria

Los registros deben ser:

Inmutables

Secuenciales

Auditables

No es obligatorio usar blockchain.
Pero sí debe garantizarse integridad verificable.

3.5 Control Authority Interface (CAI)
Función

Permitir intervención externa.

Debe permitir

Suspender agente

Cambiar nivel de autonomía

Revocar permisos

Forzar auditoría

Propiedad obligatoria

Las decisiones del CAI deben prevalecer inmediatamente.

No puede existir latencia lógica que permita ejecución posterior a suspensión.

4. Flujo Mínimo Obligatorio

Para cada acción crítica:

Agent genera Action Request.

Firma criptográfica incluida.

AEL intercepta.

PRE evalúa.

Se emite decisión.

Se registra en Action Ledger.

Solo si Approved → ejecución real.

Orden obligatorio.

No puede alterarse.

5. Definición de Acción Crítica

ACP v1.0 no define qué es crítico universalmente.

Cada implementación debe declarar explícitamente:

critical_action_set = { … }

Y todas deben pasar por AEL.

6. Códigos de Decisión Obligatorios

Una implementación debe soportar al menos:

ACP-100 Approved

ACP-200 Denied

ACP-300 Escalated

ACP-400 Agent Suspended

ACP-500 System Failure

7. Condiciones de No Cumplimiento

Una implementación NO es ACP v1.0 compliant si:

El agente puede ejecutar sin pasar por AEL.

No existe registro inmutable por acción.

No hay identidad criptográfica verificable.

No existe suspensión inmediata externa.

El sistema opera en fail-open.

8. Propiedades Sistémicas Obligatorias

ACP v1.0 debe garantizar:

Separación estructural entre decisión y ejecución.

Autorización previa obligatoria.

Trazabilidad reconstruible.

Capacidad de intervención externa inmediata.

Integridad verificable de registros.

9. Lo Que NO Es Parte de ACP v1.0

Modelo específico de scoring de riesgo.

Tecnología de almacenamiento específica.

Infraestructura de red.

Modelo económico.

Gobernanza política.

Eso pertenece a capas superiores.

10. Resultado

Con esta arquitectura mínima:

ACP deja de ser concepto.
Se convierte en protocolo implementable.