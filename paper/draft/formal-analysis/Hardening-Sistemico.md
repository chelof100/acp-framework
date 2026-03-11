0️⃣ Objetivo

Pasar de:

“Seguro bajo modelo criptográfico”

a:

“Resistente en entorno distribuido hostil”

1️⃣ Endurecimiento del Issuer (Punto Crítico)

El issuer es el corazón del sistema.
Si cae, todo cae.

1.1 Protección de Claves

El issuer MUST:

Ejecutarse en HSM o enclave seguro

No exponer clave privada en memoria de aplicación

Usar firma aislada por proceso

Recomendado:

Firma delegada vía módulo aislado

Threshold signatures (ej. 2-of-3)

1.2 Rotación de Claves

Definir:

Key epoch = k_t

Token debe incluir:

key_id

Verifier MUST:

Mantener lista de claves activas

Rechazar claves expiradas

Ventana de rotación recomendada:

30–90 días en producción crítica

1.3 Forward Containment

Si clave k_t es comprometida:

No debe permitir firmar tokens con exp > epoch_end

Mitigación:

Issuer MUST enforce exp ≤ epoch_expiration
2️⃣ Endurecimiento del Verifier

Aquí es donde la mayoría falla.

2.1 Verificación Atómica

Debe garantizar:

Verify(token) AND Execute(resource)

como operación indivisible.

Si hay delay:

Revalidar antes de ejecutar.

2.2 Protección Anti-Replay

Verifier MUST:

Mantener cache distribuida de nonces

TTL = exp - now

En cluster:

Cache consistente

O derivar nonce como función determinística de request_id

2.3 Canonicalización Determinística

Antes de hash:

JSON MUST estar canonizado

Campos ordenados

Sin espacios ambiguos

Encoding UTF-8 estricto

Sin esto, el modelo criptográfico es irrelevante.

2.4 Anti-Downgrade

Verifier MUST:

Reject policy_version < min_supported

Y esa variable no puede ser configurable dinámicamente por request.

3️⃣ Endurecimiento del Context Binding

Context_hash debe incluir:

resource_id

HTTP method

environment_id

tenant_id

policy_version

optional security level

Si alguno falta → posible escalamiento lateral.

4️⃣ Reducción de Lateral Movement

Diseño recomendado:

TTL corto (5–15 min)

Tokens no reutilizables en diferentes endpoints

Subject binding estricto

Ideal:

subject = cryptographic identity (mTLS cert fingerprint)

No solo string.

5️⃣ Protección contra Side Channels

Verifier MUST:

Usar comparación en tiempo constante

Unificar mensajes de error

No revelar si fallo fue:

Firma

Expiración

Política

Subject mismatch

Respuesta única:

403 Forbidden

Sin detalle.

6️⃣ Revocación Controlada

ACP favorece expiración corta, pero en sistemas reales necesitas revocación.

Opciones:

A) Short-lived tokens

Sencillo. Escalable.

B) Revocation list

Debe estar firmada y cacheada.

C) Online introspection

Reduce autonomía. Aumenta latencia.

Recomendación práctica:

TTL corto + revocación solo para incidentes críticos.

7️⃣ Modelo de Confianza Distribuido

En sistemas multi-servicio:

Cada servicio verifica token

Ninguno confía en otro

No existe “delegación implícita”

Regla clave:

No service may execute capability it cannot verify itself.
8️⃣ Auditoría Criptográficamente Verificable

Cada emisión de token debe loguearse como:

H(token) almacenado en log append-only

Ideal:

Log firmado

O anclado periódicamente en blockchain pública
(si quieres ir al extremo)

Esto evita emisión silenciosa maliciosa.

9️⃣ Seguridad Operacional

No criptografía, pero crítico:

Monitorización de tasa de emisión

Alertas por picos anómalos

Detección de patrones de uso anormales

Si un servicio empieza a usar 10x más tokens → algo pasa.

🔟 Nivel de Madurez Resultante

Después del endurecimiento:

Área	Nivel
Forja	Muy alto
Escalación	Muy bajo
Replay	Controlado
Lateral movement	Limitado
Issuer compromise	Contenido
Downgrade	Bloqueado
Operacional	Monitoreable