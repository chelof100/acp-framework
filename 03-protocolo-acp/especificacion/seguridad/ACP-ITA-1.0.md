# ACP-ITA-1.0
## Institutional Trust Anchor Specification
**Status:** Draft
**Version:** 1.0
**Depends-on:** ACP-SIGN-1.0, ACP-CT-1.0
**Required-by:** ACP-LEDGER-1.0, ACP-CONF-1.0

---

## 1. Alcance

Este documento define cómo se registran instituciones en ACP, cómo se establece y gestiona la Root Institutional Key (RIK), cómo los verificadores externos resuelven claves institucionales, y cómo se establece confianza entre instituciones en entornos B2B.

---

## 2. Definiciones

**Institutional Trust Anchor (ITA):** Registro autoritativo que vincula un `institution_id` a una clave pública Ed25519 verificable externamente.

**Root Institutional Key (RIK):** Par de claves Ed25519 de la institución. La clave pública es registrada en el ITA. La clave privada MUST ser custodiada en HSM institucional y nunca salir de él.

**Key Rotation:** Proceso de reemplazo de RIK con continuidad de confianza verificable.

**Cross-Institutional Verification:** Capacidad de institución B de verificar artefactos ACP emitidos por institución A usando únicamente el ITA público.

---

## 3. Modelo de Confianza

```
         ITA Registry
         (autoritativo)
               │
    ┌──────────┴──────────┐
    │                     │
Institución A         Institución B
RIK_A (pk_A)          RIK_B (pk_B)
    │                     │
    ├─ Capability Tokens   ├─ Capability Tokens
    ├─ Execution Tokens    ├─ Execution Tokens
    ├─ Ledger Events       ├─ Ledger Events
    └─ API Responses       └─ API Responses
```

---

## 4. Estructura del Registro Institucional

```json
{
  "ver": "1.0",
  "institution_id": "org.example.banking",
  "display_name": "Example Banking Corp",
  "public_key": "<base64url_ed25519_public_key_32_bytes>",
  "key_id": "<SHA-256_base64url_de_public_key>",
  "registered_at": 1718900000,
  "status": "active",
  "contact_endpoint": "https://acp.example-banking.com",
  "prev_key_id": null,
  "rotation_ref": null,
  "sig": "<firma_del_registro_por_autoridad_ITA>"
}
```

---

## 5. Especificación de Campos

**5.1 `institution_id`**
Formato: `<tld>.<domain>.<subdomain_opcional>`. MUST ser único. Caracteres alfanuméricos y puntos. Longitud máxima: 128 caracteres.

**5.2 `public_key`**
MUST ser clave pública Ed25519 de 32 bytes en base64url sin padding.

**5.3 `key_id`**
MUST ser `base64url(SHA-256(decode_base64url(public_key)))`.

**5.4 `status`**
MUST ser uno de: `active`, `rotating`, `revoked`.

- `active` — clave vigente
- `rotating` — rotación en progreso, ambas claves válidas durante transición
- `revoked` — clave comprometida, todos los artefactos firmados con ella son inválidos

**5.5 `contact_endpoint`**
URL base del sistema ACP institucional. MUST ser HTTPS.

**5.6 `prev_key_id`**
`key_id` de la clave anterior. Null para registros iniciales.

**5.7 `sig`**
Firma de la autoridad ITA sobre todos los campos excepto `sig`, según ACP-SIGN-1.0.

---

## 6. API del ITA Registry

### `GET /ita/v1/institutions/{institution_id}`

Retorna el registro institucional. **No requiere autenticación.**

**Response 200:**
```json
{
  "ver": "1.0",
  "institution_id": "org.example.banking",
  "public_key": "<base64url_pk>",
  "key_id": "<key_id>",
  "status": "active",
  "contact_endpoint": "https://acp.example-banking.com",
  "sig": "<firma_autoridad_ITA>"
}
```

### `GET /ita/v1/institutions/{institution_id}/key/{key_id}`

Retorna una clave específica por key_id. Útil durante rotación.

**Response 200:**
```json
{
  "institution_id": "org.example.banking",
  "key_id": "<key_id>",
  "public_key": "<base64url_pk>",
  "status": "active | rotating | revoked",
  "valid_from": 1718900000,
  "valid_until": null,
  "sig": "<firma_autoridad_ITA>"
}
```

`valid_until` es null mientras la clave está activa.

### `POST /ita/v1/institutions`

Registra una nueva institución. Requiere autenticación fuera de banda ante la autoridad ITA.

**Request body:**
```json
{
  "institution_id": "org.example.banking",
  "display_name": "Example Banking Corp",
  "public_key": "<base64url_pk>",
  "contact_endpoint": "https://acp.example-banking.com",
  "proof_of_key_possession": "<firma_sobre_institution_id_con_sk_institucional>"
}
```

`proof_of_key_possession` MUST ser `base64url(Sign(sk_institucional, SHA-256(institution_id_bytes)))`.

---

## 7. Resolución de Clave para Verificación

```
1. Extraer institution_id del artefacto
2. GET /ita/v1/institutions/{institution_id}
3. Verificar sig del registro con pk de la autoridad ITA
4. Verificar status == "active" o "rotating"
5. Si status == "revoked" → rechazar artefacto
6. Extraer public_key y verificar firma del artefacto
```

**Caching:** TTL recomendado 3600s. TTL máximo 86400s. Durante `rotating`: TTL máximo 300s.

---

## 8. Key Rotation

### Proceso normal (3 fases)

**Fase 1 — Preparación:**
- Institución genera nuevo par de claves en HSM
- Envía nueva public_key con proof_of_possession a autoridad ITA
- Autoridad actualiza status a `rotating`, registra `prev_key_id`

**Fase 2 — Transición (máximo 7 días):**
- Artefactos nuevos firmados con nueva clave
- Artefactos con clave anterior siguen siendo válidos
- Verificadores obtienen ambas claves durante transición

**Fase 3 — Completar:**
- Institución confirma que no hay artefactos activos con clave anterior
- Autoridad ITA actualiza a `active` con nueva clave
- `prev_key_id` permanece para trazabilidad histórica

### Rotación de emergencia (compromiso de clave)

```
1. Institución notifica a autoridad ITA
2. Autoridad marca clave actual como "revoked" con valid_until = now
3. Todos los artefactos firmados con esa clave son inmediatamente inválidos
4. Institución inicia registro con nueva clave
5. No hay período de transición
```

La rotación de emergencia invalida todos los CTs, ETs, y eventos de ledger firmados con la clave comprometida. Esto es correcto y esperado.

---

## 9. Inclusión de key_id en Artefactos

Para soportar resolución eficiente durante rotación:

En Capability Tokens (campo opcional):
```json
"iss_key_id": "<key_id>"
```

En eventos de ledger (campo opcional):
```json
"signing_key_id": "<key_id>"
```

Cuando presente, el verificador SHOULD usar `GET /ita/v1/institutions/{institution_id}/key/{key_id}` directamente.

---

## 10. Bootstrap

La clave pública de la autoridad ITA MUST ser distribuida por canal fuera de banda. Mecanismos recomendados: documentación oficial firmada, DNS con DNSSEC, certificado TLS del endpoint ITA.

El bootstrap es el único punto donde ACP depende de un mecanismo externo. Una vez que el verificador tiene la clave de la autoridad ITA, toda verificación posterior es autónoma.

---

## 11. Modelos Operativos

**Modelo A — Centralizado:** Una entidad opera el ITA Registry. Simple de implementar. Punto único de confianza.

**Modelo B — Federado:** Múltiples autoridades ITA con reconocimiento mutuo. Sin punto único de confianza. Requiere protocolo de reconocimiento entre autoridades.

La especificación define la interfaz sin prescribir el modelo. Cada despliegue B2B elige el modelo. Los mecanismos de verificación son idénticos en ambos.

---

## 12. Errores

| Código | Condición |
|--------|-----------|
| ITA-001 | institution_id no registrado |
| ITA-002 | Institución revocada |
| ITA-003 | key_id no encontrado para institución |
| ITA-004 | proof_of_key_possession inválido |
| ITA-005 | institution_id ya registrado |
| ITA-006 | Firma del registro ITA inválida |
| ITA-007 | Clave en estado revoked — artefacto inválido |

---

## 13. Conformidad

Una implementación es ACP-ITA-1.0 conforme si:

- Mantiene registro institucional con estructura de §4
- Expone endpoints de §6
- Implementa proof_of_key_possession en registro inicial
- Implementa rotación con período de transición máximo 7 días
- Implementa rotación de emergencia con invalidación inmediata
- Firma todos los registros con RIK de la autoridad ITA
- Permite resolución por key_id durante rotación
