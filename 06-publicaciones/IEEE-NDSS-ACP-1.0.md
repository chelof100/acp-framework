# ACP: Una Arquitectura de Autorización Basada en Capacidades Criptográficamente Verificable para Sistemas de Agentes Autónomos

**Draft de Submisión — IEEE S&P / NDSS**

**Autor:** Marcelo Fernandez
**Filiación:** TraslaIA
**Contacto:** marcelo@traslaia.com

---

## Resumen

Presentamos el Agent Control Protocol (ACP), una arquitectura de autorización basada en capacidades para sistemas multiagente que operan en entornos institucionales. ACP reemplaza la inferencia implícita de permisos por artefactos criptográficos explícitos — Capability Tokens — que vinculan la autorización a identidad, recurso, contexto y tiempo. Cada token es firmado con Ed25519 por un emisor designado y verificado localmente por cualquier verificador conforme sin requerir evaluación centralizada de políticas en tiempo de ejecución. ACP define un modelo formal de delegación que impone estricto confinamiento de capacidades a través de cadenas de delegación arbitrarias y un modelo de amenazas estructurado con STRIDE con análisis formal de mitigaciones. Demostramos que la infalsificabilidad de tokens ACP se reduce ajustadamente a la seguridad EUF-CMA de Ed25519, y que el confinamiento de delegación se mantiene por inducción sobre la longitud de la cadena. Evaluamos ACP contra diez vectores de ataque adversarial y lo comparamos estructuralmente con RBAC, Zero Trust y modelos basados en OAuth. ACP proporciona una primitiva de autorización formalmente verificable apta para despliegues B2B e inter-institucionales de agentes autónomos.

**Palabras clave:** seguridad basada en capacidades, autorización, Ed25519, EUF-CMA, agentes autónomos, delegación, modelo de seguridad formal, sistemas multiagente

---

## 1. Introducción

Los sistemas de autorización en entornos distribuidos enfrentan un desafío estructural: deben imponer control de acceso a través de límites de confianza, a escala, sin requerir que todas las partes compartan un motor de políticas común ni sincronicen estado en el momento del acceso.

Los enfoques existentes exhiben debilidades estructurales conocidas:

- **Control de Acceso Basado en Roles (RBAC):** El permiso se infiere de la membresía de rol. La acumulación de roles crea inflación implícita de privilegios. La delegación es opaca e inverificable.
- **Motores de Política (Zero Trust):** La evaluación en tiempo real es correcta pero introduce latencia centralizada, dependencia de disponibilidad, y no produce evidencia criptográfica de autorización.
- **OAuth 2.0 / JWT:** Los scopes son de granularidad gruesa, no formalmente verificables a nivel de capacidad. Los tokens no llevan vinculación de contexto de recurso. La delegación no es estándar ni está formalmente restringida.

El surgimiento de agentes autónomos que ejecutan operaciones a través de límites institucionales exacerba estas debilidades. Un agente puede operar en docenas de servicios, delegando sub-capacidades a otros agentes, sin un humano en el ciclo para decisiones individuales de autorización. Un sistema diseñado para sesiones humanas no se mapea limpiamente a este entorno.

**ACP propone un paradigma diferente:**

La autorización es un objeto explícito y criptográficamente verificable. Ninguna operación se ejecuta sin un Capability Token firmado que codifique exactamente qué está permitido, para quién, en qué recurso, bajo qué contexto, y hasta cuándo. La verificación es local, sin estado respecto a políticas, y formalmente reducible a suposiciones estándar de dureza criptográfica.

**Contribuciones de este paper:**

1. Una definición formal de la estructura del Capability Token ACP y semántica de verificación (§4).
2. Un modelo formal de delegación con garantías de confinamiento demostradas (§4.4, §5.2).
3. Una reducción de seguridad desde la infalsificabilidad ACP a la seguridad EUF-CMA de Ed25519 (§5.1).
4. Un análisis adversarial estructurado con STRIDE cubriendo diez vectores de ataque (§6).
5. Comparación estructural con RBAC, Zero Trust y OAuth (§7).
6. Discusión de restricciones de despliegue y riesgos residuales honestos (§8, §9).

---

## 2. Antecedentes

### 2.1 Seguridad Basada en Capacidades

Los sistemas de capacidades se originan en el trabajo sobre modelos de capacidad de objetos [Saltzer & Schroeder 1975; Miller 2006]. En un sistema de capacidades, el derecho de acceder a un recurso está representado por un token infalsificable — la capacidad. La posesión de una capacidad válida es suficiente para el acceso; no se requiere búsqueda adicional de identidad.

ACP instancia el modelo de capacidades criptográficamente. Las capacidades son objetos JSON firmados con Ed25519. La infalsificabilidad se deriva del esquema de firma en lugar del aislamiento de objetos.

### 2.2 Ed25519 y Seguridad EUF-CMA

Ed25519 [Bernstein et al. 2011] es un esquema de firma determinista variante de Schnorr sobre Curve25519. Logra infalsificabilidad existencial bajo ataque de mensaje elegido (EUF-CMA) en el modelo estándar. Para parámetro de seguridad λ = 128, ningún adversario PPT logra falsificación con ventaja no negligible.

ACP se basa exclusivamente en Ed25519 para la integridad de tokens. No se requiere esquema de firma adicional.

### 2.3 Esquema de Canonicalización JSON

La firma de tokens cubre una forma serializada determinísticamente del payload usando JSON Canonicalization Scheme (JCS, RFC 8785). Esto asegura que la cobertura de firma es inequívoca independientemente del ordenamiento de campos o espacios en blanco en representaciones en tránsito.

### 2.4 Trabajo Relacionado

**SPIFFE/SVID:** Proporciona identidad criptográfica de carga de trabajo via X.509 SVIDs pero no modela capacidades ni delegación en la capa de autorización.

**UCAN (User-Controlled Authorization Networks):** Modelo de delegación de capacidades basado en JWTs con estructura de delegación encadenada. ACP difiere en su aplicación formal de restricciones, análisis STRIDE y suite de tests de conformidad.

**Macaroons:** Tokens basados en atenuación. La atenuación es aditiva (caveats restringen pero no crean nueva autoridad). ACP modela un enfoque complementario con conjuntos de capacidades explícitas y alcances de recursos.

**Verifiable Credentials (W3C VC):** Marco de aserciones de identidad. ACP es un marco de autorización. Los dos son complementarios.

---

## 3. Modelo del Sistema

### 3.1 Principales

Sea **A** un conjunto finito de agentes. Cada agente `a ∈ A` posee un par de claves asimétricas:

```
(pk_a, sk_a) ← KeyGen(1^λ)
```

La identidad del agente está vinculada al material de claves:

```
AgentID_a = base58(SHA-256(pk_a_bytes))
```

donde `pk_a_bytes` son los 32 bytes de la clave pública Ed25519. Este vínculo asegura que el AgentID no es transferible sin conocimiento de `sk_a`.

El sistema incluye tres roles lógicos:

- **Emisor (I):** Posee `sk_I`. Emite y firma Capability Tokens.
- **Sujeto (S):** Posee `sk_S`. Recibe tokens. Debe probar posesión de `sk_S` durante el protocolo de handshake (ACP-HP-1.0).
- **Verificador (V):** Posee `pk_I`. Verifica integridad del token y predicado de autorización. Ejecuta o rechaza la operación solicitada.

### 3.2 Recursos y Capacidades

Sea:

- **R** = conjunto de recursos, identificados por `<dominio_institución>/<ruta_recurso>`.
- **O** = conjunto de operaciones, identificadas por cadenas calificadas per ACP-CAP-REG-1.0 (ej. `acp:cap:financial.payment`).

Una **capacidad** es un par `c = (o, r) ∈ O × R`.

### 3.3 Entorno Adversarial

Asumimos operación en una red parcialmente adversarial donde:

- El tráfico de red puede ser observado (adversario pasivo).
- Los mensajes pueden ser repetidos.
- Agentes individuales pueden estar comprometidos.
- Las instituciones se asumen honestas salvo indicación contraria (§9 discute compromiso del emisor).

**No** asumimos:

- Confianza en agentes individuales más allá de su material de claves.
- Disponibilidad de un oráculo de política global en tiempo de verificación.
- Relojes sincronizados más allá de una deriva acotada de 300 segundos.

---

## 4. El Protocolo ACP

### 4.1 Estructura del Capability Token

Un Capability Token ACP `τ` es un objeto JSON con los siguientes campos normativos:

```json
{
  "ver":         "1.0",
  "iss":         "<AgentID_emisor>",
  "sub":         "<AgentID_sujeto>",
  "cap":         ["acp:cap:financial.payment"],
  "res":         "org.example/cuentas/ACC-001",
  "iat":         1718920000,
  "exp":         1718923600,
  "nonce":       "<128bit_CSPRNG_base64url>",
  "deleg":       { "allowed": false, "max_depth": 0 },
  "parent_hash": null,
  "constraints": {},
  "rev":         { "type": "endpoint", "uri": "https://acp.example.com/acp/v1/rev/check" },
  "sig":         "<base64url_firma_Ed25519>"
}
```

**Semántica de campos:**

| Campo | Tipo | Descripción |
|---|---|---|
| `ver` | string | Versión del protocolo. DEBE ser `"1.0"`. |
| `iss` | AgentID | Emisor. Firma el token con `sk_iss`. |
| `sub` | AgentID | Sujeto. Debe probar posesión de `sk_sub` en handshake. |
| `cap` | string[] | Array no vacío de capacidades autorizadas. |
| `res` | string | Identificador del recurso al que aplican las capacidades. |
| `iat` | uint64 | Timestamp de emisión (segundos Unix). |
| `exp` | uint64 | Timestamp de expiración. DEBE ser > `iat`. |
| `nonce` | string | Valor CSPRNG de 128 bits, base64url. De uso único. |
| `deleg` | objeto | Permisos de delegación: `allowed` (bool), `max_depth` (int ≥ 0). |
| `parent_hash` | string\|null | null para tokens raíz; `base64url(SHA-256(JCS(padre_sin_sig)))` para delegados. |
| `constraints` | objeto | Restricciones adicionales específicas de capacidad. |
| `rev` | objeto | Referencia a endpoint de revocación o CRL. |
| `sig` | string | Firma Ed25519 sobre JCS(token_sin_sig). |

### 4.2 Emisión de Token

El emisor construye el payload `m`:

```
m = JCS({ ver, iss, sub, cap, res, iat, exp, nonce, deleg, parent_hash, constraints, rev })
```

y calcula:

```
σ = Sign_{sk_iss}(m)
τ = m ∪ { "sig": base64url(σ) }
```

El nonce DEBE ser generado por un CSPRNG con al menos 128 bits de entropía. El emisor DEBE registrar el nonce para prevenir reutilización.

### 4.3 Procedimiento de Verificación

Un verificador V con `pk_iss` ejecuta los siguientes pasos **en orden**, fallando inmediatamente ante cualquier violación:

```
1.  Assert τ.ver == "1.0"
2.  Assert Verify_{pk_iss}(JCS(τ_sin_sig), σ) = 1
3.  Assert t_actual ≤ τ.exp
4.  Assert t_actual ≥ τ.iat − 300          (tolerancia deriva de reloj)
5.  Assert ¬Revocado(τ) via τ.rev
6.  Assert capacidad_solicitada ∈ τ.cap
7.  Assert recurso_solicitado ⊆ τ.res
8.  Si τ.parent_hash ≠ null: verificar cadena padre (§4.4)
9.  Assert restricciones satisfechas per τ.constraints
```

El verificador DEBE mantener un **almacén de nonces** que cubra todos los nonces vistos dentro de la ventana de TTL máximo de token para prevenir replay concurrente.

**Predicado de autorización:**

```
Auth(τ, o, r, t) = 1  sii  pasos 1–9 todos pasan
```

**Invariante de seguridad:**

```
Ejecutar(op) ⇒ Auth(τ, op.capacidad, op.recurso, t_actual) = 1
```

Ninguna ejecución ocurre sin un predicado de autorización satisfecho.

### 4.4 Modelo de Delegación

Cuando el sujeto `S1` del token raíz `T0` emite un token delegado `T1` para el sujeto `S2`:

**Restricciones obligatorias:**

```
cap(T1)       ⊆  cap(T0)            — confinamiento de capacidad
res(T1)       ⊆  res(T0)            — confinamiento de recurso
exp(T1)       ≤  exp(T0)            — confinamiento temporal
max_depth(T1) =  max_depth(T0) − 1  — reducción de profundidad
parent_hash(T1) = base64url(SHA-256(JCS(T0_sin_sig)))
```

**Límite absoluto de profundidad:** `max_depth` NO DEBE exceder 8 en ningún token. Este límite es no configurable.

Una cadena de delegación de longitud n:

```
T0 → T1 → … → Tn
```

es válida si y solo si cada eslabón satisface las restricciones anteriores y cada token satisface individualmente el procedimiento de verificación de §4.3.

---

## 5. Análisis de Seguridad Formal

### 5.1 Teorema 1: Infalsificabilidad de Tokens

**Teorema.** Si Ed25519 es EUF-CMA seguro, entonces ningún adversario PPT `𝒜` puede producir un token `τ*` tal que `Auth(τ*, ·, ·, ·) = 1` para un emisor honesto que nunca emitió `τ*`, salvo con probabilidad negligible.

**Demostración.** Construimos una reducción `ℬ` que usa `𝒜` como subrutina para romper EUF-CMA.

*Setup.* `ℬ` recibe clave pública `pk` del desafiante EUF-CMA y la entrega a `𝒜` como clave pública del emisor.

*Simulación del oráculo.* Cuando `𝒜` consulta el oráculo de emisión de tokens sobre mensaje `m`, `ℬ` reenvía `m` al oráculo de firma EUF-CMA real y devuelve la firma. La simulación es perfecta.

*Extracción de falsificación.* Si `𝒜` produce `τ* = (m*, σ*)` con `Verify_{pk}(m*, σ*) = 1` y `m*` nunca fue consultado al oráculo, entonces `ℬ` devuelve `(m*, σ*)` como falsificación EUF-CMA válida.

*Ventaja.* Dado que la simulación es perfecta:

```
Adv_{EUF-CMA}(ℬ) = Adv_{ACP}(𝒜)
```

La reducción es ajustada. Si Ed25519 es EUF-CMA seguro, `Adv_{ACP}(𝒜)` es negligible. ∎

### 5.2 Teorema 2: Confinamiento de Delegación

**Teorema.** Para cualquier cadena de delegación válida `T0 → T1 → … → Tn`:

```
cap(Tn) ⊆ cap(T0)    y    res(Tn) ⊆ res(T0)
```

**Demostración por inducción sobre longitud de cadena n.**

*Caso base (n = 1).* La verificación impone `cap(T1) ⊆ cap(T0)` y `res(T1) ⊆ res(T0)` directamente. ✓

*Paso inductivo.* Asumir `cap(Ti) ⊆ cap(T0)` para algún i. El procedimiento de verificación requiere `cap(Ti+1) ⊆ cap(Ti)`. Por transitividad de ⊆: `cap(Ti+1) ⊆ cap(T0)`. ✓

El mismo argumento aplica para `res`. Dado que `max_depth` decrementa en 1 en cada paso y comienza en máximo 8, la cadena es finita. ∎

### 5.3 Teorema 3: Resistencia a Replay

**Teorema.** Si el verificador mantiene un almacén de nonces que cubre el TTL máximo de token, los nonces se generan con ≥ 128 bits de entropía CSPRNG, y el esquema de firma es seguro, entonces el ataque de replay sobre un token presentado tiene éxito con probabilidad negligible.

**Esquema de demostración.** Un token repetido lleva un nonce idéntico. El almacén de nonces lo rechaza determinísticamente dentro de la ventana de validez del token. Tras la expiración, el token falla la verificación `t_actual ≤ exp`. Para replay entre contextos, los campos `res` y `cap` están criptográficamente vinculados por la firma del emisor; alterarlos invalida `σ`. ∎

### 5.4 Teorema 4: Prueba de Posesión Auténtica

Durante el handshake ACP (ACP-HP-1.0), el verificador emite un desafío fresco `c` con `|c| ≥ 128` bits. El sujeto debe calcular:

```
σ_c = Sign_{sk_sub}(c)
```

**Teorema.** Ningún adversario PPT sin conocimiento de `sk_sub` puede producir `σ_c` para un desafío fresco con probabilidad no negligible, bajo seguridad EUF-CMA de Ed25519. ∎

### 5.5 Resumen de Reducción de Seguridad

La seguridad de ACP se reduce a:

```
Seguridad(ACP) ≤_T  Seguridad(Ed25519_EUF-CMA)
                   +  Seguridad(SHA-256_resistencia_colisión)
                   +  Implementación correcta
                   +  Gestión segura de claves
```

No se requieren suposiciones criptográficas adicionales.

---

## 6. Evaluación Adversarial

Evaluamos ACP contra diez vectores de ataque en cuatro perfiles de atacante:

| Perfil | Capacidades |
|---|---|
| A1 | Usuario legítimo malicioso |
| A2 | Servicio comprometido |
| A3 | Observador de red (MITM parcial) |
| A4 | Emisor comprometido |

### 6.1 Falsificación de Token (A1, A3)

**Objetivo:** Producir un token válido sin autorización del emisor.

**Análisis:** La falsificación requiere producir `σ*` tal que `Verify_{pk_iss}(m*, σ*) = 1` para un `m*` nunca firmado. Esto se reduce a romper EUF-CMA de Ed25519. Probabilidad ≈ 2^{-128} bajo modelo estándar.

**Resultado:** ✅ Seguro. Riesgo residual: prácticas débiles de gestión de claves.

### 6.2 Ataque de Replay (A1, A2, A3)

**Escenario A — Reutilización dentro de ventana válida, mismo contexto:** Permitido por diseño. No es un fallo de seguridad.

**Escenario B — Reutilización entre contextos:** `res` y `cap` están firmados. Alterarlos invalida `σ`. Un token para recurso X no puede usarse para recurso Y. ✅ Seguro.

**Escenario C — Replay concurrente dentro de ventana:** Requiere almacén de nonces en el verificador. Sin él, dos solicitudes con nonce idéntico pueden tener éxito concurrentemente. **Requisito de implementación, no debilidad del protocolo.**

**Resultado:** ✅ Seguro con implementación correcta del almacén de nonces.

### 6.3 Escalada de Privilegios via Composición de Tokens (A1, A2)

**Objetivo:** Combinar dos tokens para obtener capacidades combinadas.

Los tokens ACP no son componibles. La autorización se evalúa por token. No existe operación unión entre tokens sin intervención del emisor.

**Resultado:** ✅ Escalada imposible sin el emisor.

### 6.4 Confused Deputy (A2)

**Escenario:** El Servicio A tiene token con `sub = AgentID_A`. El Servicio B invoca a A para acceder indirectamente al recurso.

Si el verificador valida que la identidad probada del llamador coincide con `τ.sub`, B no puede presentar el token de A. Requiere que el verificador ejecute el protocolo de handshake (ACP-HP-1.0) y valide la respuesta de prueba de posesión.

**Resultado:** ✅ Bloqueado cuando se impone vinculación de sujeto. ⚠️ Vulnerable si el verificador omite el handshake.

### 6.5 Manipulación de Contexto (A2, A3)

**Escenario:** Token emitido para entorno staging se usa en producción.

`res` incluye el identificador de recurso. Si la institución codifica el entorno en la ruta de recurso (ej. `org.example/staging/recurso`), el contexto está criptográficamente vinculado.

**Resultado:** ✅ Seguro cuando los identificadores de recurso codifican el contexto de entorno.

### 6.6 Ataque de Downgrade de Política (A1, A2)

**Escenario:** El verificador es forzado a aceptar un token con `policy_version` más antiguo y permisivo.

ACP-TS-1.0 requiere que los verificadores impongan una versión mínima soportada de política. Los tokens con `policy_version` inferior al mínimo DEBEN ser rechazados.

**Resultado:** ✅ Seguro si se implementa la imposición de versión mínima.

### 6.7 Escalada de Privilegios via Delegación (A1, A2)

**Escenario:** El agente delegante intenta emitir un token con `cap(T1) ⊃ cap(T0)`.

El procedimiento de verificación en §4.4 impone `cap(hijo) ⊆ cap(padre)`. Un token delegado con capacidades expandidas falla en el paso 6.

**Resultado:** ✅ Seguro por Teorema 2 (Confinamiento de Delegación).

### 6.8 Compromiso del Emisor (A4)

**Escenario:** `sk_iss` es obtenido por el adversario.

Un emisor comprometido puede emitir tokens arbitrarios para cualquier sujeto y recurso. ACP no elimina este riesgo.

**Mitigaciones:** Rotación de claves, almacenamiento HSM, firma de umbral para emisores de alto valor, TTLs cortos de token para acotar la ventana de daño.

**Resultado:** ⚠️ **Punto único de fallo crítico.** La seguridad de ACP asume integridad del emisor. Esta es una limitación reconocida (§9).

### 6.9 Latencia de Revocación (A1, A2)

**Escenario:** Token comprometido es usado antes de que la revocación se propague.

ACP usa un endpoint de revocación en modelo push (`τ.rev`). Los tokens son válidos hasta expiración o hasta que el verificador consulte el endpoint de revocación y reciba resultado positivo.

**Mitigaciones:** Ventanas de expiración cortas (recomendado < 1 hora para capacidades sensibles), consultas de revocación online por solicitud.

**Resultado:** ⚠️ La revocación está acotada por TTL, no es instantánea.

### 6.10 Movimiento Lateral (A2)

**Escenario:** Un servicio comprometido usa su token válido para acceder a otros recursos.

Un token está limitado a `cap` y `res`. Un servicio comprometido puede usar su token pero no puede acceder a recursos o capacidades no codificadas en él.

**Resultado:** ✅ Controlable con emisión de tokens de alcance mínimo y TTL corto.

### Resumen

| Vector de Ataque | Estado | Condición |
|---|---|---|
| Falsificación de token | ✅ Seguro | Suposición EUF-CMA |
| Replay | ✅ Seguro | Almacén de nonces requerido |
| Escalada via composición | ✅ Seguro | Diseño del protocolo |
| Confused deputy | ✅ Seguro | Vinculación de sujeto impuesta |
| Manipulación de contexto | ✅ Seguro | Ruta de recurso codifica entorno |
| Downgrade de política | ✅ Seguro | Versión mínima impuesta |
| Escalada via delegación | ✅ Seguro | Teorema 2 |
| Compromiso del emisor | ⚠️ Crítico | Limitación reconocida |
| Latencia de revocación | ⚠️ Acotada | Limitada por TTL |
| Movimiento lateral | ✅ Controlable | Tokens con alcance + TTL corto |

---

## 7. Comparación con Modelos Existentes

### 7.1 ACP vs. RBAC

| Dimensión | RBAC | ACP |
|---|---|---|
| Modelo de permiso | Membresía de rol → permiso implícito | Capacidad explícita firmada por operación |
| Delegación | Opaca, dependiente de implementación | Formalmente restringida, encadenada criptográficamente |
| Límites temporales | Típicamente de alcance de sesión | Por token, criptográficamente impuesto |
| Verificabilidad | Requiere consulta de política | Verificación criptográfica local |
| Acumulación de privilegios | Debilidad estructural (explosión de roles) | Imposible (cada operación requiere su propia capacidad) |
| Reducción de seguridad formal | Ninguna | EUF-CMA (§5.1) |

### 7.2 ACP vs. Zero Trust

Zero Trust es una filosofía arquitectónica: asumir brecha, verificar explícitamente, imponer mínimo privilegio. ACP es un mecanismo de imposición concreto compatible con los principios de Zero Trust.

Diferencia clave: Los motores de política Zero Trust producen decisiones de autorización pero no evidencia criptográfica de esas decisiones. Los tokens ACP son la evidencia en sí misma, verificable offline por cualquier parte con la clave pública del emisor.

| Dimensión | Zero Trust | ACP |
|---|---|---|
| Evidencia de autorización | Decisión (sí/no) | Artefacto criptográfico firmado |
| Verificación | Requiere motor de política | Local, sin estado |
| Capacidad offline | No | Sí |
| Inter-institucional | Requiere federación | Nativo (compartir clave pública) |

### 7.3 ACP vs. OAuth 2.0 / JWT

| Dimensión | OAuth 2.0 + JWT | ACP |
|---|---|---|
| Granularidad de scope | Gruesa (cadenas de scope) | Fina (capacidades estructuradas) |
| Vinculación de recurso | Opcional (claim `aud`) | Obligatoria (campo `res`) |
| Delegación | No estándar (sin modelo formal) | Formalmente definida con prueba de confinamiento |
| Modelo de seguridad formal | No provisto en RFC | Reducción EUF-CMA (§5) |
| Límite de profundidad | No definido | Máximo 8 saltos |
| Testing de conformidad | Sin suite de tests estándar | ACP-TS-1.0/1.1 con vectores de test |

---

## 8. Consideraciones de Implementación

### 8.1 Primitivas Criptográficas

- **Firma:** Ed25519 (clave pública de 32 bytes, firma de 64 bytes).
- **Hash:** SHA-256.
- **Nonce:** CSPRNG ≥ 128 bits, codificado en base64url.
- **Serialización para firma:** JCS (RFC 8785) para canonicalización JSON determinista.

### 8.2 Almacén de Nonces

El verificador DEBE mantener un almacén de nonces que cubra todos los nonces vistos dentro de la ventana de TTL máximo esperado de token. Para verificadores distribuidos, el almacén DEBE ser consistente (linealizable) para prevenir replay concurrente entre réplicas.

Implementación recomendada: Conjunto hash en memoria con expiración TTL para nodo único; caché distribuida (ej. Redis con SETNX atómico) para despliegues multinodo.

### 8.3 Revocación

ACP-REV-1.0 define dos mecanismos de revocación:

- **Endpoint:** El verificador consulta `τ.rev.uri` por solicitud. Correcto pero agrega latencia.
- **CRL:** Descarga periódica. Más eficiente, obsolescencia acotada por intervalo de actualización de CRL.

Recomendado: Modo endpoint para despliegues de alta seguridad; CRL con actualización corta (< 5 min) para alta velocidad de procesamiento.

### 8.4 Deriva de Reloj

ACP permite 300 segundos de tolerancia de deriva de reloj en la validación de `iat`. Este valor DEBERÍA ser ajustable por política de despliegue pero NO DEBE exceder 600 segundos.

### 8.5 Gestión de Claves

La clave privada del emisor es el activo de seguridad más crítico único. Protecciones recomendadas:

- Almacenamiento en Hardware Security Module (HSM).
- Rotación de claves ≤ 90 días.
- Separación de autoridad de firma de lógica de negocio.

---

## 9. Limitaciones

**L1 — Confianza en Emisor Centralizado.** ACP v1.x depende de un único emisor por linaje de token. El compromiso del emisor invalida todas las garantías de seguridad derivadas. Esta es la limitación más significativa. (Ver ACP-D para la extensión descentralizada que aborda este problema en v2.0.)

**L2 — La Revocación No Es Instantánea.** La validez del token está acotada por `exp`. Entre el compromiso y la expiración del token, un atacante con un token válido puede continuar usándolo a menos que el verificador realice consultas de revocación online por solicitud.

**L3 — Confidencialidad No Provista.** ACP es un protocolo de autorización. La confidencialidad del contenido del token depende de la capa de transporte (TLS). ACP no cifra el payload del token.

**L4 — Ataques de Canal Lateral Fuera de Alcance.** La reducción de seguridad formal cubre falsificación criptográfica. Los ataques a nivel de implementación (temporización, análisis de energía, inspección de memoria) están fuera de alcance.

**L5 — Se Requiere Implementación Correcta.** El confinamiento de delegación y la resistencia a replay dependen de la implementación correcta del verificador. Un verificador que omite la verificación de nonces o la validación de cadena de delegación no puede basarse en las garantías de seguridad de ACP.

**L6 — Dependencia de Sincronización de Reloj.** La imposición de `iat`/`exp` requiere relojes aproximadamente sincronizados. En entornos con deriva severa de reloj, la tolerancia de 300 segundos puede ser insuficiente.

---

## 10. Conclusión

ACP proporciona una arquitectura de autorización basada en capacidades formalmente fundamentada para sistemas de agentes autónomos. Al representar la autorización como artefactos criptográficos explícitos en lugar de derivaciones implícitas de política, ACP habilita:

1. **Verificación local** — sin dependencia en tiempo de ejecución de un motor de política central.
2. **Garantías de seguridad formales** — la infalsificabilidad de tokens se reduce a EUF-CMA de Ed25519; el confinamiento de delegación se demuestra por inducción.
3. **Despliegue inter-institucional** — el compartir claves públicas habilita verificación entre límites sin sesiones federadas.
4. **Auditabilidad** — cada decisión de autorización corresponde a un artefacto firmado que puede ser registrado y verificado post-hoc.

ACP no elimina todos los riesgos de seguridad. El compromiso del emisor y la latencia de revocación son limitaciones reconocidas con estrategias de mitigación conocidas. La extensión descentralizada ACP-D, objetivo de v2.0, propone abordar la centralización del emisor mediante firma de umbral y consenso tolerante a fallos bizantinos.

La especificación actual ACP v1.x incluye una suite de tests de conformidad (ACP-TS-1.0/1.1) con vectores de test verificables por máquina, habilitando validación independiente de implementaciones. Invitamos a la comunidad investigadora a revisar y criticar la especificación.

---

## Referencias

[1] Bernstein, D.J., Duif, N., Lange, T., Schwabe, P., Yang, B.Y. (2011). *High-Speed High-Security Signatures.* CHES 2011.

[2] Saltzer, J.H., Schroeder, M.D. (1975). *The Protection of Information in Computer Systems.* Proceedings of the IEEE.

[3] Miller, M.S. (2006). *Robust Composition: Towards a Unified Approach to Access Control and Concurrency Control.* Tesis Doctoral, Johns Hopkins University.

[4] Hardt, D. (2012). *The OAuth 2.0 Authorization Framework.* RFC 6749, IETF.

[5] Rose, S., Borchert, O., Mitchell, S., Connelly, S. (2020). *Zero Trust Architecture.* NIST SP 800-207.

[6] Sporny, M., Longley, D., Sabadello, M. (2022). *Decentralized Identifiers (DIDs) v1.0.* W3C Recommendation.

[7] Hildebrand, A., Rundgren, A. (2020). *JSON Canonicalization Scheme (JCS).* RFC 8785, IETF.

[8] Bradner, S. (1997). *Key Words for Use in RFCs to Indicate Requirement Levels.* RFC 2119, IETF.

[9] Fernandez, M. (2025). *Especificación del Agent Control Protocol (ACP) v1.x.* TraslaIA. https://github.com/chelof100/acp-framework

---

*© 2025 Marcelo Fernandez / TraslaIA. Manuscrito borrador — aún no revisado por pares.*
