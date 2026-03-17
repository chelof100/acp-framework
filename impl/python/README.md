# ACP Python SDK

SDK de Python para el Agent Control Protocol (ACP) — control de admisión para acciones de agentes.

## Instalación

```bash
pip install -e .
```

Requiere Python 3.10+. La única dependencia es `cryptography>=42.0.0`.

## Inicio rápido

```python
from acp.identity import AgentIdentity
from acp.signer import ACPSigner

# Generar identidad de agente
agent = AgentIdentity.generate()
print(agent.agent_id)   # base58(SHA-256(clave_pública))

# Firmar y verificar un capability token
signer = ACPSigner(agent)
token = signer.sign_capability({
    "ver": "1.0",
    "iss": agent.did,
    "sub": agent.agent_id,
    "cap": ["acp:cap:financial.payment"],
    "resource": "bank://accounts/ACC-001",
    "exp": 9999999999,
    "nonce": "abc123",
})
assert ACPSigner.verify_capability(token, agent.public_key_bytes)
```

## Ejemplos

```bash
# Patrón de control de admisión (offline, sin servidor)
python examples/admission_control_demo.py

# Integración con LangChain (offline)
python examples/langchain_agent_demo.py

# Integración con LangChain (con LLM real)
pip install langchain langchain-openai
export OPENAI_API_KEY=sk-...
python examples/langchain_agent_demo.py --with-llm
```

Ver `examples/README.md` para documentación completa.

## Repositorio

https://github.com/chelof100/acp-framework
https://agentcontrolprotocol.xyz
