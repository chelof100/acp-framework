Adaptive Capability Protocol — Identity Trust Anchor
Internet-Draft

Status: Standards Track

Abstract

Este documento define ACP-ITA-1.1, la extensión de anclaje de confianza para el ecosistema ACP. Especifica el modelo de admisión, rotación y remoción de autoridades en entornos tolerantes a fallos bizantinos.

1. Introduction

ACP-D asume un conjunto de autoridades confiables que firman capacidades bajo un modelo bizantino. Sin un mecanismo formal de gobernanza, el sistema carece de raíz de confianza verificable.

ACP-ITA define:

Registro de autoridades

Proceso de admisión

Proceso de expulsión

Rotación de claves

Protección contra captura de quorum

2. Terminology

Las palabras MUST, MUST NOT, REQUIRED, SHALL, SHOULD, SHOULD NOT y MAY se interpretan conforme a IETF RFC 2119.

3. System Model

Sea:

n = número total de autoridades

f = número máximo de nodos bizantinos tolerables

Debe cumplirse:

n ≥ 3f + 1

4. Trust Registry

Toda autoridad MUST estar registrada en el Trust Registry:

TrustRegistryEntry = {
    authority_id,
    public_key,
    admission_signatures,
    activation_epoch,
    status
}

El registro MUST ser:

Verificable

Firmado por quorum

Público o audit-able

5. Admission Protocol

Una nueva autoridad es válida si:

Presenta clave pública

Obtiene ≥ 2f+1 firmas de autoridades activas

Espera activation_delay

Formalmente:

Authority_Valid(a) ⇔
    Cardinality(signatures(a)) ≥ 2f + 1

Una autoridad MUST NOT activarse inmediatamente tras firmarse.

6. Removal Protocol

Una autoridad MAY ser removida si:

Evidencia criptográfica de mal comportamiento

Votación ≥ 2f+1

La remoción MUST registrarse en el Trust Registry con prueba verificable.

7. Key Rotation

Una autoridad que rota clave MUST:

Firmar nueva clave con la clave anterior

Obtener confirmación ≥ 2f+1

Publicar transición verificable

El sistema MUST rechazar claves no registradas.

8. Security Considerations

ACP-ITA protege contra:

Inserción unilateral de autoridad

Sustitución de clave silenciosa

Captura progresiva del quorum

Si ≥ 2f+1 autoridades coluden, el modelo falla por definición del sistema bizantino.

9. IANA Considerations

No se requieren asignaciones IANA.

10. Normative References

RFC 2119

Byzantine Fault Tolerance literature

Threshold Signature research