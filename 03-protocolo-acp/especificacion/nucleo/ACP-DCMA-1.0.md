# ACP-DCMA-1.0
## Delegation Chain Model & Attestation — Modelo Formal de Delegación Encadenada

**Status:** Normative
**Version:** 1.0
**Type:** Core Protocol Specification
**Depends-on:** ACP-CT-1.0, ACP-SIGN-1.0, ACP-LEDGER-1.2
**Required-by:** ACP-CONF-1.1 (L1 — Core Conformance)

> Esta especificación es **normativa**. Define el modelo formal de delegación encadenada, no-escalación y revocación transitiva. Toda implementación ACP v1.x que soporte delegación MUST cumplir las propiedades formales aquí definidas.

---

## 1. Extensión del Espacio Formal

Añadimos:

𝐷 → conjunto de delegaciones

𝐼 → conjunto de instituciones

Un agente ahora pertenece a una institución:

𝑂
𝑤
𝑛
𝑒
𝑟
(
𝑎
)
∈
𝐼
Owner(a)∈I
2. Definición Formal de Delegación

Una delegación es una tupla:

𝑑
=
(
𝑎
𝑖
,
𝑎
𝑗
,
𝑐
,
𝜎
,
𝜏
)
d=(a
i
	​

,a
j
	​

,c,σ,τ)

Donde:

𝑎
𝑖
a
i
	​

 = agente delegante

𝑎
𝑗
a
j
	​

 = agente delegado

𝑐
c = capacidad delegada

𝜎
σ = restricciones adicionales

𝜏
τ = intervalo temporal de validez

Interpretación:

El agente 
𝑎
𝑖
a
i
	​

 delega capacidad 
𝑐
c al agente 
𝑎
𝑗
a
j
	​

 bajo restricciones 
𝜎
σ y tiempo 
𝜏
τ.

3. Predicado de Delegación Válida
𝑉
𝑎
𝑙
𝑖
𝑑
𝐷
𝑒
𝑙
𝑒
𝑔
𝑎
𝑡
𝑖
𝑜
𝑛
(
𝑑
)
ValidDelegation(d)

Es verdadero si:

𝑉
𝑎
𝑙
𝑖
𝑑
𝐼
𝐷
(
𝑎
𝑖
)
ValidID(a
i
	​

)

𝑉
𝑎
𝑙
𝑖
𝑑
𝐼
𝐷
(
𝑎
𝑗
)
ValidID(a
j
	​

)

𝐻
𝑎
𝑠
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
(
𝑎
𝑖
,
𝑐
)
HasCapability(a
i
	​

,c)

Firma criptográfica válida de 
𝑎
𝑖
a
i
	​


Tiempo actual ∈ 
𝜏
τ

Restricciones 
𝜎
σ compatibles con límites originales

4. Capacidad Delegada

Definimos:

𝐷
𝑒
𝑙
𝑒
𝑔
𝑎
𝑡
𝑒
𝑑
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
(
𝑎
𝑗
,
𝑐
)
DelegatedCapability(a
j
	​

,c)

Verdadero si existe una delegación válida:

∃
𝑑
∈
𝐷
 tal que 
𝑑
=
(
𝑎
𝑖
,
𝑎
𝑗
,
𝑐
,
𝜎
,
𝜏
)
∧
𝑉
𝑎
𝑙
𝑖
𝑑
𝐷
𝑒
𝑙
𝑒
𝑔
𝑎
𝑡
𝑖
𝑜
𝑛
(
𝑑
)
∃d∈D tal que d=(a
i
	​

,a
j
	​

,c,σ,τ)∧ValidDelegation(d)

Entonces el predicado de capacidad se redefine como:

𝐻
𝑎
𝑠
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
′
(
𝑎
𝑗
,
𝑐
)
  
⟺
  
𝐻
𝑎
𝑠
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
(
𝑎
𝑗
,
𝑐
)
∨
𝐷
𝑒
𝑙
𝑒
𝑔
𝑎
𝑡
𝑒
𝑑
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
(
𝑎
𝑗
,
𝑐
)
HasCapability
′
(a
j
	​

,c)⟺HasCapability(a
j
	​

,c)∨DelegatedCapability(a
j
	​

,c)
5. Restricción de No Escalación

Delegación no puede ampliar privilegios.

Formalmente:

𝐶
𝑜
𝑛
𝑠
𝑡
𝑟
𝑎
𝑖
𝑛
𝑡
𝑠
(
𝑐
𝑑
𝑒
𝑙
𝑒
𝑔
𝑎
𝑡
𝑒
𝑑
)
⊆
𝐶
𝑜
𝑛
𝑠
𝑡
𝑟
𝑎
𝑖
𝑛
𝑡
𝑠
(
𝑐
𝑜
𝑟
𝑖
𝑔
𝑖
𝑛
𝑎
𝑙
)
Constraints(c
delegated
	​

)⊆Constraints(c
original
	​

)

Y:

𝜎
⊆
𝑂
𝑟
𝑖
𝑔
𝑖
𝑛
𝑎
𝑙
𝐿
𝑖
𝑚
𝑖
𝑡
𝑠
(
𝑎
𝑖
,
𝑐
)
σ⊆OriginalLimits(a
i
	​

,c)

Si el delegado intenta ejecutar fuera de esas restricciones:

𝐷
𝑒
𝑐
𝑖
𝑠
𝑖
𝑜
𝑛
(
𝑟
𝑒
𝑞
)
=
𝐷
𝑒
𝑛
𝑖
𝑒
𝑑
Decision(req)=Denied
6. Delegación Encadenada

Permite transitividad controlada.

Cadena:

𝑎
1
→
𝑎
2
→
𝑎
3
a
1
	​

→a
2
	​

→a
3
	​


Es válida si:

Cada delegación intermedia es válida.

No se viola restricción acumulativa.

La profundidad de delegación ≤ límite institucional.

Definimos:

𝐷
𝑒
𝑙
𝑒
𝑔
𝑎
𝑡
𝑖
𝑜
𝑛
𝐷
𝑒
𝑝
𝑡
ℎ
(
𝑎
𝑘
)
≤
𝛿
𝑚
𝑎
𝑥
DelegationDepth(a
k
	​

)≤δ
max
	​


Donde 
𝛿
𝑚
𝑎
𝑥
δ
max
	​

 es parámetro institucional.

7. Evaluación Formal con Delegación

La regla de autorización se modifica:

𝐴
𝑢
𝑡
ℎ
𝑜
𝑟
𝑖
𝑧
𝑒
𝑑
(
𝑟
𝑒
𝑞
)
  
⟺
  
𝑉
𝑎
𝑙
𝑖
𝑑
𝐼
𝐷
(
𝑎
)
∧
𝐻
𝑎
𝑠
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
′
(
𝑎
,
𝑐
)
∧
𝑃
𝑜
𝑙
𝑖
𝑐
𝑦
𝑆
𝑎
𝑡
𝑖
𝑠
𝑓
𝑖
𝑒
𝑑
(
.
.
.
)
∧
𝑊
𝑖
𝑡
ℎ
𝑖
𝑛
𝐿
𝑖
𝑚
𝑖
𝑡
𝑠
(
.
.
.
)
∧
𝐴
𝑐
𝑐
𝑒
𝑝
𝑡
𝑎
𝑏
𝑙
𝑒
𝑅
𝑖
𝑠
𝑘
(
.
.
.
)
Authorized(req)⟺ValidID(a)∧HasCapability
′
(a,c)∧PolicySatisfied(...)∧WithinLimits(...)∧AcceptableRisk(...)

La diferencia está en 
𝐻
𝑎
𝑠
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
′
HasCapability
′
.

8. Encadenamiento de Responsabilidad

Cada delegación genera registro:

𝑒
𝑑
=
(
𝑎
𝑖
,
𝑎
𝑗
,
𝑐
,
𝜎
,
𝜏
,
ℎ
𝑎
𝑠
ℎ
𝑝
𝑟
𝑒
𝑣
)
e
d
	​

=(a
i
	​

,a
j
	​

,c,σ,τ,hash
prev
	​

)

Para una acción ejecutada bajo delegación, el ledger debe poder reconstruir:

𝑎
1
→
𝑎
2
→
.
.
.
→
𝑎
𝑘
a
1
	​

→a
2
	​

→...→a
k
	​


Propiedad obligatoria:

𝐸
𝑥
𝑒
𝑐
𝑢
𝑡
𝑖
𝑜
𝑛
(
𝑎
𝑘
,
𝑐
)
⇒
𝑇
𝑟
𝑎
𝑐
𝑒
𝑎
𝑏
𝑙
𝑒
𝐶
ℎ
𝑎
𝑖
𝑛
(
𝑎
1
,
.
.
.
,
𝑎
𝑘
)
Execution(a
k
	​

,c)⇒TraceableChain(a
1
	​

,...,a
k
	​

)

Si no puede reconstruirse → no válido.

9. Revocación Transitiva

Si:

𝑅
𝑒
𝑣
𝑜
𝑘
𝑒
(
𝑎
𝑖
)
Revoke(a
i
	​

)

Entonces:

∀
𝑑
 donde 
𝑑
𝑒
𝑙
𝑒
𝑔
𝑎
𝑡
𝑜
𝑟
=
𝑎
𝑖
⇒
𝐼
𝑛
𝑣
𝑎
𝑙
𝑖
𝑑
(
𝑑
)
∀d donde delegator=a
i
	​

⇒Invalid(d)

Y recursivamente:

Toda cadena dependiente queda inválida.

Esto evita delegaciones zombis.

10. Modelo Interinstitucional

Para delegación entre instituciones:

𝑂
𝑤
𝑛
𝑒
𝑟
(
𝑎
𝑖
)
≠
𝑂
𝑤
𝑛
𝑒
𝑟
(
𝑎
𝑗
)
Owner(a
i
	​

)

=Owner(a
j
	​

)

Requiere:

TrustAnchor(Owner(a_i), Owner(a_j))

Validación cruzada de certificados

Registro auditable por ambas partes

Delegación B2B solo válida si ambas instituciones pueden verificar la firma.

11. Propiedades de Seguridad

Delegación ACP garantiza:

No ampliación de privilegios.

Revocación propagada.

Trazabilidad completa.

Profundidad limitada.

Firma obligatoria en cada salto.

12. Diferencia Estructural con RBAC

RBAC permite asignación de rol.
No modela:

Delegación con restricciones dinámicas.

Encadenamiento verificable.

Revocación transitiva formal.

Responsabilidad multi-institucional.

ACP sí.

13. Punto Crítico

Ahora ACP tiene:

Modelo de decisión formal

Modelo de identidad

Modelo de delegación encadenada

Propiedades de seguridad demostrables

Estructura auditable

---

14. Revocación Transitiva — Timing Normativo

La sección 9 define la propiedad formal de revocación transitiva. Esta sección establece los requisitos de tiempo de propagación que MUST satisfacer toda implementación conforme.

14.1 Propagación Máxima

Desde que Revoke(aᵢ) es registrado en el sistema de revocación:

El verificador MUST garantizar que toda verificación posterior dentro de τ_propagation ≤ 60 segundos rechace:

- Tokens emitidos por aᵢ
- Tokens de toda cadena de delegación donde aᵢ sea delegante (directo o transitivo)

El verificador MUST consultar el estado de revocación en cada decisión de autorización, sin excepción.

14.2 Caché de Estado de Revocación

Si el verificador utiliza caché del estado de revocación:

- El TTL del caché MUST ser ≤ 30 segundos.
- Entradas expiradas MUST ser invalidadas antes de la siguiente consulta de autorización.
- El verificador MUST aceptar refrescamiento forzado del caché ante cualquier notificación de revocación recibida por canal de eventos.

Una implementación que no usa caché MUST consultar el almacén de revocación en tiempo real en cada decisión.

14.3 Solicitudes en Vuelo

Si una revocación ocurre mientras una solicitud de ejecución está en curso:

- El verificador MUST re-evaluar el estado de revocación del agente y su cadena de delegación antes de emitir la confirmación final de ejecución.
- Una solicitud aprobada antes de la revocación MUST ser denegada si la revocación es detectada antes de la confirmación final.
- El sistema MUST emitir error REVOKED con referencia al jti del token afectado.

14.4 Atomicidad de la Revocación

Revoke(aᵢ) tiene efecto atómico en el estado del sistema:

- No existe estado intermedio donde aᵢ está parcialmente revocado.
- Toda delegación dependiente (directa y transitiva) queda inválida simultáneamente desde el timestamp de revocación.
- El timestamp de revocación MUST ser registrado con precisión de segundos y ser consultable por auditores.

14.5 Non-Compliance por Timing

Una implementación NO es conforme respecto a revocación transitiva si:

- Acepta tokens emitidos por un agente revocado más de 60 segundos después del timestamp de revocación.
- Utiliza un caché de revocación con TTL > 30 segundos.
- Confirma ejecuciones sin re-evaluar estado de revocación cuando la revocación ocurrió durante el procesamiento de la solicitud.
- No registra el timestamp de revocación con precisión de segundos.
