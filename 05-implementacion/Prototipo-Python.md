1. Alcance del Prototipo

Implementar:

Registro de agentes con clave pública.

Motor de autorización formal.

Delegación con restricciones.

Ledger encadenado por hash.

Revocación transitiva.

Simulación de ataque fallido.

No implementar:

Infraestructura distribuida real.

PKI completa.

UI.

Red real.

Todo puede correr local.

2. Arquitectura del Prototipo

Estructura mínima en Python:

acp/
 ├── identity.py
 ├── agent.py
 ├── delegation.py
 ├── policy_engine.py
 ├── authorization.py
 ├── ledger.py
 ├── control_authority.py
 └── main_demo.py
3. Componentes Técnicos
3.1 Identity Module

Responsable de:

Generar clave pública/privada.

Firmar mensajes.

Verificar firmas.

Usar librería estándar tipo:

cryptography (ed25519)

Requisito:

Toda ActionRequest debe verificarse contra clave pública registrada.

3.2 Agent Model

Clase Agent:

Atributos:

agent_id

public_key

capabilities

limits

state

delegations_received

Método:

request_action(action_type, params)

No ejecuta directamente.
Solo genera solicitud.

3.3 Delegation Engine

Estructura:

Delegation:

delegator_id

delegate_id

capability

constraints

expiry

signature

Validación:

delegator debe tener capability.

constraints ⊆ constraints originales.

no exceder profundidad.

3.4 Policy Engine

Función:

evaluate(request)

Implementación simple:

verificar capability

verificar límites

calcular riesgo (simulado)

comparar con threshold

Devuelve:

APPROVED

DENIED

ESCALATED

3.5 Authorization Layer

Función central:

authorize(request)

Pasos:

Verificar firma.

Verificar estado agente.

Resolver delegación si aplica.

Evaluar políticas.

Registrar en ledger.

Retornar decisión.

Separación obligatoria:

Agent nunca ejecuta sin authorize().

3.6 Ledger

Estructura:

Event:

request_id

decision

risk

prev_hash

hash

Hash:

sha256(serialized_event + prev_hash)

Método:

verify_chain()

Si alguien altera evento → cadena inválida.

3.7 Control Authority

Funciones:

suspend_agent(agent_id)

revoke_agent(agent_id)

revoke_delegations(agent_id)

Revocación debe:

invalidar delegaciones descendientes

bloquear futuras acciones

4. Escenario de Demostración

main_demo.py debe ejecutar:

Caso 1 — Ejecución válida

Agente A tiene capability approve_tx

Solicita acción

Motor aprueba

Ledger registra

Resultado esperado: APPROVED

Caso 2 — Intento sin capability

Agente B sin permiso

Solicita approve_tx

Resultado esperado: DENIED

Caso 3 — Delegación válida

A delega approve_tx a B

B ejecuta dentro de límites

Resultado esperado: APPROVED

Caso 4 — Delegación excediendo límites

B intenta monto mayor al permitido

Resultado esperado: DENIED

Caso 5 — Revocación transitiva

Revocar A

B intenta ejecutar delegación heredada

Resultado esperado: DENIED

Caso 6 — Manipulación del ledger

Alterar manualmente evento

Ejecutar verify_chain()

Resultado esperado: FAIL

5. Propiedades que Debe Demostrar

El prototipo debe probar:

Execute(req) ⇒ Decision = APPROVED

Delegation no amplía privilegios.

Revocación invalida cadena.

Ledger detecta manipulación.

No existe ejecución directa.

Si una sola falla → diseño incorrecto.

6. Métrica de Éxito

Prototipo es válido si:

Código < 800 líneas.

Casos demostrables reproducibles.

Motor determinístico.

Ataques simulados fallan.

