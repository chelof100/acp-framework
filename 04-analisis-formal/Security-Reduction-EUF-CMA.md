4. Security Reduction of ACP to EUF-CMA Signature Security
4.1 Modelo Criptográfico

Sea:

Σ = (KeyGen, Sign, Verify) un esquema de firma digital.

Suponemos que Σ es existentially unforgeable under chosen-message attack (EUF-CMA).

Definimos el token ACP como:

T = Sign_skI( m )

donde:

m = Encode(
      subject,
      resource,
      context_hash,
      exp,
      nonce,
      policy_version
)

El verificador acepta si:

Verify_pkI(m, T) = 1
∧ exp válido
∧ policy válida
∧ subject binding válido
∧ nonce no reutilizado
4.2 Juego de Seguridad ACP-CMA

Definimos el juego entre Challenger C y adversario A.

Setup

C ejecuta:

(pk, sk) ← KeyGen(1^λ)

pk se entrega a A.

Oracle de Firma

A puede consultar un oráculo:

O_sign(m):
    return Sign_sk(m)

Esto modela emisión legítima de tokens.

Fase de Ataque

A produce un par (m*, T*) tal que:

Verify_pk(m*, T*) = 1

m* no fue previamente consultado al oráculo O_sign

Si A logra esto, gana.

4.3 Definición de Ventaja

Definimos la ventaja de A como:

Adv_ACP(A) = Pr[ A gana ]
4.4 Teorema Principal

Teorema 1.

Si existe un adversario PPT A que rompe ACP con ventaja ε,
entonces existe un adversario PPT B que rompe Σ bajo EUF-CMA con ventaja al menos ε.

4.5 Prueba por Reducción

Construimos B usando A como subrutina.

Construcción del Reductor B

B interactúa con el challenger del juego EUF-CMA.

Paso 1 – Recepción de pk

B recibe pk del challenger EUF-CMA.

B entrega ese pk a A.

Paso 2 – Simulación del Oráculo

Cuando A consulta:

O_sign(m)

B reenvía m al oráculo real de firma y devuelve la firma a A.

Simulación perfecta.

Paso 3 – Forja de A

A produce:

(m*, T*)

tal que:

Verify_pk(m*, T*) = 1

m* no fue consultado antes

B devuelve exactamente (m*, T*) al challenger EUF-CMA.

Correctitud de la Reducción

Si A gana en ACP:

m* no fue firmado por el oráculo

T* verifica correctamente

Entonces:

B ha producido una forja válida bajo EUF-CMA.

4.6 Relación de Ventajas

La simulación es perfecta.

Por lo tanto:

Adv_EUF-CMA(B) = Adv_ACP(A)

La reducción es tight.

4.7 Implicación

Si Σ es EUF-CMA seguro, entonces ACP es seguro contra forja existencial.

En otras palabras:

Romper ACP implica romper la firma subyacente.

4.8 Qué No Cubre Esta Prueba

Esta reducción solo cubre:

✔ Forja criptográfica
✔ Integridad del token

No cubre:

Replay (requiere modelo stateful)

Downgrade de política

Side-channel

Compromiso del issuer

Atomicidad

Eso pertenece a la seguridad del sistema, no del primitivo criptográfico.

4.9 Conclusión Formal

Bajo la suposición de que:

Σ es EUF-CMA seguro

Encode es determinístico y no ambiguo

Hash es resistente a colisiones

ACP es criptográficamente tan seguro como la firma subyacente.

La reducción es directa y tight.