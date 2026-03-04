# Política de Seguridad — ACP (Agent Control Protocol)

## Alcance

Esta política cubre vulnerabilidades de seguridad en la **especificación ACP** en sí — incluyendo fallas en el diseño criptográfico, debilidades del protocolo, ambigüedades que podrían llevar a implementaciones inseguras, y errores en el modelo formal de seguridad.

Esta política **no** cubre vulnerabilidades en implementaciones de terceros de ACP. Para esas, contactar directamente al mantenedor correspondiente.

---

## Versiones Soportadas

| Versión | Estado          | Correcciones de seguridad |
|---------|-----------------|---------------------------|
| 1.4.x   | Actual          | ✅ Sí                      |
| 1.3.x   | Mantenimiento   | ✅ Solo críticas            |
| 1.2.x   | Fin de vida     | ❌ No                      |

---

## Reportar una Vulnerabilidad

**No abrir un issue público en GitHub para vulnerabilidades de seguridad.**

Enviar el reporte a:

**Contacto de seguridad:** info@traslaia.com
**Asunto:** `[ACP SECURITY] <descripción breve>`

Incluir en el reporte:
- Descripción de la vulnerabilidad
- Qué documento(s) de especificación están afectados (ej. `ACP-SIGN-1.0`, `ACP-CT-1.0`)
- Impacto potencial si la falla es explotada en una implementación
- Corrección o mitigación sugerida, si la tenés
- Si planeás publicar el hallazgo (y cuándo)

---

## Tiempos de Respuesta

| Hito                                      | Tiempo objetivo          |
|-------------------------------------------|--------------------------|
| Acuse de recibo                           | Dentro de 5 días hábiles |
| Evaluación inicial                        | Dentro de 15 días hábiles |
| Corrección o mitigación publicada         | Dentro de 90 días del reporte |
| Divulgación pública (coordinada)          | Después de publicar la corrección, o al plazo de 90 días |

Seguimos una **política de divulgación coordinada a 90 días**, alineada con el estándar de la industria (Google Project Zero). Si una corrección requiere más tiempo por complejidad, lo comunicaremos proactivamente y coordinaremos la divulgación con quien reportó.

---

## Qué Califica como Vulnerabilidad

Ejemplos de temas dentro del alcance:

- **Fallas criptográficas**: debilidades en el uso de Ed25519, canonicalización JCS, o manejo de nonces definido en `ACP-SIGN-1.0`
- **Falsificación de tokens**: fallas de diseño en `ACP-CT-1.0` que permitan crear Capability Tokens válidos sin un emisor legítimo
- **Escalada de privilegios**: vacíos en las restricciones de delegación `ACP-DCMA-1.0` que permitan a un delegatario exceder las capacidades delegadas
- **Ataques de replay**: ambigüedades de timing o especificación en `ACP-EXEC-1.0` o mecanismos anti-replay
- **Bypass de revocación**: debilidades en `ACP-REV-1.0` que permitan aceptar tokens revocados
- **Vulnerabilidades de umbral BFT**: fallas en la lógica de quórum `ACP-ITA-1.1` (n ≥ 3f+1, t ≥ 2f+1)
- **Inconsistencias en el modelo formal**: contradicciones entre las pruebas de seguridad y la especificación normativa

Fuera del alcance: typos, inconsistencias menores en documentación no-normativa, solicitudes de features.

---

## Atribución

Acreditaremos a los investigadores de seguridad en la errata o entrada del changelog de la especificación relevante, a menos que prefieras permanecer en el anonimato.

---

## Contacto

**Marcelo Fernandez — TraslaIA**
info@traslaia.com
www.traslaia.com
