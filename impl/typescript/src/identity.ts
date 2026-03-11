/**
 * acp/identity — Identidad Ed25519 del agente + derivación de AgentID (ACP-SIGN-1.0)
 *
 * La identidad criptográfica de un agente consiste en:
 *   - Un par de claves Ed25519 (privada/pública)
 *   - Un AgentID derivado como base58(SHA-256(clave pública raw de 32 bytes))
 *   - Una representación DID (did:key)
 *
 * Sin dependencias externas en runtime — usa solo el módulo `node:crypto` de Node.js.
 *
 * @example
 * ```typescript
 * import { AgentIdentity } from '@acp/sdk';
 *
 * const agent = AgentIdentity.generate();
 * console.log(agent.agentId);         // string base58
 * console.log(agent.did);             // "did:key:z..."
 * console.log(agent.publicKeyBytes);  // Buffer(32)
 *
 * // Round-trip
 * const restored = AgentIdentity.fromPrivateBytes(agent.privateKeyBytes);
 * // restored.agentId === agent.agentId
 * ```
 */

import {
  generateKeyPairSync,
  createPrivateKey,
  createPublicKey,
  sign as cryptoSign,
  verify as cryptoVerify,
  createHash,
} from 'node:crypto';
import type { KeyObject } from 'node:crypto';

// ─── Cabeceras DER ────────────────────────────────────────────────────────────
// Prefijo PKCS8 DER de Ed25519 (16 bytes): 302e020100300506032b657004220420
const PKCS8_PREFIX = Buffer.from('302e020100300506032b657004220420', 'hex');
// Prefijo SPKI DER de Ed25519 (12 bytes): 302a300506032b6570032100
const SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');
// Prefijo multicodec para clave pública Ed25519 (para did:key): 0xed 0x01
const ED25519_MULTICODEC = Buffer.from([0xed, 0x01]);

// ─── Base58btc ────────────────────────────────────────────────────────────────

const BASE58_ALPHABET =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/** Codificación Base58btc (alfabeto Bitcoin, igual que Python's _base58_encode). */
function base58Encode(data: Buffer): string {
  // Contar bytes cero al inicio
  let leadingZeros = 0;
  for (const byte of data) {
    if (byte === 0) leadingZeros++;
    else break;
  }

  // Convertir bytes → entero grande
  let n = 0n;
  for (const byte of data) {
    n = n * 256n + BigInt(byte);
  }

  // Convertir entero grande → dígitos base58 (invertidos)
  const digits: number[] = [];
  while (n > 0n) {
    const rem = Number(n % 58n);
    n /= 58n;
    digits.push(rem);
  }

  return (
    BASE58_ALPHABET[0].repeat(leadingZeros) +
    digits
      .reverse()
      .map((d) => BASE58_ALPHABET[d])
      .join('')
  );
}

// ─── AgentIdentity ────────────────────────────────────────────────────────────

/**
 * Identidad Ed25519 del agente (ACP-SIGN-1.0).
 *
 * Atributos:
 *   agentId        — base58(SHA-256(clave pública raw de 32 bytes))  [ACP-CT-1.0 §3]
 *   did            — did:key:z<base58(0xed01 || pubkey)>
 *   publicKeyBytes — clave pública Ed25519 raw de 32 bytes
 *   privateKeyBytes— clave privada Ed25519 raw de 32 bytes (¡guardar de forma segura!)
 */
export class AgentIdentity {
  private readonly _privateKey: KeyObject;
  private readonly _publicKey: KeyObject;
  private readonly _pubkeyRaw: Buffer;

  private constructor(privateKey: KeyObject, publicKey: KeyObject) {
    this._privateKey = privateKey;
    this._publicKey = publicKey;
    // Eliminar la cabecera SPKI DER de 12 bytes para obtener la clave raw de 32 bytes
    const spkiDer = this._publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
    this._pubkeyRaw = Buffer.from(spkiDer.subarray(12));
  }

  // ─── Constructores ──────────────────────────────────────────────────────────

  /** Genera una nueva identidad de agente Ed25519 aleatoria. */
  static generate(): AgentIdentity {
    const { privateKey, publicKey } = generateKeyPairSync('ed25519');
    return new AgentIdentity(privateKey, publicKey);
  }

  /**
   * Restaura una identidad desde 32 bytes raw de clave privada.
   * @param data Seed de clave privada Ed25519 raw de 32 bytes
   */
  static fromPrivateBytes(data: Buffer): AgentIdentity {
    if (data.length !== 32) {
      throw new Error(
        `AgentIdentity.fromPrivateBytes: se esperaban 32 bytes, se recibieron ${data.length}`
      );
    }
    const pkcs8 = Buffer.concat([PKCS8_PREFIX, data]);
    const privateKey = createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' });
    const publicKey = createPublicKey(privateKey);
    return new AgentIdentity(privateKey, publicKey);
  }

  // ─── Propiedades ─────────────────────────────────────────────────────────────

  /**
   * AgentID ACP: base58(SHA-256(clave pública raw de 32 bytes)).
   * Implementa ACP-SIGN-1.0 §3.1.
   */
  get agentId(): string {
    const digest = createHash('sha256').update(this._pubkeyRaw).digest();
    return base58Encode(digest);
  }

  /**
   * Representación did:key (multicodec Ed25519 + base58btc).
   * Formato: did:key:z<base58(0xed01 || pubkey)>
   */
  get did(): string {
    const multicodec = Buffer.concat([ED25519_MULTICODEC, this._pubkeyRaw]);
    return `did:key:z${base58Encode(multicodec)}`;
  }

  /** Clave pública Ed25519 raw de 32 bytes. */
  get publicKeyBytes(): Buffer {
    return Buffer.from(this._pubkeyRaw);
  }

  /** Clave privada Ed25519 raw de 32 bytes (¡guardar de forma segura!). */
  get privateKeyBytes(): Buffer {
    const pkcs8 = this._privateKey.export({ type: 'pkcs8', format: 'der' }) as Buffer;
    return Buffer.from(pkcs8.subarray(16)); // eliminar cabecera PKCS8 de 16 bytes
  }

  // ─── Firma ───────────────────────────────────────────────────────────────────

  /**
   * Firma bytes arbitrarios con Ed25519. Retorna firma raw de 64 bytes.
   * El llamador es responsable de cualquier pre-hash (ej. SHA-256 para ACP-SIGN-1.0).
   */
  sign(message: Buffer): Buffer {
    return cryptoSign(null, message, this._privateKey) as Buffer;
  }

  /**
   * Verifica una firma Ed25519 de 64 bytes contra un mensaje.
   * Retorna true si es válida, false en caso contrario.
   */
  verify(signature: Buffer, message: Buffer): boolean {
    try {
      return cryptoVerify(null, message, this._publicKey, signature);
    } catch {
      return false;
    }
  }

  toString(): string {
    return `AgentIdentity(agentId=${this.agentId})`;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Deriva un AgentID a partir de bytes raw de clave pública Ed25519 de 32 bytes.
 * AgentID = base58(SHA-256(publicKeyBytes))
 */
export function deriveAgentId(publicKeyBytes: Buffer): string {
  const digest = createHash('sha256').update(publicKeyBytes).digest();
  return base58Encode(digest);
}
