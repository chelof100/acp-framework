ACP-TS-1.1
Formato Normativo de Test Vectors

Estado: Normativo
Aplica a: ACP v1.0 / v1.1
Obligatorio para certificación

Este documento define el formato oficial que toda implementación debe usar para validar cumplimiento contra ACP.

Sin ambigüedades. Sin libertad creativa.

1. Principios de Diseño

Un test vector ACP debe ser:

Determinista

Reproducible

Independiente del lenguaje

Ejecutable por máquina

Versionado

2. Estructura General del Test Vector

Formato obligatorio: JSON UTF-8 canonicalizado.

Estructura:

{
  "meta": {},
  "input": {},
  "context": {},
  "expected": {}
}
3. Sección meta

Describe el test.

{
  "meta": {
    "id": "TS-CORE-01",
    "acp_version": "1.1",
    "layer": "CORE",
    "conformance_level": "L1",
    "description": "Valid canonical capability",
    "severity": "mandatory"
  }
}

Campos obligatorios:

Campo	Tipo	Descripción
id	string	Identificador único
acp_version	string	1.0 o 1.1
layer	enum	CORE / ITA / CONF / PAY / REP / D
conformance_level	enum	L1-L5
severity	enum	mandatory / optional
4. Sección input

Contiene el objeto a evaluar.

Ejemplo CORE:

{
  "input": {
    "capability": {
      "id": "cap-001",
      "subject": "did:example:alice",
      "action": "read",
      "resource": "doc-123",
      "expiry": 1893456000,
      "issuer": "did:example:authority",
      "signature": "BASE64_SIGNATURE"
    }
  }
}
5. Sección context

Define entorno determinista.

Ejemplo:

{
  "context": {
    "current_time": 1700000000,
    "revocation_list": [],
    "trusted_issuers": [
      "did:example:authority"
    ],
    "reputation_scores": {
      "did:example:alice": 0.82
    },
    "payment_tokens": []
  }
}

Regla clave:
Nunca se usa hora del sistema real. Siempre context.current_time.

6. Sección expected

Define resultado obligatorio.

Formato:

{
  "expected": {
    "decision": "VALID",
    "error_code": null
  }
}

Posibles decision:

VALID

REJECT

ACCESS_GRANTED

ACCESS_DENIED

Posibles error_code:

EXPIRED

INVALID_SIGNATURE

REVOKED

UNTRUSTED_ISSUER

PAYMENT_REQUIRED

PAYMENT_REPLAY

LOW_REPUTATION

INTEGRITY_FAILURE

DELEGATION_DEPTH

MALFORMED_INPUT

7. Canonicalization Rules (Crítico)

Antes de verificar firma:

Orden lexicográfico de claves

UTF-8

Sin espacios extra

Sin campos adicionales

Si implementación no respeta esto → FAIL automático.

8. Negative Test Vector Obligatorio

Ejemplo:

{
  "meta": {
    "id": "TS-CORE-NEG-01",
    "acp_version": "1.1",
    "layer": "CORE",
    "conformance_level": "L1",
    "description": "Missing expiry field",
    "severity": "mandatory"
  },
  "input": {
    "capability": {
      "id": "cap-002",
      "subject": "did:example:alice"
    }
  },
  "context": {
    "current_time": 1700000000
  },
  "expected": {
    "decision": "REJECT",
    "error_code": "MALFORMED_INPUT"
  }
}

Toda implementación debe:

Detectar campo faltante

No crashear

Retornar código correcto

9. Firma de Test Suite

Para evitar manipulación:

Cada versión de la suite tiene hash SHA-256

Publicado en el repo oficial

Certificación requiere declarar hash usado

10. Resultado de Ejecución

La implementación debe generar:

{
  "implementation": "acp-go-impl",
  "version": "0.9.3",
  "tested_against": "ACP-TS-1.1",
  "test_suite_hash": "sha256:abc123...",
  "total_tests": 124,
  "passed": 124,
  "failed": 0,
  "conformance_level": "L4"
}

Si failed > 0 → no es conforme.