# ACP Framework — Inicio Rápido

---

## Elegí tu camino

### Camino A — Entender el diseño del protocolo

Comenzá aquí para entender qué resuelve ACP y cómo está estructurado.

1. [`README.md`](README.md) — Qué es ACP y por qué existe
2. [`ARCHITECTURE.md`](ARCHITECTURE.md) — Modelo de dominio formal y grafo de dependencias
3. [`spec/nucleo/ACP-SIGN-1.0.md`](spec/nucleo/ACP-SIGN-1.0.md) — Capa criptográfica base
4. [`spec/nucleo/ACP-CT-1.0.md`](spec/nucleo/ACP-CT-1.0.md) — Formato del Capability Token
5. [`spec/nucleo/ACP-HP-1.0.md`](spec/nucleo/ACP-HP-1.0.md) — Protocolo de Handshake

### Camino B — Implementar ACP

Comenzá aquí si querés construir una implementación conforme a ACP.

1. [`spec/gobernanza/ACP-CONF-1.2.md`](spec/gobernanza/ACP-CONF-1.2.md) — Definición normativa de conformidad (L1–L5)
2. [`openapi/acp-api-1.0.yaml`](openapi/acp-api-1.0.yaml) — Spec OpenAPI 3.1.0 para todos los endpoints HTTP
3. [`compliance/ACP-TS-1.1.md`](compliance/ACP-TS-1.1.md) — Formato de vectores de prueba
4. [`compliance/test-vectors/`](compliance/test-vectors/) — 22 vectores de prueba normativos (CORE · DCMA · HP)
5. [`compliance/ACR-1.0.md`](compliance/ACR-1.0.md) — Protocolo del compliance runner

### Camino C — Ejecutar la implementación de referencia

**Requisitos:** Go 1.22+, Docker (opcional)

**Paso 1 — Compilar e iniciar el servidor**

```bash
git clone https://github.com/chelof100/acp-framework
cd acp-framework/impl/go

# Generar una clave de desarrollo
go run ./cmd/keygen

# Iniciar el servidor (configurar la clave institucional)
export ACP_INSTITUTION_PUBLIC_KEY=<base64url_ed25519_public_key>
go run ./cmd/acp-server
```

**Paso 2 — Verificación de estado**

```bash
curl http://localhost:8080/acp/v1/health
```

```json
{
  "acp_version": "1.0",
  "status": "operational",
  "timestamp": 1718920000,
  "components": {
    "policy_engine": "operational",
    "audit_ledger": "operational",
    "agent_registry": "operational",
    "rev_endpoint": "operational"
  }
}
```

**Paso 3 — Ejecutar los vectores de prueba de conformidad**

```bash
cd impl/go

# Compilar el evaluador IUT
go build ./cmd/acp-evaluate

# Ejecutar la suite de conformidad contra todos los vectores
go run ./cmd/acp-runner \
  --impl ./acp-evaluate \
  --suite ../../compliance/test-vectors

# Esperado: 22/22 PASS → CONFORME L1 (CORE + DCMA + HP)
```

### Camino D — Contribuir al framework

1. [`CONTRIBUTING.md`](CONTRIBUTING.md) — Proceso RFC para cambios normativos
2. [`SECURITY.md`](SECURITY.md) — Divulgación responsable de vulnerabilidades

---

## Niveles de Conformidad

| Nivel | Nombre | Specs requeridas |
|---|---|---|
| **L1** | Núcleo | SIGN · AGENT · CT · CAP-REG · HP · DCMA · MESSAGES |
| **L2** | Seguridad | L1 + RISK · REV · ITA-1.0 |
| **L3** | Ejecución Verificable | L2 + API · EXEC · LEDGER · PROVENANCE · POLICY-CTX · PSN |
| **L4** | Gobernanza | L3 + PAY · REP-1.2 · ITA-1.1 · GOV-EVENTS · LIA · HIST · NOTIFY · DISC · BULK · CROSS-ORG · REP-PORTABILITY |
| **L5** | Federación | L4 + ACP-D · quórum BFT ITA-1.1 |

La mayoría de los despliegues en producción apuntan a **L3** o **L4**.

Requisitos normativos completos: [`spec/gobernanza/ACP-CONF-1.2.md`](spec/gobernanza/ACP-CONF-1.2.md)

---

## Conceptos Clave

**Capability Token (CT):** Objeto JSON firmado que otorga a un agente permiso para ejecutar una acción específica. Contiene: DID del agente, capacidades, expiración, firma del emisor.

**ITA (Institutional Trust Anchor):** Entidad autorizada a emitir Capability Tokens. Centralizada (clave única) o distribuida (quórum BFT).

**DCMA (Delegation Chain):** Delegación multi-salto con garantías de no-escalación y revocación transitiva.

**HP (Handshake Protocol):** Protocolo de desafío/respuesta en dos fases que prueba la posesión de un CT antes de acceder a cualquier endpoint protegido.

**DID (Decentralized Identifier):** Identidad criptográfica del agente, independiente del proveedor o plataforma.

---

## Preguntas y Contribuciones

- Preguntas generales: [GitHub Discussions](https://github.com/chelof100/acp-framework/discussions)
- Vulnerabilidades de seguridad: [`SECURITY.md`](SECURITY.md)
- Cambios normativos: proceso RFC en [`CONTRIBUTING.md`](CONTRIBUTING.md)
