/**
 * acp/client — Cliente HTTP ACP con handshake PoP automático (ACP-HP-1.0)
 *
 * El ACPClient maneja el flujo completo de autorización ACP:
 *   1. POST /acp/v1/register → registrar clave pública del agente (una vez por agente)
 *   2. GET  /acp/v1/challenge → recibir nonce de un solo uso
 *   3. Firmar PoP: Method|Path|Challenge|base64url(SHA-256(body)) → SHA-256 → Ed25519
 *   4. POST /acp/v1/verify   → enviar token + PoP via headers HTTP, recibir decisión
 *
 * Headers HTTP usados por verify():
 *   Authorization:   Bearer <capability_token_json>
 *   X-ACP-Agent-ID:  <agent_id>
 *   X-ACP-Challenge: <challenge>
 *   X-ACP-Signature: <pop_signature>
 *
 * Sin dependencias externas en runtime — usa solo `node:crypto` de Node.js y `fetch` (Node 18+).
 *
 * @example
 * ```typescript
 * import { AgentIdentity, ACPSigner, ACPClient } from '@acp/sdk';
 *
 * const agent = AgentIdentity.generate();
 * const signer = new ACPSigner(agent);
 * const client = new ACPClient('http://localhost:8080', agent, signer);
 *
 * // Registrar agente con el servidor (una vez)
 * await client.register();
 *
 * // Verificar un token de capacidad
 * const result = await client.verify(signedToken);
 * console.log(result); // { ok: true, agent_id: '...', capabilities: [...] }
 * ```
 */

import { createHash } from 'node:crypto';
import { AgentIdentity } from './identity';
import { ACPSigner } from './signer';

// ─── ACPError ─────────────────────────────────────────────────────────────────

/** Lanzado cuando el servidor ACP retorna un error o la solicitud falla. */
export class ACPError extends Error {
  /** Código de estado HTTP, si aplica. */
  readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ACPError';
    this.statusCode = statusCode;
  }
}

// ─── ACPClient ────────────────────────────────────────────────────────────────

/**
 * Cliente HTTP ACP que implementa el handshake Challenge/PoP (ACP-HP-1.0).
 *
 * El cliente no mantiene estado entre llamadas. Cada llamada a verify() realiza
 * una nueva solicitud de desafío para prevenir ataques de replay.
 */
export class ACPClient {
  private readonly _server: string;
  private readonly _identity: AgentIdentity;
  private readonly _signer: ACPSigner;
  private readonly _timeoutMs: number;

  /**
   * @param serverUrl  URL base del validador ACP (ej. "http://localhost:8080")
   * @param identity   Identidad del agente (par de claves Ed25519)
   * @param signer     Instancia de ACPSigner para producir firmas PoP
   * @param timeoutMs  Timeout HTTP en milisegundos (por defecto: 10000)
   */
  constructor(
    serverUrl: string,
    identity: AgentIdentity,
    signer: ACPSigner,
    timeoutMs = 10_000
  ) {
    this._server = serverUrl.replace(/\/$/, '');
    this._identity = identity;
    this._signer = signer;
    this._timeoutMs = timeoutMs;
  }

  // ─── API Pública ─────────────────────────────────────────────────────────────

  /**
   * Registra la clave pública de este agente con el servidor ACP.
   *
   * POST /acp/v1/register
   * Body: { "agent_id": "<agent_id>", "public_key_hex": "<base64url(pubkey)>" }
   *
   * Debe llamarse una vez antes de verify(). En producción, este endpoint
   * está restringido a administradores institucionales.
   */
  async register(): Promise<Record<string, unknown>> {
    const pubKeyB64 = this._identity.publicKeyBytes.toString('base64url');
    return this._postJson('/acp/v1/register', {
      agent_id: this._identity.agentId,
      public_key_hex: pubKeyB64,
    });
  }

  /**
   * Flujo completo de verificación ACP (ACP-HP-1.0):
   *   1. GET /acp/v1/challenge  → nonce de un solo uso
   *   2. Calcular PoP: Method|Path|Challenge|base64url(SHA-256(body))
   *   3. POST /acp/v1/verify via headers HTTP (Authorization + X-ACP-*)
   *
   * @param capabilityToken Objeto de token de capacidad firmado (de ACPSigner)
   * @returns { ok: true, agent_id: '...', capabilities: [...] }
   */
  async verify(
    capabilityToken: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Paso 1: Obtener desafío
    const challengeResp = await this._getJson('/acp/v1/challenge');
    const challenge = challengeResp['challenge'] as string | undefined;
    if (!challenge) {
      throw new ACPError("la respuesta del servidor no contiene el campo 'challenge'");
    }

    // Paso 2: Serializar token (JSON compacto) y calcular PoP sobre body vacío
    const tokenJson = JSON.stringify(capabilityToken);
    const body = Buffer.alloc(0);
    const popSig = this._signPop('POST', '/acp/v1/verify', challenge, body);

    // Paso 3: POST con headers ACP
    return this._postWithAcpHeaders(
      '/acp/v1/verify',
      body,
      tokenJson,
      this._identity.agentId,
      challenge,
      popSig
    );
  }

  /**
   * GET /acp/v1/health — verificar disponibilidad del servidor.
   */
  async health(): Promise<Record<string, unknown>> {
    return this._getJson('/acp/v1/health');
  }

  // ─── Interno ─────────────────────────────────────────────────────────────────

  /**
   * Calcula la firma de Prueba de Posesión (ACP-HP-1.0 channel binding).
   *
   * signed_payload = Method + "|" + Path + "|" + Challenge + "|" + base64url(SHA-256(body))
   * sig = Ed25519(sk, SHA-256(signed_payload_bytes))
   *
   * Retorna firma codificada en base64url (sin padding).
   */
  private _signPop(
    method: string,
    path: string,
    challenge: string,
    body: Buffer
  ): string {
    const bodyHash = createHash('sha256').update(body).digest();
    const bodyHashB64 = bodyHash.toString('base64url');
    const signedPayload = `${method}|${path}|${challenge}|${bodyHashB64}`;
    const payloadHash = createHash('sha256')
      .update(Buffer.from(signedPayload, 'utf-8'))
      .digest();
    const sigBytes = this._signer.signBytes(payloadHash);
    return sigBytes.toString('base64url');
  }

  private async _getJson(path: string): Promise<Record<string, unknown>> {
    const url = `${this._server}${path}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeoutMs);
    try {
      const resp = await fetch(url, { method: 'GET', signal: controller.signal });
      if (!resp.ok) {
        throw new ACPError(`HTTP ${resp.status}`, resp.status);
      }
      return (await resp.json()) as Record<string, unknown>;
    } catch (err) {
      if (err instanceof ACPError) throw err;
      throw new ACPError(`Conexión fallida: ${(err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  private async _postJson(
    path: string,
    body: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const url = `${this._server}${path}`;
    const data = Buffer.from(JSON.stringify(body), 'utf-8');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeoutMs);
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        signal: controller.signal,
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({ error: resp.statusText })) as Record<string, unknown>;
        throw new ACPError(
          `HTTP ${resp.status}: ${String(errBody['error'] ?? resp.statusText)}`,
          resp.status
        );
      }
      return (await resp.json()) as Record<string, unknown>;
    } catch (err) {
      if (err instanceof ACPError) throw err;
      throw new ACPError(`Conexión fallida: ${(err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }

  private async _postWithAcpHeaders(
    path: string,
    body: Buffer,
    tokenJson: string,
    agentId: string,
    challenge: string,
    popSig: string
  ): Promise<Record<string, unknown>> {
    const url = `${this._server}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenJson}`,
      'X-ACP-Agent-ID': agentId,
      'X-ACP-Challenge': challenge,
      'X-ACP-Signature': popSig,
    };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this._timeoutMs);
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: body.length > 0 ? body : undefined,
        signal: controller.signal,
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({ error: resp.statusText })) as Record<string, unknown>;
        throw new ACPError(
          `HTTP ${resp.status}: ${String(errBody['error'] ?? resp.statusText)}`,
          resp.status
        );
      }
      return (await resp.json()) as Record<string, unknown>;
    } catch (err) {
      if (err instanceof ACPError) throw err;
      throw new ACPError(`Conexión fallida: ${(err as Error).message}`);
    } finally {
      clearTimeout(timer);
    }
  }
}
