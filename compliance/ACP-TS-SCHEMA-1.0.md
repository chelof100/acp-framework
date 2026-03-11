JSON Schema Formal para Test Vectors

Aplica a: ACP-TS-1.1
Draft: 2020-12

1. Esquema Principal
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://acp.foundation/schemas/acp-test-vector-1.0.json",
  "title": "ACP Test Vector",
  "type": "object",
  "required": ["meta", "input", "context", "expected"],
  "additionalProperties": false,

  "properties": {

    "meta": {
      "type": "object",
      "required": [
        "id",
        "acp_version",
        "layer",
        "conformance_level",
        "description",
        "severity"
      ],
      "additionalProperties": false,
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^TS-[A-Z]+(-NEG)?-[0-9]+$"
        },
        "acp_version": {
          "type": "string",
          "enum": ["1.0", "1.1"]
        },
        "layer": {
          "type": "string",
          "enum": ["CORE", "ITA", "CONF", "PAY", "REP", "D"]
        },
        "conformance_level": {
          "type": "string",
          "enum": ["L1", "L2", "L3", "L4", "L5"]
        },
        "description": {
          "type": "string",
          "minLength": 10
        },
        "severity": {
          "type": "string",
          "enum": ["mandatory", "optional"]
        }
      }
    },

    "input": {
      "type": "object",
      "minProperties": 1
    },

    "context": {
      "type": "object",
      "required": ["current_time"],
      "additionalProperties": false,
      "properties": {

        "current_time": {
          "type": "integer",
          "minimum": 0
        },

        "revocation_list": {
          "type": "array",
          "items": { "type": "string" }
        },

        "trusted_issuers": {
          "type": "array",
          "items": { "type": "string" }
        },

        "reputation_scores": {
          "type": "object",
          "additionalProperties": {
            "type": "number",
            "minimum": 0,
            "maximum": 1
          }
        },

        "payment_tokens": {
          "type": "array",
          "items": { "type": "string" }
        },

        "delegation_chain_depth": {
          "type": "integer",
          "minimum": 0
        }
      }
    },

    "expected": {
      "type": "object",
      "required": ["decision", "error_code"],
      "additionalProperties": false,
      "properties": {

        "decision": {
          "type": "string",
          "enum": [
            "VALID",
            "REJECT",
            "ACCESS_GRANTED",
            "ACCESS_DENIED"
          ]
        },

        "error_code": {
          "type": ["string", "null"],
          "enum": [
            null,
            "EXPIRED",
            "INVALID_SIGNATURE",
            "REVOKED",
            "UNTRUSTED_ISSUER",
            "PAYMENT_REQUIRED",
            "PAYMENT_REPLAY",
            "LOW_REPUTATION",
            "INTEGRITY_FAILURE",
            "DELEGATION_DEPTH",
            "MALFORMED_INPUT"
          ]
        }
      }
    }
  }
}
2. Reglas Normativas Fuera del Schema

El JSON Schema valida estructura.
Pero ACP requiere reglas adicionales:

2.1 Canonicalización Obligatoria

Antes de firma o verificación:

UTF-8

Orden lexicográfico de claves

Sin espacios extra

Sin campos no definidos

Sin comentarios

Si no cumple → FAIL inmediato.

2.2 Regla de Coherencia Nivel/Capa

Implementación debe verificar:

Nivel	Capas permitidas
L1	CORE
L2	CORE, ITA
L3	CORE, ITA, CONF
L4	CORE, ITA, CONF, PAY, REP
L5	Todas

Un test con layer=PAY y level=L2 es inválido.

Esto no lo cubre el JSON Schema.
Debe validarlo el runner.

2.3 Determinismo Temporal

Toda lógica temporal usa context.current_time.

Está prohibido usar reloj del sistema.

3. Extensibilidad Controlada

Si ACP 1.2 agrega nuevos error codes:

Se publica nuevo schema

Nuevo $id

Nueva versión mayor del schema

No se modifica retroactivamente.

4. Validación en CI

En el repo oficial:

ajv validate -s acp-test-vector-1.0.json -d test-suite/**/*.json

Si falla → PR rechazado.

5. Hash de Versión del Schema

Cada release debe publicar:

SHA256(acp-test-vector-1.0.json)

Para que certificaciones indiquen contra qué versión validaron.