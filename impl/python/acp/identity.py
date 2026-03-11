"""
acp.identity — Identidad Ed25519 del agente + derivación de AgentID (ACP-SIGN-1.0)

La identidad criptográfica de un agente consiste en:
  - Un par de claves Ed25519 (privada/pública)
  - Un AgentID derivado como SHA-256 de los bytes raw de la clave pública,
    codificado en base58 (sin prefijo)

Uso:
    from acp.identity import AgentIdentity

    # Generar una nueva identidad aleatoria
    agent = AgentIdentity.generate()
    print(agent.agent_id)   # "base58(SHA-256(pk))"
    print(agent.did)        # "did:key:z<base58btc-encoded>"

    # Cargar desde bytes de clave privada existente
    agent = AgentIdentity.from_private_bytes(private_key_bytes)

    # Exportar clave privada para almacenamiento
    private_bytes = agent.private_key_bytes  # 32 bytes raw
"""
from __future__ import annotations

import base64
import hashlib
from typing import Optional

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    PublicFormat,
    PrivateFormat,
    NoEncryption,
)

# prefijo multicodec para clave pública Ed25519: 0xed 0x01
_ED25519_MULTICODEC = bytes([0xED, 0x01])


def _base64url(data: bytes) -> str:
    """Codificación Base64url sin padding."""
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _base58_encode(data: bytes) -> str:
    """Codificación Base58btc (alfabeto Bitcoin)."""
    alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    n = int.from_bytes(data, "big")
    result = []
    while n:
        n, remainder = divmod(n, 58)
        result.append(alphabet[remainder])
    # Ceros al inicio
    for byte in data:
        if byte == 0:
            result.append(alphabet[0])
        else:
            break
    return "".join(reversed(result))


class AgentIdentity:
    """
    Identidad Ed25519 del agente (ACP-SIGN-1.0).

    Atributos:
        agent_id: Identificador ACP del agente (base58(SHA-256(pk)) según ACP-CT-1.0 §3)
        did:      Representación did:key de la clave pública
        public_key_bytes: Clave pública Ed25519 raw de 32 bytes
    """

    def __init__(self, private_key: Ed25519PrivateKey) -> None:
        self._private_key = private_key
        self._public_key: Ed25519PublicKey = private_key.public_key()
        # Clave pública raw de 32 bytes
        self._pubkey_raw: bytes = self._public_key.public_bytes(
            Encoding.Raw, PublicFormat.Raw
        )

    # ─── Constructores ─────────────────────────────────────────────────────────

    @classmethod
    def generate(cls) -> "AgentIdentity":
        """Genera una nueva identidad de agente Ed25519 aleatoria."""
        return cls(Ed25519PrivateKey.generate())

    @classmethod
    def from_private_bytes(cls, data: bytes) -> "AgentIdentity":
        """Carga desde clave privada raw de 32 bytes."""
        return cls(Ed25519PrivateKey.from_private_bytes(data))

    # ─── Propiedades ──────────────────────────────────────────────────────────

    @property
    def agent_id(self) -> str:
        """AgentID ACP: base58(SHA-256(clave pública raw)) según ACP-CT-1.0 §3."""
        digest = hashlib.sha256(self._pubkey_raw).digest()
        return _base58_encode(digest)

    @property
    def did(self) -> str:
        """Representación did:key (multicodec Ed25519 + base58btc)."""
        multicodec_bytes = _ED25519_MULTICODEC + self._pubkey_raw
        return f"did:key:z{_base58_encode(multicodec_bytes)}"

    @property
    def public_key_bytes(self) -> bytes:
        """Clave pública Ed25519 raw de 32 bytes."""
        return self._pubkey_raw

    @property
    def private_key_bytes(self) -> bytes:
        """Clave privada Ed25519 raw de 32 bytes (¡guardar de forma segura!)."""
        return self._private_key.private_bytes(
            Encoding.Raw, PrivateFormat.Raw, NoEncryption()
        )

    # ─── Firma ────────────────────────────────────────────────────────────────

    def sign(self, message: bytes) -> bytes:
        """Firma bytes arbitrarios. Retorna firma Ed25519 de 64 bytes."""
        return self._private_key.sign(message)

    def verify(self, signature: bytes, message: bytes) -> bool:
        """Verifica una firma. Retorna True si es válida, False en caso contrario."""
        try:
            self._public_key.verify(signature, message)
            return True
        except Exception:
            return False

    def __repr__(self) -> str:
        return f"AgentIdentity(agent_id={self.agent_id!r})"
