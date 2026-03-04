# ACP Framework — Quickstart (15 minutos)

Este framework tiene tres niveles. Comenzá por el que coincide con tu rol.

---

## El framework en 5 minutos

ACP no es solo un protocolo. Es un framework completo de tres niveles:

| Nivel | Qué define | Dónde |
|---|---|---|
| **1 — Arquitectura de IA Soberana** | Por qué la independencia del proveedor de IA es un requisito arquitectónico | [`01-arquitectura-soberana/`](01-arquitectura-soberana/) |
| **2 — Modelo GAT** | Cómo estructurar organizaciones que operan agentes autónomos | [`02-modelo-gat/`](02-modelo-gat/) |
| **3 — ACP Protocol** | La implementación criptográficamente verificable de los principios anteriores | [`03-protocolo-acp/`](03-protocolo-acp/) |

**Invariante central:**
```
Execute(request) ⟹ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk
```

---

## Elegí tu camino (10 minutos)

### Camino A — Quiero entender el framework estratégico

1. [`01-arquitectura-soberana/Arquitectura-Soberana-de-IA.md`](01-arquitectura-soberana/Arquitectura-Soberana-de-IA.md) — Por qué la soberanía
2. [`02-modelo-gat/GAT-Maturity-Model.md`](02-modelo-gat/GAT-Maturity-Model.md) — Modelo de madurez 0-5
3. [`02-modelo-gat/Arquitectura-Tres-Capas.md`](02-modelo-gat/Arquitectura-Tres-Capas.md) — Síntesis de los 3 niveles

### Camino B — Quiero entender el diseño del protocolo

1. [`02-modelo-gat/ACP-Architecture-Specification.md`](02-modelo-gat/ACP-Architecture-Specification.md) — Arquitectura técnica unificada
2. [`03-protocolo-acp/especificacion/nucleo/ACP-SIGN-1.0.md`](03-protocolo-acp/especificacion/nucleo/ACP-SIGN-1.0.md) — Capa criptográfica base
3. [`03-protocolo-acp/especificacion/nucleo/ACP-CT-1.0.md`](03-protocolo-acp/especificacion/nucleo/ACP-CT-1.0.md) — Formato del Capability Token

### Camino C — Quiero implementar ACP

1. [`03-protocolo-acp/especificacion/gobernanza/ACP-CONF-1.1.md`](03-protocolo-acp/especificacion/gobernanza/ACP-CONF-1.1.md) — Qué requiere cada nivel L1-L5
2. [`03-protocolo-acp/cumplimiento/ACP-TS-1.1.md`](03-protocolo-acp/cumplimiento/ACP-TS-1.1.md) — Formato de vectores de prueba
3. [`03-protocolo-acp/cumplimiento/ACP-IUT-PROTOCOL-1.0.md`](03-protocolo-acp/cumplimiento/ACP-IUT-PROTOCOL-1.0.md) — Contrato runner ↔ implementación
4. [`03-protocolo-acp/cumplimiento/ACR-1.0.md`](03-protocolo-acp/cumplimiento/ACR-1.0.md) — Ejecutar el compliance runner
5. [`03-protocolo-acp/test-vectors/`](03-protocolo-acp/test-vectors/) — 12 vectores normativos listos para usar

### Camino E — Quiero correr la implementación de referencia

**Prerrequisitos:** Docker, Git, Go 1.21+ (o solo Docker)

**Paso 1 — Clonar e iniciar el servidor**
```bash
git clone https://github.com/chelof100/acp-framework
cd acp-framework/07-implementacion-referencia

# Iniciar el servidor Go (usa clave de prueba RFC 8037 para desarrollo)
export ACP_INSTITUTION_PUBLIC_KEY=cA4s58S2dEJ-qye6ggvPbw-uvmjgn-hWQpIRTkHcakE
docker compose up -d

# Verificar
curl http://localhost:8080/acp/v1/health
# {"status":"ok","version":"1.0.0"}
```

**Paso 2 — Elegí tu SDK**

*Python:*
```bash
cd sdk/python
pip install -e ".[dev]"
ACP_SERVER_URL=http://localhost:8080 python examples/agent_payment.py
```

*TypeScript (Node.js 18+):*
```bash
cd sdk/typescript
npm install
```
```typescript
import { AgentIdentity, ACPSigner, ACPClient } from './src';

const agent = AgentIdentity.generate();
const signer = new ACPSigner(agent);
const client = new ACPClient('http://localhost:8080', agent, signer);

// Registrar agente con la institución
await client.register();
console.log('Agent ID:', agent.agentId);
console.log('DID:', agent.did);

// Health check
const health = await client.health();
console.log('Servidor:', health);
```

*Rust:*
```bash
cd sdk/rust
cargo test  # 43 tests
```
```rust
use acp_sdk::{AgentIdentity, ACPSigner, ACPClient};

let agent = AgentIdentity::generate();
let signer = ACPSigner::new(&agent);
let client = ACPClient::new("http://localhost:8080", agent, signer);

client.register().await?;
println!("Agent ID: {}", client.agent_id());
```

**Paso 3 — Ejecutar la suite de cumplimiento**
```bash
cd 07-implementacion-referencia/acp-go

# Ejecutar IUT contra los 12 vectores ACP-TS-1.1
go test ./pkg/iut/... -v
# 12/12 PASS → CONFORMANT L1+L2

# O ejecutar el compliance runner completo
go run ./cmd/acp-runner --impl ./acp-evaluate.exe --suite ../../../03-protocolo-acp/test-vectors
```

→ Documentación completa: [`07-implementacion-referencia/README.md`](07-implementacion-referencia/README.md)

### Camino D — Quiero contribuir al framework

1. [`CONTRIBUTING.md`](CONTRIBUTING.md) — Proceso RFC para cambios normativos
2. [`SECURITY.md`](SECURITY.md) — Divulgación responsable de vulnerabilidades
3. [`02-modelo-gat/Roadmap.md`](02-modelo-gat/Roadmap.md) — Estado actual y próximos pasos

---

## Niveles de Conformidad

| Nivel | Nombre | Requiere |
|---|---|---|
| **L1** | CORE | SIGN + CT + CAP-REG + HP |
| **L2** | SECURITY | L1 + RISK + REV + ITA-1.0 |
| **L3** | FULL | L2 + API + EXEC + LEDGER |
| **L4** | EXTENDED | L3 + PAY + REP + ITA-1.1 |
| **L5** | DECENTRALIZED | L4 + ACP-D + quórum BFT |

La mayoría de los despliegues en producción apuntan a **L3** o **L4**.

---

## Conceptos Clave

**Capability Token (CT):** Objeto JSON firmado que otorga a un agente permiso para ejecutar una acción específica. Contiene: DID del agente, permisos, expiración, firma del emisor.

**ITA (Institutional Trust Anchor):** Entidad autorizada para emitir Capability Tokens. Puede ser centralizada (clave única) o distribuida (quórum BFT).

**DCMA (Delegation Chain):** Mecanismo para que agentes deleguen sub-capacidades, con garantías de no-escalada y revocación transitiva.

**DID (Decentralized Identifier):** Identidad criptográfica del agente, independiente del proveedor o plataforma.

---

## Preguntas y Contribuciones

- Preguntas generales: GitHub Discussions
- Vulnerabilidades de seguridad: [`SECURITY.md`](SECURITY.md)
- Cambios normativos: proceso RFC en [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Contacto: info@traslaia.com
