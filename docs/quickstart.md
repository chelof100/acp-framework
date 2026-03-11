# ACP — Guía de Inicio Rápido

> Comienza con Agent Control Protocol en menos de 10 minutos.

## ¿Qué es ACP?

ACP es un protocolo de gobernanza — un estándar (no una librería de software) — que define cómo los agentes autónomos deben probar identidad, capacidad y autoridad de delegación antes de ejecutar cualquier acción.

## Prerrequisitos

- Leer [`docs/architecture-overview.md`](architecture-overview.md) para el modelo conceptual
- Elegir un objetivo de conformidad: L1-CORE (mínimo) hasta L5-DECENTRALIZED

## Paso 1 — Comprender el invariante central

Toda ejecución conforme a ACP debe satisfacer:

```
Execute(req) ⟹ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk
```

Ninguna acción procede a menos que los cuatro predicados se cumplan simultáneamente.

## Paso 2 — Elegir nivel de conformidad

| Objetivo | Specs requeridas |
|----------|-----------------|
| L1-CORE | ACP-AGENT-1.0, ACP-CAP-REG-1.0 |
| L2-SECURITY | + ACP-SIGN-1.0 |
| L3-FULL | + ACP-DCMA-1.0, ACP-CT-1.0 |
| L4-EXTENDED | + ACP-LEDGER-1.0, ACP-RISK-1.0 |
| L5-DECENTRALIZED | + ACP-D |

## Paso 3 — Leer las specs

Todas las especificaciones están en [`spec/`](../spec/). Empezar por:

1. [`spec/core/ACP-AGENT-1.0.md`](../spec/core/ACP-AGENT-1.0.md) — Modelo de identidad del agente
2. [`spec/core/ACP-CAP-REG-1.0.md`](../spec/core/ACP-CAP-REG-1.0.md) — Registro de capacidades
3. [`spec/governance/ACP-CONF-1.1.md`](../spec/governance/ACP-CONF-1.1.md) — Niveles de conformidad

## Paso 4 — Explorar la implementación de referencia

Código funcional en [`impl/`](../impl/):
- Go: [`impl/go/`](../impl/go/)
- Python SDK: [`impl/python/`](../impl/python/)
- Rust SDK: [`impl/rust/`](../impl/rust/)
- TypeScript SDK: [`impl/typescript/`](../impl/typescript/)

## Paso 5 — Ejecutar tests de compliance

```bash
cd compliance/
# Ver compliance/README.md para instrucciones de test vectors
```

## Próximos pasos

- [`docs/faq.md`](faq.md) — Preguntas frecuentes
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — Cómo contribuir specs o código
