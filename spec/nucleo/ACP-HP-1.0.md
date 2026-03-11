# ACP-HP-1.0
## Handshake Protocol Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** ACP-SIGN-1.0, ACP-CT-1.0, ACP-ITA-1.0
**Required-by:** ACP-API-1.0, ACP-CONF-1.0

---

## 1. Alcance

Este documento define el procedimiento mediante el cual un agente ACP prueba ante un sistema receptor que posee la clave privada correspondiente al `sub` de un Capability Token presentado.

ACP-HP-1.0 es stateless. No establece sesiones. No produce session_id. No requiere estado en el servidor entre requests.

El handshake ocurre en el contexto de cada request que presenta un CT. Su propósito es único: vincular criptográficamente al portador del CT con su identidad declarada.

Sin ACP-HP-1.0, un CT robado es suficiente para suplantar al agente. Con ACP-HP-1.0, el portador debe demostrar posesión de `sk_sub` en cada request.

---

## 2. Definiciones

**Initiator (I):** Agente que presenta el CT y prueba posesión de clave.

**Responder (R):** Sistema que verifica la prueba y decide si proceder.

**Challenge:** Valor aleatorio generado por R, de un solo uso, con ventana de validez corta.

**Proof-of-Possession (PoP):** Firma del Initiator sobre el challenge y el request, que demuestra posesión de `sk_sub`.

**Binding:** Vinculación criptográfica entre CT, challenge, y contenido del request.

---

## 3. Modelo de Seguridad

ACP-HP-1.0 garantiza las siguientes propiedades cuando se ejecuta correctamente:

```
P1 — Autenticación de identidad
     El portador del CT posee sk_sub correspondiente a sub del token.

P2 — Binding de request
     La prueba está vinculada al contenido del request específico.
     Una PoP válida para request A no es válida para request B.

P3 — Protección anti-replay
     Un challenge usado no puede ser reutilizado.

P4 — Independencia de canal
     El protocolo no depende de propiedades del canal de transporte
     para las garantías de identidad.
```

---

## 4. Requisitos Previos

**El Initiator MUST:**
- Poseer par de claves Ed25519 `(sk_sub, pk_sub)`
- Tener un CT válido donde `sub == base58(SHA-256(pk_sub))`
- Tener acceso al endpoint de challenges del Responder

**El Responder MUST:**
- Exponer los endpoints definidos en §6
- Mantener registro de challenges emitidos no usados (ventana activa)
- Tener acceso al ITA para resolver `pk_sub` según ACP-ITA-1.0

**Canal de transporte:**
- MUST ser HTTPS
- mTLS SHOULD ser usado en entornos B2B

---

## 5. Secuencia del Protocolo

```
Initiator (I)                              Responder (R)
     │                                          │
     │   POST /acp/v1/handshake/challenge       │
     │ ────────────────────────────────────►    │
     │                                          │  genera challenge
     │                                          │  registra en ventana activa
     │   {challenge_id, challenge, expires_at}  │
     │ ◄────────────────────────────────────    │
     │                                          │
     │  construye PoP payload                   │
     │  firma con sk_sub                        │
     │                                          │
     │   POST /acp/v1/<endpoint>                │
     │   Authorization: ACP-Agent <CT>          │
     │   X-ACP-PoP: <pop_token>                 │
     │ ────────────────────────────────────►    │
     │                                          │  verifica pop_token
     │                                          │  verifica CT
     │                                          │  elimina challenge de ventana
     │   {response}                             │
     │ ◄────────────────────────────────────    │
```

---

## 6. Endpoints del Responder

### `POST /acp/v1/handshake/challenge`

Emite un challenge para uso en el siguiente request.

**No requiere autenticación.**

**Request body:**
```json
{
  "agent_id": "<AgentID_del_initiator>",
  "resource": "org.example/accounts/ACC-001",
  "capability": "acp:cap:financial.payment"
}
```

`resource` y `capability` son informativos. Permiten al Responder emitir challenges pre-contextualizados. No son vinculantes — el binding real ocurre en el PoP Token.

**Response 200:**
```json
{
  "challenge_id": "<uuid_v4>",
  "challenge": "<128_bits_CSPRNG_base64url>",
  "expires_at": 1718920030,
  "responder_id": "<institution_id_del_responder>"
}
```

`expires_at` MUST ser `issued_at + 30 segundos`. Este valor es fijo en v1.0.

**Errores:**

| HTTP | Código | Condición |
|------|--------|-----------|
| 400 | HP-001 | agent_id mal formado |
| 429 | HP-002 | Rate limit de challenges para este agent_id |
| 503 | HP-003 | Challenge registry no disponible |

---

## 7. Estructura del PoP Token

El PoP Token es el artefacto que prueba posesión de `sk_sub`. Se transmite en el header `X-ACP-PoP`.

```json
{
  "ver": "1.0",
  "challenge_id": "<uuid_del_challenge>",
  "challenge": "<valor_del_challenge>",
  "agent_id": "<AgentID_del_initiator>",
  "request_method": "POST",
  "request_path": "/acp/v1/authorize",
  "request_body_hash": "<SHA-256_base64url_de_body>",
  "issued_at": 1718920010,
  "sig": "<base64url_firma_Ed25519_de_sk_sub>"
}
```

**Transmisión:**

El PoP Token serializado en JSON MUST ser codificado en base64url y transmitido en el header:

```http
X-ACP-PoP: <base64url(JSON(pop_token))>
```

---

## 8. Especificación de Campos del PoP Token

**8.1 `ver`** — MUST ser `"1.0"`.

**8.2 `challenge_id`** — UUID del challenge emitido por el Responder. MUST corresponder a un challenge activo en la ventana del Responder.

**8.3 `challenge`** — Valor del challenge. El Responder MUST verificar que coincide con el registrado para `challenge_id`.

**8.4 `agent_id`** — MUST coincidir con el `sub` del CT presentado en `Authorization`.

**8.5 `request_method`** — Método HTTP del request. MUST coincidir con el método real recibido.

**8.6 `request_path`** — Path del request sin query string. MUST coincidir con el path real recibido.

**8.7 `request_body_hash`** — `base64url(SHA-256(body_bytes))`. Para requests sin body: `base64url(SHA-256(""))`.

Este campo es el binding entre la PoP y el contenido específico del request. Impide que una PoP válida sea reutilizada con body distinto.

**8.8 `issued_at`** — Unix timestamp en segundos. MUST ser ≤ `challenge.expires_at`. MUST ser ≥ `challenge.issued_at`.

**8.9 `sig`** — Firma del Initiator con `sk_sub` sobre todos los campos excepto `sig`, según ACP-SIGN-1.0.

---

## 9. Procedimiento de Construcción del PoP Token (Initiator)

```
1. Obtener challenge via POST /acp/v1/handshake/challenge
2. Construir objeto PoP con todos los campos excepto sig
3. issued_at = timestamp actual
4. request_body_hash = base64url(SHA-256(body_bytes_exactos))
5. Firmar según ACP-SIGN-1.0 con sk_sub
6. Serializar a JSON
7. Codificar en base64url
8. Incluir en header X-ACP-PoP
9. Incluir CT en header Authorization: ACP-Agent <CT>
10. Enviar request
```

---

## 10. Procedimiento de Verificación (Responder)

Los siguientes pasos MUST ejecutarse en orden exacto. Un fallo en cualquier paso MUST producir rechazo con el código correspondiente.

```
Paso 1:  Extraer CT de header Authorization
Paso 2:  Extraer y decodificar PoP Token de header X-ACP-PoP
Paso 3:  Verificar pop.ver == "1.0"
Paso 4:  Verificar pop.challenge_id existe en ventana activa
Paso 5:  Verificar pop.challenge == challenge registrado para challenge_id
Paso 6:  Resolver pk_sub desde pop.agent_id via ACP-ITA-1.0 o registro de agentes
Paso 7:  Verificar firma pop.sig con pk_sub según ACP-SIGN-1.0
Paso 8:  Verificar pop.agent_id == CT.sub
Paso 9:  Verificar pop.issued_at <= challenge.expires_at
Paso 10: Verificar pop.request_method == método HTTP recibido
Paso 11: Verificar pop.request_path == path HTTP recibido
Paso 12: Calcular hash_recibido = base64url(SHA-256(body_recibido))
         Verificar hash_recibido == pop.request_body_hash
Paso 13: Eliminar challenge_id de ventana activa (consumido, no reutilizable)
Paso 14: Continuar con validación del CT según ACP-CT-1.0 §6
```

Los pasos 1–13 MUST completarse antes del paso 14. La verificación del CT depende de que la identidad del portador ya esté probada.

---

## 11. Challenge Registry

El Responder MUST mantener un registro en memoria de challenges activos.

**Estructura por entrada:**

```json
{
  "challenge_id": "<uuid>",
  "challenge": "<valor_base64url>",
  "agent_id": "<AgentID>",
  "issued_at": 1718920000,
  "expires_at": 1718920030
}
```

**Reglas de gestión:**

El Responder MUST eliminar una entrada cuando:
- Es consumida (paso 13 del procedimiento de verificación)
- `expires_at` es alcanzado sin haber sido consumida

El Responder MUST rechazar presentación de `challenge_id` que no existe en el registro activo, independientemente de si fue consumida o expirada. El código de error es distinto para cada caso (§12).

**Límite de challenges activos por agent_id:** El Responder MAY limitar el número de challenges activos simultáneos por agent_id. Valor recomendado: 5. Cuando se alcanza el límite, POST /challenge MUST retornar HP-002.

---

## 12. Errores

| Código | HTTP | Condición |
|--------|------|-----------|
| HP-001 | 400 | agent_id mal formado en request de challenge |
| HP-002 | 429 | Límite de challenges activos para agent_id |
| HP-003 | 503 | Challenge registry no disponible |
| HP-004 | 400 | Header X-ACP-PoP ausente |
| HP-005 | 400 | PoP Token mal formado o no decodificable |
| HP-006 | 400 | ver no soportado |
| HP-007 | 401 | challenge_id no encontrado — expirado o ya consumido |
| HP-008 | 401 | challenge value no coincide |
| HP-009 | 401 | Firma PoP inválida |
| HP-010 | 401 | agent_id en PoP no coincide con sub del CT |
| HP-011 | 401 | PoP issued_at fuera de ventana del challenge |
| HP-012 | 400 | request_method no coincide |
| HP-013 | 400 | request_path no coincide |
| HP-014 | 400 | request_body_hash no coincide |
| HP-015 | 401 | pk_sub no resoluble para agent_id |

HP-007 es intencionalmente ambiguo entre expirado y consumido. No se revela al Initiator cuál de los dos ocurrió.

---

## 13. Protección Anti-Replay

La combinación de los siguientes mecanismos garantiza P3:

**Challenge de un solo uso:** El paso 13 del procedimiento de verificación elimina el challenge al consumirlo. Un segundo request con el mismo challenge_id producirá HP-007.

**Ventana de 30 segundos:** Un challenge expirado produce HP-007. El Initiator debe obtener un nuevo challenge para cada request.

**Body hash binding:** `request_body_hash` vincula la PoP al contenido exacto del request. Modificar el body invalida la PoP.

**Method y path binding:** `request_method` y `request_path` vinculan la PoP al endpoint específico. Una PoP válida para POST /authorize no es válida para POST /tokens.

---

## 14. Comportamiento ante Condiciones Anómalas

| Condición | Comportamiento MUST |
|-----------|-------------------|
| Header X-ACP-PoP ausente | Rechazar HP-004 |
| Challenge expirado | Rechazar HP-007 — no revelar si expirado o consumido |
| Challenge ya consumido | Rechazar HP-007 — no revelar si expirado o consumido |
| pk_sub no resoluble | Rechazar HP-015 — no continuar con CT |
| Body recibido distinto al hasheado | Rechazar HP-014 |
| Challenge registry no disponible | Rechazar HP-003 — fail closed |
| PoP con issued_at en el futuro | Rechazar HP-011 |

El Responder MUST fail closed. Si el challenge registry no está disponible, no hay forma de verificar la PoP, por lo que toda solicitud debe ser rechazada.

---

## 15. Relación con ACP-API-1.0

ACP-HP-1.0 opera como capa de verificación previa a ACP-API-1.0. El flujo combinado es:

```
Request llega al servidor ACP
  │
  ├─ Paso 1: ACP-HP-1.0 verifica PoP (pasos 1–13)
  │          Si falla → rechazar HP-0xx
  │
  ├─ Paso 2: ACP-CT-1.0 verifica CT (§6)
  │          Si falla → rechazar CT-0xx / AUTH-0xx
  │
  ├─ Paso 3: ACP-RISK-1.0 evalúa riesgo
  │
  └─ Paso 4: Procesar request
```

Los endpoints de ACP-API-1.0 que requieren autenticación MUST requerir también `X-ACP-PoP` válido. La excepción es `GET /acp/v1/health` y `POST /acp/v1/handshake/challenge`.

---

## 16. Consideraciones de Implementación

**Rate limiting de challenges:** El endpoint POST /challenge MUST tener rate limiting independiente del rate limiting de ACP-API-1.0. Recomendado: 20 challenges/minuto por agent_id.

**Sincronización de reloj:** El campo `issued_at` del PoP no tiene tolerancia explícita de drift. El Responder DEBE aplicar la misma tolerancia de 300 segundos definida en ACP-CT-1.0 §5.6 para `iat`. Si el reloj del Initiator tiene drift excesivo, el challenge puede expirar antes de que la PoP llegue.

**Implementación stateless del Responder:** El challenge registry es el único estado que ACP-HP-1.0 requiere en el servidor. Si el Responder necesita ser horizontalmente escalable, el challenge registry MUST ser compartido entre instancias (ej. Redis con TTL de 30 segundos). Sin registry compartido, un challenge emitido por instancia A no puede ser verificado por instancia B.

---

## 17. Conformidad

Una implementación es ACP-HP-1.0 conforme si:

- Expone `POST /acp/v1/handshake/challenge` con estructura de §6
- Emite challenges de 128 bits CSPRNG con ventana de 30 segundos
- Verifica PoP Token en el orden exacto de §10
- Elimina challenge al consumirlo (paso 13)
- Rechaza challenges expirados o ya consumidos con HP-007
- Falla cerrado cuando el challenge registry no está disponible
- Produce los códigos de error de §12
- Requiere X-ACP-PoP en todos los endpoints autenticados excepto los declarados en §15
