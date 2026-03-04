# Contribuir a ACP — Agent Control Protocol

Gracias por tu interés en contribuir a ACP.

ACP es un **protocolo criptográfico de autorización** para agentes de IA autónomos. Los cambios a la especificación tienen implicaciones de seguridad para toda implementación. Por esta razón, usamos un **proceso formal de RFC** para todos los cambios normativos.

---

## Tipos de Contribuciones

| Tipo | Proceso |
|---|---|
| Cambio normativo (spec, modelo formal, diseño criptográfico) | RFC obligatorio |
| Nueva extensión o capa | RFC obligatorio |
| Corrección no-normativa (typo, clarificación de ejemplo, formato) | Pull Request |
| Adición o corrección de vector de prueba | Pull Request |
| Traducción | Pull Request |
| Vulnerabilidad de seguridad | Ver [SECURITY.md](SECURITY.md) — NO abrir un issue público |

---

## Proceso RFC — Cambios Normativos

Todos los cambios a documentos bajo `03-protocolo-acp/especificacion/`, `04-analisis-formal/`, y el modelo formal de seguridad requieren un RFC.

### Ciclo de vida del RFC

```
Borrador → Revisión → Última Llamada → Aceptado → Final
              ↓
           Rechazado
```

| Estado | Significado |
|---|---|
| **Borrador** | El autor está trabajando en la propuesta — aún no abierta para revisión |
| **Revisión** | Abierta para feedback de la comunidad — cualquiera puede comentar |
| **Última Llamada** | Ventana final de 14 días — no nuevos temas, solo bloqueadores |
| **Aceptado** | Aprobado — será incorporado en la próxima versión de la spec |
| **Rechazado** | No aceptado — motivo registrado en el documento RFC |
| **Final** | Incorporado en la especificación publicada |

### Cómo enviar un RFC

1. **Abrir un Issue en GitHub** usando la plantilla RFC (`New RFC Proposal`)
   - Describir el problema que resuelve
   - Identificar qué documentos de especificación están afectados
   - Evaluar el impacto de seguridad (ninguno / bajo / medio / alto / crítico)

2. **Esperar el reconocimiento** — un mantenedor asignará un número de RFC (`ACP-RFC-NNN`) dentro de 10 días hábiles

3. **Escribir el documento RFC** siguiendo la plantilla en [`.github/RFC-TEMPLATE.md`](.github/RFC-TEMPLATE.md)
   - Ruta del archivo: `rfcs/ACP-RFC-NNN-titulo-corto.md`
   - Estado: `Borrador`

4. **Abrir un Pull Request** apuntando al directorio `rfcs/`
   - No modificar aún los documentos de spec — el RFC debe ser aceptado primero

5. **Período de revisión** — al menos 21 días en estado `Revisión` antes de pasar a Última Llamada
   - Para cambios que afectan `ACP-SIGN-1.0`, `ACP-CT-1.0`, o `ACP-ITA-*.md`: mínimo 45 días

6. **Última Llamada** — ventana final de 14 días
   - Si no hay objeciones bloqueantes: RFC pasa a `Aceptado`
   - Si se encuentra un problema bloqueante: RFC vuelve a `Revisión`

7. **Incorporar cambios** — una vez `Aceptado`, abrir un PR separado modificando el/los documento(s) de spec

### Numeración de RFCs

Los RFCs reciben números secuenciales: `ACP-RFC-001`, `ACP-RFC-002`, etc.
Los números son asignados por los mantenedores — no auto-asignarse.

### Revisión de Seguridad del RFC

Cualquier RFC con impacto de seguridad **medio o superior** debe incluir:
- Análisis de amenazas: ¿cómo podría explotarse este cambio?
- Impacto en propiedades formales: ¿preserva la no-falsificabilidad, confinamiento, resistencia a replay?
- Ruta de migración: ¿cómo mantienen la compatibilidad las implementaciones existentes?

---

## Proceso de Pull Request — Cambios No-Normativos

Para typos, ejemplos, formato, documentación no-normativa y vectores de prueba:

1. Forkear el repositorio
2. Crear una rama: `fix/descripcion` o `docs/descripcion`
3. Realizar los cambios
4. Verificar que los cambios no modifiquen lenguaje normativo (MUST, SHALL, MUST NOT, SHOULD)
5. Abrir un Pull Request con una descripción clara

Los PRs de cambios no-normativos se revisan dentro de 15 días hábiles.

---

## Vectores de Prueba

Los vectores de prueba viven en `03-protocolo-acp/test-vectors/` y siguen el esquema definido en [`03-protocolo-acp/cumplimiento/ACP-TS-SCHEMA-1.0.md`](03-protocolo-acp/cumplimiento/ACP-TS-SCHEMA-1.0.md).

Para contribuir un vector de prueba:
- Asegurar que sigue el formato `ACP-TS-1.1` (JSON determinístico, independiente del lenguaje)
- Incluir secciones `meta`, `input`, `context` y `expected`
- Verificar que valida contra `ACP-TS-SCHEMA-1.0`
- Nombrarlo siguiendo el patrón: `TS-{CAPA}-{NN}-{descripcion}.json`

---

## Lenguaje Normativo

Las especificaciones ACP usan palabras clave RFC 2119:

- **MUST** / **SHALL** — requisito absoluto
- **MUST NOT** / **SHALL NOT** — prohibición absoluta
- **SHOULD** — recomendado, la desviación debe documentarse
- **MAY** — opcional

Al proponer cambios, ser preciso sobre qué nivel de obligación aplica.

---

## Formato de Mensajes de Commit

```
tipo(scope): descripción corta

Tipos: feat, fix, docs, spec, rfc, test, chore
Scope: sign, ct, cap-reg, hp, ita, rep, pay, dcma, conf, ts, cert, readme
```

Ejemplos:
```
spec(ct): clarificar ventana de validación de nonce en ACP-CT-1.0
rfc(sign): agregar propuesta ACP-RFC-001 para soporte Ed448
test(core): agregar TS-CORE-NEG-008 para capability set vacío
docs(readme): actualizar tabla de niveles de conformidad
```

---

## Preguntas

Para preguntas generales sobre el protocolo, abrir un GitHub Discussion.
Para temas de seguridad, ver [SECURITY.md](SECURITY.md).
Para todo lo demás: info@traslaia.com

---

*Mantenido por Marcelo Fernandez — TraslaIA*
