# RFC-PROCESS — Proceso de RFC para ACP

| Campo | Valor |
|---|---|
| **Status** | Normative |
| **Version** | 1.0 |
| **Type** | Process Document |
| **Scope** | Gestión de cambios ACP v1.x |
| **Fecha** | 2026-03-10 |

---

## 1. Propósito

Este documento define el proceso formal para proponer, revisar y aprobar cambios a las especificaciones del protocolo ACP (Agent Control Protocol).

Todo cambio normativo o informativo al cuerpo de especificaciones ACP v1.x debe seguir este proceso. Las correcciones editoriales menores (erratas tipográficas, formato) pueden aplicarse directamente por el Editor sin requerir un RFC completo.

Este proceso garantiza que los cambios sean revisados técnicamente, que las partes afectadas tengan oportunidad de participar, y que el historial de decisiones quede documentado en el RFC-REGISTRY.md.

---

## 2. Tipos de RFC

### (a) Informational — Informativo

No introduce cambios normativos a ninguna especificación existente. Puede documentar buenas prácticas, análisis, guías de implementación, o propuestas de diseño que no requieren modificar el texto normativo.

- No genera cambio de versión en ningún documento.
- No requiere votación del Council.
- Requiere 2 aprobaciones de Reviewer.

### (b) Protocol — Protocolo

Introduce cambios normativos a una especificación existente. Puede agregar, modificar o eliminar comportamientos, campos, o requisitos en documentos ya publicados.

- Puede ser Breaking o Non-Breaking (ver §8).
- Requiere 2 aprobaciones de Reviewer.
- Puede escalar a votación del Council si no hay consenso (ver §7).

### (c) Extension — Extensión

Propone un documento de especificación nuevo, no existente previamente en el cuerpo normativo ACP. Agrega capacidad al protocolo sin modificar directamente documentos existentes, aunque puede requerir que otros documentos lo referencien.

- Siempre genera un minor version bump (ver §9).
- Requiere 2 aprobaciones de Reviewer.
- Puede escalar a votación del Council.

---

## 3. Ciclo de Vida del RFC

```
Draft → Review → Accepted
                → Rejected

(si Accepted) → Implemented → Stable
```

| Estado | Descripción |
|---|---|
| **Draft** | El Author está redactando el RFC. Aún no está en revisión formal. |
| **Review** | El RFC ha sido enviado para revisión. La ventana de revisión está abierta. |
| **Accepted** | El RFC ha recibido las aprobaciones requeridas o ha sido aprobado por el Council. |
| **Rejected** | El RFC fue rechazado mediante NACK con justificación técnica, o por votación del Council. |
| **Implemented** | El RFC aceptado ha sido incorporado a los documentos de especificación. |
| **Stable** | El RFC implementado ha pasado un período de observación sin objeciones. |

Un RFC en estado Rejected puede ser reeditado como nuevo Draft con un nuevo `rfc_id` si el Author aborda las objeciones planteadas.

---

## 4. Formato del Documento RFC

Todo RFC debe presentarse como un documento Markdown con los siguientes campos y secciones:

```
rfc_id: RFC-XXXX
title: Título descriptivo del cambio propuesto
type: Informational | Protocol | Extension
author: Nombre o alias del autor
date: YYYY-MM-DD
```

### Secciones obligatorias

| Sección | Descripción |
|---|---|
| **Abstract** | Resumen de una o dos oraciones del RFC |
| **Motivation** | Por qué este cambio es necesario; problema que resuelve |
| **Specification** | Descripción técnica precisa del cambio propuesto |
| **Backwards Compatibility** | Impacto en implementaciones existentes; si es Breaking (ver §8) |
| **Security Considerations** | Análisis de implicaciones de seguridad del cambio |

Las secciones adicionales (Ejemplos, Alternativas consideradas, Referencias) son opcionales pero bienvenidas.

---

## 5. Roles

### (a) Author — Autor

Persona o grupo que redacta y propone el RFC. Responsable de:
- Mantener el documento actualizado durante la revisión.
- Responder a comentarios técnicos de los Reviewers.
- Decidir si retira el RFC (transición a Rejected) si no puede resolver las objeciones.

### (b) Reviewer — Revisor

Participa en la revisión técnica del RFC. Se requieren **al menos 2 Reviewers** por RFC. Sus responsabilidades:
- Revisar la propuesta dentro de la ventana de revisión.
- Emitir aprobación (LGTM / ACK) o rechazo técnico (NACK) con justificación.
- Un Reviewer puede cambiar su voto durante la ventana de revisión.

### (c) Editor

Responsable de la integridad del cuerpo de especificaciones ACP. Sus responsabilidades:
- Verificar que el RFC cumple el formato requerido antes de abrir la revisión.
- Fusionar (merge) el RFC y aplicar los cambios a los documentos afectados una vez Accepted.
- Actualizar el RFC-REGISTRY.md con el resultado.
- Aplicar correcciones editoriales menores sin RFC.

### (d) Council — Consejo

Órgano de gobernanza que vota en casos de RFC controvertidos donde los Reviewers no alcanzan consenso. Ver §7 para reglas de votación.

---

## 6. Proceso de Revisión

1. El Author presenta el RFC al Editor con el documento en formato de §4.
2. El Editor verifica el formato y asigna un `rfc_id`. Si el formato no cumple, devuelve al Author para corrección.
3. El Editor abre la revisión formal: el RFC entra en estado **Review**.
4. La **ventana de revisión mínima es de 2 semanas** (14 días calendario) desde la apertura.
5. Durante la ventana, cualquier Reviewer puede:
   - Emitir **ACK** (aprobación) con o sin comentarios.
   - Emitir **NACK** (rechazo) con justificación técnica obligatoria.
   - Solicitar cambios sin emitir un veredicto final aún.
6. Al cierre de la ventana:
   - **2 o más ACK y 0 NACK** → RFC pasa a **Accepted**.
   - **1 o más NACK** → el Author puede responder y reabrir discusión, o escalar al Council (§7).
   - **Menos de 2 ACK** → la ventana puede extenderse por decisión del Editor, o el RFC pasa a Rejected por falta de revisión.
7. Un NACK sin justificación técnica puede ser desestimado por el Editor, quien debe documentar la razón.

---

## 7. Votación del Council

El Council vota únicamente cuando los Reviewers no pueden alcanzar consenso y al menos una de las siguientes condiciones se cumple:

- Hay 1 o más NACK activos al cierre de la ventana de revisión.
- El RFC modifica elementos de §8 (cambios Breaking).
- El Author solicita explícitamente escalar al Council.

### Reglas de votación

| Parámetro | Valor |
|---|---|
| **Quórum mínimo** | 3 miembros del Council |
| **Mayoría requerida** | Simple (más de la mitad de los votos emitidos) |
| **Empate** | El RFC pasa a Rejected (empate no es aprobación) |
| **Plazo** | El Council dispone de 2 semanas adicionales para votar |

Los votos del Council son definitivos. Un RFC rechazado por el Council no puede reintroducirse hasta que se aborden las objeciones documentadas en el acta de votación.

---

## 8. Cambios Breaking

Un cambio se clasifica como **Breaking** si modifica cualquiera de los siguientes elementos:

- **Schemas de eventos del LEDGER**: agregar campos obligatorios, renombrar campos, eliminar campos, o cambiar tipos en eventos definidos en ACP-LEDGER-1.x.
- **Formato del capability token**: cambios en claims requeridos, algoritmo de firma, o estructura del token definido en ACP-CONF-1.x.
- **Códigos de error**: renombrar, eliminar, o cambiar el significado de códigos de error existentes (prefijos ACP-NNN, PAY-NNN, etc.).

### Requisitos adicionales para cambios Breaking

1. El RFC debe clasificar explícitamente el cambio como Breaking en la sección Backwards Compatibility.
2. La ventana de revisión se extiende a **6 semanas** (42 días calendario) en lugar de 2.
3. Se requiere un **version bump** en todos los documentos afectados (ver §9).
4. El Editor debe notificar a los implementadores conocidos al abrir la revisión.

---

## 9. Impacto en Versionado

El versionado de los documentos de especificación ACP sigue el esquema `MAJOR.MINOR.PATCH`.

| Tipo de RFC | Impacto en versión |
|---|---|
| **Informational** | Sin cambio de versión en ningún documento |
| **Protocol — Non-Breaking** | Patch version bump (`X.Y.Z` → `X.Y.Z+1`) en documentos afectados |
| **Protocol — Breaking** | Minor version bump (`X.Y.Z` → `X.Y+1.0`) en documentos afectados |
| **Extension** | Minor version bump en el cuerpo normativo ACP; nuevo documento con versión `1.0` |

Un major version bump (`X.0.0`) requiere un RFC especial de tipo Protocol Breaking que lo justifique explícitamente, con aprobación obligatoria del Council independientemente del resultado de la revisión estándar.

---

## 10. RFC Registry

Todos los RFC, independientemente de su estado final, deben ser registrados en:

**`RFC-REGISTRY.md`** — ubicado en el mismo directorio que este documento.

El registro incluye por cada RFC:

| Campo | Descripción |
|---|---|
| `rfc_id` | Identificador único asignado por el Editor |
| `title` | Título del RFC |
| `type` | Informational / Protocol / Extension |
| `author` | Autor o autores |
| `date_opened` | Fecha de apertura de revisión |
| `date_closed` | Fecha de cierre (Accepted / Rejected) |
| `status` | Estado final |
| `breaking` | Sí / No |
| `version_impact` | Documentos y versiones afectados |
| `link` | Ruta al documento RFC |

El Editor es responsable de mantener el RFC-REGISTRY.md actualizado. Ningún RFC puede pasar a estado Implemented sin estar registrado.
