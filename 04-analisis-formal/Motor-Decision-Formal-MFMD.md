1. Espacio Formal

Definimos los siguientes conjuntos:

𝐴 → conjunto de agentes

𝐶 → conjunto de capacidades

𝑃 → conjunto de políticas

𝐿 → conjunto de límites

𝑅 → conjunto de recursos

𝑋 → conjunto de contextos

𝐸 → conjunto de eventos

Una acción solicitada se modela como:

𝑟
𝑒
𝑞
=
(
𝑎
,
𝑐
,
𝑟
,
𝑥
,
𝑡
)
req=(a,c,r,x,t)

Donde:

𝑎
∈
𝐴
a∈A

𝑐
∈
𝐶
c∈C

𝑟
∈
𝑅
r∈R

𝑥
∈
𝑋
x∈X

𝑡
t = timestamp

2. Predicados Fundamentales

Definimos los siguientes predicados booleanos:

2.1 Identidad válida
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
ValidID(a)

Verdadero si:

Identidad criptográfica válida

No revocada

Estado = active

2.2 Capacidad declarada
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
,
𝑐
)
HasCapability(a,c)

Verdadero si:

𝑐
∈
𝐶
𝑎
c∈C
a
	​


Pertenece al dominio autorizado del agente

2.3 Política satisfecha
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
𝑎
,
𝑐
,
𝑟
,
𝑥
)
PolicySatisfied(a,c,r,x)

Evalúa reglas declaradas:

Condiciones de contexto

Umbrales cuantitativos

Restricciones temporales

2.4 Límites respetados
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
𝑎
,
𝑐
,
𝑡
)
WithinLimits(a,c,t)

Evalúa:

Rate limits

Límite acumulado

Vigencia temporal

Supervisión requerida

2.5 Riesgo aceptable

Definimos función de riesgo:

𝑅
𝑖
𝑠
𝑘
:
(
𝑎
,
𝑐
,
𝑟
,
𝑥
)
→
[
0
,
1
]
Risk:(a,c,r,x)→[0,1]

Y umbral institucional:

𝜃
∈
[
0
,
1
]
θ∈[0,1]

Entonces:

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
𝑎
,
𝑐
,
𝑟
,
𝑥
)
  
⟺
  
𝑅
𝑖
𝑠
𝑘
(
𝑎
,
𝑐
,
𝑟
,
𝑥
)
<
𝜃
AcceptableRisk(a,c,r,x)⟺Risk(a,c,r,x)<θ
3. Regla Formal de Autorización

La autorización se define como:

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
𝑎
,
𝑐
,
𝑟
,
𝑥
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
𝑎
,
𝑐
,
𝑡
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
𝑎
,
𝑐
,
𝑟
,
𝑥
)
Authorized(req)⟺ValidID(a)∧HasCapability(a,c)∧PolicySatisfied(a,c,r,x)∧WithinLimits(a,c,t)∧AcceptableRisk(a,c,r,x)

Si cualquiera de los predicados es falso → Denied.

4. Estados de Decisión

Definimos función de decisión:

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
→
{
𝐴
𝑝
𝑝
𝑟
𝑜
𝑣
𝑒
𝑑
,
𝐷
𝑒
𝑛
𝑖
𝑒
𝑑
,
𝐸
𝑠
𝑐
𝑎
𝑙
𝑎
𝑡
𝑒
𝑑
}
Decision(req)→{Approved,Denied,Escalated}

Formalmente:

Caso 1 — Approved
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
=
𝑇
𝑟
𝑢
𝑒
Authorized(req)=True
Caso 2 — Denied

Si:

¬
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
∨
¬
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
,
𝑐
)
∨
¬
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
𝑎
,
𝑐
,
𝑡
)
¬ValidID(a)∨¬HasCapability(a,c)∨¬WithinLimits(a,c,t)
Caso 3 — Escalated

Si:

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
𝑎
,
𝑐
,
𝑟
,
𝑥
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
𝑎
,
𝑐
,
𝑡
)
∧
𝑅
𝑖
𝑠
𝑘
(
𝑎
,
𝑐
,
𝑟
,
𝑥
)
≥
𝜃
ValidID(a)∧HasCapability(a,c)∧PolicySatisfied(a,c,r,x)∧WithinLimits(a,c,t)∧Risk(a,c,r,x)≥θ

Escalated implica intervención externa.

5. Propiedad de Separación Decisión–Ejecución

Definimos operador de ejecución:

𝐸
𝑥
𝑒
𝑐
𝑢
𝑡
𝑒
(
𝑟
𝑒
𝑞
)
Execute(req)

Propiedad obligatoria:

𝐸
𝑥
𝑒
𝑐
𝑢
𝑡
𝑒
(
𝑟
𝑒
𝑞
)
⇒
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
𝐴
𝑝
𝑝
𝑟
𝑜
𝑣
𝑒
𝑑
Execute(req)⇒Decision(req)=Approved

Y su contraparte:

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
≠
𝐴
𝑝
𝑝
𝑟
𝑜
𝑣
𝑒
𝑑
⇒
¬
𝐸
𝑥
𝑒
𝑐
𝑢
𝑡
𝑒
(
𝑟
𝑒
𝑞
)
Decision(req)

=Approved⇒¬Execute(req)

Esto garantiza no bypass.

6. Propiedad de No Escalación Implícita

Para todo agente 
𝑎
a:

∀
𝑐
∉
𝐶
𝑎
⇒
¬
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
,
𝑐
)
∀c∈
/
C
a
	​

⇒¬HasCapability(a,c)

Y por lo tanto:

¬
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
,
𝑐
)
⇒
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
¬HasCapability(a,c)⇒Decision(req)=Denied

No existe inferencia automática de capacidades.

7. Trazabilidad Formal

Cada decisión genera evento:

𝑒
=
(
𝑟
𝑒
𝑞
,
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
,
𝑟
𝑖
𝑠
𝑘
_
𝑣
𝑎
𝑙
𝑢
𝑒
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
e=(req,Decision(req),risk_value,hash
prev
	​

)

El ledger forma cadena:

ℎ
𝑎
𝑠
ℎ
𝑛
=
𝐻
(
𝑒
𝑛
∥
ℎ
𝑎
𝑠
ℎ
𝑛
−
1
)
hash
n
	​

=H(e
n
	​

∥hash
n−1
	​

)

Propiedad:

𝑇
𝑎
𝑚
𝑝
𝑒
𝑟
(
𝑒
𝑘
)
⇒
𝐼
𝑛
𝑣
𝑎
𝑙
𝑖
𝑑
𝐶
ℎ
𝑎
𝑖
𝑛
Tamper(e
k
	​

)⇒InvalidChain
8. Propiedad de Determinismo

Si:

Misma identidad

Mismo contexto

Mismas políticas

Mismo estado

Misma función de riesgo

Entonces:

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
1
)
=
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
2
)
Decision(req
1
	​

)=Decision(req
2
	​

)

Esto es crítico para auditabilidad.

9. Comparación Formal con RBAC

RBAC define:

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
𝑅
𝐵
𝐴
𝐶
(
𝑢
,
𝑟
)
  
⟺
  
𝑅
𝑜
𝑙
𝑒
(
𝑢
)
∈
𝑃
𝑒
𝑟
𝑚
𝑖
𝑡
𝑡
𝑒
𝑑
𝑅
𝑜
𝑙
𝑒
𝑠
(
𝑟
)
Authorized
RBAC
	​

(u,r)⟺Role(u)∈PermittedRoles(r)

ACP extiende el modelo añadiendo:

Contexto dinámico

Función de riesgo

Límites acumulativos

Estado operativo

Es estrictamente más expresivo.

10. Complejidad Computacional

La decisión ACP es:

𝑂
(
𝑃
+
𝐿
+
𝑅
𝑓
)
O(P+L+R
f
	​

)

Donde:

𝑃
P = número de políticas aplicables

𝐿
L = número de límites activos

𝑅
𝑓
R
f
	​

 = costo de función de riesgo

Debe mantenerse polinomial para viabilidad práctica.

11. Resultado

Ahora ACP tiene:

Modelo algebraico

Predicados definidos

Función de riesgo formal

Reglas de autorización estrictas

Propiedades demostrables

Base para análisis formal