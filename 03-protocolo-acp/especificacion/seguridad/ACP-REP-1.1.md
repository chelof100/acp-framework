Adaptive Capability Protocol — Reputation Extension
Internet-Draft

Status: Standards Track

Abstract

ACP-REP-1.1 introduce un modelo reputacional cuantificable para autoridades, verificadores y sujetos dentro del ecosistema ACP.

1. Introduction

La tolerancia bizantina define un límite teórico. ACP-REP añade una capa adaptativa que reduce riesgo antes de alcanzar ese límite.

2. Terminology

Interpretación conforme a IETF RFC 2119.

3. Reputation Model

Cada entidad tiene:

ReputationScore ∈ [0,1]
4. Update Function

Después de cada evento verificable:

score' = α·score + β·event_metric

Donde:

α ∈ (0,1)

β ∈ (0,1)

α + β ≤ 1

5. Event Metrics

event_metric MAY incluir:

Firma inválida detectada

Firma tardía

Token mal formado

Revocación incorrecta

Auditoría superada

6. Usage in Policy

Un sistema ACP MAY:

Requerir reputación mínima

Reducir expiración para baja reputación

Incrementar requisitos de quorum dinámicamente

7. Authority Governance

Si:

ReputationScore < threshold

Se activa:

Auditoría automática

Restricción temporal

Posible proceso de remoción (ACP-ITA)

8. Security Considerations

Mitiga:

Degradación lenta del sistema

Ataques oportunistas

Colusión progresiva

Debe evitarse manipulación reputacional mediante:

Pruebas verificables

Registro público de eventos

Penalización por denuncias falsas

9. IANA Considerations

No requiere asignaciones.

10. Normative References

RFC 2119

Byzantine systems research

Reputation systems literature