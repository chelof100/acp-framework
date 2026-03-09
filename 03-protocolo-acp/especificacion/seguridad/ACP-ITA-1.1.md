# ACP-ITA-1.1
## Inter-Authority Federation Specification
**Status:** Draft
**Version:** 1.1
**Depends-on:** ACP-ITA-1.0, ACP-SIGN-1.0
**Required-by:** ACP-LEDGER-1.1 (verificación cross-institucional), ACP-REP-1.2 (ERS cross-institutional)
**Changelog:** v1.1 — Añade protocolo de reconocimiento mutuo entre autoridades ITA independientes (Modelo B Federado definido en ACP-ITA-1.0 §11). Supersede el borrador BFT anterior.

---

## 1. Alcance

ACP-ITA-1.0 define el modelo centralizado (Modelo A): una única autoridad ITA registra instituciones. Este documento define el Modelo B Federado: múltiples autoridades ITA operadas independientemente que se reconocen mutuamente, permitiendo verificación cross-authority sin punto único de confianza.

ACP-ITA-1.1 especifica:
- Estructura del FederationRecord: acuerdo firmado de reconocimiento mutuo
- Protocolo de establecimiento de federación
- Algoritmo de resolución cross-authority para artefactos ACP
- Propagación de revocaciones entre autoridades federadas
- Descubrimiento de autoridad para un `institution_id` dado

---

## 2. Definiciones

**Authority (ITA Authority):** Entidad que opera un ITA Registry según ACP-ITA-1.0. Identificada por `authority_id` (formato: `ita.<domain>`).

**FederationRecord:** Documento firmado bilateralmente que expresa que dos autoridades se reconocen mutuamente como confiables para los propósitos de verificación ACP.

**FederationRegistry:** Endpoint público de una autoridad que lista todas sus relaciones de federación activas.

**Cross-Authority Resolution:** Proceso por el que institución B (bajo ITA_B) verifica artefactos emitidos por institución A (bajo ITA_A) usando la federación ITA_A ↔ ITA_B.

**Authority Root Key (ARK):** Par de claves Ed25519 de la autoridad ITA. Análogo a la RIK institucional pero para la autoridad misma. Usada para firmar FederationRecords y registros institucionales.

---

## 3. Modelo de Confianza Federado

```
        ITA_A                        ITA_B
    (authority_a)               (authority_b)
         │                            │
         │    FederationRecord        │
         │◄──────────────────────────►│
         │    (bilateral, firmado)    │
         │                            │
    ┌────┴────┐                  ┌────┴────┐
    │  Inst A │                  │  Inst B │
    │ (org.a) │                  │ (org.b) │
    └─────────┘                  └─────────┘
         │                            │
         └──── Artefactos ACP ────────►│
              (verificables vía
               resolución cross-auth)
```

La federación es bilateral: ITA_A reconoce a ITA_B y viceversa en el mismo FederationRecord. No existe federación unidireccional.

La profundidad de federación es 1 hop: ITA_A puede federar con ITA_B y con ITA_C, pero ITA_B y ITA_C no son transitivamente reconocidas entre sí por ello. Cada par requiere su propio FederationRecord.

---

## 4. Estructura del FederationRecord

```json
{
  "ver": "1.1",
  "federation_id": "<uuid_v4>",
  "authority_a": {
    "authority_id": "ita.example-a.com",
    "display_name": "Authority A",
    "registry_endpoint": "https://ita.example-a.com",
    "public_key": "<base64url_ed25519_pk_32_bytes>",
    "key_id": "<SHA-256_base64url_de_public_key>"
  },
  "authority_b": {
    "authority_id": "ita.example-b.com",
    "display_name": "Authority B",
    "registry_endpoint": "https://ita.example-b.com",
    "public_key": "<base64url_ed25519_pk_32_bytes>",
    "key_id": "<SHA-256_base64url_de_public_key>"
  },
  "established_at": 1718900000,
  "valid_until": null,
  "scope": {
    "capabilities": ["*"],
    "event_types": ["*"],
    "restrictions": null
  },
  "sig_a": "<firma_de_authority_a_sobre_el_record_sin_sig_b>",
  "sig_b": "<firma_de_authority_b_sobre_el_record_sin_sig_a>"
}
```

`valid_until` es null para federaciones indefinidas. Cuando presente, la federación expira automáticamente y todos los artefactos emitidos antes de la expiración siguen siendo verificables hasta su propio `exp`.

`scope.capabilities` limita qué capabilities ACP son reconocidas cross-authority. `["*"]` significa sin restricción.

`sig_a` cubre todos los campos excepto `sig_a` y `sig_b`. Ídem para `sig_b`. Ambas firmas deben estar presentes para que el record sea válido.

---

## 5. Protocolo de Establecimiento de Federación

### Fase 1 — Propuesta (fuera de banda)

Las autoridades se contactan por canal fuera de banda (correo, contrato legal, portal de administración) y acuerdan federar. El mecanismo fuera de banda no es especificado por ACP.

### Fase 2 — Firma bilateral

```
1. ITA_A construye FederationRecord con todos los campos excepto sig_a y sig_b
2. ITA_A firma: sig_a = Sign(ark_a, SHA-256(JCS(record_sin_ambas_sigs)))
3. ITA_A envía el record con sig_a a ITA_B
4. ITA_B verifica sig_a con pk_a conocida fuera de banda
5. ITA_B firma: sig_b = Sign(ark_b, SHA-256(JCS(record_sin_ambas_sigs)))
6. ITA_B publica el record completo (con sig_a y sig_b) en su FederationRegistry
7. ITA_A hace lo mismo
```

Ambas autoridades MUST publicar el mismo FederationRecord. Un verificador que obtiene el record de cualquiera de las dos puede verificar ambas firmas.

### Fase 3 — Activación

La federación está activa cuando el FederationRecord es publicado por ambas partes. No hay período de transición.

---

## 6. API del FederationRegistry

### `GET /ita/v1/federation`

Lista todas las federaciones activas de esta autoridad. **No requiere autenticación.**

**Response 200:**
```json
{
  "ver": "1.1",
  "authority_id": "ita.example-a.com",
  "federations": [
    {
      "federation_id": "<uuid>",
      "peer_authority_id": "ita.example-b.com",
      "peer_display_name": "Authority B",
      "peer_registry_endpoint": "https://ita.example-b.com",
      "established_at": 1718900000,
      "valid_until": null,
      "status": "active"
    }
  ]
}
```

### `GET /ita/v1/federation/{federation_id}`

Retorna el FederationRecord completo con ambas firmas.

**Response 200:** FederationRecord completo según §4.

### `GET /ita/v1/federation/resolve/{institution_id}`

Dado un `institution_id`, retorna bajo qué autoridad está registrada esa institución, buscando en el propio registry y en los peers federados.

**Response 200:**
```json
{
  "institution_id": "org.example.banking",
  "governing_authority": "ita.example-a.com",
  "resolution_path": "direct | federated",
  "federation_id": "<uuid_o_null_si_direct>",
  "institution_record": {},
  "verified_at": 1718920000
}
```

`resolution_path: "direct"` — la institución está en el registry propio.
`resolution_path: "federated"` — la institución fue encontrada en un peer federado.

El servidor MUST verificar la firma del registro institucional retornado antes de incluirlo en la respuesta.

**Errores:**

| Código | HTTP | Condición |
|--------|------|-----------|
| ITA-F001 | 404 | institution_id no encontrado en ningún registry federado |
| ITA-F002 | 502 | Peer federation registry no responde (timeout) |

Cuando ITA-F002, la respuesta SHOULD incluir qué peers fueron intentados y cuáles fallaron:
```json
{
  "error": "ITA-F002",
  "peers_attempted": ["ita.example-b.com"],
  "peers_failed": ["ita.example-b.com"]
}
```

---

## 7. Notificación de Revocaciones — `POST /ita/v1/revocation-notify`

Cuando una institución bajo ITA_A es revocada, ITA_A MUST notificar a todos sus peers federados.

### Request body (enviado por ITA_A a ITA_B)

```json
{
  "ver": "1.1",
  "notification_id": "<uuid>",
  "federation_id": "<uuid>",
  "notifying_authority": "ita.example-a.com",
  "event": "institution_revoked | institution_key_revoked",
  "institution_id": "org.example.banking",
  "key_id": "<key_id_afectado_o_null_si_institution_revoked>",
  "revoked_at": 1718920000,
  "reason_code": "ITA-F010",
  "sig": "<firma_de_authority_a>"
}
```

`sig` cubre todos los campos excepto `sig`.

ITA_B MUST verificar `sig` con la pk de ITA_A del FederationRecord antes de procesar la notificación.

### Response 200

```json
{
  "notification_id": "<uuid>",
  "accepted": true,
  "invalidated_cache_entries": 3
}
```

ITA_B MUST invalidar inmediatamente su caché local de la institución o clave revocada. Los artefactos firmados con la clave revocada son inválidos desde `revoked_at`.

---

## 8. Algoritmo de Resolución Cross-Authority

Cuando institución B (bajo ITA_B) verifica un artefacto ACP emitido por institución A (bajo ITA_A):

```
1. Extraer institution_id del artefacto → "org.example.banking"
2. GET /ita/v1/institutions/org.example.banking en ITA_B → 404 (no está en ITA_B)
3. GET /ita/v1/federation/resolve/org.example.banking en ITA_B
   → governing_authority: "ita.example-a.com", resolution_path: "federated"
4. Obtener FederationRecord ITA_A ↔ ITA_B:
   GET /ita/v1/federation/{federation_id} en ITA_B o ITA_A
5. Verificar ambas firmas del FederationRecord con pk de ITA_A y ITA_B
   (pk de ITA_B conocida localmente; pk de ITA_A en FederationRecord)
6. Verificar que FederationRecord.status == "active"
7. Obtener registro institucional de ITA_A:
   GET /ita/v1/institutions/org.example.banking en ITA_A
8. Verificar firma del registro institucional con pk de ITA_A (del FederationRecord)
9. Extraer public_key institucional y verificar firma del artefacto
```

Un verificador puede hacer este proceso sin confiar en ITA_A directamente — confía en la firma de ITA_B sobre el FederationRecord, que a su vez incluye la pk de ITA_A.

**Caching:** Los FederationRecords pueden cachearse hasta 3600s. Los registros institucionales obtenidos via federación tienen TTL máximo 300s (igual que durante rotación en ITA-1.0).

---

## 9. Impacto en ACP-REP-1.2

Los eventos `REPUTATION_UPDATED` emitidos por institución A (bajo ITA_A) y usados por institución B (bajo ITA_B) para calcular ERS cross-institutional MUST ser verificados mediante el algoritmo de §8 antes de ser considerados como `context: "cross_institutional"` (peso 1.0 en ERS).

Eventos no verificables via resolución cross-authority (federation no disponible, firma inválida) MUST ser descartados del cálculo ERS.

---

## 10. Terminación de Federación

Una federación puede terminarse por acuerdo mutuo o unilateralmente.

### Terminación por acuerdo mutuo

Ambas autoridades eliminan el FederationRecord de sus FederationRegistries simultáneamente.

### Terminación unilateral

Una autoridad puede marcar la federación como `status: "terminating"` en su propio registry, estableciendo un período de gracia de 7 días. Durante ese período:
- No se aceptan nuevos artefactos cross-authority
- Los artefactos emitidos antes de `terminating_at` siguen siendo verificables hasta su propio `exp`

Al vencer el período de gracia, el status pasa a `"terminated"`. Artefactos posteriores a `terminating_at` son inválidos.

La otra autoridad MUST ser notificada via `POST /ita/v1/revocation-notify` con `event: "federation_terminating"`.

---

## 11. Errores Generales de Federación

| Código | HTTP | Condición |
|--------|------|-----------|
| ITA-F010 | — | Institución revocada por su autoridad gobernante |
| ITA-F011 | 400 | FederationRecord con firma inválida |
| ITA-F012 | 400 | FederationRecord expirado |
| ITA-F013 | 403 | Federación terminada — resolución cross-authority no disponible |
| ITA-F014 | 400 | Notificación de revocación con firma inválida |
| ITA-F015 | 409 | Federation ya existe entre estas dos autoridades |
| ITA-F016 | 400 | Profundidad de federación excedida (max 1 hop directo) |

---

## 12. Consideraciones de Seguridad

**Captura de FederationRecord:** Un atacante que compromete la ARK de ITA_A puede establecer federaciones fraudulentas. La ARK MUST ser custodiada en HSM con acceso estrictamente limitado.

**Resolución de institution_id ambigua:** Si el mismo `institution_id` aparece bajo dos autoridades diferentes, el verificador MUST rechazar ambos y reportar ITA-F001. Los `institution_id` deben ser globalmente únicos.

**Bootstrap de pk de autoridad:** La pk de una autoridad ITA (su ARK pública) MUST ser obtenida fuera de banda la primera vez. Mecanismos recomendados: DNS con DNSSEC, certificado TLS del endpoint ITA, documentación oficial firmada. Una vez obtenida, todas las verificaciones posteriores son autónomas.

**Revocación tardía:** Entre que ITA_A revoca una institución y la notificación llega a ITA_B, existe una ventana de tiempo en que ITA_B aún acepta artefactos de la institución revocada. Esta ventana es aceptable dado el modelo de threat y se mitiga con TTL bajo (300s) para registros institucionales federados.

---

## 13. Conformidad

Una implementación es ACP-ITA-1.1 conforme si:

- Implementa FederationRecord según §4 con doble firma
- Implementa protocolo de establecimiento de §5
- Expone `GET /ita/v1/federation`, `GET /ita/v1/federation/{id}`, `GET /ita/v1/federation/resolve/{institution_id}`
- Expone `POST /ita/v1/revocation-notify` y propaga revocaciones a peers
- Implementa algoritmo de resolución cross-authority de §8
- Limita federación a 1 hop (no transitiva)
- Invalida caché local ante notificación de revocación
- Custodia ARK en HSM y nunca la expone en API
