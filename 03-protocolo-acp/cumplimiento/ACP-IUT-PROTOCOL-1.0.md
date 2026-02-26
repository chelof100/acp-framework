Protocolo Oficial Runner ↔ Implementation Under Test

Estado: Normativo
Compatible con: ACR-1.0 / ACP-TS-1.1

1. Canal de Comunicación

Modo obligatorio:

Entrada: STDIN

Salida: STDOUT

Errores: STDERR

Formato: JSON UTF-8

Un solo objeto JSON por ejecución

Sin logs en STDOUT

Cualquier texto extra en STDOUT → FAIL automático.

2. Input hacia la IUT

El runner envía exactamente el test vector completo:

{
  "meta": {...},
  "input": {...},
  "context": {...},
  "expected": {...}
}

Reglas:

Canonicalizado

Sin modificaciones

Sin campos eliminados

La IUT debe ignorar expected.

3. Output Obligatorio de la IUT

Formato estricto:

{
  "decision": "VALID",
  "error_code": null
}

Schema formal de respuesta:

{
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
      "type": ["string", "null"]
    }
  }
}

Si:

Faltan campos → FAIL

Campos extra → FAIL

JSON inválido → FAIL

Timeout → FAIL

Exit code ≠ 0 → FAIL

4. Exit Codes

La IUT debe:

Exit Code	Significado
0	Evaluación correcta
≠ 0	Error interno

Si exit ≠ 0 → Runner marca FAIL incluso si JSON parece válido.

5. Timeout

Tiempo máximo por test:

Default: 2000 ms

Configurable

Si supera timeout → FAIL + CRASH flag.

6. Modo Batch Opcional (No Obligatorio)

Para performance mode, la IUT puede soportar:

acp-evaluate --batch

Entrada:

{
  "batch": [
    { test_vector_1 },
    { test_vector_2 }
  ]
}

Salida:

{
  "results": [
    { "decision": "...", "error_code": ... },
    { "decision": "...", "error_code": ... }
  ]
}

Si se implementa, debe declararse en manifest.

7. Manifest de Implementación

La IUT debe exponer:

acp-evaluate --manifest

Salida:

{
  "implementation_name": "acp-go-impl",
  "implementation_version": "0.9.3",
  "supported_acp_version": "1.1",
  "max_conformance_level": "L4",
  "supports_batch": true
}

El runner usa esto para validar coherencia.

8. Seguridad del Protocolo

Obligatorio:

No ejecución de código externo desde input

No escritura fuera de sandbox

No llamadas de red durante evaluación

Determinismo total

Si se detecta red → FAIL en modo estricto.