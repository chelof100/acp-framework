4. Formal Agent Specification
4.1 Agent Definition

Un Agente ACP es una entidad computacional autónoma capaz de:

Tomar decisiones dentro de un dominio operativo definido.

Ejecutar acciones sobre recursos controlados.

Declarar su capacidad, contexto y límites.

Ser auditado criptográficamente.

Formalmente definimos un agente como:

𝐴
=
(
𝐼
𝐷
,
𝐶
,
𝑃
,
𝐷
,
𝐿
,
𝑆
)
A=(ID,C,P,D,L,S)

Donde:

ID → Identidad criptográfica única.

C → Conjunto de capacidades declaradas.

P → Políticas activas.

D → Dominio operativo.

L → Límites operacionales.

S → Estado actual verificable.

4.2 Agent Identity (ID)

Cada agente posee una identidad verificable compuesta por:

Public Key

Agent Fingerprint

Issuer Authority

Trust Level

Version

Formato mínimo:

{
  "agent_id": "did:acp:org:agent-001",
  "public_key": "base64",
  "issuer": "acp-root-authority",
  "trust_level": "institutional",
  "version": "0.3"
}

El agent_id debe ser:

Globalmente único

No reutilizable

Firmado por autoridad válida

4.3 Capabilities (C)

Una capacidad es una acción ejecutable dentro de un dominio.

𝐶
=
{
𝑐
1
,
𝑐
2
,
.
.
.
,
𝑐
𝑛
}
C={c
1
	​

,c
2
	​

,...,c
n
	​

}

Cada capacidad tiene la estructura:

{
  "capability_id": "approve_transaction",
  "domain": "finance.payments",
  "constraints": {
    "max_amount": 100000,
    "currency": ["USD", "EUR"]
  }
}

Reglas:

Las capacidades son declarativas.

No implican permiso absoluto.

Son evaluadas dinámicamente bajo políticas.

4.4 Policies (P)

Las políticas determinan cuándo una capacidad puede ser ejercida.

Modelo:

𝐷
𝑒
𝑐
𝑖
𝑠
𝑖
𝑜
𝑛
=
𝑓
(
𝐶
𝑜
𝑛
𝑡
𝑒
𝑥
𝑡
,
𝐶
𝑎
𝑝
𝑎
𝑏
𝑖
𝑙
𝑖
𝑡
𝑦
,
𝑃
𝑜
𝑙
𝑖
𝑐
𝑦
)
Decision=f(Context,Capability,Policy)

Ejemplo:

{
  "policy_id": "tx-policy-01",
  "rule": "amount < 100000 AND risk_score < 0.7",
  "effect": "allow"
}

Tipos de políticas:

Determinísticas

Basadas en riesgo

Contextuales

Temporales

Multi-factor

4.5 Domain (D)

Define el espacio operativo del agente.

Ejemplo:

{
  "domain_id": "finance.payments",
  "scope": [
    "transaction.initiate",
    "transaction.approve"
  ]
}

Un agente no puede operar fuera de su dominio declarado.

4.6 Limits (L)

Los límites establecen restricciones duras:

Máximo de transacciones por hora

Límite monetario

Tiempo de vigencia

Nivel de supervisión requerido

Ejemplo:

{
  "rate_limit": "100/hour",
  "expires_at": "2026-12-31T23:59:59Z",
  "supervision_required": true
}

Los límites son no negociables en tiempo de ejecución.

4.7 State (S)

Estado actual verificable del agente.

𝑆
=
(
𝑚
𝑜
𝑑
𝑒
,
ℎ
𝑒
𝑎
𝑙
𝑡
ℎ
,
𝑡
𝑟
𝑢
𝑠
𝑡
𝑠
𝑐
𝑜
𝑟
𝑒
,
𝑎
𝑢
𝑑
𝑖
𝑡
ℎ
𝑎
𝑠
ℎ
)
S=(mode,health,trust
s
	​

core,audit
h
	​

ash)

Ejemplo:

{
  "mode": "active",
  "health": "ok",
  "trust_score": 0.92,
  "audit_hash": "sha256-abc123"
}
5. Agent Lifecycle
5.1 Registration

Generación de identidad criptográfica.

Declaración de dominio.

Declaración de capacidades.

Validación por autoridad.

Emisión de certificado ACP.

5.2 Activation

Un agente se activa solo si:

ID válido

Certificado no revocado

Políticas cargadas

Límites definidos

5.3 Operation Flow

Proceso de decisión:

Request → Capability Check → Policy Evaluation → 
Limit Verification → Decision → Execution → Audit Log

Formalmente:

𝐸
𝑥
𝑒
𝑐
𝑢
𝑡
𝑒
(
𝐴
,
𝑎
𝑐
𝑡
𝑖
𝑜
𝑛
)
⇒
𝑉
𝑎
𝑙
𝑖
𝑑
(
𝐼
𝐷
)
∧
𝐴
𝑙
𝑙
𝑜
𝑤
𝑒
𝑑
(
𝐶
,
𝑃
)
∧
𝑊
𝑖
𝑡
ℎ
𝑖
𝑛
(
𝐿
)
Execute(A,action)⇒Valid(ID)∧Allowed(C,P)∧Within(L)
5.4 Suspension

Un agente puede ser:

Suspendido por riesgo alto

Revocado por autoridad

Auto-desactivado por fallo interno

5.5 Revocation

La revocación implica:

Invalidez inmediata del ID

Inclusión en lista CRL ACP

Registro permanente en log inmutable

6. Trust Model

ACP opera bajo:

Identidad criptográfica fuerte

Evaluación continua

Registro auditable

Confianza contextual, no permanente

No existe confianza estática.

7. Security Properties

ACP garantiza:

No escalación implícita de privilegios

Auditabilidad completa

Capacidad declarativa y verificable

Evaluación contextual obligatoria

Separación entre identidad y autorización

8. Minimal Conformance Requirements

Un sistema cumple ACP si:

Implementa identidad verificable

Evalúa políticas dinámicamente

Registra eventos auditables

Permite revocación efectiva

Separa capacidad de autorización