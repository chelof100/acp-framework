# ACP Framework — Quickstart (15 minutos)

Este framework tiene tres niveles. Empezá por el que corresponda a tu rol.

---

## El framework en 5 minutos

ACP no es solo un protocolo. Es un marco completo de tres niveles:

| Nivel | Qué define | Dónde |
|---|---|---|
| **1 — Arquitectura Soberana de IA** | Por qué la independencia de proveedores de IA es un requisito arquitectónico | [`01-arquitectura-soberana/`](01-arquitectura-soberana/) |
| **2 — Modelo GAT** | Cómo estructurar organizaciones que operan agentes autónomos | [`02-modelo-gat/`](02-modelo-gat/) |
| **3 — Protocolo ACP** | La implementación criptográfica verificable de los principios anteriores | [`03-protocolo-acp/`](03-protocolo-acp/) |

**Invariante central:**
```
Execute(request) ⟹ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk
```

---

## Elige tu camino (10 minutos)

### Camino A — Quiero entender el framework estratégico

1. [`01-arquitectura-soberana/Arquitectura-Soberana-de-IA.md`](01-arquitectura-soberana/Arquitectura-Soberana-de-IA.md) — Por qué soberanía
2. [`02-modelo-gat/GAT-Maturity-Model.md`](02-modelo-gat/GAT-Maturity-Model.md) — Modelo de madurez 0-5
3. [`02-modelo-gat/Arquitectura-Tres-Capas.md`](02-modelo-gat/Arquitectura-Tres-Capas.md) — Síntesis de los 3 niveles

### Camino B — Quiero entender el diseño del protocolo

1. [`02-modelo-gat/ACP-Architecture-Specification.md`](02-modelo-gat/ACP-Architecture-Specification.md) — Arquitectura técnica unificada
2. [`03-protocolo-acp/especificacion/nucleo/ACP-SIGN-1.0.md`](03-protocolo-acp/especificacion/nucleo/ACP-SIGN-1.0.md) — Capa criptográfica base
3. [`03-protocolo-acp/especificacion/nucleo/ACP-CT-1.0.md`](03-protocolo-acp/especificacion/nucleo/ACP-CT-1.0.md) — Formato Capability Token

### Camino C — Quiero implementar ACP

1. [`03-protocolo-acp/especificacion/gobernanza/ACP-CONF-1.1.md`](03-protocolo-acp/especificacion/gobernanza/ACP-CONF-1.1.md) — Qué requiere cada nivel L1-L5
2. [`03-protocolo-acp/cumplimiento/ACP-TS-1.1.md`](03-protocolo-acp/cumplimiento/ACP-TS-1.1.md) — Formato de vectores de prueba
3. [`03-protocolo-acp/cumplimiento/ACP-IUT-PROTOCOL-1.0.md`](03-protocolo-acp/cumplimiento/ACP-IUT-PROTOCOL-1.0.md) — Contrato runner ↔ implementación
4. [`03-protocolo-acp/cumplimiento/ACR-1.0.md`](03-protocolo-acp/cumplimiento/ACR-1.0.md) — Ejecutar compliance runner
5. [`03-protocolo-acp/test-vectors/`](03-protocolo-acp/test-vectors/) — 12 vectores normativos listos para usar

### Camino D — Quiero contribuir al framework

1. [`CONTRIBUTING.md`](CONTRIBUTING.md) — Proceso RFC para cambios normativos
2. [`SECURITY.md`](SECURITY.md) — Divulgación responsable de vulnerabilidades
3. [`02-modelo-gat/Roadmap.md`](02-modelo-gat/Roadmap.md) — Estado actual y próximos pasos

---

## Niveles de conformidad

| Nivel | Nombre | Requiere |
|---|---|---|
| **L1** | CORE | SIGN + CT + CAP-REG + HP |
| **L2** | SECURITY | L1 + RISK + REV + ITA-1.0 |
| **L3** | FULL | L2 + API + EXEC + LEDGER |
| **L4** | EXTENDED | L3 + PAY + REP + ITA-1.1 |
| **L5** | DECENTRALIZED | L4 + ACP-D + BFT quorum |

La mayoría de despliegues productivos apuntan a **L3** o **L4**.

---

## Conceptos clave

**Capability Token (CT):** Objeto JSON firmado que otorga a un agente permiso para ejecutar una acción específica. Contiene: DID del agente, permisos, expiración, firma del emisor.

**ITA (Institutional Trust Anchor):** Entidad autorizada a emitir Capability Tokens. Puede ser centralizada (una clave) o distribuida (quórum BFT).

**DCMA (Delegation Chain):** Mecanismo para que agentes deleguen sub-capacidades, con garantías de no-escalación y revocación transitiva.

**DID (Decentralized Identifier):** Identidad criptográfica del agente, independiente de proveedor o plataforma.

---

## Preguntas y contribuciones

- Preguntas generales: GitHub Discussions
- Vulnerabilidades de seguridad: [`SECURITY.md`](SECURITY.md)
- Cambios normativos: proceso RFC en [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Contacto: info@traslaia.com
