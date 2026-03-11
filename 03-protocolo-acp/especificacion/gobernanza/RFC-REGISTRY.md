# RFC-REGISTRY — Registro de RFCs ACP

| Campo | Valor |
|---|---|
| **Status** | Normative |
| **Version** | 1.0 |
| **Type** | Registry |
| **Mantenido por** | Editor ACP |
| **Fecha** | 2026-03-10 |

---

## Descripción

Registro oficial de todos los RFC presentados al proceso ACP. Incluye RFC aceptados, rechazados y retirados. Ningún RFC puede pasar a estado `Implemented` sin estar registrado aquí.

Ver proceso completo en [`RFC-PROCESS.md`](./RFC-PROCESS.md).

---

## Registro

| rfc_id | title | type | author | date_opened | date_closed | status | breaking | version_impact | link |
|--------|-------|------|--------|-------------|-------------|--------|----------|----------------|------|
| — | — | — | — | — | — | — | — | — | — |

*Sin RFCs registrados a la fecha.*

---

## Notas

- `rfc_id`: Identificador único asignado por el Editor (formato: `RFC-YYYY-NNN`)
- `type`: `Informational` / `Protocol` / `Extension`
- `status`: `Draft` / `Open` / `Accepted` / `Rejected` / `Withdrawn` / `Implemented`
- `breaking`: `Sí` / `No`
- `version_impact`: Lista de documentos y versiones afectados (p. ej. `ACP-LEDGER-1.2, ACP-CONF-1.1`)
- `link`: Ruta relativa al documento RFC (p. ej. `./rfcs/RFC-2026-001.md`)
