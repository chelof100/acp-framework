# ACP — Visión General de la Arquitectura

> **Agent Control Protocol (ACP)** — infraestructura de gobernanza para sistemas autónomos con trazabilidad de responsabilidad.

## Invariante Central

```
Execute(req) ⟹ ValidIdentity ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk
```

## Marco de Tres Capas

| Capa | Nombre | Propósito |
|------|--------|-----------|
| L1 | Arquitectura Soberana de IA | Doctrina fundacional de gobernanza |
| L2 | Modelo GAT | Modelo de madurez Gobernanza-Accountability-Trazabilidad |
| L3 | Protocolo ACP | Capa de ejecución constitucional |

## Stack de Gobernanza de Agentes (8 Capas)

```
┌─────────────────────────────────────────────────────┐
│  L8  Arquitectura de Riesgo    (integración ARAF)   │
│  L7  Reputación                                     │
│  L6  Trazabilidad de Responsabilidad                │
│  L5  Historia Verificable      (integración MIR)    │
│  L4  ► Gobernanza de Ejecución ◄  (ACP)             │
│  L3  Delegación                                     │
│  L2  Capacidad                                      │
│  L1  Identidad                                      │
└─────────────────────────────────────────────────────┘
```

ACP es la **capa de evidencia de gobernanza**: produce las aserciones criptográficas, pruebas de delegación y snapshots de política que las capas L5–L8 consumen.

## Niveles de Conformidad (ACP-CONF-1.1)

| Nivel | Nombre | Descripción |
|-------|--------|-------------|
| L1-CORE | Mínimo | Validación de identidad y capacidad |
| L2-SECURITY | Seguro | + Firma criptográfica (ACP-SIGN-1.0) |
| L3-FULL | Completo | + Cadenas de delegación (ACP-DCMA-1.0) |
| L4-EXTENDED | Extendido | + Historia + scoring de riesgo |
| L5-DECENTRALIZED | Soberano | + Sin emisor central (ACP-D) |

## Especificaciones Clave

- [`spec/core/`](../spec/core/) — Identidad, capacidad, delegación, firma
- [`spec/governance/`](../spec/governance/) — Conformidad, trust scoring, proceso RFC
- [`spec/operations/`](../spec/operations/) — API, operaciones bulk, runtime
- [`spec/extensions/`](../spec/extensions/) — Historia, privacidad, cross-domain
- [`spec/decentralized/`](../spec/decentralized/) — Arquitectura descentralizada (ACP-D)

## Ecosistema

- **MIR** (capa de historial de participación) — consume historia verificable de ACP
- **ARAF** (capa de arquitectura de riesgo) — consume evidencia de riesgo de ACP
