
Agent Control Protocol
ACP v1.0
Gobernanza formal de agentes autónomos institucionales

Autor:
Marcelo Fernandez
TraslaIA
info@traslaia.com   |   www.traslaia.com
23 de febrero de 2026
Draft Standard  ·  Versión 1.0  ·  Uso B2B
 
Abstract
Agent Control Protocol (ACP) es una especificación técnica formal para la gobernanza de agentes autónomos en entornos institucionales B2B. Define los mecanismos de identidad criptográfica, autorización por capacidades, evaluación de riesgo determinístico, delegación encadenada verificable, revocación transitiva y auditoría inmutable que un sistema debe implementar para que los agentes autónomos operen bajo control institucional explícito.
ACP opera como capa adicional sobre RBAC y Zero Trust, sin reemplazarlos. Está diseñado específicamente para el problema que ninguno de estos modelos resuelve: gobernar qué puede hacer un agente autónomo, bajo qué condiciones, con qué límites, y con trazabilidad completa para auditoría externa.
La especificación v1.0 está compuesta por 15 documentos técnicos organizados en cuatro capas: Core, Security, Operations y Governance. Define 3 niveles de conformidad, más de 62 requisitos verificables, 12 comportamientos prohibidos, y los mecanismos de interoperabilidad entre instituciones.

Contenidos
Abstract	1
Contenidos	1
1.  El Problema que ACP Resuelve	1
1.1  El gap estructural	1
1.2  Por qué RBAC y Zero Trust son insuficientes	1
1.3  El escenario concreto que ACP previene	1
2.  Qué es ACP	1
2.1  Definición	1
2.2  Principios de diseño	1
2.3  Modelo formal del agente	1
2.4  Arquitectura en capas	1
3.  Mecanismos Técnicos	1
3.1  Serialización y firma (ACP-SIGN-1.0)	1
3.2  Capability Token (ACP-CT-1.0)	1
3.3  Handshake y Proof-of-Possession (ACP-HP-1.0)	1
3.4  Evaluación de riesgo determinístico (ACP-RISK-1.0)	1
3.5  Delegación encadenada verificable	1
3.6  Execution Token (ACP-EXEC-1.0)	1
3.7  Audit Ledger (ACP-LEDGER-1.0)	1
4.  Confianza Inter-Institucional	1
4.1  Institutional Trust Anchor (ACP-ITA-1.0)	1
4.2  Reconocimiento mutuo entre autoridades (ACP-ITA-1.1)	1
4.3  Rotación y revocación de claves institucionales	1
5.  Modelo de Seguridad	1
5.1  Threat Model (STRIDE)	1
5.2  Propiedades de seguridad garantizadas	1
5.3  Riesgos residuales declarados	1
6.  Conformidad e Interoperabilidad	1
6.1  Niveles de conformidad	1
6.2  Declaración de conformidad	1
6.3  Comportamientos prohibidos	1
6.4  Condiciones de interoperabilidad B2B	1
7.  Casos de Uso	1
7.1  Sector financiero — Agentes de pago inter-institucional	1
7.2  Gobierno digital — Procesamiento de expedientes	1
7.3  Enterprise AI — Orquestación multi-empresa	1
7.4  Infraestructura crítica — Agentes de monitoreo y actuación	1
8.  Estado de la Especificación	1
8.1  Documentos v1.0 — Completos	1
8.2  Documentos v1.1 — Completos	1
8.3  Roadmap v2.0 — Planificado	1
9.  Cómo Implementar ACP	1
9.1  Requisitos mínimos para conformidad L1	1
9.2  Requisitos adicionales para conformidad L3	1
9.3  Lo que ACP no prescribe	1
10.  Conclusión	1
Apéndice A — Glosario	1
Apéndice B — Referencias	1

 
1.  El Problema que ACP Resuelve
Los agentes autónomos están siendo desplegados en entornos institucionales sin que exista un estándar técnico que gobierne su comportamiento. Esto no es un problema de herramientas — es un problema de protocolo.
1.1  El gap estructural
Cuando un agente autónomo toma una decisión y la ejecuta, existe un momento crítico entre ambas acciones. En los modelos actuales, ese momento no existe formalmente: la decisión y la ejecución son el mismo evento. El agente decide y actúa. No hay validación intermedia. No hay punto de intervención. No hay registro estructurado de por qué se tomó la decisión.
Esto es aceptable cuando un humano ejecuta esa acción, porque el humano carga con la responsabilidad y puede ser interrogado. Un agente autónomo no puede ser interrogado. Solo puede ser auditado — y solo si existe algo que auditar.

El problema no es si los agentes son confiables. El problema es que actualmente no existe ningún mecanismo técnico formal que permita a una institución demostrar que sus agentes operaron dentro de los límites autorizados.

1.2  Por qué RBAC y Zero Trust son insuficientes
RBAC (Role-Based Access Control) y Zero Trust son las capas de control predominantes en entornos empresariales. Ambas son necesarias. Ninguna resuelve el problema de gobernar agentes autónomos:

Criterio	RBAC	Zero Trust	ACP
Diseñado para	Usuarios humanos con roles	Acceso a red y recursos	Agentes autónomos institucionales
Identidad criptográfica nativa	No	Parcial	Sí — Ed25519 obligatorio
Delegación dinámica verificable	No	No	Sí — encadenada y auditable
Separación decisión / ejecución	No	No	Sí — Execution Tokens
Evaluación de riesgo en tiempo real	No	Parcial	Sí — determinístico y reproducible
Auditoría multi-institucional	No estándar	No estándar	Nativa — ledger firmado
Revocación transitiva de delegación	No	No	Sí — propagación formal
Interoperabilidad B2B para agentes	No estructurada	No estructurada	Diseño central del protocolo

ACP no reemplaza RBAC ni Zero Trust. Añade una capa de gobernanza orientada específicamente a agentes autónomos que opera por encima de los controles existentes.
1.3  El escenario concreto que ACP previene
Considere el siguiente escenario, que ocurre hoy en múltiples organizaciones con sistemas de automatización avanzada:

Escenario sin ACP
Un agente de procesamiento financiero recibe instrucciones de otro agente para ejecutar una transferencia. El agente ejecuta la acción. Si la instrucción era legítima, todo funciona. Si la instrucción fue comprometida, inyectada, o generada por un agente no autorizado, la transferencia ocurre igualmente. No existe mecanismo formal que lo impida, ni registro técnico que permita reconstruir la cadena de autorización.
Escenario con ACP
El agente que solicita la transferencia debe presentar un Capability Token firmado criptográficamente por la institución emisora, demostrar posesión de la clave privada asociada, y la solicitud pasa por el motor de riesgo antes de recibir un Execution Token. El ET es de un solo uso. Toda la cadena queda registrada en el Audit Ledger con firma institucional verificable externamente.
 
2.  Qué es ACP
Una especificación técnica formal — no un framework, no una plataforma, no un conjunto de buenas prácticas. Un protocolo con definiciones precisas, modelos de estado formales, flujos verificables y requisitos de conformidad explícitos.
2.1  Definición
Agent Control Protocol (ACP) es una especificación técnica que define los mecanismos mediante los cuales los agentes autónomos institucionales son identificados, autorizados, monitorizados y gobernados en entornos B2B. Establece el contrato formal entre un agente, la institución que lo opera, y las instituciones con las que interactúa.

Principio central:
Execute(request) ⟹ ValidIdentity(agent) ∧ ValidCapability ∧ ValidDelegationChain ∧ AcceptableRisk
Ninguna acción de un agente ACP puede ejecutarse sin que los cuatro predicados anteriores sean verdaderos simultáneamente. Si cualquiera falla, la acción es denegada. Sin excepciones.

2.2  Principios de diseño
ACP fue diseñado con cinco principios que no se negocian en tiempo de implementación:

—	P1 Fail Closed. Ante cualquier fallo de componente interno, la acción es denegada. Nunca aprobada por defecto.
—	P2 Identidad es criptografía. AgentID = base58(SHA-256(clave_pública)). No hay usernames. No hay IDs arbitrarios. La identidad no puede ser reclamada — debe ser demostrada en cada request.
—	P3 Delegación no amplía privilegios. Los permisos del agente delegado son siempre un subconjunto estricto de los permisos del delegante. Esta propiedad se verifica criptográficamente en cada salto de la cadena.
—	P4 Auditabilidad completa. Toda decisión — aprobada, denegada o escalada — se registra en un ledger append-only con firma institucional. No solo los éxitos. Todo.
—	P5 Verificación externa posible. Cualquier institución puede verificar artefactos ACP de otra institución usando únicamente la clave pública registrada en el ITA. Sin dependencia de sistemas propietarios.

2.3  Modelo formal del agente
En ACP, un agente es una tupla formal con estado bien definido:

A = ( AgentID , capabilities , autonomy_level , state , limits )

Campo	Tipo	Descripción
AgentID	String (43-44 chars)	base58(SHA-256(pk)). Derivado de la clave pública. Inmutable.
capabilities	Lista de strings	Permisos explícitos. Formato: acp:cap:<domain>.<action>. Nunca roles abstractos.
autonomy_level	Entero 0–4	Determina thresholds de evaluación de riesgo. 0 = sin autonomía. 4 = máxima.
state	Enum	active | restricted | suspended | revoked. Transición a revoked es unidireccional.
limits	Objeto	Rate limits, montos máximos, ventanas temporales. No modificables en runtime.

2.4  Arquitectura en capas
ACP no sustituye la infraestructura de seguridad existente. Se añade como capa superior con responsabilidad específica:

Capa ACP       Gobernanza de agentes autónomos — identidad, autorización, riesgo, auditoría
Capa RBAC      Control de acceso por roles para usuarios humanos
Capa Zero TrustVerificación continua de identidad y acceso a red
 
3.  Mecanismos Técnicos
ACP define seis mecanismos interdependientes. Cada uno tiene su propia especificación formal, modelo de estado, estructura de datos, flujo de protocolo y códigos de error.
3.1  Serialización y firma (ACP-SIGN-1.0)
Toda verificación en ACP comienza con la verificación de firma. ACP-SIGN-1.0 define el proceso exacto que produce un resultado binario — válido o inválido — sin ambigüedad:

—	Canonicalización con JCS (RFC 8785). Produce una representación determinística del objeto JSON, independiente del orden de campos y del sistema que lo generó.
—	Hash SHA-256 sobre el output canónico en UTF-8.
—	Firma Ed25519 (RFC 8032) sobre el hash. Clave de 32 bytes, firma de 64 bytes.
—	Codificación base64url sin padding para transmisión.

La verificación de firma precede a toda validación semántica. Un objeto con firma inválida se rechaza sin procesar su contenido. Esta regla no tiene excepciones (PROHIB-003, PROHIB-012).
3.2  Capability Token (ACP-CT-1.0)
El Capability Token es el artefacto central de ACP. Es un objeto JSON firmado que especifica exactamente qué puede hacer un agente, sobre qué recurso, durante cuánto tiempo, y si puede delegar esa capacidad a otros agentes.

{ "ver": "1.0",
  "iss": "<AgentID_emisor>",
  "sub": "<AgentID_sujeto>",
  "cap": ["acp:cap:financial.payment"],
  "res": "org.example/accounts/ACC-001",
  "exp": 1718923600,
  "nonce": "<128bit_CSPRNG_base64url>",
  "deleg": { "allowed": true, "max_depth": 2 },
  "parent_hash": null,
  "sig": "<Ed25519_base64url>" }

Campos críticos: exp es obligatorio — un token sin expiración es inválido por definición. El nonce de 128 bits previene ataques de replay. parent_hash encadena tokens delegados de forma verificable. La firma cubre todos los campos excepto sig.
3.3  Handshake y Proof-of-Possession (ACP-HP-1.0)
Poseer un Capability Token válido no es suficiente para actuar. ACP-HP-1.0 exige que el portador demuestre en cada request que posee la clave privada correspondiente al AgentID declarado en el token. Esto elimina la posibilidad de suplantar un agente con un token robado.
El protocolo es stateless — no establece sesiones, no produce session_id, no requiere estado en el servidor entre requests. La prueba ocurre en cada interacción:

—	El sistema receptor emite un challenge de 128 bits generado por CSPRNG, válido por 30 segundos y de un solo uso.
—	El agente firma el challenge junto con el método HTTP, la ruta y el hash del body del request.
—	El receptor verifica la firma usando la clave pública del agente, obtenida del ITA.
—	El challenge es eliminado inmediatamente después de usarse — no puede ser reutilizado.

Esta secuencia garantiza cuatro propiedades formales: autenticación de identidad, binding criptográfico del request, anti-replay, e independencia del canal de transporte.
3.4  Evaluación de riesgo determinístico (ACP-RISK-1.0)
Cada solicitud de autorización pasa por una función de riesgo determinística que produce un Risk Score (RS) en el rango [0, 100]. La misma entrada siempre produce el mismo resultado — sin elementos estocásticos, sin aprendizaje automático en el camino crítico.

RS = min(100,  B(c)  +  F_ctx(x)  +  F_hist(h)  +  F_res(r))

Factor	Descripción	Ejemplo de valores
B(c)	Baseline por capacidad	*.read = 0  |  financial.payment = 35  |  financial.transfer = 40
F_ctx(x)	Contexto del request	IP no corporativa +20  |  Fuera de horario +15  |  Timestamp drift +30
F_hist(h)	Historial del agente (24h)	Denegación reciente +20  |  Sin historial previo +10  |  Frecuencia anómala +15
F_res(r)	Clasificación del recurso	public = 0  |  internal = 5  |  sensitive = 15  |  restricted = 45

El RS determina la decisión según los thresholds configurados para el autonomy_level del agente. Con autonomy_level 2 (estándar): RS ≤ 39 → APPROVED, RS 40–69 → ESCALATED, RS ≥ 70 → DENIED. Un agente con autonomy_level 0 recibe DENIED siempre, sin ejecutar la función.
Toda evaluación genera un registro completo con todos los factores aplicados, los valores intermedios y la decisión final. Esto permite reproducir el cálculo íntegramente desde el log de auditoría.
3.5  Delegación encadenada verificable
ACP permite que un agente delegue capacidades a otro agente, que a su vez puede delegar a un tercero, hasta la profundidad máxima definida en el token raíz. La delegación es un mecanismo con tres propiedades garantizadas:

—	No escalación de privilegios. El conjunto de capacidades del agente delegado es siempre un subconjunto del conjunto del delegante. Esta propiedad se verifica criptográficamente en cada salto mediante el campo parent_hash.
—	Profundidad limitada. El campo max_depth del token raíz establece el límite de la cadena. Una cadena que excede ese límite es inválida.
—	Revocación transitiva. Revocar el token de un agente invalida automáticamente todos los tokens delegados que descienden de él. Las delegaciones zombi son imposibles por diseño.

La verificación de una cadena de delegación requiere verificar cada token desde el solicitante hasta la raíz institucional, validando firma, expiración y constraints en cada salto. La cadena completa es registrada en el Audit Ledger.
3.6  Execution Token (ACP-EXEC-1.0)
La separación entre autorización y ejecución es un principio central de ACP. Cuando el motor de autorización aprueba una solicitud, no devuelve un permiso genérico — devuelve un Execution Token (ET): un artefacto de un solo uso, con tiempo de vida corto, que autoriza exactamente esa acción, sobre ese recurso, en ese momento.

—	Un ET solo puede ser consumido una vez. Si se presenta dos veces, la segunda presentación es rechazada (PROHIB-002).
—	Un ET expirado es inválido aunque nunca haya sido usado.
—	El sistema objetivo que recibe y consume el ET notifica el consumo al endpoint ACP, cerrando el ciclo de auditoría.

Este mecanismo hace que incluso una autorización APPROVED no sea ejecutable de forma indefinida. Cierra la ventana entre el momento en que se aprueba una acción y el momento en que se ejecuta.
3.7  Audit Ledger (ACP-LEDGER-1.0)
El Audit Ledger es una cadena de eventos firmados criptográficamente donde cada evento incluye el hash del evento anterior, formando una estructura que hace imposible modificar o eliminar un evento sin invalidar toda la cadena subsiguiente:

hash_n = SHA-256( event_n || hash_n-1 )

El ledger registra todos los tipos de eventos del ciclo de vida ACP: GENESIS, AUTHORIZATION (incluyendo DENIED y ESCALATED, no solo APPROVED), RISK_EVALUATION, TOKEN_ISSUED, TOKEN_REVOKED, EXECUTION_TOKEN_ISSUED, y EXECUTION_TOKEN_CONSUMED.
Las instituciones con conformidad nivel FULL exponen el ledger mediante el endpoint GET /acp/v1/audit/query, permitiendo a socios externos verificar la integridad de la cadena usando únicamente la clave pública institucional del ITA. Modificar o eliminar eventos del ledger es un comportamiento prohibido (PROHIB-007, PROHIB-008).
 
4.  Confianza Inter-Institucional
En un entorno B2B, los agentes de una institución interactúan con los sistemas de otra. ACP define el mecanismo exacto mediante el cual esta confianza se establece, se verifica y se puede revocar.
4.1  Institutional Trust Anchor (ACP-ITA-1.0)
El ITA es el registro autoritativo que vincula un institution_id a una clave pública Ed25519. Es el único punto donde ACP depende de un mecanismo fuera de banda: la distribución inicial de la clave pública de la autoridad ITA. Una vez resuelta esa clave, toda verificación posterior es autónoma y criptográfica.
Cada institución registra en el ITA su Root Institutional Key (RIK) — la clave privada que custodia en HSM y que nunca sale de él. Todos los artefactos ACP de esa institución (tokens, eventos de ledger, respuestas API) están firmados con esa clave. Cualquier tercero puede verificarlos resolviendo la clave pública desde el ITA.

4.2  Reconocimiento mutuo entre autoridades (ACP-ITA-1.1)
Cuando dos instituciones operan bajo autoridades ITA distintas, ACP-ITA-1.1 define el protocolo de reconocimiento mutuo. El proceso requiere que ambas autoridades firmen un Acuerdo de Reconocimiento Mutuo (ARM), que establece:

—	El alcance del reconocimiento (capacidades incluidas, recursos accesibles, condiciones).
—	La vigencia del acuerdo y el proceso de renovación.
—	El mecanismo de resolución proxy: cuando la autoridad A recibe una consulta sobre una institución registrada en la autoridad B, la autoridad A puede resolver la clave usando el ProxyRecord del ARM.

El reconocimiento es explícitamente no transitivo. Si A reconoce a B y B reconoce a C, A no reconoce automáticamente a C. Cada relación bilateral requiere su propio ARM firmado. Esto evita la expansión no controlada del grafo de confianza.
4.3  Rotación y revocación de claves institucionales
ACP define dos procesos de gestión de claves: rotación normal y rotación de emergencia.
La rotación normal incluye un período de transición de hasta 7 días durante el cual ambas claves (anterior y nueva) son válidas. Esto permite que los artefactos firmados con la clave anterior sean verificados durante la transición, sin interrupciones de servicio.
La rotación de emergencia se activa cuando una clave es comprometida. El resultado es inmediato: la clave es marcada como revoked, todos los artefactos firmados con ella son inválidos desde ese momento, y no existe período de transición. Esto es correcto y esperado — el compromiso de una clave institucional es un evento de seguridad de máxima prioridad.
 
5.  Modelo de Seguridad
ACP define explícitamente qué amenazas mitiga, qué propiedades garantiza, y qué riesgos quedan fuera de su alcance. La claridad sobre los límites del protocolo es parte de la especificación.
5.1  Threat Model (STRIDE)

Categoría	Amenaza	Mitigación en ACP
Spoofing	Suplantación de AgentID	AgentID = SHA-256(pk). Sin firma válida con sk correspondiente → DENIED inmediato.
Tampering	Alteración de token o evento	Ed25519 cubre todos los campos. Ledger encadenado — alterar un evento invalida toda la cadena posterior.
Repudiation	Agente niega acción ejecutada	ActionRequest firmada digitalmente. Non-repudiation garantizado por diseño.
Info Disclosure	Exposición de capacidades	Tokens revelan solo el subconjunto necesario. Confidencialidad del canal depende de TLS.
Denial of Service	Flood de requests o escalaciones	Rate limits por agent_id. WithinLimits() incluye control de frecuencia anómala.
Elevation	Delegación que amplía privilegios	Constraints_delegado ⊆ Constraints_original. Verificado criptográficamente en cada salto.

5.2  Propiedades de seguridad garantizadas
ACP garantiza las siguientes propiedades cuando la implementación es conforme a la especificación:

—	Integridad de artefactos. EUF-CMA security de Ed25519. Imposible modificar un token o evento sin invalidar la firma.
—	Autenticidad de identidad. Solo quien posee sk puede generar una firma válida bajo la pk correspondiente. La probabilidad de forja es negligible.
—	No escalación de privilegios por delegación. Demostrable por inducción sobre la cadena de delegación.
—	Anti-replay. El challenge de un solo uso en ACP-HP-1.0 hace que reutilizar una prueba de posesión sea inútil — el challenge ya fue consumido.
—	Revocación efectiva. Valid(t) = firma_válida ∧ no_expirado ∧ no_revocado ∧ delegación_válida. Las cuatro condiciones deben ser verdaderas.

5.3  Riesgos residuales declarados
ACP declara explícitamente lo que no puede resolver:

—	Compromiso total de la RIK custodiada en HSM. ACP define el proceso de rotación de emergencia pero no puede prevenir un compromiso físico de la infraestructura de custodia.
—	Colusión institucional coordinada. Si múltiples instituciones actúan de forma maliciosa coordinada, pueden generar artefactos válidos. ACP garantiza trazabilidad, no previene acuerdos maliciosos entre partes.
—	Fallos en la implementación. ACP es una especificación. Una implementación que viola los comportamientos prohibidos puede comprometer todas las garantías del protocolo. La conformidad requiere tests formales.
—	Bootstrap del ITA. El único punto que depende de canal fuera de banda. Una vez resuelta la clave raíz del ITA, todo lo posterior es autónomo.
 
6.  Conformidad e Interoperabilidad
ACP define tres niveles de conformidad con requisitos verificables. Una implementación declara públicamente su nivel mediante un endpoint estándar. No hay conformidad parcial dentro de un nivel.
6.1  Niveles de conformidad

Nivel	Documentos requeridos	Capacidad habilitada
L1 — CORE	ACP-SIGN-1.0  |  ACP-CT-1.0  |  ACP-CAP-REG-1.0  |  ACP-HP-1.0	Emisión y verificación de tokens con prueba de posesión criptográfica
L2 — SECURITY	L1 + ACP-RISK-1.0  |  ACP-REV-1.0  |  ACP-ITA-1.0	Evaluación de riesgo, revocación transitiva, delegación entre instituciones
L3 — FULL	L2 + ACP-API-1.0  |  ACP-EXEC-1.0  |  ACP-LEDGER-1.0	Sistema ACP completo con auditoría inter-institucional verificable

6.2  Declaración de conformidad
Toda implementación conforme DEBE exponer un endpoint público sin autenticación:

GET https://<contact_endpoint>/acp/v1/conformance

Este endpoint retorna la declaración de conformidad institucional: nivel alcanzado, documentos implementados, extensiones institucionales declaradas, y fecha de declaración. Permite que cualquier socio externo verifique el nivel de conformidad de una contraparte antes de establecer una relación ACP.
6.3  Comportamientos prohibidos
ACP define 12 comportamientos que ninguna implementación conforme puede exhibir. Si una implementación exhibe alguno de ellos, no puede declararse conforme en ningún nivel:

Código	Comportamiento prohibido
PROHIB-001	Aprobar un request cuando cualquier componente de evaluación falla
PROHIB-002	Reutilizar un Execution Token ya consumido
PROHIB-003	Omitir verificación de firma en cualquier artefacto entrante
PROHIB-004	Tratar un token_id no encontrado como activo en el contexto de revocación
PROHIB-005	Permitir transición de estado desde revoked
PROHIB-006	Emitir un ET sin AuthorizationDecision APPROVED previa
PROHIB-007	Modificar o eliminar eventos del Audit Ledger
PROHIB-008	Silenciar la detección de corrupción en el ledger
PROHIB-009	Ignorar max_depth en cadenas de delegación
PROHIB-010	Implementar política offline más permisiva que la definida en ACP-REV-1.0
PROHIB-011	Aprobar requests de agentes con autonomy_level 0
PROHIB-012	Continuar procesando un artefacto con firma inválida

6.4  Condiciones de interoperabilidad B2B
ACP establece tres niveles de interoperabilidad entre instituciones, cada uno con condiciones precisas:

—	Interoperabilidad L1: La institución A puede verificar tokens de la institución B si ambas implementan ACP-CONF-L1, A tiene acceso a la clave pública de B (vía ITA o fuera de banda), y los tokens de B usan los algoritmos de ACP-SIGN-1.0.
—	Interoperabilidad L2: A puede delegar a agentes de B si ambas implementan ACP-CONF-L2, están registradas en un ITA común o con reconocimiento mutuo, y el endpoint de revocación de B es accesible para A.
—	Interoperabilidad L3: A puede auditar el ledger de B si B implementa ACP-CONF-L3, A puede resolver la clave pública de B vía ITA, y B expone GET /acp/v1/audit/query.
 
7.  Casos de Uso
ACP es agnóstico al sector. Los mecanismos son los mismos independientemente de la industria. Lo que varía es la configuración de capacidades, recursos y autonomy_levels.
7.1  Sector financiero — Agentes de pago inter-institucional
ACP-PAY-1.0 extiende el registro de capacidades con especificaciones formales para acp:cap:financial.payment y acp:cap:financial.transfer. Cada operación financiera ejecutada por un agente ACP incluye:

—	Constraints obligatorios en el token: max_amount, currency. Sin estos constraints, el token es inválido para operaciones financieras.
—	12 pasos de validación específicos para operaciones de pago, incluyendo verificación de límites, validación de beneficiario, y control de ventana temporal.
—	11 códigos de error propios (PAY-001 a PAY-011) para diagnóstico preciso de fallos.
—	Registro en ledger con todos los campos de la operación, permitiendo auditoría regulatoria completa.

En un escenario B2B financiero, el banco A puede autorizar a un agente para ejecutar pagos hasta un monto definido hacia beneficiarios pre-aprobados, en una ventana temporal específica, con registro completo verificable por el banco receptor B sin necesidad de sistemas propietarios compartidos.
7.2  Gobierno digital — Procesamiento de expedientes
Los agentes gubernamentales que procesan documentos y expedientes pueden operar bajo ACP con autonomy_level 1 o 2, requiriendo revisión humana para cualquier acción con Risk Score superior al threshold configurado. El ITA institucional garantiza que solo los agentes certificados por la autoridad gubernamental pueden acceder a recursos clasificados. La trazabilidad del ledger es evidencia forense para auditorías regulatorias y procesos de transparencia.
7.3  Enterprise AI — Orquestación multi-empresa
En pipelines de agentes que atraviesan los límites de múltiples organizaciones, ACP permite que cada organización mantenga control formal sobre lo que los agentes de otras organizaciones pueden hacer en sus sistemas. La delegación encadenada permite que un agente en la empresa A opere en sistemas de la empresa B con capacidades delegadas explícitas, sin que B necesite confiar en los controles internos de A — solo en la cadena de tokens firmados.
7.4  Infraestructura crítica — Agentes de monitoreo y actuación
Para sistemas donde una acción incorrecta tiene consecuencias irreversibles, ACP permite configurar autonomy_level 0 para todos los agentes que actúan sobre sistemas críticos. Cualquier solicitud de actuación es DENIED sin evaluar el Risk Score, y pasa obligatoriamente por revisión humana. El ledger proporciona el registro forense necesario para análisis post-incidente.
 
8.  Estado de la Especificación
ACP v1.0/v1.1 es una especificación Draft Standard completa. Todos los documentos definidos en el roadmap v1.x están finalizados.
8.1  Documentos v1.0 — Completos

Documento	Título	Capa
ACP-SIGN-1.0	Serialización y Firma	Core
ACP-CT-1.0	Capability Tokens	Core
ACP-CAP-REG-1.0	Registro de Capacidades	Core
ACP-HP-1.0	Handshake / Proof-of-Possession	Core
ACP-RISK-1.0	Motor de Riesgo Determinístico	Security
ACP-REV-1.0	Protocolo de Revocación	Security
ACP-ITA-1.0	Institutional Trust Anchor	Security
ACP-API-1.0	HTTP API Formal	Operations
ACP-EXEC-1.0	Execution Tokens	Operations
ACP-LEDGER-1.0	Audit Ledger	Operations
ACP-CONF-1.0	Conformidad — 3 niveles, 62+ requisitos	Governance

8.2  Documentos v1.1 — Completos

Documento	Título	Qué añade
ACP-PAY-1.0	Financial Capability Spec	Especificación formal para capacidades financieras. 12 pasos de validación, 11 códigos de error.
ACP-REP-1.1	Reputation Module	trust_score determinístico sobre 90 días de historial. Señales externas con límite de impacto ±0.20.
ACP-ITA-1.1	ITA Mutual Recognition	Reconocimiento bilateral entre autoridades ITA. ARM firmado. Resolución proxy. No transitivo.

8.3  Roadmap v2.0 — Planificado
Las siguientes extensiones están identificadas pero no tienen fecha. Cada una requiere análisis de impacto sobre la especificación existente antes de iniciarse:

—	Algoritmos post-cuánticos. Evaluación de migración desde Ed25519. Análisis de compatibilidad con todos los artefactos firmados existentes bajo ACP-SIGN-1.0.
—	Protocolo de federación ITA. Extensión formal de ACP-ITA-1.1 para grafos de confianza multi-nivel con condiciones de transitividad controladas.
—	Prototipo de referencia. Implementación mínima ejecutable en Python con todos los documentos v1.0. Suite de tests de conformidad automatizados.
—	Proceso de estandarización. Preparación para envío a body de estándares formal. Numeración tipo IETF RFC. Revisión externa por pares.
 
9.  Cómo Implementar ACP
ACP es una especificación — no requiere adoptar ninguna plataforma específica. Puede implementarse sobre la infraestructura existente. Lo que requiere es precisión en los mecanismos criptográficos y rigor en el cumplimiento de los flujos definidos.
9.1  Requisitos mínimos para conformidad L1
Para alcanzar el nivel mínimo de conformidad (L1 — CORE), una organización necesita:

—	Infraestructura de clave pública Ed25519. Par de claves para cada agente. No es negociable el algoritmo — Ed25519 es el único definido en v1.0.
—	Implementación de JCS (RFC 8785). Canonicalización determinística para todos los artefactos firmados.
—	Emisión y verificación de Capability Tokens con todos los campos obligatorios según ACP-CT-1.0 §5.
—	Endpoint de handshake para emitir y verificar challenges (ACP-HP-1.0 §6).
—	Registro de capacidades con los dominios core de ACP-CAP-REG-1.0.

9.2  Requisitos adicionales para conformidad L3
Para conformidad completa (L3 — FULL) se añaden:

—	Root Institutional Key custodiada en HSM con proceso de rotación documentado.
—	Registro en una autoridad ITA (modelo centralizado o federado).
—	Motor de riesgo determinístico con los cuatro factores de ACP-RISK-1.0.
—	Endpoint de revocación (Mecanismo A — endpoint online, o Mecanismo B — CRL).
—	Almacenamiento append-only para el Audit Ledger con firma por evento.
—	HTTP API completa según ACP-API-1.0, incluyendo endpoint de health y conformance.
—	Declaración de conformidad pública en GET /acp/v1/conformance.

9.3  Lo que ACP no prescribe
ACP define el qué — los mecanismos, los flujos, las estructuras de datos, los requisitos. No prescribe el cómo de la implementación interna:

—	Lenguaje de programación o framework.
—	Base de datos o sistema de almacenamiento para el ledger.
—	Proveedor de HSM o infraestructura de custodia de claves.
—	Proveedor de ITA (puede ser operado internamente en el modelo centralizado).
—	Integración específica con sistemas RBAC o Zero Trust existentes.
 
10.  Conclusión
Los agentes autónomos ya están operando en entornos institucionales. La pregunta no es si van a operar — es si lo van a hacer con o sin gobernanza formal. ACP propone que lo hagan con gobernanza formal, con mecanismos verificables, y con trazabilidad que pueda sostener una auditoría externa.
ACP no es el primer intento de controlar agentes autónomos. Es el primer intento de hacerlo mediante una especificación técnica formal con modelos de estado precisos, propiedades de seguridad demostrables, y requisitos de conformidad verificables. La diferencia entre una política de buenas prácticas y un protocolo formal es exactamente esa: los comportamientos están definidos, los fallos tienen códigos de error específicos, y la conformidad se puede comprobar.

El objetivo de ACP no es hacer que los agentes sean más capaces. Es hacer que sean gobernable. Esa es una condición necesaria para que su despliegue institucional sea sostenible a escala.

La especificación v1.0/v1.1 está completa. Está disponible para revisión técnica, implementación piloto y proceso de estandarización formal. TraslaIA invita a organizaciones interesadas en adoptar ACP, contribuir a su evolución, o participar en el proceso de estandarización a contactar directamente.

Marcelo Fernandez  |  TraslaIA
info@traslaia.com   |   www.traslaia.com
 
Apéndice A — Glosario

Término	Definición
AgentID	Identificador criptográfico de un agente: base58(SHA-256(clave_pública_Ed25519)). Inmutable e inforjable.
Capability Token (CT)	Artefacto JSON firmado que autoriza a un agente a realizar acciones específicas sobre un recurso definido durante un período limitado.
Execution Token (ET)	Artefacto de un solo uso emitido tras una AuthorizationDecision APPROVED. Autoriza exactamente esa acción en ese momento.
ITA	Institutional Trust Anchor. Registro autoritativo que vincula institution_id con clave pública Ed25519 institucional.
RIK	Root Institutional Key. Par de claves Ed25519 de la institución. La clave privada se custodia en HSM y nunca sale de él.
Risk Score (RS)	Entero en [0, 100] producido por la función de riesgo determinístico de ACP-RISK-1.0. Determina la decisión de autorización.
Autonomy Level	Entero 0–4 asignado a un agente que determina los thresholds de evaluación de riesgo aplicables.
Proof-of-Possession (PoP)	Prueba criptográfica de que el portador de un CT posee la clave privada correspondiente al AgentID declarado.
Audit Ledger	Cadena de eventos firmados donde hash_n = SHA-256(event_n || hash_n-1). Append-only e inmutable.
ARM	Acuerdo de Reconocimiento Mutuo. Documento bilateral firmado por dos autoridades ITA para habilitar interoperabilidad cross-authority.
ESCALATED	Decisión del motor ACP cuando el RS está en el rango intermedio. La acción no se ejecuta hasta resolución explícita por autoridad humana o agente con nivel suficiente.
Fail Closed	Principio de diseño: ante cualquier fallo interno, la acción es denegada. Nunca aprobada por defecto.

Apéndice B — Referencias

RFC 8785  JSON Canonicalization Scheme (JCS). IETF, 2020.
RFC 8032  Edwards-Curve Digital Signature Algorithm (EdDSA). IETF, 2017.
ACP-SIGN-1.0  Serialization and Signature Specification. TraslaIA, 2026.
ACP-CT-1.0  Capability Token Specification. TraslaIA, 2026.
ACP-CAP-REG-1.0  Capability Registry Specification. TraslaIA, 2026.
ACP-HP-1.0  Handshake Protocol / Proof-of-Possession Specification. TraslaIA, 2026.
ACP-RISK-1.0  Deterministic Risk Model Specification. TraslaIA, 2026.
ACP-REV-1.0  Revocation Protocol Specification. TraslaIA, 2026.
ACP-ITA-1.0  Institutional Trust Anchor Specification. TraslaIA, 2026.
ACP-ITA-1.1  ITA Mutual Recognition Protocol. TraslaIA, 2026.
ACP-API-1.0  HTTP API Specification. TraslaIA, 2026.
ACP-EXEC-1.0  Execution Token Specification. TraslaIA, 2026.
ACP-LEDGER-1.0  Audit Ledger Specification. TraslaIA, 2026.
ACP-PAY-1.0  Financial Capability Specification. TraslaIA, 2026.
ACP-REP-1.1  Reputation Module Specification. TraslaIA, 2026.
ACP-CONF-1.0  Conformance Specification. TraslaIA, 2026.

La especificación completa está disponible a través de TraslaIA. Contacto: info@traslaia.com
