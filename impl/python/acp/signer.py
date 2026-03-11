"""
acp.signer — Canonicalización JCS + pipeline de firma Ed25519 (ACP-SIGN-1.0)

Pipeline de firma ACP:
  1. Canonicalizar el objeto capability usando JCS (RFC 8785)
  2. Calcular SHA-256 de los bytes canónicos
  3. Firmar el digest con Ed25519
  4. Embeber la firma como base64url en el campo plano "sig" del capability (ACP-CT-1.0)

Uso:
    from acp.identity import AgentIdentity
    from acp.signer import ACPSigner

    agent = AgentIdentity.generate()
    signer = ACPSigner(agent)

    capability = {
        "ver": "1.0",
        "iss": agent.did,
        "sub": agent.agent_id,
        "iat": 1700000000,
        "exp": 1700003600,
        "nonce": "nonce-aleatorio",
        "cap": ["acp:cap:financial.payment"],
        "resource": "org.example/accounts/ACC-001",
    }

    signed = signer.sign_capability(capability)
    # signed["sig"] contiene la firma Ed25519 en base64url (campo plano)

    # Verificar
    is_valid = ACPSigner.verify_capability(signed, agent.public_key_bytes)
"""
from __future__ import annotations

import base64
import copy
import hashlib
import json
from typing import Any, Dict

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

from .identity import AgentIdentity


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _base64url_decode(s: str) -> bytes:
    padding = "=" * (4 - len(s) % 4) if len(s) % 4 else ""
    return base64.urlsafe_b64decode(s + padding)


def _jcs_canonicalize(obj: Any) -> bytes:
    """
    JSON Canonicalization Scheme (RFC 8785).

    Produce bytes UTF-8 determinísticos:
    - Claves de objeto ordenadas lexicográficamente
    - Sin espacios
    - Escapes Unicode para caracteres de control
    """
    if obj is None:
        return b"null"
    if isinstance(obj, bool):
        return b"true" if obj else b"false"
    if isinstance(obj, int):
        return str(obj).encode()
    if isinstance(obj, float):
        # Usar representación JSON (sin ceros finales)
        return json.dumps(obj, separators=(",", ":")).encode()
    if isinstance(obj, str):
        return json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode()
    if isinstance(obj, (list, tuple)):
        items = b",".join(_jcs_canonicalize(v) for v in obj)
        return b"[" + items + b"]"
    if isinstance(obj, dict):
        # Ordenar claves lexicográficamente por puntos de código Unicode
        sorted_pairs = sorted(obj.items(), key=lambda kv: kv[0])
        items = b",".join(
            _jcs_canonicalize(k) + b":" + _jcs_canonicalize(v)
            for k, v in sorted_pairs
        )
        return b"{" + items + b"}"
    raise TypeError(f"No serializable a JSON: {type(obj)}")


class ACPSigner:
    """
    Pipeline de firma y verificación ACP (ACP-SIGN-1.0).

    Pipeline: JCS(capability) → SHA-256 → Ed25519.sign → base64url
    """

    def __init__(self, identity: AgentIdentity) -> None:
        self._identity = identity

    # ─── Firma ────────────────────────────────────────────────────────────────

    def sign_capability(self, capability: Dict[str, Any]) -> Dict[str, Any]:
        """
        Firma un objeto capability y embebe la firma en capability["sig"].

        El dict capability NO se modifica en lugar. Se retorna una copia con
        el campo "sig" agregado/reemplazado (campo plano según ACP-CT-1.0).

        La entrada de firma son los bytes JCS canónicos del capability SIN
        el campo "sig" (para que la firma no esté incluida en lo que se firma).
        """
        # Eliminar firma existente antes de firmar
        cap_to_sign = {k: v for k, v in capability.items() if k != "sig"}

        canonical = _jcs_canonicalize(cap_to_sign)
        digest = hashlib.sha256(canonical).digest()
        signature_bytes = self._identity.sign(digest)
        signature_b64 = _base64url_encode(signature_bytes)

        signed = copy.deepcopy(capability)
        signed["sig"] = signature_b64
        return signed

    def sign_bytes(self, data: bytes) -> bytes:
        """Firma bytes arbitrarios directamente (para desafíos PoP)."""
        return self._identity.sign(data)

    # ─── Verificación ─────────────────────────────────────────────────────────

    @staticmethod
    def verify_capability(
        capability: Dict[str, Any],
        public_key_bytes: bytes,
    ) -> bool:
        """
        Verifica un capability firmado contra una clave pública Ed25519 de 32 bytes.

        Retorna True si la firma es válida, False en caso contrario.
        Espera la firma en el campo plano "sig" (ACP-CT-1.0).
        """
        sig_b64 = capability.get("sig")
        if not sig_b64:
            return False

        # Reconstruir entrada de firma (capability sin "sig")
        cap_to_verify = {k: v for k, v in capability.items() if k != "sig"}

        try:
            canonical = _jcs_canonicalize(cap_to_verify)
            digest = hashlib.sha256(canonical).digest()
            signature_bytes = _base64url_decode(sig_b64)

            pub_key = Ed25519PublicKey.from_public_bytes(public_key_bytes)
            pub_key.verify(signature_bytes, digest)
            return True
        except Exception:
            return False

    @staticmethod
    def canonicalize(obj: Any) -> bytes:
        """Expone la canonicalización JCS para uso externo."""
        return _jcs_canonicalize(obj)
