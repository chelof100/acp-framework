0. Modelo del atacante

Definimos cuatro perfiles:

Actor	Capacidades
A1	Usuario legítimo malicioso
A2	Servicio comprometido
A3	Observador de red (MITM parcial)
A4	Emisor comprometido (issuer)

Se evalúa ACP frente a cada uno.

1️⃣ Ataque 1: Forgery de Capability Token
Objetivo

Crear un token válido sin autorización del emisor.

Superficie
Token = Sign_skIssuer(payload)
Intento

Alterar payload

Cambiar contexto

Reusar firma previa

Generar firma falsa

Análisis

Si:

Firma = Ed25519

Clave privada protegida

Verificación obligatoria en cada request

Entonces:

Forja requiere romper EUF-CMA

Probabilidad ≈ 2^-128

Resultado

✔️ Seguro bajo modelo criptográfico estándar
❗ Riesgo real: mala gestión de claves

2️⃣ Ataque 2: Replay Attack
Objetivo

Reusar un token válido fuera de su contexto temporal.

Superficie

Campos:

nbf
exp
nonce
context_hash
Escenario A: Reuso dentro de ventana válida

✔️ Permitido si política lo permite
No es fallo, es diseño.

Escenario B: Reuso fuera de contexto

Si:

context_hash = H(resource || method || environment || policy_version)

Entonces el token:

No puede moverse a otro endpoint

No puede cambiar método

No puede saltar política

✔️ Mitigado

Escenario C: Replay distribuido

Si no existe cache de nonces → posible reuso concurrente.

Mitigación:

Verifier MUST maintain replay cache for nonce during token validity window.

Si no se implementa → vulnerabilidad práctica.

3️⃣ Ataque 3: Privilege Escalation por Token Composition
Objetivo

Combinar dos tokens para crear mayor privilegio.

ACP no permite composición implícita.

Cada token:

capability = conjunto cerrado

No existe:

union(tokenA, tokenB)

Sin intervención del issuer.

✔️ Escalación imposible sin issuer.

4️⃣ Ataque 4: Confused Deputy

Clásico problema de sistemas capability.

Escenario

Servicio A tiene token para recurso X.
Servicio B invoca A para obtener acceso a X indirectamente.

Si el token:

subject = servicio A

Y verificador exige coincidencia de identidad del caller:

✔️ Bloqueado.

Si no se valida binding con identidad:

❌ Vulnerable.

Normativa requerida:

Verifier MUST validate that caller identity matches token.subject.
5️⃣ Ataque 5: Context Manipulation
Objetivo

Cambiar entorno sin invalidar token.

Ejemplo:

Token emitido para entorno staging

Usado en producción

Si:

context_hash incluye environment_id

✔️ Seguro.

Si el entorno no forma parte del hash:

❌ Vulnerable.

6️⃣ Ataque 6: Policy Downgrade Attack
Escenario

policy_version 5 es estricta

policy_version 3 es permisiva

Si atacante fuerza verificador a aceptar versión antigua:

Mitigación:

Verifier MUST reject tokens with policy_version lower than minimum_supported.

Sin esto → downgrade posible.

7️⃣ Ataque 7: Issuer Compromise

Este es el punto crítico.

Si issuer es comprometido:

Puede emitir cualquier capability

Puede escalar privilegios

ACP no elimina este riesgo.

Mitigaciones:

Key rotation

Threshold signatures

HSM

Separation of duties

El modelo de seguridad asume:

Issuer trusted and secure

Sin eso → sistema cae.

8️⃣ Ataque 8: Revocation Problem

Tokens firmados son autónomos.

Si se compromete un token:

No puede revocarse sin lista externa.

Opciones:

Ventanas cortas de expiración

CRL distribuida

Online introspection

Trade-off:

Más autonomía = menos control de revocación.

ACP favorece expiración corta.

9️⃣ Ataque 9: Lateral Movement

Si servicio comprometido posee token válido:

Puede usarlo hasta exp.

ACP limita movimiento si:

Tokens son scoped

TTL corto

Context binding estricto

Sin eso → lateral movement viable.

🔟 Ataque 10: Formal Cryptographic Break

Bajo suposiciones:

Ed25519 seguro

SHA-256 resistente a colisiones

Nonces aleatorios

ACP reduce a:

EUF-CMA + collision resistance

Si cualquiera cae → sistema cae.

Pero eso aplica a cualquier sistema moderno.

🧠 Resultado Global
Vector	Estado
Forgery	Seguro
Replay	Seguro si nonce cache
Escalation	Seguro
Confused deputy	Seguro si subject binding
Context swap	Seguro si context hash correcto
Downgrade	Seguro si enforce mínimo
Issuer compromise	Punto crítico
Revocation	Limitado
Lateral movement	Controlable con TTL corto
🔴 Conclusión Realista

ACP:

✔️ Es criptográficamente sólido
✔️ Reduce superficie comparado con RBAC tradicional
✔️ Elimina autorización implícita

Pero:

❗ La seguridad real depende de implementación estricta
❗ Issuer sigue siendo el punto de mayor riesgo
❗ Revocación no es trivial