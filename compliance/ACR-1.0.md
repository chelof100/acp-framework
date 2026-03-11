ACP Compliance Runner

Versión: 1.0
Compatible con: ACP-TS-1.1
Objetivo: Ejecutar test vectors y certificar conformidad L1–L5

1. Principios

El runner debe ser:

Determinista

Reproducible

Independiente del lenguaje

Automatizable en CI

No acoplado a una implementación concreta

El runner no implementa ACP.
Valida que una implementación lo haga correctamente.

2. Modelo de Integración

El runner interactúa con la implementación bajo prueba (IUT – Implementation Under Test) mediante una interfaz estándar.

Opción obligatoria: CLI Adapter

La implementación debe exponer un comando:

acp-evaluate < test-vector.json

Debe devolver:

{
  "decision": "VALID",
  "error_code": null
}

El runner:

Carga test vector

Valida contra JSON Schema

Ejecuta IUT

Compara salida con expected

Registra resultado

3. Arquitectura del Runner
ACP Compliance Runner
│
├── Loader
├── Schema Validator
├── Context Injector
├── Execution Engine
├── Comparator
├── Report Generator
└── Certification Engine
4. Flujo de Ejecución

Para cada test vector:

Validar JSON contra schema

Verificar coherencia layer/nivel

Serializar canonical JSON

Enviar a IUT

Parsear respuesta

Comparar con expected

Registrar PASS / FAIL

5. CLI Oficial del Runner
acp-runner run \
  --impl ./acp-evaluate \
  --suite ./test-suite \
  --level L4 \
  --report report.json

Opciones:

Flag	Descripción
--impl	Ruta ejecutable IUT
--suite	Carpeta test suite
--level	L1–L5
--layer	Ejecutar capa específica
--strict	Falla si hay warnings
--performance	Ejecuta benchmarks
6. Motor de Comparación

Comparación estricta:

expected.decision == actual.decision
expected.error_code == actual.error_code

Cualquier diferencia → FAIL.

No hay tolerancia.

7. Resultado Global

Salida final:

{
  "implementation": "acp-go-impl",
  "implementation_version": "0.9.3",
  "acp_version": "1.1",
  "tested_level": "L4",
  "test_suite_hash": "sha256:abc123...",
  "total_tests": 124,
  "passed": 124,
  "failed": 0,
  "failed_tests": [],
  "timestamp": "2026-02-25T10:22:00Z",
  "status": "CONFORMANT"
}

Si failed > 0 → status = NON_CONFORMANT

8. Performance Mode

En modo performance:

acp-runner run --performance

Ejecuta:

10k validaciones consecutivas

Mide latencia media

Mide p95

Mide throughput

Mide uso memoria

Resultado:

{
  "latency_avg_ms": 2.8,
  "latency_p95_ms": 4.1,
  "throughput_per_sec": 12400,
  "memory_mb": 32
}

No afecta conformidad funcional, pero es requerido para certificación pública.

9. Certificación Automática

Si:

100% mandatory tests PASS

Sin errores schema

Sin crashes

Performance mínima cumplida

El runner genera:

{
  "protocol": "ACP",
  "version": "1.1",
  "level": "L4",
  "certification_id": "ACP-CERT-2026-0007",
  "test_suite_hash": "...",
  "runner_version": "1.0",
  "issued_at": "2026-02-25"
}

Firmado digitalmente por la ACP Certification Authority (entidad de gobernanza a definir por la comunidad — ver ACP-CERT-1.0 §7).

10. Reglas de Seguridad del Runner

El runner debe:

Ejecutar IUT en sandbox

Limitar tiempo por test (ej. 2s timeout)

Detectar crashes

Detectar salidas inválidas JSON

Detectar output adicional no permitido

Si IUT imprime logs mezclados con JSON → FAIL.

11. Modo CI/CD

Ejemplo GitHub Actions:

- name: Run ACP Compliance
  run: |
    acp-runner run \
      --impl ./bin/acp-evaluate \
      --suite ./test-suite \
      --level L4

Si status != CONFORMANT → pipeline falla.

12. Versionado del Runner

ACP-CR-1.x compatible con ACP-TS-1.1

Nueva versión mayor si cambia protocolo

Runner nunca modifica test suite histórica

13. Resultado Estratégico

Con esto ACP obtiene:

✔ Verificación objetiva
✔ Certificación reproducible
✔ Integración automática en CI
✔ Defensa sólida ante revisión académica
✔ Base real para adopción empresarial