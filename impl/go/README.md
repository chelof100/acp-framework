# ACP Go — Servidor de Referencia

Implementación de referencia del **Agent Control Protocol (ACP)** en Go 1.22.
Servidor HTTP que implementa las especificaciones core del protocolo para entornos de agentes IA autónomos.

## Especificaciones implementadas

| Spec | Descripción | Estado |
|------|-------------|--------|
| ACP-HP-1.0 | Handshake Protocol — challenge/verify con Proof of Possession | ✅ |
| ACP-SIGN-1.0 | Firmas Ed25519 determinísticas con JCS (RFC 8785) | ✅ |
| ACP-CT-1.0 | Capability Tokens — delegación verificable de permisos | ✅ |
| ACP-RISK-1.0 | Motor de evaluación de riesgo (score 0–100, 3 niveles) | ✅ |
| ACP-REV-1.0 | Revocación de tokens y agentes | ✅ |
| ACP-REP-1.1 | Motor de reputación de agentes | ✅ |
| ACP-API-1.0 | Middleware de validación + response envelopes + OpenAPI spec | ✅ |
| ACP-EXEC-1.0 | Execution Tokens single-use (máx. 300 segundos) | ✅ |
| ACP-LEDGER-1.0 | Audit Ledger append-only con hash chain SHA-256 | ✅ |

## Estructura de paquetes

```
pkg/
├── api/         # ACP-API-1.0: middleware, request IDs, response envelopes firmados
├── crypto/      # Primitivas: Ed25519, JCS, SHA-256, base58, base64url
├── delegation/  # Cadena de delegación de capability tokens
├── execution/   # ACP-EXEC-1.0: emission y consumo de execution tokens
├── handshake/   # ACP-HP-1.0: challenge/verify con Proof of Possession
├── iut/         # IUT — compliance runner contra test vectors normativos
├── ledger/      # ACP-LEDGER-1.0: audit log append-only con hash chain
├── registry/    # Registro de agentes con niveles de autonomía
├── reputation/  # ACP-REP-1.1: motor de reputación
├── revocation/  # ACP-REV-1.0: store de revocación
├── risk/        # ACP-RISK-1.0: evaluación de riesgo y umbrales de decisión
└── tokens/      # ACP-CT-1.0: emisión y verificación de capability tokens
```

## Requisitos

- Go 1.22+
- Dependencias: `github.com/gowebpki/jcs v1.0.1` (JCS RFC 8785, solo para el ledger)

## Build y tests

```bash
# Compilar todo
go build ./...

# Ejecutar todos los tests
go test ./... -count=1

# Verificar estilo
go vet ./...
```

## Variables de entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `ACP_INSTITUTION_PUBLIC_KEY` | ✅ | — | Clave pública Ed25519 (base64url). Necesaria para iniciar. |
| `ACP_INSTITUTION_PRIVATE_KEY` | ❌ | — | Clave privada Ed25519 (base64url). Habilita firma de respuestas. Sin ella, el servidor corre en modo dev (no firma). |
| `ACP_INSTITUTION_ID` | ❌ | `org.acp.server` | Identificador de institución para el audit ledger. |
| `ACP_ADDR` | ❌ | `:8080` | Dirección y puerto de escucha. |
| `ACP_LOG_LEVEL` | ❌ | `info` | Nivel de logging. |

## Ejecución

```bash
export ACP_INSTITUTION_PUBLIC_KEY="cA4s58S2dEJ-qye6ggvPbw-uvmjgn-hWQpIRTkHcakE"
export ACP_INSTITUTION_PRIVATE_KEY="<base64url_privkey_64_bytes>"
export ACP_INSTITUTION_ID="org.mi-institucion"
go run ./cmd/acp-server
```

### Con Docker

```bash
docker compose up
```

Configura `ACP_INSTITUTION_PUBLIC_KEY` y opcionalmente `ACP_INSTITUTION_PRIVATE_KEY` en el entorno o en un archivo `.env`.

## Endpoints

| Método | Path | Spec | Descripción |
|--------|------|------|-------------|
| `GET` | `/acp/v1/handshake/challenge` | ACP-HP-1.0 | Obtener nonce de challenge para PoP |
| `POST` | `/acp/v1/verify` | ACP-HP-1.0 | Verificar Proof of Possession |
| `POST` | `/acp/v1/agents` | ACP-API-1.0 | Registrar agente con clave pública |
| `GET` | `/acp/v1/agents/{agent_id}` | ACP-API-1.0 | Consultar datos de agente |
| `POST` | `/acp/v1/agents/{agent_id}/state` | ACP-API-1.0 | Cambiar estado del agente (active/suspended/revoked) |
| `POST` | `/acp/v1/authorize` | ACP-RISK-1.0 | Solicitar autorización — evalúa riesgo, decide APPROVED/DENIED/ESCALATED |
| `POST` | `/acp/v1/authorize/escalations/{id}/resolve` | ACP-RISK-1.0 | Resolver escalación manual |
| `POST` | `/acp/v1/tokens` | ACP-CT-1.0 | Emitir capability token |
| `POST` | `/acp/v1/exec-tokens/{et_id}/consume` | ACP-EXEC-1.0 | Consumir execution token (single-use) |
| `GET` | `/acp/v1/exec-tokens/{et_id}/status` | ACP-EXEC-1.0 | Consultar estado de execution token |
| `POST` | `/acp/v1/audit/query` | ACP-LEDGER-1.0 | Consultar eventos del audit ledger |
| `GET` | `/acp/v1/audit/verify/{event_id}` | ACP-LEDGER-1.0 | Verificar integridad de evento en cadena |
| `GET` | `/acp/v1/rev/check` | ACP-REV-1.0 | Verificar si un token está revocado |
| `POST` | `/acp/v1/rev/revoke` | ACP-REV-1.0 | Revocar token o agente |
| `GET` | `/acp/v1/rep/{agent_id}` | ACP-REP-1.1 | Obtener reputación de agente |
| `GET` | `/acp/v1/rep/{agent_id}/events` | ACP-REP-1.1 | Historial de eventos de reputación |
| `POST` | `/acp/v1/rep/{agent_id}/state` | ACP-REP-1.1 | Actualizar estado de reputación |
| `GET` | `/acp/v1/health` | — | Health check con estado de componentes |

## ACP-LEDGER-1.0 — Audit Ledger

El ledger registra todos los eventos relevantes del sistema en una cadena verificable:

- **11 tipos de eventos**: `AUTHORIZATION`, `RISK_EVALUATION`, `REVOCATION`, `TOKEN_ISSUED`, `EXECUTION_TOKEN_ISSUED`, `EXECUTION_TOKEN_CONSUMED`, `AGENT_REGISTERED`, `AGENT_STATE_CHANGE`, `ESCALATION_CREATED`, `ESCALATION_RESOLVED`, `LEDGER_GENESIS`
- **Hash chain SHA-256** con JCS (RFC 8785) para determinismo entre implementaciones
- **Firmas Ed25519** institucionales en cada evento
- **`chain_valid`** en todas las respuestas de consulta

```json
{
  "ver": "1.0",
  "event_id": "<uuid_v4>",
  "event_type": "AUTHORIZATION",
  "sequence": 42,
  "timestamp": 1718920000,
  "institution_id": "org.example.banking",
  "prev_hash": "<SHA-256_base64url_del_evento_anterior>",
  "payload": { "decision": "APPROVED", "risk_score": 28 },
  "hash": "<SHA-256_base64url_de_este_evento>",
  "sig": "<firma_institucional_Ed25519>"
}
```

## Clave de prueba (solo desarrollo)

Seed determinístico RFC 8037 key A:
```
seed:    9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae3d55
pubkey:  cA4s58S2dEJ-qye6ggvPbw-uvmjgn-hWQpIRTkHcakE
```

## Invariante fundamental

```
Execute(request) ≡ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk
```

---

**Versión:** 1.5.0 | **Licencia:** Apache 2.0 | **Autor:** Marcelo Fernandez — [TraslaIA](https://traslaia.com)
