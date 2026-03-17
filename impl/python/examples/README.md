# ACP Python SDK — Ejemplos

Tres ejemplos que demuestran ACP como control de admisión para acciones de agentes,
en los frameworks Python de agentes más utilizados.

---

## `admission_control_demo.py` — Patrón base (sin framework requerido)

Muestra el patrón `ACPAdmissionGuard` directamente: emisión de tokens, verificación
de firma, delegación multi-hop, decisiones APPROVED / DENIED / ESCALATED.

```bash
pip install cryptography>=42.0.0

# Offline (por defecto) — solo crypto, sin servidor
python examples/admission_control_demo.py

# Online — control de admisión completo via servidor ACP
python examples/admission_control_demo.py --online
```

---

## `langchain_agent_demo.py` — Integración con LangChain

Muestra cómo envolver cualquier herramienta LangChain con control de admisión ACP
usando el decorador `@acp_tool`. El agente LLM no puede invocar una herramienta
sin pasar primero por el control de admisión ACP.

```bash
pip install cryptography>=42.0.0

# Demo de patrón (sin clave LLM requerida)
python examples/langchain_agent_demo.py

# Agente ReAct completo (requiere LangChain + clave OpenAI)
pip install langchain langchain-openai
export OPENAI_API_KEY=sk-...
python examples/langchain_agent_demo.py --with-llm
```

### El decorador `@acp_tool`

```python
from langchain_agent_demo import acp_tool, ACPAdmissionGuard

guard = ACPAdmissionGuard(identity=agente, institution=institucion)

@acp_tool(guard=guard,
          capability="acp:cap:financial.payment",
          resource="bank://accounts/*",
          action_parameter_keys=["amount"])
def transfer_funds(amount: float, to_account: str) -> str:
    """Transfiere fondos. El cuerpo solo se ejecuta si ACP dice APPROVED."""
    return payment_system.transfer(amount, to_account)
```

Reemplazo directo del `@tool` de LangChain. El cuerpo de la función solo se ejecuta
si ACP admite la acción. De lo contrario:

| Decisión ACP | Excepción lanzada | El agente ve |
|---|---|---|
| `APPROVED` | — | Resultado + execution token registrado |
| `ESCALATED` | `ACPEscalatedError` | Error de herramienta → revisión humana |
| `DENIED` | `ACPDeniedError` | Error de herramienta → bloqueado, sin mutación |

---

## `pydantic_ai_demo.py` — Integración con Pydantic AI

Muestra cómo inyectar `ACPAdmissionGuard` como dependencia `RunContext` de Pydantic AI.
El guard está disponible dentro de cada función `@agent.tool` via `ctx.deps`.

```bash
pip install cryptography>=42.0.0

# Demo de patrón (sin clave LLM requerida)
python examples/pydantic_ai_demo.py

# Agente Pydantic AI completo (requiere pydantic-ai + clave LLM)
pip install pydantic-ai
export OPENAI_API_KEY=sk-...
python examples/pydantic_ai_demo.py --with-agent
```

### El patrón de inyección `RunContext`

```python
from pydantic_ai import Agent, ModelRetry
from pydantic_ai.tools import RunContext
from pydantic_ai_demo import ACPAdmissionGuard

agent = Agent('openai:gpt-4o-mini', deps_type=ACPAdmissionGuard)

@agent.tool
async def transfer_funds(
    ctx: RunContext[ACPAdmissionGuard],
    amount: float,
    to_account: str,
) -> str:
    """Transfiere fondos. El cuerpo solo se ejecuta si ACP dice APPROVED."""
    result = ctx.deps.check(
        capability="acp:cap:financial.payment",
        resource="bank://accounts/*",
        action_parameters={"amount": amount},
    )
    if result.denied:
        raise ModelRetry(f"ACP DENIED: {result.error_code}")
    if result.escalated:
        raise ModelRetry(f"ACP ESCALATED: revisión humana requerida ({result.escalation_id})")
    return payment_system.transfer(amount, to_account)

# El guard se inyecta en el momento de la invocación
response = await agent.run("Transferir $500 a ACC-002", deps=guard)
```

| Decisión ACP | Acción | El agente ve |
|---|---|---|
| `APPROVED` | Cuerpo de herramienta ejecutado | Resultado + ET registrado |
| `ESCALATED` | `ModelRetry` lanzado | Reintento/abort → reporta al usuario |
| `DENIED` | `ModelRetry` lanzado | Reintento/abort → reporta al usuario |

---

## `mcp_server_demo.py` — Integración con servidor MCP

Muestra cómo agregar control de admisión ACP a nivel del dispatcher MCP usando
`ACPToolDispatcher`. Cada solicitud `tools/call` pasa por ACP antes de que el
handler se ejecute. Compatible con Claude Desktop y cualquier cliente MCP.

```bash
pip install cryptography>=42.0.0

# Demo del dispatcher (sin paquete MCP requerido)
python examples/mcp_server_demo.py

# Iniciar servidor FastMCP real (para Claude Desktop)
pip install mcp
python examples/mcp_server_demo.py --server
```

### El `ACPToolDispatcher`

```python
from mcp_server_demo import ACPToolDispatcher, ACPAdmissionGuard

dispatcher = ACPToolDispatcher(guard)

@dispatcher.tool(
    capability="acp:cap:financial.payment",
    resource="bank://accounts/*",
    risk_params=["amount"],
)
def transfer_funds(amount: float, to_account: str) -> str:
    """Transfiere fondos. El cuerpo solo se ejecuta si ACP dice APPROVED."""
    return payment_system.transfer(amount, to_account)

# Montar en FastMCP
from mcp.server.fastmcp import FastMCP
mcp_server = FastMCP("acp-banking")
dispatcher.mount(mcp_server)
mcp_server.run()
```

Formato de respuesta MCP:

| Decisión ACP | `isError` | `content[0].text` |
|---|---|---|
| `APPROVED` | `false` | Resultado + referencia ET |
| `ESCALATED` | `true` | Aviso de escalación + ID |
| `DENIED` | `true` | Aviso de denegación + risk score |

### Configuración Claude Desktop

```json
{
  "mcpServers": {
    "acp-banking": {
      "command": "python",
      "args": ["/ruta/a/impl/python/examples/mcp_server_demo.py", "--server"]
    }
  }
}
```

---

## Ejecutar con el servidor de referencia ACP

Los tres demos de integración soportan `--online` para ejecutarse contra el servidor
de referencia ACP en lugar de la capa crypto offline:

```bash
docker run -p 8080:8080 \
  -e ACP_INSTITUTION_PUBLIC_KEY=cA4s58S2dEJ-qye6EpJaJKKaVfvPT8mAQf97Vo8TInk \
  ghcr.io/chelof100/acp-server:latest

python examples/admission_control_demo.py --online
python examples/langchain_agent_demo.py --online
python examples/pydantic_ai_demo.py --online
python examples/mcp_server_demo.py --online
```
