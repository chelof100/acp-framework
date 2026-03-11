/**
 * Definiciones de tipos ACP — ACP-CT-1.0, ACP-HP-1.0, ACP-SIGN-1.0
 */

// ─── Capability Token ─────────────────────────────────────────────────────────

/** Token de capacidad ACP según ACP-CT-1.0 §5 */
export interface CapabilityToken {
  /** Versión del protocolo — debe ser "1.0" */
  ver: string;
  /** AgentID del emisor: base58(SHA-256(issuer_pubkey)) */
  iss: string;
  /** AgentID del sujeto — el agente autorizado a usar este token */
  sub: string;
  /** Identificadores de capacidad otorgados (ej. ["acp:cap:financial.payment"]) */
  cap: string[];
  /** Alcance del recurso (ej. "org.bank/accounts/ACC-001") */
  res: string;
  /** Timestamp Unix de emisión */
  iat: number;
  /** Timestamp Unix de expiración */
  exp: number;
  /** Nonce aleatorio — base64url de 128 bits, previene ataques de replay */
  nonce: string;
  /** Restricciones de delegación */
  deleg: DelegationConstraints;
  /** Hash del token padre para tokens delegados (null para tokens raíz) */
  parent_hash: string | null;
  /** Restricciones específicas del dominio (ej. max_amount_usd) */
  constraints?: Record<string, unknown>;
  /** Configuración del endpoint de revocación */
  rev?: RevocationConfig;
  /** Firma Ed25519 sobre SHA-256(JCS(payload_sin_sig)) */
  sig?: string;
}

/** Restricciones de delegación embebidas en cada token */
export interface DelegationConstraints {
  /** Si el sujeto puede delegar este token a otros */
  allowed: boolean;
  /** Profundidad máxima de delegación restante (0 = sin más delegación) */
  max_depth: number;
}

/** Configuración del endpoint de revocación */
export interface RevocationConfig {
  /** Tipo de verificación de revocación */
  type: "endpoint" | "crl";
  /** URI para verificación de revocación */
  uri: string;
}

/** Un CapabilityToken con el campo `sig` poblado */
export type SignedCapabilityToken = CapabilityToken & { sig: string };

// ─── Códigos de Error ACP ─────────────────────────────────────────────────────

/** Códigos de error estandarizados según ACP-CT-1.0 §8 */
export type ACPErrorCode =
  | "CT-001" // JSON malformado
  | "CT-002" // versión no soportada
  | "CT-003" // token expirado
  | "CT-004" // iat en el futuro
  | "CT-005" // revocado
  | "CT-006" // firma inválida
  | "CT-007" // emisor no coincide
  | "CT-008" // capacidades vacías
  | "CT-009" // recurso faltante
  | "CT-010" // profundidad de delegación excedida
  | "CT-011" // sujeto no coincide
  | "CT-012" // replay de nonce
  | "CT-013"; // violación de restricción

// ─── Headers HTTP ACP ─────────────────────────────────────────────────────────

/** Headers HTTP de seguridad ACP (ACP-HP-1.0) */
export interface ACPHeaders {
  Authorization: string;        // Bearer <token_json>
  "X-ACP-Agent-ID": string;    // AgentID
  "X-ACP-Challenge": string;   // nonce de desafío
  "X-ACP-Signature": string;   // firma PoP
  "Content-Type": string;
}

// ─── Opciones del Cliente ─────────────────────────────────────────────────────

/** Opciones para el constructor de ACPClient */
export interface ACPClientOptions {
  /** URL base del servidor compatible con ACP (sin barra final) */
  baseUrl: string;
  /** Timeout de solicitud en milisegundos (por defecto: 10000) */
  timeoutMs?: number;
}

/** Opciones para client.execute() */
export interface ExecuteOptions {
  /** Método HTTP */
  method: string;
  /** Ruta de la API comenzando con "/" */
  path: string;
  /** String JSON del token de capacidad raw */
  capabilityToken: string;
  /** Cuerpo de la solicitud opcional (se serializará a JSON) */
  payload?: Record<string, unknown>;
}
