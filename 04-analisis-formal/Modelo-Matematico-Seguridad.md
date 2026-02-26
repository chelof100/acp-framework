1. Modelo del Sistema

Definimos el sistema ACP como un conjunto:

S = (A, K, T, R, V)

Donde:

A = conjunto de agentes

K = conjunto de pares de claves criptográficas

T = conjunto de tokens emitidos

R = conjunto de recursos

V = función de verificación

2. Definiciones Formales
2.1 Agente

Un agente a ∈ A se define como:

a = (pk_a, sk_a)

Donde:

pk_a es clave pública

sk_a es clave privada

La identidad del agente es:

AgentID_a = H(pk_a)

Donde H es SHA-256.

2.2 Capability Token

Un token t ∈ T es una tupla:

t = (ver, iss, sub, cap, res, iat, exp, nonce, deleg, parent, rev, sig)

La firma se define como:

sig = Sign_sk_iss ( H( payload ) )

Donde payload incluye todos los campos excepto sig.

3. Función de Verificación

Definimos:

V(t, op, r, time) → {0,1}

Donde:

t es token

op es operación solicitada

r es recurso

time es tiempo actual

La función retorna:

1 si autorizado

0 si rechazado

4. Condiciones de Validez

Un token t es válido si y solo si:

4.1 Firma válida
Verify_pk_iss ( sig , H(payload) ) = 1
4.2 No expirado
iat ≤ time ≤ exp
4.3 Coincidencia de recurso
r ∈ scope(res)
4.4 Coincidencia de capacidad
op ∈ cap
4.5 Delegación válida

Si existe parent:

Existe t_parent

depth ≤ max_depth

cap_child ⊆ cap_parent

res_child ⊆ res_parent

Formalmente:

∀c ∈ cap_child → c ∈ cap_parent
5. Modelo de Amenaza

Asumimos adversario D con capacidades:

Interceptar tráfico

Repetir mensajes

Intentar falsificar tokens

Intentar modificar tokens

Intentar ampliar delegaciones

Comprometer agente individual

No asumimos ruptura de primitivas criptográficas.

6. Propiedades de Seguridad

ACP debe cumplir:

6.1 Integridad

Imposibilidad computacional de modificar token sin invalidar firma.

Reducible a:

EUF-CMA seguridad de Ed25519

Si Ed25519 es seguro → integridad garantizada.

6.2 Autenticidad

Solo quien posee sk_iss puede generar sig.

Formalmente:

Probabilidad de forja:

Pr[ Forge(sig) ] ≤ ε

Donde ε es negligible bajo seguridad EUF-CMA.

6.3 No Escalamiento de Privilegios

Delegación cumple:

cap_child ⊆ cap_parent
res_child ⊆ res_parent

Por inducción en cadena:

Si se cumple en cada nivel, entonces:

cap_final ⊆ cap_original

No hay ampliación posible sin romper firma.

6.4 Resistencia a Replay

Sea challenge generado por R.

I responde con:

Sign_sk_sub ( challenge )

Si challenge es único y no reutilizable:

Replay sin clave privada es imposible.

Replay con token pero sin clave privada falla en prueba de posesión.

6.5 Revocación

Modelo abstracto:

Definimos función:

Revoked(t) ∈ {0,1}

La validez total es:

Valid(t) = Firma ∧ Tiempo ∧ Delegación ∧ ¬Revoked(t)
7. Propiedad de Confinamiento

Si un token inicial t0 define:

cap0, res0

Y existe cadena:

t0 → t1 → t2 → ... → tn

Entonces:

capn ⊆ cap0
resn ⊆ res0

Prueba por inducción:

Base:
t1 ⊆ t0

Paso inductivo:
si ti ⊆ ti-1 y ti-1 ⊆ t0 → ti ⊆ t0

Por transitividad:

No existe escalamiento válido dentro del sistema sin ruptura criptográfica.

8. Modelo de Confianza

ACP es:

Trust-minimized

No depende de autoridad online constante

Basado en verificabilidad criptográfica

Confianza requerida:

Seguridad de Ed25519

Seguridad de SHA-256

Correcta gestión de claves privadas

9. Supuestos Críticos

El modelo asume:

CSPRNG seguro

Claves privadas no comprometidas

Implementaciones correctas

No ruptura de primitivas criptográficas

1. Modelo del Sistema

Definimos el sistema ACP como un conjunto:

S = (A, K, T, R, V)

Donde:

A = conjunto de agentes

K = conjunto de pares de claves criptográficas

T = conjunto de tokens emitidos

R = conjunto de recursos

V = función de verificación

2. Definiciones Formales
2.1 Agente

Un agente a ∈ A se define como:

a = (pk_a, sk_a)

Donde:

pk_a es clave pública

sk_a es clave privada

La identidad del agente es:

AgentID_a = H(pk_a)

Donde H es SHA-256.

2.2 Capability Token

Un token t ∈ T es una tupla:

t = (ver, iss, sub, cap, res, iat, exp, nonce, deleg, parent, rev, sig)

La firma se define como:

sig = Sign_sk_iss ( H( payload ) )

Donde payload incluye todos los campos excepto sig.

3. Función de Verificación

Definimos:

V(t, op, r, time) → {0,1}

Donde:

t es token

op es operación solicitada

r es recurso

time es tiempo actual

La función retorna:

1 si autorizado

0 si rechazado

4. Condiciones de Validez

Un token t es válido si y solo si:

4.1 Firma válida
Verify_pk_iss ( sig , H(payload) ) = 1
4.2 No expirado
iat ≤ time ≤ exp
4.3 Coincidencia de recurso
r ∈ scope(res)
4.4 Coincidencia de capacidad
op ∈ cap
4.5 Delegación válida

Si existe parent:

Existe t_parent

depth ≤ max_depth

cap_child ⊆ cap_parent

res_child ⊆ res_parent

Formalmente:

∀c ∈ cap_child → c ∈ cap_parent
5. Modelo de Amenaza

Asumimos adversario D con capacidades:

Interceptar tráfico

Repetir mensajes

Intentar falsificar tokens

Intentar modificar tokens

Intentar ampliar delegaciones

Comprometer agente individual

No asumimos ruptura de primitivas criptográficas.

6. Propiedades de Seguridad

ACP debe cumplir:

6.1 Integridad

Imposibilidad computacional de modificar token sin invalidar firma.

Reducible a:

EUF-CMA seguridad de Ed25519

Si Ed25519 es seguro → integridad garantizada.

6.2 Autenticidad

Solo quien posee sk_iss puede generar sig.

Formalmente:

Probabilidad de forja:

Pr[ Forge(sig) ] ≤ ε

Donde ε es negligible bajo seguridad EUF-CMA.

6.3 No Escalamiento de Privilegios

Delegación cumple:

cap_child ⊆ cap_parent
res_child ⊆ res_parent

Por inducción en cadena:

Si se cumple en cada nivel, entonces:

cap_final ⊆ cap_original

No hay ampliación posible sin romper firma.

6.4 Resistencia a Replay

Sea challenge generado por R.

I responde con:

Sign_sk_sub ( challenge )

Si challenge es único y no reutilizable:

Replay sin clave privada es imposible.

Replay con token pero sin clave privada falla en prueba de posesión.

6.5 Revocación

Modelo abstracto:

Definimos función:

Revoked(t) ∈ {0,1}

La validez total es:

Valid(t) = Firma ∧ Tiempo ∧ Delegación ∧ ¬Revoked(t)
7. Propiedad de Confinamiento

Si un token inicial t0 define:

cap0, res0

Y existe cadena:

t0 → t1 → t2 → ... → tn

Entonces:

capn ⊆ cap0
resn ⊆ res0

Prueba por inducción:

Base:
t1 ⊆ t0

Paso inductivo:
si ti ⊆ ti-1 y ti-1 ⊆ t0 → ti ⊆ t0

Por transitividad:

No existe escalamiento válido dentro del sistema sin ruptura criptográfica.

8. Modelo de Confianza

ACP es:

Trust-minimized

No depende de autoridad online constante

Basado en verificabilidad criptográfica

Confianza requerida:

Seguridad de Ed25519

Seguridad de SHA-256

Correcta gestión de claves privadas

9. Supuestos Críticos

El modelo asume:

CSPRNG seguro

Claves privadas no comprometidas

Implementaciones correctas

No ruptura de primitivas criptográficas