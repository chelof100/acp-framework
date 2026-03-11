# ACR-1.0 — ACP Compliance Runner

| Campo | Valor |
|---|---|
| **Estado** | Borrador |
| **Versión** | 1.0 |
| **Tipo** | Especificación de Implementación |
| **Depende de** | ACP-TS-1.1, ACP-CONF-1.1 |
| **Fecha** | 2026-03-10 |

---

## 1. Propósito

Este documento especifica el **ACP Compliance Runner** (`acr`), una herramienta de línea de comandos que ejecuta los conjuntos de pruebas definidos en ACP-TS-1.1 contra implementaciones del protocolo ACP.

El objetivo de `acr` es:

- Permitir a implementadores verificar la conformidad de su stack ACP de forma automatizada.
- Integrarse con pipelines de CI/CD para validación continua.
- Producir reportes estandarizados comparables entre implementaciones.
- Servir como referencia ejecutable de ACP-CONF-1.1.

`acr` no reemplaza la auditoría manual ni la certificación formal, pero constituye el primer paso obligatorio para cualquier implementación que aspire a conformidad declarada.

---

## 2. Interfaz CLI

### 2.1 Comando principal

```bash
acr run --level L3 --target http://localhost:8080 --output json
```

### 2.2 Flags disponibles

| Flag | Descripción | Valor por defecto |
|---|---|---|
| `--level` | Nivel de conformidad ACP-CONF-1.1 a evaluar. Valores: `L1`, `L2`, `L3`, `L4`, `L5` o `all` | `all` |
| `--target` | URL base del endpoint ACP a evaluar. DEBE incluir esquema y host | (requerido) |
| `--output` | Formato del reporte de salida: `json`, `text`, `junit` | `text` |
| `--timeout` | Tiempo máximo por prueba individual en segundos | `30s` |
| `--skip` | Lista separada por comas de `test_id` a omitir (ej: `TS-L2-003,TS-L3-007`) | (ninguno) |

### 2.3 Ejemplos de uso

```bash
# Ejecutar solo nivel L3 contra target local, salida JSON
acr run --level L3 --target http://localhost:8080 --output json

# Ejecutar todos los niveles, omitir dos pruebas, timeout extendido
acr run --level all --target https://acp.midominio.com --timeout 60s --skip TS-L4-002,TS-L5-001

# Salida JUnit para CI
acr run --level L5 --target $ACP_TARGET --output junit > acr-results.xml
```

### 2.4 Subcomandos adicionales

| Subcomando | Descripción |
|---|---|
| `acr list --level L3` | Lista todos los test_id disponibles para el nivel indicado |
| `acr version` | Muestra la versión de `acr` y la versión de ACP-TS que implementa |
| `acr validate-config` | Valida que el target responde en `/acp/v1/health` antes de ejecutar |

---

## 3. Ejecución de Pruebas

### 3.1 Mecanismo

Para cada prueba definida en ACP-TS-1.1, `acr`:

1. Construye la solicitud HTTP según los campos `method`, `path`, `headers` y `body` de la prueba.
2. Envía la solicitud al `--target` especificado.
3. Compara la respuesta recibida contra `expected_result` de ACP-TS-1.1 §8, evaluando:
   - Código de estado HTTP
   - Estructura del cuerpo de respuesta (campos obligatorios presentes)
   - Valores específicos donde ACP-TS-1.1 los requiera
4. Registra `duration_ms` desde el inicio hasta la recepción completa de la respuesta.
5. Determina resultado: `PASSED`, `FAILED` o `SKIPPED`.

### 3.2 Manejo de timeout

Si la solicitud excede el valor de `--timeout`, la prueba se registra como `FAILED` con `reason: "timeout"` y `acr` continúa con la siguiente prueba (no aborta la ejecución completa).

### 3.3 Dependencias entre pruebas

Cuando una prueba depende del estado generado por una prueba anterior (ej: registrar un agente para luego consultarlo), `acr` ejecuta el setup previo automáticamente si la prueba precedente fue `PASSED`. Si el setup falla, las pruebas dependientes se marcan `SKIPPED` con `reason: "prerequisite_failed"`.

### 3.4 Datos de prueba

`acr` genera datos sintéticos válidos para cada prueba (UUIDs, nombres, etc.) a menos que se proporcionen fixtures mediante `--fixtures <archivo.json>`. Los datos sintéticos garantizan que cada ejecución sea independiente y reproducible.

---

## 4. Formato de Reporte (JSON)

Cuando `--output json`, `acr` escribe en stdout el siguiente objeto:

```json
{
  "acr_version": "1.0.0",
  "ats_version": "1.1",
  "target": "http://localhost:8080",
  "level": "L3",
  "timestamp": "2026-03-10T14:22:00Z",
  "duration_ms": 4320,
  "summary": {
    "total": 47,
    "passed": 44,
    "failed": 2,
    "skipped": 1
  },
  "results": [
    {
      "test_id": "TS-L3-001",
      "name": "Registro de agente — datos mínimos",
      "level": "L3",
      "status": "PASSED",
      "duration_ms": 87,
      "expected_status": 201,
      "actual_status": 201
    },
    {
      "test_id": "TS-L3-012",
      "name": "Concesión de capacidad — token inválido",
      "level": "L3",
      "status": "FAILED",
      "duration_ms": 112,
      "expected_status": 401,
      "actual_status": 200,
      "failure_reason": "El endpoint no rechazó el token expirado"
    },
    {
      "test_id": "TS-L3-018",
      "name": "Consulta de reputación — agente inexistente",
      "level": "L3",
      "status": "SKIPPED",
      "reason": "prerequisite_failed"
    }
  ]
}
```

El campo `results` sigue el formato de ACP-TS-1.1 §8 (TestResult). Campos adicionales de `acr` (`duration_ms`, `failure_reason`) se añaden sin romper compatibilidad.

---

## 5. Salida JUnit

### 5.1 Requisito

Cuando `--output junit`, `acr` DEBE producir XML compatible con el esquema JUnit estándar utilizado por GitHub Actions, Jenkins y GitLab CI.

### 5.2 Estructura XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="ACP Compliance Runner" tests="47" failures="2" skipped="1" time="4.320">
  <testsuite name="ACP-L3" tests="47" failures="2" skipped="1" time="4.320">
    <testcase classname="acp.l3" name="TS-L3-001: Registro de agente — datos mínimos" time="0.087">
    </testcase>
    <testcase classname="acp.l3" name="TS-L3-012: Concesión de capacidad — token inválido" time="0.112">
      <failure message="HTTP 200 esperado 401">
        El endpoint no rechazó el token expirado. Respuesta: {"status":"ok"}
      </failure>
    </testcase>
    <testcase classname="acp.l3" name="TS-L3-018: Consulta de reputación — agente inexistente" time="0">
      <skipped message="prerequisite_failed"/>
    </testcase>
  </testsuite>
</testsuites>
```

### 5.3 Compatibilidad garantizada

`acr` garantiza compatibilidad con:

- GitHub Actions (`junit-report` action)
- Jenkins (JUnit Publisher plugin)
- GitLab CI (`junit` artifact reports)
- CircleCI (JUnit test results)

---

## 6. Códigos de Salida

| Código | Significado |
|---|---|
| `0` | Todas las pruebas ejecutadas pasaron (ningún `FAILED`) |
| `1` | Una o más pruebas fallaron |
| `2` | Error de herramienta: target inalcanzable, configuración inválida, timeout global |

Los códigos de salida permiten integración directa con sistemas CI sin necesidad de parsear el reporte.

```bash
acr run --level L5 --target $ACP_TARGET --output junit
if [ $? -eq 1 ]; then
  echo "Fallos de conformidad detectados"
  exit 1
fi
```

---

## 7. Integración CI/CD

### 7.1 GitHub Actions — ejemplo de workflow

```yaml
name: ACP Compliance Check

on:
  push:
    branches: [main, develop]
  pull_request:

jobs:
  acp-compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Instalar ACP Compliance Runner
        run: |
          curl -sSL https://github.com/acp-protocol/acr/releases/latest/download/install.sh | bash

      - name: Iniciar servidor ACP (target)
        run: |
          docker compose up -d acp-server
          sleep 5

      - name: Ejecutar suite de conformidad L5
        run: |
          acr run --level L5 --target ${{ env.ACP_TARGET }} --output junit > acr-results.xml
        env:
          ACP_TARGET: http://localhost:8080

      - name: Publicar resultados
        uses: mikepenz/action-junit-report@v4
        if: always()
        with:
          report_paths: acr-results.xml
          check_name: ACP Conformance L5
          fail_on_failure: true
```

### 7.2 GitLab CI

```yaml
acp-compliance:
  image: node:20-alpine
  script:
    - npm install -g @acp-protocol/acr
    - acr run --level L5 --target $ACP_TARGET --output junit > acr-results.xml
  artifacts:
    reports:
      junit: acr-results.xml
```

---

## 8. Conformidad

### 8.1 Implementación de referencia

La implementación de referencia de `acr` está disponible en:

```
https://github.com/acp-protocol/acr
```

_(placeholder — repositorio a crear durante fase de implementación)_

### 8.2 Requisitos de la herramienta

Una implementación de `acr` que afirme conformidad con este documento DEBE:

- Implementar todos los flags definidos en §2.2.
- Ejecutar todas las pruebas de ACP-TS-1.1 para el nivel especificado.
- Producir salida JSON exactamente según el schema de §4.
- Producir salida JUnit válida según §5.
- Retornar los códigos de salida definidos en §6.

### 8.3 Versionado

`acr` versiona de forma separada al protocolo ACP. Cada release de `acr` declara qué versión de ACP-TS implementa mediante el campo `ats_version` en el reporte de salida.
