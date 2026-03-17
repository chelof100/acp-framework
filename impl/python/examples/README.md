# ACP Python SDK — Ejemplos

Dos ejemplos que demuestran ACP como control de admisión para acciones de agentes.

## `admission_control_demo.py` — Patrón base (sin framework)

Muestra el patrón `ACPAdmissionGuard` directamente: emisión de tokens, verificación
de firmas, delegación multi-salto, decisiones APPROVED / DENIED / ESCALATED.

```bash
pip install cryptography>=42.0.0

# Offline (por defecto) — solo crypto, sin servidor
python examples/admission_control_demo.py

# Online — admission check completo vía servidor ACP
python examples/admission_control_demo.py --online
```

## `langchain_agent_demo.py` — Integración con LangChain

Muestra cómo envolver cualquier herramienta de LangChain con control de admisión ACP
usando el decorador `@acp_tool`. El agente no puede llamar a una herramienta sin
pasar primero el chequeo de admisión ACP.

```bash
pip install cryptography>=42.0.0

# Demo de patrón (sin clave de LLM requerida)
python examples/langchain_agent_demo.py

# Agente ReAct completo (requiere LangChain + clave OpenAI)
pip install langchain langchain-openai
export OPENAI_API_KEY=sk-...
python examples/langchain_agent_demo.py --with-llm
```

### El decorador `@acp_tool`

```python
from langchain_agent_demo import acp_tool, ACPAdmissionGuard

guard = ACPAdmissionGuard(identity=agent, institution=institution)

@acp_tool(guard=guard,
          capability="acp:cap:financial.payment",
          resource="bank://accounts/*",
          action_parameter_keys=["amount"])
def transfer_funds(amount: float, to_account: str) -> str:
    """Transferir fondos. El cuerpo solo se ejecuta si ACP dice APPROVED."""
    return payment_system.transfer(amount, to_account)
```

Es un reemplazo directo del `@tool` de LangChain. El cuerpo de la función
solo se ejecuta si ACP admite la acción. De lo contrario:

| Decisión ACP | Excepción lanzada | El agente ve |
|---|---|---|
| `APPROVED` | — | Resultado de la herramienta + token de ejecución registrado |
| `ESCALATED` | `ACPEscalatedError` | Error de herramienta → revisión humana requerida |
| `DENIED` | `ACPDeniedError` | Error de herramienta → bloqueado, sin mutación de estado |

## Ejecución con el servidor de referencia ACP

```bash
docker run -p 8080:8080 \
  -e ACP_INSTITUTION_PUBLIC_KEY=cA4s58S2dEJ-qye6EpJaJKKaVfvPT8mAQf97Vo8TInk \
  ghcr.io/chelof100/acp-server:latest

python examples/admission_control_demo.py --online
python examples/langchain_agent_demo.py --online
```
