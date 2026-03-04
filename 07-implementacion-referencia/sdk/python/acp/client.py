"""
acp.client — Cliente HTTP ACP con handshake PoP automático (ACP-HP-1.0)

El ACPClient maneja el flujo completo de autorización ACP:
  1. POST /acp/v1/register → registrar clave pública del agente (una vez por agente)
  2. GET  /acp/v1/challenge → recibir nonce de un solo uso
  3. Firmar PoP: Method|Path|Challenge|base64url(SHA-256(body)) → Ed25519
  4. POST /acp/v1/verify   → enviar token + PoP via headers HTTP, recibir decisión

Headers HTTP usados por verify():
  Authorization:   Bearer <capability_token_json>
  X-ACP-Agent-ID:  <agent_id>
  X-ACP-Challenge: <challenge>
  X-ACP-Signature: <pop_signature>

Uso:
    from acp.identity import AgentIdentity
    from acp.signer import ACPSigner
    from acp.client import ACPClient

    agent = AgentIdentity.generate()
    signer = ACPSigner(agent)
    client = ACPClient(
        server_url="http://localhost:8080",
        identity=agent,
        signer=signer,
    )

    # Registrar agente con el servidor (una vez)
    client.register()

    # Verificar un token de capacidad
    result = client.verify(capability_token=signed_token)
    print(result)  # {"ok": true, "agent_id": "...", "capabilities": [...]}
"""
from __future__ import annotations

import base64
import hashlib
import time
from typing import Any, Dict, Optional
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import json

from .identity import AgentIdentity
from .signer import ACPSigner


class ACPError(Exception):
    """Lanzado cuando el servidor ACP retorna un error o la solicitud falla."""

    def __init__(self, message: str, status_code: Optional[int] = None) -> None:
        super().__init__(message)
        self.status_code = status_code


def _post_json(url: str, body: Dict[str, Any], timeout: int = 10) -> Dict[str, Any]:
    """POST HTTP mínimo con body JSON, sin dependencias externas."""
    data = json.dumps(body).encode("utf-8")
    req = Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        with urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        body_bytes = e.read()
        try:
            err = json.loads(body_bytes)
        except Exception:
            err = {"error": body_bytes.decode("utf-8", errors="replace")}
        raise ACPError(
            f"HTTP {e.code}: {err.get('error', str(err))}", status_code=e.code
        ) from e
    except URLError as e:
        raise ACPError(f"Conexión fallida: {e.reason}") from e


def _get_json(url: str, timeout: int = 10) -> Dict[str, Any]:
    """GET HTTP mínimo que retorna JSON parseado."""
    req = Request(url)
    try:
        with urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except HTTPError as e:
        raise ACPError(f"HTTP {e.code}", status_code=e.code) from e
    except URLError as e:
        raise ACPError(f"Conexión fallida: {e.reason}") from e


class ACPClient:
    """
    Cliente HTTP ACP que implementa el handshake Challenge/PoP (ACP-HP-1.0).

    El cliente no mantiene estado entre llamadas. Cada llamada a `verify()` realiza
    una nueva solicitud de desafío para prevenir ataques de replay.
    """

    def __init__(
        self,
        server_url: str,
        identity: AgentIdentity,
        signer: ACPSigner,
        timeout: int = 10,
    ) -> None:
        """
        Args:
            server_url: URL base del validador ACP (ej. "http://localhost:8080")
            identity:   Identidad del agente (par de claves Ed25519)
            signer:     Instancia de ACPSigner para producir firmas PoP
            timeout:    Timeout HTTP en segundos
        """
        self._server = server_url.rstrip("/")
        self._identity = identity
        self._signer = signer
        self._timeout = timeout

    # ─── API Pública ──────────────────────────────────────────────────────────

    def register(self) -> Dict[str, Any]:
        """
        Registra la clave pública de este agente con el servidor ACP.

        POST /acp/v1/register
        Body: {"agent_id": "<agent_id>", "public_key_hex": "<base64url(pubkey)>"}

        Debe llamarse una vez antes de verify(). En producción este endpoint
        está restringido a administradores institucionales.
        """
        pubkey_b64 = base64.urlsafe_b64encode(
            self._identity.public_key_bytes
        ).rstrip(b"=").decode()
        return _post_json(
            f"{self._server}/acp/v1/register",
            {"agent_id": self._identity.agent_id, "public_key_hex": pubkey_b64},
            timeout=self._timeout,
        )

    def verify(
        self,
        capability_token: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Flujo completo de verificación ACP (ACP-HP-1.0):
          1. GET /acp/v1/challenge  → nonce de un solo uso
          2. Calcular PoP: Method|Path|Challenge|base64url(SHA-256(body))
          3. POST /acp/v1/verify via headers HTTP (Authorization + X-ACP-*)

        Args:
            capability_token: Dict de token de capacidad firmado (de ACPSigner).

        Returns:
            {"ok": true, "agent_id": "...", "capabilities": [...], ...}

        Raises:
            ACPError en caso de error HTTP o de conexión.
        """
        # Paso 1: Obtener desafío
        challenge_resp = self._get_challenge()
        challenge = challenge_resp["challenge"]

        # Paso 2: Serializar token y calcular PoP sobre body vacío
        token_json = json.dumps(capability_token, separators=(",", ":"))
        body = b""
        pop_sig = self._sign_pop("POST", "/acp/v1/verify", challenge, body)

        # Paso 3: POST con headers ACP
        return self._post_with_acp_headers(
            f"{self._server}/acp/v1/verify",
            body=body,
            token_json=token_json,
            agent_id=self._identity.agent_id,
            challenge=challenge,
            pop_sig=pop_sig,
        )

    def health(self) -> Dict[str, Any]:
        """GET /acp/v1/health — verificar disponibilidad del servidor."""
        return _get_json(f"{self._server}/acp/v1/health", timeout=self._timeout)

    # ─── Interno ──────────────────────────────────────────────────────────────

    def _get_challenge(self) -> Dict[str, Any]:
        """Obtiene un nonce de desafío de 128 bits de un solo uso (ACP-HP-1.0 §2)."""
        return _get_json(
            f"{self._server}/acp/v1/challenge", timeout=self._timeout
        )

    def _sign_pop(
        self, method: str, path: str, challenge: str, body: bytes
    ) -> str:
        """
        Calcula la firma de Prueba de Posesión (ACP-HP-1.0 channel binding).

        signed_payload = Method + "|" + Path + "|" + Challenge + "|" + base64url(SHA-256(body))
        sig = Ed25519(sk, SHA-256(signed_payload_bytes))

        Retorna firma codificada en base64url (sin padding).
        """
        body_hash = hashlib.sha256(body).digest()
        body_hash_b64 = base64.urlsafe_b64encode(body_hash).rstrip(b"=").decode()
        signed_payload = f"{method}|{path}|{challenge}|{body_hash_b64}"
        payload_hash = hashlib.sha256(signed_payload.encode("utf-8")).digest()
        sig_bytes = self._signer.sign_bytes(payload_hash)
        return base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()

    def _post_with_acp_headers(
        self,
        url: str,
        body: bytes,
        token_json: str,
        agent_id: str,
        challenge: str,
        pop_sig: str,
    ) -> Dict[str, Any]:
        """POST con headers de autenticación ACP."""
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token_json}",
            "X-ACP-Agent-ID": agent_id,
            "X-ACP-Challenge": challenge,
            "X-ACP-Signature": pop_sig,
        }
        req = Request(url, data=body, headers=headers)
        try:
            with urlopen(req, timeout=self._timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except HTTPError as e:
            body_bytes = e.read()
            try:
                err = json.loads(body_bytes)
            except Exception:
                err = {"error": body_bytes.decode("utf-8", errors="replace")}
            raise ACPError(
                f"HTTP {e.code}: {err.get('error', str(err))}", status_code=e.code
            ) from e
        except URLError as e:
            raise ACPError(f"Conexión fallida: {e.reason}") from e
