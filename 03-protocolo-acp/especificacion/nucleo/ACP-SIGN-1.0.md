# ACP-SIGN-1.0
## Serialization and Signing Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** RFC 8785 (JCS), RFC 8032 (Ed25519)
**Required-by:** ACP-CT-1.0, ACP-REV-1.0, ACP-API-1.0, ACP-LEDGER-1.0, ACP-ITA-1.0

---

## 1. Alcance

Este documento especifica el mecanismo de canonicalización, hash, y firma digital para todos los artefactos ACP. Todo documento, token, y mensaje que requiera firma en el protocolo ACP MUST seguir esta especificación.

---

## 2. Canonicalización

**2.1 Algoritmo obligatorio**

Toda serialización para firma MUST usar JSON Canonicalization Scheme (JCS) definido en RFC 8785.

JCS garantiza:
- Ordenamiento determinístico de claves de objetos JSON
- Representación numérica canónica
- Escape de caracteres Unicode consistente
- Output en UTF-8 sin BOM

**2.2 Justificación**

JCS es el único estándar de canonicalización JSON con implementaciones verificadas en múltiples lenguajes. No requiere schema previo. Es determinístico entre implementaciones conformes.

**2.3 Implementaciones de referencia**

- Python: `jcs` package
- JavaScript/Node: `canonicalize` package
- Go: `go-jose/json`
- Java: `erdtman/java-json-canonicalization`

---

## 3. Procedimiento de Firma

**3.1 Firma de un objeto**

```
Dado: objeto JSON O, clave privada sk (Ed25519, 32 bytes)

1. Verificar que O no contiene campo "sig"
2. Serializar: canonical_bytes = JCS(O) en UTF-8
3. Calcular digest: h = SHA-256(canonical_bytes)
4. Firmar: signature_bytes = Ed25519_Sign(sk, h)  [64 bytes]
5. Codificar: sig_value = base64url(signature_bytes) sin padding
6. Insertar campo: O["sig"] = sig_value
7. Retornar O con campo sig
```

**3.2 Verificación de firma**

```
Dado: objeto JSON O con campo "sig", clave pública pk (Ed25519, 32 bytes)

1. Extraer y decodificar: signature_bytes = base64url_decode(O["sig"])
2. Construir O_sin_sig = copia de O sin campo "sig"
3. Serializar: canonical_bytes = JCS(O_sin_sig) en UTF-8
4. Calcular digest: h = SHA-256(canonical_bytes)
5. Verificar: resultado = Ed25519_Verify(pk, h, signature_bytes)
6. Si resultado == false → rechazar con SIGN-003
7. Continuar con validación semántica solo si resultado == true
```

**3.3 Orden de operaciones**

La verificación de firma MUST preceder a toda validación semántica. Un objeto con firma inválida MUST ser rechazado sin procesar su contenido.

---

## 4. Algoritmos

**4.1 Hash**

SHA-256 (FIPS 180-4). Output: 32 bytes.

**4.2 Firma digital**

Ed25519 (RFC 8032). Clave privada: 32 bytes. Clave pública: 32 bytes. Firma: 64 bytes.

No se permiten otros algoritmos de firma en v1.0.

**4.3 Codificación de firma**

base64url sin padding (RFC 4648 §5). La firma de 64 bytes produce exactamente 86 caracteres base64url sin padding.

---

## 5. Identificación de Clave Pública

**5.1 Derivación desde AgentID**

Para artefactos firmados por agentes, la clave pública se obtiene del registro del agente:

```
AgentID → GET /acp/v1/agents/{AgentID} → public_key
```

**5.2 Inclusión inline**

El emisor MAY incluir la clave pública en el artefacto con campo `iss_pk`:

```json
"iss_pk": "<base64url_ed25519_public_key_32_bytes>"
```

Cuando `iss_pk` está presente, el verificador MUST verificar que la clave coincide con la registrada para el emisor. No puede usar `iss_pk` como fuente de verdad sin validación.

**5.3 Clave institucional**

Para artefactos firmados por el sistema ACP institucional (responses de API, eventos de ledger), la clave se obtiene del ITA según ACP-ITA-1.0.

---

## 6. Vectores de Prueba

**6.1 Input**

```json
{"ver":"1.0","iss":"3yMApqCuCjXDWPrbjfR5mjCPTHqFG8Pux1TxQrEM7Kx3","sub":"4zNBqDrDjYEQscgkXPwumDQUIqGH9HrYQuD2UyRFN8y4","iat":1718920000}
```

**6.2 JCS output esperado**

```
{"iat":1718920000,"iss":"3yMApqCuCjXDWPrbjfR5mjCPTHqFG8Pux1TxQrEM7Kx3","sub":"4zNBqDrDjYEQscgkXPwumDQUIqGH9HrYQuD2UyRFN8y4","ver":"1.0"}
```

Nota: JCS ordena las claves alfabéticamente.

**6.3 SHA-256 del JCS output**

```
base64url: <debe ser calculado por implementación y verificado contra vector de referencia>
```

Las implementaciones MUST verificar su output JCS y hash contra estos vectores antes de uso en producción.

---

## 7. Errores

| Código | Condición |
|--------|-----------|
| SIGN-001 | Campo sig presente antes de firma — objeto ya firmado o corrupto |
| SIGN-002 | JCS falló — objeto contiene tipos no serializables |
| SIGN-003 | Firma inválida — verificación Ed25519 falló |
| SIGN-004 | Clave pública no encontrada para emisor |
| SIGN-005 | Longitud de firma incorrecta — no son 64 bytes |
| SIGN-006 | base64url decode falló |
| SIGN-007 | Campo sig ausente en objeto que requiere firma |

---

## 8. Conformidad

Una implementación es ACP-SIGN-1.0 conforme si:

- Usa JCS (RFC 8785) exacto para canonicalización
- Usa SHA-256 para hash del canonical output
- Usa Ed25519 (RFC 8032) para firma y verificación
- Codifica firmas en base64url sin padding
- Verifica firma antes de cualquier validación semántica
- Rechaza objetos con firmas inválidas sin procesar contenido
- Pasa los vectores de prueba de sección 6
