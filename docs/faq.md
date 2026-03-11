# ACP — Preguntas Frecuentes

## ¿Qué es ACP?

ACP (Agent Control Protocol) es un estándar de protocolo — como JWT u OAuth — que define gobernanza constitucional para agentes autónomos. No es una librería de software. La spec es el producto; las implementaciones son evidencia de que la spec funciona.

## ¿Es ACP un software que puedo instalar?

No. ACP es una especificación. Tú la implementas. Existen implementaciones de referencia en [`impl/`](../impl/) para demostrar que la spec es implementable, pero el artefacto autoritativo es la spec en [`spec/`](../spec/).

## ¿Cómo se relaciona ACP con MIR y ARAF?

ACP está en la capa 4 del Stack de Gobernanza de Agentes (Gobernanza de Ejecución). Produce la evidencia criptográfica — aserciones de identidad, pruebas de delegación, snapshots de política — que:
- **MIR** (capa de historial, L5) consume para construir historial verificable de agentes
- **ARAF** (capa de arquitectura de riesgo, L8) consume para producir scores de riesgo y trazas de responsabilidad

## ¿Cuál es el mínimo que necesito implementar?

La conformidad L1-CORE requiere:
- `ACP-AGENT-1.0` — modelo de identidad del agente
- `ACP-CAP-REG-1.0` — registro de capacidades

Ver [`docs/quickstart.md`](quickstart.md) para una guía paso a paso.

## ¿Qué diferencia a ACP de otros frameworks de agentes?

ACP se enfoca exclusivamente en **gobernanza en tiempo de ejecución** — el momento en que un agente decide actuar. Responde: *¿por qué autoridad toma este agente esta acción, ahora, bajo la política vigente?*

La mayoría de los frameworks se centran en capacidad (qué puede hacer un agente). ACP se centra en provenance de autoridad (de dónde vino el derecho a hacerlo).

## ¿Qué es Authority Provenance?

Un objeto estructurado que prueba, en tiempo de ejecución, la cadena completa de autoridad detrás de la acción de un agente:
- Qué principal delegó originalmente
- A través de qué cadena de delegación
- Bajo qué contexto de política
- En qué momento

Está siendo formalizado en `ACP-PROVENANCE-1.0` (en progreso).

## ¿Puede ACP funcionar sin un emisor central de identidad?

Sí. La sección `spec/decentralized/` (ACP-D) define arquitectura para operación descentralizada sin ancla de confianza central. Corresponde a conformidad L5-DECENTRALIZED.

## ¿Cómo contribuyo?

Ver [`CONTRIBUTING.md`](../CONTRIBUTING.md) y [`spec/governance/RFC-PROCESS.md`](../spec/governance/RFC-PROCESS.md).
