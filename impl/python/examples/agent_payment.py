"""
Ejemplo: Agente de IA ejecutando un pago usando ACP (ACP-HP-1.0).

Demostración completa de extremo a extremo:
  1. Generar par de claves institucional (o cargar desde ACP_INSTITUTION_SEED)
  2. Generar identidad del agente
  3. Construir + firmar token de capacidad (institución firma, agente es sujeto)
  4. Registrar agente con el servidor ACP
  5. Ejecutar handshake PoP completo: desafío → firma → verificación via headers HTTP

Para probar con el servidor de referencia Go:
    cd acp-go && go build -o acp-server.exe ./cmd/acp-server

    # Ejecutar este script UNA VEZ con --print-pubkey para obtener la clave pública institucional:
    python examples/agent_payment.py --print-pubkey

    # Iniciar servidor con esa clave pública:
    ACP_INSTITUTION_PUBLIC_KEY=<salida_anterior> ./acp-server.exe

    # Ejecutar la demo completa:
    python examples/agent_payment.py

Variables de entorno:
    ACP_SERVER_URL        default: http://localhost:8080
    ACP_AGENT_SEED        hex(32 bytes) — identidad de agente determinística
    ACP_INSTITUTION_SEED  hex(32 bytes) — clave institucional determinística
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
import sys
import time

from acp.identity import AgentIdentity
from acp.signer import ACPSigner
from acp.client import ACPClient, ACPError


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _load_identity(env_var: str) -> AgentIdentity:
    """Carga identidad desde seed hex en <env_var>, o genera una nueva efímera."""
    seed_hex = os.getenv(env_var, "")
    if seed_hex:
        return AgentIdentity.from_private_bytes(bytes.fromhex(seed_hex))
    return AgentIdentity.generate()


def _build_payment_token(
    issuer: AgentIdentity,
    subject: AgentIdentity,
) -> dict:
    """
    Construye y firma un token de capacidad financial.payment.

    Los campos del token siguen exactamente el esquema ACP-CT-1.0 CapabilityToken:
      ver, iss, sub, cap, resource, iat, exp, nonce, sig

    En producción: el emisor institucional crea y firma los tokens.
    Esta demo usa una clave emisora local — debe coincidir con ACP_INSTITUTION_PUBLIC_KEY.
    """
    now = int(time.time())
    capability = {
        "ver": "1.0",
        "iss": issuer.did,
        "sub": subject.agent_id,           # debe coincidir con el header X-ACP-Agent-ID
        "cap": ["acp:cap:financial.payment"],
        "resource": "org.banco-soberano/accounts/ACC-001",
        "iat": now,
        "exp": now + 3600,
        "nonce": secrets.token_urlsafe(16),
    }
    signer = ACPSigner(issuer)
    return signer.sign_capability(capability)


# ─── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    # Modo --print-pubkey: solo imprimir la clave pública institucional y salir
    if "--print-pubkey" in sys.argv:
        institution = _load_identity("ACP_INSTITUTION_SEED")
        pubkey_b64 = base64.urlsafe_b64encode(
            institution.public_key_bytes
        ).rstrip(b"=").decode()
        print(pubkey_b64)
        return

    print("=== ACP Python SDK — Ejemplo de Pago con Agente (ACP-HP-1.0) ===\n")

    # Paso 1 — Identidades
    institution = _load_identity("ACP_INSTITUTION_SEED")
    if not os.getenv("ACP_INSTITUTION_SEED"):
        print("[INFO] ACP_INSTITUTION_SEED no configurado — generando clave institucional efímera")
        print("[INFO] Para probar con el servidor Go, ejecutar con --print-pubkey primero\n")

    agent = _load_identity("ACP_AGENT_SEED")
    if not os.getenv("ACP_AGENT_SEED"):
        print("[INFO] ACP_AGENT_SEED no configurado — generando identidad de agente efímera\n")

    agent_signer = ACPSigner(agent)

    pubkey_b64 = base64.urlsafe_b64encode(
        institution.public_key_bytes
    ).rstrip(b"=").decode()

    print(f"Clave pública institución : {pubkey_b64[:32]}...")
    print(f"Agent ID                  : {agent.agent_id}")
    print(f"Agent DID                 : {agent.did}")
    print(f"Clave pública agente      : {agent.public_key_bytes.hex()[:24]}...\n")

    # Paso 2 — Emitir + firmar token de capacidad (institución firma)
    token = _build_payment_token(institution, agent)
    print("Token de capacidad:")
    print(f"  sub      : {token['sub']}")
    print(f"  cap      : {token['cap']}")
    print(f"  resource : {token['resource']}")
    print(f"  exp      : {token['exp']} (ahora+1h)")
    print(f"  sig      : {token['sig'][:32]}...\n")

    # Paso 3 — Verificar firma localmente (sin servidor)
    is_valid = ACPSigner.verify_capability(token, institution.public_key_bytes)
    print(f"Firma local válida: {is_valid}\n")

    # Paso 4 — Conectar al servidor ACP
    server_url = os.getenv("ACP_SERVER_URL", "http://localhost:8080")
    client = ACPClient(server_url=server_url, identity=agent, signer=agent_signer)

    print(f"Conectando al servidor ACP: {server_url}")
    try:
        health = client.health()
        print(f"Estado del servidor: {health}\n")
    except ACPError as e:
        print(f"[Servidor no disponible — {e}]")
        print("Continuando con demo PoP sin conexión.\n")
        _show_offline_demo(agent, agent_signer)
        return

    # Paso 5 — Registrar agente
    print("Registrando agente...")
    try:
        reg = client.register()
        print(f"Registro: {reg}\n")
    except ACPError as e:
        print(f"Registro fallido (status={e.status_code}): {e}\n")
        return

    # Paso 6 — Verificación completa ACP-HP-1.0 (desafío → headers PoP → verify)
    print("Ejecutando flujo completo de verificación ACP-HP-1.0...")
    try:
        result = client.verify(capability_token=token)
        print(f"Respuesta completa: {json.dumps(result, indent=2)}")
    except ACPError as e:
        print(f"Error ACP (status={e.status_code}): {e}")


def _show_offline_demo(agent: AgentIdentity, signer: ACPSigner) -> None:
    """Muestra cómo se vería el payload PoP sin un servidor activo."""
    fake_challenge = base64.urlsafe_b64encode(b"demo-challenge-nonce").rstrip(b"=").decode()
    method, path = "POST", "/acp/v1/verify"
    body = b""
    body_hash = hashlib.sha256(body).digest()
    body_hash_b64 = base64.urlsafe_b64encode(body_hash).rstrip(b"=").decode()
    signed_payload = f"{method}|{path}|{fake_challenge}|{body_hash_b64}"
    payload_hash = hashlib.sha256(signed_payload.encode()).digest()
    sig_bytes = signer.sign_bytes(payload_hash)
    sig_b64 = base64.urlsafe_b64encode(sig_bytes).rstrip(b"=").decode()

    print("--- Demo PoP sin conexión (channel binding ACP-HP-1.0) ---")
    print(f"  signed_payload : {signed_payload}")
    print(f"  X-ACP-Signature: {sig_b64[:40]}...")
    print("\nPara ejecutar el flujo completo:")
    print("  1. Obtener clave pública institucional:")
    print("       python examples/agent_payment.py --print-pubkey")
    print("  2. Iniciar servidor Go:")
    print("       ACP_INSTITUTION_PUBLIC_KEY=<pubkey> ./acp-server.exe")
    print("  3. Ejecutar demo:")
    print("       python examples/agent_payment.py")


if __name__ == "__main__":
    main()
