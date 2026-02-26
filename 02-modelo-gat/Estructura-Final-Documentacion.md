01 — Vision & Position Paper

Fundamento conceptual y motivación.

02 — RFC Técnica ACP v0.2

Especificación normativa (MUST, SHOULD, etc.).

03 — Esquema Criptográfico del Capability Token

Diseño formal del token y primitivas.

04 — Modelo Matemático de Seguridad

Formalización abstracta.

05 — Prueba de Seguridad por Reducción

Reducción a EUF-CMA.

06 — Análisis Adversarial Formal

Red team estructurado.

07 — Hardening Sistémico

Endurecimiento operacional.

08 — Modelo Formal Distribuido (estilo TLA+)

Estados, transiciones, invariantes.

09 — Documento Comparativo: ACP vs RBAC vs Zero Trust

Marco analítico comparativo.

Iremos uno por uno.

Comenzamos con:

📄 Documento 01
ACP — Vision & Position Paper

Te lo entrego ahora completo y listo para guardar como:

01_ACP_Vision_Position_Paper.md
ACP — Authorization by Cryptographic Capability
Position Paper
1. Introducción

Los modelos de autorización dominantes actuales se basan en roles, listas de control de acceso o evaluación dinámica de políticas centralizadas. Estos enfoques presentan problemas estructurales:

Autorización implícita.

Superposición de privilegios.

Dependencia de estado global.

Dificultad para razonar formalmente sobre seguridad.

ACP propone un enfoque distinto:

La autorización es un objeto criptográfico explícito, verificable y portable.

No se pregunta “¿tiene permiso?”, sino:

“¿posee una capability válida firmada?”

2. Principio Fundamental

Una acción solo es válida si existe un token criptográfico que:

Describe exactamente el recurso.

Describe el contexto.

Está firmado por un issuer confiable.

No ha expirado.

No ha sido reutilizado.

No existe autorización implícita.
No existe herencia automática.
No existe ampliación contextual.

3. Hipótesis Central

Si cada acción requiere una capability criptográficamente verificable y vinculada al contexto, entonces:

La superficie de escalación se reduce.

El modelo es formalizable.

La seguridad depende de primitivas bien estudiadas.

4. Diferenciación Conceptual

ACP no es:

Un sistema de roles.

Un sistema de listas.

Un proxy central de autorización.

ACP es un sistema capability-based firmado.

5. Propiedades Deseadas

No escalación sin emisión explícita.

Context binding obligatorio.

Temporalidad estricta.

Independencia entre servicios.

Verificación local.

6. Ámbito de Aplicación

ACP está diseñado para:

Sistemas distribuidos.

Microservicios.

Infraestructura cloud.

Entornos multi-tenant.

APIs críticas.

7. Conclusión

ACP propone que la autorización deje de ser lógica implícita y pase a ser evidencia criptográfica explícita.

La seguridad no se infiere.
Se verifica.

📄 01_ACP_Vision_Position_Paper.md
ACP — Authorization by Cryptographic Capability
Position Paper
1. Introducción

Los sistemas tradicionales de autorización se basan en roles (RBAC), atributos (ABAC) o validaciones dinámicas centralizadas. Estos modelos comparten problemas estructurales:

Autorización implícita.

Expansión accidental de privilegios.

Dependencia de estado global.

Dificultad de formalización matemática.

ACP propone un modelo alternativo:

La autorización es un objeto criptográfico explícito.

Cada acción requiere una capability verificable y firmada.

2. Principio Central

Una operación es válida si y solo si existe un token criptográfico que:

Describe el recurso.

Describe el contexto.

Está firmado por un issuer confiable.

No ha expirado.

No ha sido reutilizado.

3. Hipótesis

Si toda autorización es explícita y verificable criptográficamente:

No existe escalación implícita.

La seguridad es reducible a primitivas formales.

El sistema es auditado matemáticamente.

4. Propiedades Clave

No-escalation por construcción.

Context binding obligatorio.

Temporalidad estricta.

Verificación descentralizada.

Tokens autónomos.

5. Conclusión

ACP convierte la autorización en evidencia criptográfica portable.
La confianza se reduce a firmas y verificación determinística.

📄 02_RFC_ACP_v0.2.md
RFC ACP v0.2
Authorization by Cryptographic Capability
1. Terminología

Las palabras MUST, MUST NOT, SHOULD, MAY deben interpretarse como en RFC 2119.

2. Token Structure

El Capability Token MUST contener:

subject

resource

context_hash

exp

nonce

policy_version

key_id

signature

3. Emisión

El Issuer:

MUST firmar el payload completo.

MUST validar policy_version.

MUST asegurar que exp ≤ key_epoch_end.

MUST generar nonce con entropía ≥ 128 bits.

4. Verificación

El Verifier:

MUST validar firma.

MUST validar expiración.

MUST validar policy_version ≥ min_supported.

MUST validar subject binding.

MUST verificar que nonce no haya sido usado.

MUST ejecutar operación solo si todas las validaciones son verdaderas.

5. Canonicalización

El payload MUST:

Usar encoding UTF-8.

Estar serializado de forma determinística.

Tener orden fijo de campos.

6. Anti-Replay

Verifier MUST mantener un NonceStore consistente.

7. Rotación de Claves

Verifier MUST aceptar claves activas.
Retention window MUST ≥ máximo TTL.

📄 03_Capability_Token_Cryptographic_Spec.md
Cryptographic Specification of ACP Token
1. Primitivas

Firma digital: Ed25519

Hash: SHA-256

RNG: CSPRNG ≥ 128 bits

2. Payload
m = Encode(
    subject,
    resource,
    context_hash,
    exp,
    nonce,
    policy_version,
    key_id
)

Token:

T = Sign_sk(m)
3. Context Hash
context_hash = SHA256(
    resource_id ||
    http_method ||
    environment_id ||
    tenant_id ||
    policy_version
)
4. Seguridad

Seguridad depende de:

EUF-CMA de la firma.

Resistencia a colisiones del hash.

Entropía del nonce.

📄 04_ACP_Mathematical_Security_Model.md
Mathematical Security Model

Definiciones:

I: Issuer

V: Verifier

S: Subject

T: Token

Token:

T = Sign_skI(m)

Propiedad de seguridad:

Pr[Forge ∨ Escalate ∨ Replay ∨ Rebind] ≤ ε

ε es negligible si:

Firma es EUF-CMA segura.

Hash resistente.

Nonce único.

📄 05_ACP_Security_Reduction.md
Security Reduction to EUF-CMA
Teorema

Si existe adversario A que forja ACP con ventaja ε,
entonces existe adversario B que rompe EUF-CMA con ventaja ≥ ε.

Idea

B usa A como subrutina.

Simula oráculo de firma.

Recibe forja.

La reenvía como forja de firma.

Reducción tight.

Conclusión:

ACP es tan seguro como la firma subyacente.

📄 06_ACP_Formal_Adversarial_Analysis.md
Formal Adversarial Analysis
Amenazas Evaluadas

Forgery → mitigado por firma.

Replay → mitigado por nonce cache.

Privilege escalation → imposible sin issuer.

Confused deputy → mitigado por subject binding.

Policy downgrade → mitigado por min_policy.

Context swap → mitigado por context_hash.

Lateral movement → mitigado por TTL corto.

Issuer compromise → riesgo crítico.

Key leakage → requiere rotación.

Side-channel → requiere verificación constante.

📄 07_ACP_System_Hardening.md
System Hardening
Issuer

MUST usar HSM o enclave.

SHOULD usar threshold signatures.

MUST rotar claves periódicamente.

Verifier

MUST verificar atómicamente.

MUST usar comparación en tiempo constante.

MUST unificar mensajes de error.

MUST mantener NonceStore consistente.

Operacional

Monitorizar tasa de emisión.

Detectar anomalías.

Log firmado append-only.

📄 08_ACP_Distributed_Formal_Model.md
Distributed System Model
Estado

issued_tokens

nonce_cache

valid_keys

current_time

Invariantes

NoEscalation:

Execute(op) ⇒ ∃ token válido

NoReplay:

Cada nonce se usa ≤ 1 vez

Atomicity:

Execute ⇒ Verify en el mismo paso

KeySafety:

RetentionWindow ≥ MaxTTL
Riesgos Identificados

Condición de carrera en NonceStore.

Drift de reloj.

Rotación prematura de claves.

Verificación no atómica.

📄 09_ACP_vs_RBAC_vs_ZeroTrust.md
Comparative Analysis
ACP vs RBAC

RBAC:

Basado en roles.

Permisos implícitos.

Difícil de auditar formalmente.

ACP:

Autorización explícita.

No herencia automática.

Formalizable matemáticamente.

ACP vs Zero Trust

Zero Trust:

Filosofía de verificación continua.

Puede usar RBAC internamente.

ACP:

Mecanismo concreto.

Basado en tokens firmados.

Compatible con Zero Trust.

Ventajas de ACP

Reducción clara a primitivas criptográficas.

Context binding estricto.

Eliminación de permisos implícitos.

Modelo verificable formalmente.