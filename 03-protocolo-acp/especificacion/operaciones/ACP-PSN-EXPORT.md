# ACP-PSN-EXPORT — Exportación de Policy Snapshots entre Instituciones

| Campo | Valor |
|---|---|
| **Estado** | Borrador |
| **Versión** | 1.0 |
| **Tipo** | Extensión de Protocolo |
| **Depende de** | ACP-PSN-1.0, ACP-SIGN-1.0, ACP-LEDGER-1.2 |
| **Fecha** | 2026-03-10 |

---

## 1. Propósito

Este documento especifica el mecanismo para exportar Policy Snapshots (PSN) entre instituciones participantes en la federación ACP, en un formato firmado y verificable.

La exportación de PSN permite que una institución comparta un estado de política verificado con otra institución, garantizando:

- **Autenticidad**: el snapshot proviene de la institución declarada como origen.
- **Integridad**: el contenido no fue modificado en tránsito.
- **Frescura**: el snapshot fue exportado dentro de una ventana de tiempo válida.
- **Trazabilidad**: el evento queda registrado en el ledger de ambas instituciones.

Este mecanismo es necesario para escenarios de auditoría cruzada, onboarding federado de agentes y sincronización de políticas entre nodos ACP de distintas organizaciones.

---

## 2. Formato de Exportación

Una exportación de Policy Snapshot se encapsula en un **sobre de exportación firmado** con la siguiente estructura:

```json
{
  "export_id": "exp-uuid-7f3a1b",
  "snapshot_id": "psn-uuid-4d2e9c",
  "source_institution": "inst-uuid-acme",
  "target_institution": "inst-uuid-globalbank",
  "exported_at": "2026-03-10T14:00:00Z",
  "snapshot_content": {
    "snapshot_id": "psn-uuid-4d2e9c",
    "institution_id": "inst-uuid-acme",
    "policy_version": "3.1.2",
    "effective_at": "2026-03-01T00:00:00Z",
    "rules": [ "..." ],
    "content_hash": "sha256:abc123..."
  },
  "signature": "<JWS compacto — firmado por source_institution>"
}
```

### 2.1 Campos del sobre

| Campo | Tipo | Descripción |
|---|---|---|
| `export_id` | UUID | Identificador único de esta exportación. Uso único por par source/target. |
| `snapshot_id` | UUID | Referencia al snapshot exportado (ACP-PSN-1.0). |
| `source_institution` | UUID | Institución que genera y firma el sobre. |
| `target_institution` | UUID | Institución destinataria del sobre. |
| `exported_at` | ISO 8601 | Timestamp de generación del sobre. |
| `snapshot_content` | Objeto | Cuerpo completo del snapshot según ACP-PSN-1.0. |
| `signature` | JWS | Firma JWS (JSON Web Signature) del sobre completo por `source_institution`. |

### 2.2 Algoritmo de firma

La firma JWS DEBE usar el algoritmo `ES256` con la clave privada registrada para `source_institution` en el directorio de claves ACP. El payload firmado es el objeto completo del sobre excluyendo el campo `signature`.

---

## 3. Endpoint de Exportación

### 3.1 Solicitud

```
GET /acp/v1/policy-snapshots/{snapshot_id}/export?target_institution={inst_id}
```

| Parámetro | Ubicación | Requerido | Descripción |
|---|---|---|---|
| `snapshot_id` | Path | Sí | ID del snapshot a exportar |
| `target_institution` | Query | Sí | ID de la institución destinataria |

**Headers requeridos:**
```
Authorization: Bearer <token de la source_institution>
Content-Type: application/json
```

### 3.2 Respuesta exitosa

```
HTTP 200 OK
Content-Type: application/json
```

Cuerpo: el sobre de exportación firmado según §2.

### 3.3 Comportamiento del servidor

Al recibir la solicitud, el servidor ACP de `source_institution` DEBE:

1. Verificar que `snapshot_id` existe y pertenece a la institución autenticada.
2. Verificar que `target_institution` está en la federación de confianza (ACP-ITA-1.1).
3. Verificar que no existe una exportación previa de este snapshot hacia `target_institution` (uso único).
4. Construir el sobre de exportación con los campos de §2.
5. Firmar el sobre con la clave privada institucional.
6. Registrar el evento en el ledger (§6).
7. Retornar el sobre firmado.

---

## 4. Validación en la Institución Receptora

Al recibir un sobre de exportación, la institución receptora DEBE validar los siguientes puntos en orden:

### 4.1 Verificación de firma JWS

- Obtener la clave pública de `source_institution` del directorio de claves ACP.
- Verificar la firma JWS del sobre completo (excluyendo el campo `signature`).
- Si la verificación falla: rechazar con error `PSN-EXP-003`.

### 4.2 Verificación de hash de contenido

- Calcular el hash SHA-256 del campo `snapshot_content` serializado canónicamente.
- Comparar con `snapshot_content.content_hash`.
- Si no coincide: rechazar con error `PSN-EXP-003`.

### 4.3 Verificación de ventana temporal

- Calcular `now() - exported_at`.
- Si el resultado supera 24 horas: rechazar con error `PSN-EXP-004`.

### 4.4 Verificación de federación

- Confirmar que `source_institution` aparece en el registro de instituciones federadas (ACP-ITA-1.1).
- Si no está federada: rechazar con error `PSN-EXP-002`.

### 4.5 Aceptación

Solo tras superar todas las validaciones anteriores, la institución receptora PUEDE importar el snapshot a su almacenamiento local y registrar el evento de importación (§7).

---

## 5. Códigos de Error

| Código | HTTP | Descripción |
|---|---|---|
| `PSN-EXP-001` | 404 | Snapshot no encontrado o no pertenece a la institución autenticada |
| `PSN-EXP-002` | 403 | La institución destino no está federada (no aparece en ACP-ITA-1.1) |
| `PSN-EXP-003` | 422 | Verificación de firma o hash fallida |
| `PSN-EXP-004` | 410 | Snapshot expirado para exportación (ventana de 24h superada) |
| `PSN-EXP-005` | 409 | Este snapshot ya fue exportado previamente hacia esta institución destino |

---

## 6. Integración con el Ledger

### 6.1 Evento en la institución origen

Al completar una exportación exitosa, `source_institution` DEBE registrar el siguiente evento en ACP-LEDGER-1.2:

```json
{
  "event_type": "POLICY_SNAPSHOT_EXPORTED",
  "event_id": "evt-uuid-...",
  "timestamp": "2026-03-10T14:00:00Z",
  "snapshot_id": "psn-uuid-4d2e9c",
  "source_institution": "inst-uuid-acme",
  "target_institution": "inst-uuid-globalbank",
  "export_id": "exp-uuid-7f3a1b",
  "prev_hash": "<hash del evento anterior en la cadena>",
  "signature": "<firma institucional del evento>"
}
```

### 6.2 Campos del evento

| Campo | Descripción |
|---|---|
| `event_type` | Valor fijo: `POLICY_SNAPSHOT_EXPORTED` |
| `snapshot_id` | ID del snapshot exportado |
| `source_institution` | ID de la institución exportadora |
| `target_institution` | ID de la institución receptora |
| `export_id` | ID único del sobre de exportación generado |
| `prev_hash` | Hash del último evento en la cadena del ledger (encadenamiento) |
| `signature` | Firma institucional del evento completo |

---

## 7. Seguridad

### 7.1 Exportaciones de uso único

Cada sobre de exportación TIENE uso único por par `(snapshot_id, target_institution)`. Si `source_institution` intenta exportar el mismo snapshot a la misma institución destino nuevamente, el servidor DEBE retornar `PSN-EXP-005`.

### 7.2 Registro de importación

La institución receptora DEBE registrar en su propio ledger el evento `POLICY_SNAPSHOT_IMPORTED` al aceptar un sobre:

```json
{
  "event_type": "POLICY_SNAPSHOT_IMPORTED",
  "snapshot_id": "psn-uuid-4d2e9c",
  "source_institution": "inst-uuid-acme",
  "export_id": "exp-uuid-7f3a1b",
  "imported_at": "2026-03-10T14:02:00Z",
  "prev_hash": "<hash del evento anterior en el ledger receptor>",
  "signature": "<firma de la institución receptora>"
}
```

### 7.3 No reutilización de sobres

La institución receptora DEBE rechazar un sobre con `export_id` ya registrado en su ledger local, incluso si la firma es válida.

### 7.4 Transmisión segura

Los sobres de exportación DEBEN transmitirse únicamente sobre TLS 1.2 o superior. El contenido está adicionalmente protegido por la firma JWS, pero la seguridad en tránsito es obligatoria.
