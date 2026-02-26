1. Supuestos del Sistema

ACP opera en un entorno donde:

Existen agentes autónomos con identidad criptográfica.

Los agentes pueden delegar capacidades.

Existen múltiples instituciones.

Hay actores potencialmente maliciosos.

Puede haber compromiso parcial de infraestructura.

No asumimos confianza total en:

Agentes individuales.

Infraestructura interna.

Redes externas.

2. Superficie de Ataque

Superficie mínima relevante:

Suplantación de identidad de agente.

Manipulación de mensajes.

Bypass del motor de autorización.

Escalación indebida vía delegación.

Ataques de replay.

Manipulación del ledger.

Revocación incompleta.

Colusión entre agentes.

3. Clasificación de Amenazas

Usamos categorías estructurales:

S — Spoofing (Suplantación)

T — Tampering (Manipulación)

R — Repudiation (Repudio)

I — Information Disclosure

D — Denial of Service

E — Elevation of Privilege

4. Análisis Formal por Categoría
4.1 Spoofing (S)
Amenaza S1

Un atacante intenta hacerse pasar por un agente válido.

Condición adversarial:

𝐹
𝑜
𝑟
𝑔
𝑒
𝑆
𝑖
𝑔
𝑛
𝑎
𝑡
𝑢
𝑟
𝑒
(
𝑎
)
ForgeSignature(a)

Mitigación ACP:

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
⇒
𝑉
𝑒
𝑟
𝑖
𝑓
𝑦
𝑆
𝑖
𝑔
𝑛
𝑎
𝑡
𝑢
𝑟
𝑒
(
𝑎
)
ValidID(a)⇒VerifySignature(a)

Si firma inválida:

Decision(req) = Denied (ACP-001)

Propiedad garantizada:
Sin clave privada válida, no hay ejecución.

4.2 Tampering (T)
Amenaza T1

Alteración de un AuthorizationDecision en tránsito.

Mitigación:

Firma institucional obligatoria.

Verificación antes de ejecución.

𝐼
𝑛
𝑣
𝑎
𝑙
𝑖
𝑑
𝑆
𝑖
𝑔
𝑛
𝑎
𝑡
𝑢
𝑟
𝑒
⇒
𝑅
𝑒
𝑗
𝑒
𝑐
𝑡
InvalidSignature⇒Reject
Amenaza T2

Manipulación del Action Ledger.

Ledger encadenado:

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
∣
∣
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

∣∣hash
n−1
	​

)

Si:

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
Tamper(e
k
	​

)

Entonces:

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
InvalidChain

Auditoría detecta alteración.

4.3 Repudiation (R)
Amenaza R1

Un agente niega haber emitido una acción.

Mitigación:

ActionRequest firmada digitalmente.

𝑆
𝑖
𝑔
𝑛
𝑒
𝑑
(
𝑟
𝑒
𝑞
,
𝑎
)
⇒
𝑁
𝑜
𝑛
𝑅
𝑒
𝑝
𝑢
𝑑
𝑖
𝑎
𝑡
𝑖
𝑜
𝑛
Signed(req,a)⇒NonRepudiation
4.4 Information Disclosure (I)

ACP no es protocolo de confidencialidad, pero:

No expone claves privadas.

No transmite capacidades completas si no son requeridas.

Delegaciones deben revelar solo subconjunto necesario.

Protección parcial.
Confidencialidad depende de capa de transporte.

4.5 Denial of Service (D)
Amenaza D1

Flood de ActionRequest.

Mitigación:

WithinLimits(a,c,t) incluye rate limit.

Amenaza D2

Bloqueo por escalaciones masivas.

Requiere:

Cola controlada

Límite de escalaciones por unidad de tiempo

ACP no elimina DoS de red, pero limita impacto lógico.

4.6 Elevation of Privilege (E)

Esta es la amenaza más crítica.

Amenaza E1

Un agente ejecuta capacidad no declarada.

Formalmente:

𝑐
∉
𝐶
𝑎
c∈
/
C
a
	​


Mitigación:

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

Si falso → Denied.

Amenaza E2

Delegación amplía privilegios.

Ataque:

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
𝑑
𝑒
𝑙
𝑒
𝑔
𝑎
𝑡
𝑒
𝑑
⊃
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
𝑜
𝑟
𝑖
𝑔
𝑖
𝑛
𝑎
𝑙
Constraints
delegated
	​

⊃Constraints
original
	​


Mitigación formal:

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
𝑑
𝑒
𝑙
𝑒
𝑔
𝑎
𝑡
𝑒
𝑑
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
𝑜
𝑟
𝑖
𝑔
𝑖
𝑛
𝑎
𝑙
Constraints
delegated
	​

⊆Constraints
original
	​


Si no se cumple → Delegación inválida.

Amenaza E3

Cadena infinita de delegación.

Mitigación:

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

Amenaza E4

Revocación parcial no propagada.

Mitigación:

Revocación transitiva obligatoria.

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
⇒
∀
𝑑
 dependientes 
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
Revoke(a
i
	​

)⇒∀d dependientes Invalid(d)
5. Modelo Adversarial

Definimos adversario 
𝐴
A:

Capacidades:

Interceptar mensajes.

Modificar tráfico.

Comprometer agente individual.

Intentar forjar delegaciones.

Intentar manipular estado.

No puede:

Romper criptografía estándar.

Modificar múltiples instituciones simultáneamente sin detección.

Reescribir ledger completo sin invalidar hash.

6. Propiedad de Seguridad Global

ACP garantiza:

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
𝑉
𝑎
𝑙
𝑖
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
𝐶
ℎ
𝑎
𝑖
𝑛
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
Execute(req)⇒ValidID(a)∧ValidCapability∧ValidDelegationChain∧AcceptableRisk

Cualquier ataque debe romper al menos uno de esos predicados.

7. Comparación con RBAC bajo amenaza

RBAC bajo E2:

No existe modelo formal de delegación encadenada.

RBAC no define:

Profundidad de delegación.

Restricción transitiva formal.

Registro criptográfico obligatorio.

ACP sí.

8. Comparación con Zero Trust bajo amenaza

Zero Trust protege acceso a red.

No regula:

Escalación semántica interna.

Delegación lógica encadenada.

Responsabilidad estructural multi-agente.

ACP agrega esa capa.

9. Riesgos Residuales

ACP no elimina:

Compromiso total de autoridad raíz.

Corrupción institucional coordinada.

Fallos en implementación.

Ataques físicos.

Pero reduce:

Escalación silenciosa.

Delegación opaca.

Falta de trazabilidad.

Ambigüedad de responsabilidad.

10. Conclusión Técnica

Con:

Modelo de decisión formal

Delegación encadenada formal

Threat model estructurado

Propiedades demostrables

ACP ya tiene:

Base técnica suficiente para revisión académica rigurosa.