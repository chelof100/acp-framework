/**
 * acp/signer — Canonicalización JCS + pipeline de firma Ed25519 (ACP-SIGN-1.0)
 *
 * Pipeline de firma ACP:
 *   1. Canonicalizar el objeto capability usando JCS (RFC 8785)
 *   2. Calcular SHA-256 de los bytes canónicos
 *   3. Firmar el digest con Ed25519
 *   4. Embeber la firma como base64url en el campo plano "sig" del capability (ACP-CT-1.0)
 *
 * Sin dependencias externas en runtime — usa solo el módulo `node:crypto` de Node.js.
 *
 * @example
 * ```typescript
 * import { AgentIdentity, ACPSigner } from '@acp/sdk';
 *
 * const agent = AgentIdentity.generate();
 * const signer = new ACPSigner(agent);
 *
 * const capability = {
 *   ver: '1.0', iss: agent.did, sub: agent.agentId,
 *   iat: 1700000000, exp: 1700003600,
 *   nonce: 'nonce-aleatorio',
 *   cap: ['acp:cap:financial.payment'],
 *   res: 'org.example/accounts/ACC-001',
 * };
 *
 * const signed = signer.signCapability(capability);
 * // signed['sig'] contiene la firma Ed25519 en base64url
 *
 * const isValid = ACPSigner.verifyCapability(signed, agent.publicKeyBytes);
 * ```
 */

import { createHash, createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { AgentIdentity } from './identity';

// ─── Canonicalización JCS (RFC 8785) ─────────────────────────────────────────

/**
 * Produce recursivamente el string canónico JCS (RFC 8785) de un valor JSON.
 *
 * Reglas:
 *   - Claves de objeto ordenadas lexicográficamente por punto de código Unicode
 *   - Sin espacios entre tokens
 *   - Strings codificados via JSON.stringify (secuencias de escape correctas)
 *   - Números codificados via JSON.stringify (representación IEEE 754)
 */
function _jcsStr(obj: unknown): string {
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return JSON.stringify(obj);
  if (typeof obj === 'string') return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return '[' + obj.map(_jcsStr).join(',') + ']';
  }
  if (typeof obj === 'object') {
    const sorted = Object.entries(obj as Record<string, unknown>).sort(
      ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)
    );
    return (
      '{' +
      sorted.map(([k, v]) => `${JSON.stringify(k)}:${_jcsStr(v)}`).join(',') +
      '}'
    );
  }
  throw new TypeError(`jcsCanonicalize: no serializable a JSON: ${typeof obj}`);
}

/**
 * Canonicaliza un objeto con JCS a bytes UTF-8 (RFC 8785).
 * Exportado para uso en tests y llamadores externos.
 */
export function jcsCanonicalize(obj: unknown): Buffer {
  return Buffer.from(_jcsStr(obj), 'utf-8');
}

// ─── Cabecera SPKI (para verifyCapability) ────────────────────────────────────

// Prefijo SPKI DER de Ed25519 (12 bytes): 302a300506032b6570032100
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

// ─── ACPSigner ────────────────────────────────────────────────────────────────

/**
 * Pipeline de firma y verificación ACP (ACP-SIGN-1.0).
 *
 * Pipeline: JCS(capability) → SHA-256 → Ed25519.sign → base64url
 */
export class ACPSigner {
  private readonly _identity: AgentIdentity;

  constructor(identity: AgentIdentity) {
    this._identity = identity;
  }

  // ─── Firma ───────────────────────────────────────────────────────────────────

  /**
   * Firma un objeto capability y embebe la firma en capability["sig"].
   *
   * El dict de entrada NO se modifica. Se retorna un nuevo objeto con el campo
   * "sig" agregado/reemplazado (campo plano según ACP-CT-1.0).
   *
   * La entrada de firma es JCS(capability SIN "sig").
   */
  signCapability(capability: Record<string, unknown>): Record<string, unknown> {
    // Eliminar "sig" existente antes de firmar
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sig: _sig, ...capToSign } = capability;

    // Canonicalizar JCS → SHA-256 → Ed25519.sign
    const canonical = jcsCanonicalize(capToSign);
    const digest = createHash('sha256').update(canonical).digest();
    const sigBytes = this._identity.sign(digest);
    const sigB64 = sigBytes.toString('base64url');

    return { ...capability, sig: sigB64 };
  }

  /**
   * Firma bytes arbitrarios directamente (para desafíos PoP).
   * Retorna firma Ed25519 raw de 64 bytes.
   */
  signBytes(data: Buffer): Buffer {
    return this._identity.sign(data);
  }

  // ─── Verificación ────────────────────────────────────────────────────────────

  /**
   * Verifica un capability firmado contra una clave pública Ed25519 de 32 bytes.
   *
   * Retorna true si la firma es válida, false en caso contrario.
   * Espera la firma en el campo plano "sig" (ACP-CT-1.0).
   */
  static verifyCapability(
    capability: Record<string, unknown>,
    publicKeyBytes: Buffer
  ): boolean {
    const sig = capability['sig'];
    if (!sig || typeof sig !== 'string') return false;

    // Reconstruir entrada de firma (capability sin "sig")
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { sig: _sig, ...capToVerify } = capability;

    try {
      const canonical = jcsCanonicalize(capToVerify);
      const digest = createHash('sha256').update(canonical).digest();

      // Decodificar firma base64url
      const sigBytes = Buffer.from(sig, 'base64url');
      if (sigBytes.length !== 64) return false;

      // Reconstruir clave pública desde bytes raw
      const spkiDer = Buffer.concat([SPKI_PREFIX, publicKeyBytes]);
      const pubKey = createPublicKey({ key: spkiDer, format: 'der', type: 'spki' });

      return cryptoVerify(null, digest, pubKey, sigBytes);
    } catch {
      return false;
    }
  }

  /** Expone la canonicalización JCS para uso externo. */
  static canonicalize(obj: unknown): Buffer {
    return jcsCanonicalize(obj);
  }
}
