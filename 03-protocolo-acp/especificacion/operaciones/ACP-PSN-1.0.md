# ACP-PSN-1.0
## Policy Snapshot Specification
**Status:** Stable
**Version:** 1.0
**Depends-on:** ACP-RISK-1.0, ACP-SIGN-1.0, ACP-LEDGER-1.2
**Required-by:** ACP-LEDGER-1.2, ACP-LIA-1.0

---

## 1. Alcance

Este documento define el mecanismo de Policy Snapshot (instantánea de política) en el ecosistema ACP. Especifica la estructura de un snapshot, su ciclo de vida, el proceso de transición atómica entre snapshots, y los endpoints de consulta y creación.

El objetivo es resolver el problema de "policy drift": cuando una auditoría se realiza semanas después de una ejecución, la política de riesgo vigente puede haber cambiado. El Policy Snapshot garantiza que la política exacta que gobernó una decisión pueda reconstruirse de forma determinista en cualquier momento futuro.

---

## 2. Definiciones

**Policy Snapshot:** Registro inmutable y firmado del estado completo de la política de riesgo en un instante específico. Una vez creado, no puede modificarse.

**Snapshot activo:** El único snapshot con `effective_until: null` en un momento dado. Toda nueva evaluación de riesgo MUST referenciar el snapshot activo.

**Snapshot superseded:** Snapshot que fue reemplazado por uno posterior. Su `effective_until` está fijado al `effective_from` del snapshot sucesor.

**Snapshot transition:** Proceso atómico por el cual un nuevo snapshot pasa a ser el activo y el anterior queda superseded. No puede haber un instante sin snapshot activo.

**policy_version:** String semántico (semver) que identifica la versión lógica de la política. Múltiples snapshots pueden compartir la misma `policy_version` si representan la misma política sin cambios de contenido (no es el caso normal).

**Policy drift:** Fenómeno donde la política actual en el momento de la auditoría difiere de la política vigente en el momento de la ejecución. El Policy Snapshot elimina este riesgo.

---

## 3. Principios

**3.1 Inmutabilidad** — Un Policy Snapshot, una vez creado y firmado, es inmutable. No puede actualizarse ni eliminarse.

**3.2 Unicidad del snapshot activo** — En todo momento MUST existir exactamente un snapshot activo (`effective_until: null`). La transición es atómica.

**3.3 Cobertura temporal total** — Los rangos `[effective_from, effective_until)` de todos los snapshots MUST cubrir el timeline completo sin huecos desde la creación del primer snapshot.

**3.4 Referenciabilidad permanente** — Todo snapshot, incluyendo superseded, MUST permanecer disponible para consulta indefinidamente. No se eliminan snapshots.

**3.5 Firma institucional** — Todo snapshot MUST estar firmado con la clave institucional (ACP-SIGN-1.0). La firma cubre todos los campos del snapshot excepto `sig`.

---

## 4. Estructura del Policy Snapshot

```json
{
  "ver": "1.0",
  "snapshot_id": "<uuid_v4>",
  "institution_id": "org.example.banking",
  "policy_version": "2.1.0",
  "effective_from": 1718900000,
  "effective_until": null,
  "thresholds": {
    "default": {
      "approved_max": 39,
      "escalated_max": 69
    },
    "by_autonomy_level": {
      "0": {"approved_max": -1, "escalated_max": -1},
      "1": {"approved_max": 19, "escalated_max": 100},
      "2": {"approved_max": 39, "escalated_max": 69},
      "3": {"approved_max": 59, "escalated_max": 79},
      "4": {"approved_max": 79, "escalated_max": 89}
    }
  },
  "capability_baselines": {
    "acp:cap:financial.payment": 35,
    "acp:cap:financial.transfer": 40,
    "acp:cap:data.read": 10,
    "acp:cap:data.write": 25
  },
  "context_factors": {
    "off_hours": 15,
    "non_corporate_ip": 20,
    "high_frequency": 10
  },
  "resource_factors": {
    "public": 0,
    "sensitive": 15,
    "critical": 30
  },
  "custom_factors": {},
  "created_at": 1718900000,
  "created_by": "<AgentID>",
  "sig": "<firma_institucional>"
}
```

---

## 5. Especificación de Campos

**5.1 `ver`** — Versión del schema ACP-PSN. MUST ser `"1.0"` para snapshots conformes con este documento.

**5.2 `snapshot_id`** — UUID v4 único e inmutable. Clave primaria de referencia en todos los sistemas ACP.

**5.3 `institution_id`** — Identificador de la institución propietaria del snapshot. MUST coincidir con el `institution_id` del ledger donde se registra.

**5.4 `policy_version`** — String semver de la versión lógica de la política. Incrementar cuando cambia algún threshold o factor. Permite a auditores identificar qué versión de política estaba vigente.

**5.5 `effective_from`** — Unix timestamp (segundos) del inicio de validez del snapshot. MUST ser ≥ `effective_from` del snapshot anterior (no puede solaparse hacia atrás).

**5.6 `effective_until`** — Unix timestamp del fin de validez. `null` indica snapshot activo. Al ser superseded, se fija al `effective_from` del snapshot sucesor.

**5.7 `thresholds`** — Objeto con umbrales de evaluación de riesgo:
- `default`: Umbrales globales cuando no hay regla específica por `autonomy_level`.
- `by_autonomy_level`: Mapa `autonomy_level` → umbrales. `approved_max`: score máximo para aprobación automática. `escalated_max`: score máximo para escalación (por encima → rechazo). `-1` indica que el nivel no puede ejecutar ninguna acción.

**5.8 `capability_baselines`** — Mapa de capability → score base. El score base se suma al score total antes de aplicar factores de contexto y recurso. Capabilities no listadas usan el valor `default.approved_max / 2` como baseline.

**5.9 `context_factors`** — Mapa de factor de contexto → incremento de score. Los factores se suman cuando la condición correspondiente se detecta en la evaluación.

**5.10 `resource_factors`** — Mapa de clasificación de recurso → incremento de score. Se aplica el factor correspondiente a la clasificación del recurso objetivo.

**5.11 `custom_factors`** — Mapa extensible para factores personalizados por la institución. MUST respetar el formato `string → integer`. Las implementaciones SHOULD documentar los factores custom que soportan.

**5.12 `created_at`** — Unix timestamp de creación del snapshot. MUST coincidir con `effective_from`.

**5.13 `created_by`** — AgentID del agente o sistema que creó el snapshot. SHOULD ser el sistema de gestión de políticas institucional.

**5.14 `sig`** — Firma institucional (ACP-SIGN-1.0) sobre todos los campos excepto `sig`. Computada sobre `base64url(SHA-256(JCS(snapshot sin sig)))`.

---

## 6. Ciclo de Vida

**Estados:**
- `ACTIVE`: snapshot con `effective_until: null`. Exactamente uno a la vez.
- `SUPERSEDED`: snapshot con `effective_until` fijado. Estado terminal.

**Transiciones:**
```
ACTIVE → SUPERSEDED  (via Snapshot Transition §7)
```

No existe transición de SUPERSEDED a ningún otro estado.

---

## 7. Snapshot Transition (Proceso Atómico)

Cuando una nueva política debe activarse:

**7.1 Pre-condición:** MUST existir exactamente un snapshot ACTIVE.

**7.2 Secuencia atómica:**
1. Crear nuevo snapshot con `effective_from = T_now`, `effective_until = null`, `policy_version` incrementado si hay cambios.
2. Firmar nuevo snapshot (ACP-SIGN-1.0).
3. En una transacción atómica:
   a. Fijar `effective_until = T_now` en el snapshot ACTIVE anterior.
   b. Persistir el nuevo snapshot como ACTIVE.
4. Emitir evento `POLICY_SNAPSHOT_CREATED` en el Audit Ledger (ACP-LEDGER-1.2 §5.13).

**7.3 Atomicidad:** Si el paso 3 falla, el estado MUST revertir. No puede quedar el sistema sin snapshot ACTIVE ni con dos snapshots ACTIVE simultáneamente.

**7.4 `effective_until` del snapshot superseded:** MUST ser igual al `effective_from` del nuevo snapshot. Esto garantiza cobertura temporal sin huecos ni solapamientos.

---

## 8. Uso en Evaluación de Riesgo

**8.1 Referencia obligatoria** — Todo evento `AUTHORIZATION` y `RISK_EVALUATION` en el ledger MUST incluir `policy_snapshot_ref` con el UUID del snapshot ACTIVE en el momento de la evaluación.

**8.2 Determinismo** — Dado un `policy_snapshot_ref`, cualquier actor puede replicar exactamente el cálculo de riesgo realizado en el momento de la ejecución, independientemente de los cambios de política ocurridos después.

**8.3 Obtención del snapshot activo** — Los implementadores SHOULD cachear el snapshot activo en memoria. El cache MUST invalidarse al detectar un evento `POLICY_SNAPSHOT_CREATED` en el ledger.

---

## 9. Endpoints

### 9.1 `GET /acp/v1/policy-snapshots/active`

Retorna el snapshot actualmente activo.

**Response 200:**
```json
{
  "snapshot": { /* Policy Snapshot completo */ },
  "retrieved_at": 1718925000
}
```
**Response 503:** `PSN-005` si no existe snapshot activo (estado inválido del sistema).

---

### 9.2 `GET /acp/v1/policy-snapshots/{snapshot_id}`

Retorna un snapshot específico por ID (incluye superseded).

**Response 200:** Policy Snapshot completo.
**Response 404:** `PSN-001`

---

### 9.3 `GET /acp/v1/policy-snapshots?from=&to=`

Lista snapshots vigentes en un rango temporal. Útil para auditorías históricas.

**Query params:**
- `from`: Unix timestamp inicio (requerido)
- `to`: Unix timestamp fin (default: now)
- `include_superseded`: boolean (default: true)

**Response 200:**
```json
{
  "items": [
    {
      "snapshot_id": "<uuid>",
      "policy_version": "2.1.0",
      "effective_from": 1718900000,
      "effective_until": 1719000000,
      "status": "SUPERSEDED"
    }
  ],
  "total_count": 3
}
```

---

### 9.4 `POST /acp/v1/policy-snapshots`

Crea un nuevo snapshot y lo activa (ejecuta Snapshot Transition §7).

**Request body:**
```json
{
  "policy_version": "2.2.0",
  "thresholds": { /* ... */ },
  "capability_baselines": { /* ... */ },
  "context_factors": { /* ... */ },
  "resource_factors": { /* ... */ },
  "custom_factors": {}
}
```

**Response 201:**
```json
{
  "snapshot_id": "<uuid>",
  "effective_from": 1719000000,
  "previous_snapshot_id": "<uuid>",
  "ledger_event_id": "<uuid>"
}
```

**Response 409:** `PSN-004` si hay una transición en curso.
**Response 422:** `PSN-006` si los thresholds son inválidos.

---

## 10. Verificación Histórica

**10.1 Flujo de verificación externa:**

1. Obtener `policy_snapshot_ref` del evento a auditar (AUTHORIZATION o LIABILITY_RECORD).
2. Recuperar snapshot via `GET /acp/v1/policy-snapshots/{snapshot_id}`.
3. Verificar firma `sig` del snapshot con la clave pública institucional.
4. Verificar que `effective_from ≤ executed_at < effective_until` (o `effective_until: null` si fue el último).
5. Re-ejecutar el cálculo de riesgo usando el snapshot recuperado.
6. Comparar resultado con la decisión registrada en el ledger.

**10.2 Prueba de no-alteración:** La firma institucional sobre el snapshot garantiza que no puede haberse modificado retroactivamente. Un auditor externo puede verificar esto con la clave pública institucional publicada.

---

## 11. Interoperabilidad

**11.1 Referencias cross-institución** — Cuando un agente de una institución A ejecuta en el contexto de institución B, el `policy_snapshot_ref` MUST referenciar el snapshot de la institución donde ocurre la ejecución (institución B).

**11.2 Exportación** — Las implementaciones MAY exportar snapshots en formato JSON firmado para verificación por terceros sin acceso al sistema institucional.

**11.3 Versionado de schema** — El campo `ver` permite evolucionar el schema. Implementaciones MUST rechazar snapshots con `ver` desconocido con error `PSN-003`.

---

## 12. Códigos de Error

| Código | Condición |
|---|---|
| `PSN-001` | Snapshot no encontrado para el ID dado |
| `PSN-002` | Firma inválida: el snapshot ha sido alterado o la clave no corresponde |
| `PSN-003` | Versión de schema (`ver`) no soportada por esta implementación |
| `PSN-004` | Snapshot transition en curso: no se puede crear un nuevo snapshot concurrentemente |
| `PSN-005` | No existe snapshot activo: estado inválido del sistema |
| `PSN-006` | Thresholds inválidos: valores fuera de rango o estructura incorrecta |
