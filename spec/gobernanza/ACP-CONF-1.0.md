# ACP-CONF-1.0
## Conformance Specification

> ⚠️ **DEPRECATED** — Este documento define los niveles de conformidad para ACP v1.0 (L1–L3).
> Ha sido supersedido por **ACP-CONF-1.1** (L1–L5, incluye PAY, REP, ACP-D).
> Nuevas implementaciones deben usar ACP-CONF-1.1.
> Este documento se mantiene por referencia histórica de ACP v1.0.

**Status:** Deprecated (supersedido por ACP-CONF-1.1)
**Version:** 1.0
**Depends-on:** ACP-SIGN-1.0, ACP-CT-1.0, ACP-CAP-REG-1.0, ACP-HP-1.0, ACP-RISK-1.0, ACP-REV-1.0, ACP-ITA-1.0, ACP-API-1.0, ACP-EXEC-1.0, ACP-LEDGER-1.0
**Blocks:** ninguno — documento terminal de la especificación v1.0
**Superseded-by:** ACP-CONF-1.1

---

## 1. Alcance

Este documento define los niveles de conformidad del protocolo ACP, los requisitos mínimos por nivel, el proceso de verificación de conformidad, y las condiciones de interoperabilidad entre implementaciones.

Una implementación que declara conformidad con ACP MUST cumplir todos los requisitos del nivel declarado. No hay conformidad parcial dentro de un nivel.

---

## 2. Niveles de Conformidad

```
Nivel 1 — CORE
  Documentos: ACP-SIGN-1.0, ACP-CT-1.0, ACP-CAP-REG-1.0, ACP-HP-1.0
  Caso de uso: verificación de tokens con prueba de posesión de clave

Nivel 2 — SECURITY
  Documentos: Nivel 1 + ACP-RISK-1.0, ACP-REV-1.0, ACP-ITA-1.0
  Caso de uso: sistema emisor de tokens con evaluación de riesgo

Nivel 3 — FULL
  Documentos: Nivel 2 + ACP-API-1.0, ACP-EXEC-1.0, ACP-LEDGER-1.0
  Caso de uso: sistema ACP completo con API, ejecución y auditoría
```

---

## 3. Requisitos — Nivel 1 (CORE)

### ACP-SIGN-1.0

| ID | Requisito | Verificación |
|----|-----------|-------------|
| L1-SIGN-001 | Canonicalización usa JCS (RFC 8785) exacto | Vector de prueba §6 |
| L1-SIGN-002 | Hash usa SHA-256 sobre output JCS en UTF-8 | Vector de prueba §6 |
| L1-SIGN-003 | Firma usa Ed25519 (RFC 8032) | Interop test |
| L1-SIGN-004 | Firma codificada en base64url sin padding | Inspección de output |
| L1-SIGN-005 | Verificación precede a toda validación semántica | Test de flujo |
| L1-SIGN-006 | Objeto con firma inválida rechazado sin procesar contenido | Test negativo |

### ACP-CT-1.0

| ID | Requisito | Verificación |
|----|-----------|-------------|
| L1-CT-001 | AgentID = base58(SHA-256(pk_bytes)) | Vector de prueba |
| L1-CT-002 | Tokens con todos los campos MUST | Inspección de schema |
| L1-CT-003 | Verificación en orden exacto de §6 | Test de flujo |
| L1-CT-004 | Fallo en cualquier paso produce rechazo inmediato | Tests negativos |
| L1-CT-005 | Reglas de delegación §7 correctas | Test de delegación |
| L1-CT-006 | max_depth > 8 rechazado | Test negativo |
| L1-CT-007 | Cadena verificada completa hasta raíz | Test de cadena |

### ACP-CAP-REG-1.0

| ID | Requisito | Verificación |
|----|-----------|-------------|
| L1-CAP-001 | Formato de capability validado | Tests de formato |
| L1-CAP-002 | Todos los dominios core reconocidos | Test de cobertura |
| L1-CAP-003 | Baselines RS aplicados exactamente | Test de valores |
| L1-CAP-004 | Extended desconocida → ESCALATED, no DENIED | Test negativo |
| L1-CAP-005 | Constraints obligatorios validados | Tests de constraints |

### ACP-HP-1.0

| ID | Requisito | Verificación |
|----|-----------|-------------|
| L1-HP-001 | Endpoint POST /handshake/challenge implementado con estructura de §6 | Test de API |
| L1-HP-002 | Challenges de 128 bits CSPRNG con ventana de 30 segundos | Inspección |
| L1-HP-003 | Verificación PoP en orden exacto de §10 | Test de flujo |
| L1-HP-004 | Challenge eliminado al consumirse — no reutilizable | Test de replay |
| L1-HP-005 | Challenge expirado o consumido retorna HP-007 sin revelar cuál | Test negativo |
| L1-HP-006 | Fail closed cuando challenge registry no disponible | Test de fallo |
| L1-HP-007 | X-ACP-PoP requerido en todos los endpoints autenticados | Test de cobertura |
| L1-HP-008 | request_body_hash vincula PoP al body exacto | Test de binding |
| L1-HP-009 | request_method y request_path verificados contra request real | Test de binding |

---

## 4. Requisitos — Nivel 2 (SECURITY)

Incluye todos los requisitos de Nivel 1 más:

### ACP-RISK-1.0

| ID | Requisito | Verificación |
|----|-----------|-------------|
| L2-RISK-001 | RS idénticos para los mismos inputs | Test de determinismo |
| L2-RISK-002 | Todos los factores B, F_ctx, F_hist, F_res implementados | Test de cobertura |
| L2-RISK-003 | Thresholds correctos por autonomy_level | Test de thresholds |
| L2-RISK-004 | Autonomy_level 0 → DENIED sin ejecutar función | Test especial |
| L2-RISK-005 | Registro de evaluación con estructura completa de §10 | Inspección |
| L2-RISK-006 | Contexto incompleto rechazado con RISK-004 | Test negativo |

### ACP-REV-1.0

| ID | Requisito | Verificación |
|----|-----------|-------------|
| L2-REV-001 | Al menos un mecanismo (A o B) implementado | Declaración |
| L2-REV-002 | Firma de respuesta validada antes de usar | Test de flujo |
| L2-REV-003 | token_id no encontrado → revocado | Test negativo |
| L2-REV-004 | Revocación transitiva correcta | Test de cadena |
| L2-REV-005 | Política offline sin excepciones más permisivas | Test de disponibilidad |
| L2-REV-006 | Revocación de agente invalida todos sus tokens | Test de propagación |

### ACP-ITA-1.0

| ID | Requisito | Verificación |
|----|-----------|-------------|
| L2-ITA-001 | Registro institucional con estructura de §4 | Inspección |
| L2-ITA-002 | Endpoints GET /institutions/{id} y /key/{key_id} | Test de API |
| L2-ITA-003 | proof_of_key_possession validado | Test de bootstrap |
| L2-ITA-004 | Rotación con transición ≤ 7 días | Test de rotación |
| L2-ITA-005 | Rotación de emergencia invalida inmediatamente | Test de emergencia |
| L2-ITA-006 | Registros firmados con RIK de la autoridad | Test de firma |
| L2-ITA-007 | Clave revoked → rechazo de artefactos | Test negativo |

---

## 5. Requisitos — Nivel 3 (FULL)

Incluye todos los requisitos de Nivel 2 más:

### ACP-API-1.0

| ID | Requisito | Verificación |
|----|-----------|-------------|
| L3-API-001 | Todos los endpoints de §4 a §9 implementados | Test de cobertura |
| L3-API-002 | Autenticación por CT en todos excepto /health | Test de autenticación |
| L3-API-003 | Firma de responses con cobertura correcta | Inspección de firma |
| L3-API-004 | Fallo interno → rechazo, nunca aprobación | Test de fallo |
| L3-API-005 | Rate limiting por agent_id | Test de rate limit |
| L3-API-006 | Nonce anti-replay ventana 5 minutos | Test de replay |
| L3-API-007 | Autonomy_level 0 → AUTH-008 en /authorize | Test especial |
| L3-API-008 | Capability core desconocida → 403 CAP-002 | Test negativo |
| L3-API-009 | Capability extended desconocida → ESCALATED | Test negativo |
| L3-API-010 | Rev offline aplica ACP-REV-1.0 §5 | Test de disponibilidad |

### ACP-EXEC-1.0

| ID | Requisito | Verificación |
|----|-----------|-------------|
| L3-EXEC-001 | ETs emitidos solo en AuthorizationDecision APPROVED | Test de flujo |
| L3-EXEC-002 | ETs firmados con clave institucional ACP | Test de firma |
| L3-EXEC-003 | Ventana máxima 300 segundos | Test de expiración |
| L3-EXEC-004 | ET consumido no reutilizable | Test de replay |
| L3-EXEC-005 | ET expirado rechazado | Test negativo |
| L3-EXEC-006 | ET Registry con estados issued/used/expired | Inspección |
| L3-EXEC-007 | POST /exec-tokens/{et_id}/consume implementado | Test de API |

### ACP-LEDGER-1.0

| ID | Requisito | Verificación |
|----|-----------|-------------|
| L3-LEDG-001 | Todos los tipos de eventos de §5 implementados | Test de cobertura |
| L3-LEDG-002 | Hash con JCS obligatorio | Vector de prueba |
| L3-LEDG-003 | Genesis con prev_hash constante correcto | Test de bootstrap |
| L3-LEDG-004 | sequence monotónico sin huecos | Test de integridad |
| L3-LEDG-005 | Verificación de cadena de §7 implementada | Test de verificación |
| L3-LEDG-006 | Corrupción reportada sin silenciar | Test de corrupción |
| L3-LEDG-007 | Ninguna operación de modificación disponible | Test negativo |
| L3-LEDG-008 | chain_valid en responses de consulta | Inspección |
| L3-LEDG-009 | Retención mínima 7 años declarada en política | Declaración |

---

## 6. Condiciones de Interoperabilidad

### 6.1 Interoperabilidad L1

```
A puede verificar tokens de B si:
  - Ambas implementan ACP-CONF-L1
  - A tiene pk de B (via ITA o fuera de banda)
  - Tokens de B usan algoritmos de ACP-SIGN-1.0
  - Tokens de B usan capabilities del registro core
```

### 6.2 Interoperabilidad L2

```
A puede delegar a agentes de B si:
  - Ambas implementan ACP-CONF-L2
  - Ambas registradas en ITA común o con reconocimiento mutuo
  - Endpoint de revocación de B accesible para A
  - Mismo conjunto de dominios core
```

### 6.3 Interoperabilidad L3

```
A puede auditar ledger de B si:
  - B implementa ACP-CONF-L3
  - A resuelve pk de B via ACP-ITA-1.0
  - B expone GET /acp/v1/audit/query
  - A implementa verificación de cadena de ACP-LEDGER-1.0 §7
```

---

## 7. Declaración de Conformidad

Debe ser accesible en `GET https://<contact_endpoint>/acp/v1/conformance` sin autenticación.

```json
{
  "acp_conformance": {
    "version": "1.0",
    "level": "FULL",
    "documents": {
      "ACP-SIGN-1.0": "compliant",
      "ACP-CT-1.0": "compliant",
      "ACP-CAP-REG-1.0": "compliant",
      "ACP-HP-1.0": "compliant",
      "ACP-RISK-1.0": "compliant",
      "ACP-REV-1.0": { "status": "compliant", "mechanism": "endpoint" },
      "ACP-ITA-1.0": { "status": "compliant", "model": "centralized" },
      "ACP-API-1.0": "compliant",
      "ACP-EXEC-1.0": "compliant",
      "ACP-LEDGER-1.0": "compliant"
    },
    "extensions": [],
    "institution_id": "org.example.banking",
    "contact_endpoint": "https://acp.example-banking.com",
    "declaration_date": 1718920000
  }
}
```

---

## 8. Comportamientos Prohibidos

Una implementación que exhibe cualquiera de estos comportamientos MUST NOT declararse conforme en ningún nivel.

| ID | Comportamiento prohibido |
|----|--------------------------|
| PROHIB-001 | Aprobar request cuando cualquier componente de evaluación falla |
| PROHIB-002 | Reutilizar Execution Token consumido |
| PROHIB-003 | Omitir verificación de firma en artefacto entrante |
| PROHIB-004 | Tratar token_id no encontrado como activo en revocación |
| PROHIB-005 | Permitir transición desde estado `revoked` |
| PROHIB-006 | Emitir ET sin AuthorizationDecision APPROVED |
| PROHIB-007 | Modificar o eliminar eventos del Audit Ledger |
| PROHIB-008 | Silenciar detección de corrupción en ledger |
| PROHIB-009 | Ignorar max_depth en cadenas de delegación |
| PROHIB-010 | Política offline más permisiva que ACP-REV-1.0 §5 |
| PROHIB-011 | Aprobar requests de agentes con autonomy_level 0 |
| PROHIB-012 | Continuar procesando objeto con firma inválida |

---

## 9. Extensiones

Las extensiones institucionales son conformes si:
- Están documentadas formalmente
- No modifican comportamiento de documentos core
- No violan ningún comportamiento prohibido de §8
- Se declaran en la Declaración de Conformidad

Namespace obligatorio: `ext.<institution_id>.<nombre>`

---

## 10. Versiones Futuras

**Versión minor (v1.x):** Agrega capacidades opcionales. No rompe conformidad v1.0.

**Versión major (v2.0):** Puede introducir cambios incompatibles. Requiere nuevo proceso de conformidad.

---

## 11. Resumen

| Documento | L1 CORE | L2 SECURITY | L3 FULL |
|-----------|---------|------------|---------|
| ACP-SIGN-1.0 | ✓ | ✓ | ✓ |
| ACP-CT-1.0 | ✓ | ✓ | ✓ |
| ACP-CAP-REG-1.0 | ✓ | ✓ | ✓ |
| ACP-HP-1.0 | ✓ | ✓ | ✓ |
| ACP-RISK-1.0 | — | ✓ | ✓ |
| ACP-REV-1.0 | — | ✓ | ✓ |
| ACP-ITA-1.0 | — | ✓ | ✓ |
| ACP-API-1.0 | — | — | ✓ |
| ACP-EXEC-1.0 | — | — | ✓ |
| ACP-LEDGER-1.0 | — | — | ✓ |
