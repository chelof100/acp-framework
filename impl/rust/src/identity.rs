//! Identidad de Agente ACP — par de claves Ed25519, AgentID (base58), DID (did:key)
//!
//! Implementa las primitivas de identidad ACP-SIGN-1.0 §3.

use ed25519_dalek::{SigningKey, VerifyingKey, Signature, Signer, Verifier};
use rand::rngs::OsRng;
use sha2::{Sha256, Digest};

/// Identidad de agente Ed25519.
///
/// AgentID  = base58(SHA-256(clave pública raw de 32 bytes))
/// DID      = "did:key:z" + base58(0xed 0x01 || clave pública)
#[derive(Clone)]
pub struct AgentIdentity {
    signing_key: SigningKey,
}

impl AgentIdentity {
    /// Genera un nuevo par de claves Ed25519 aleatorio.
    pub fn generate() -> Self {
        let signing_key = SigningKey::generate(&mut OsRng);
        Self { signing_key }
    }

    /// Reconstruye la identidad a partir de 32 bytes raw de clave privada.
    pub fn from_private_bytes(bytes: &[u8; 32]) -> Self {
        let signing_key = SigningKey::from_bytes(bytes);
        Self { signing_key }
    }

    /// Clave privada raw de 32 bytes.
    pub fn private_key_bytes(&self) -> [u8; 32] {
        self.signing_key.to_bytes()
    }

    /// Clave pública raw de 32 bytes.
    pub fn public_key_bytes(&self) -> [u8; 32] {
        self.signing_key.verifying_key().to_bytes()
    }

    /// Clave pública en hexadecimal minúscula (para el registro).
    pub fn public_key_hex(&self) -> String {
        hex::encode(self.public_key_bytes())
    }

    /// AgentID = base58btc(SHA-256(clave pública raw)).
    pub fn agent_id(&self) -> String {
        derive_agent_id(&self.public_key_bytes())
    }

    /// DID = "did:key:z" + base58btc(0xed01 || clave pública raw).
    pub fn did(&self) -> String {
        let pubkey = self.public_key_bytes();
        let mut multicodec = vec![0xed_u8, 0x01];
        multicodec.extend_from_slice(&pubkey);
        format!("did:key:z{}", bs58::encode(&multicodec).into_string())
    }

    /// Firma bytes arbitrarios. Devuelve una firma Ed25519 de 64 bytes.
    pub fn sign(&self, message: &[u8]) -> Signature {
        self.signing_key.sign(message)
    }

    /// Verifica una firma contra la clave pública de esta identidad.
    pub fn verify(&self, message: &[u8], signature: &Signature) -> bool {
        self.signing_key.verifying_key().verify(message, signature).is_ok()
    }

    /// Accede a la clave de verificación interna.
    pub fn verifying_key(&self) -> VerifyingKey {
        self.signing_key.verifying_key()
    }
}

/// Deriva el AgentID a partir de los bytes raw de la clave pública (32 bytes).
/// AgentID = base58btc(SHA-256(clave pública))
pub fn derive_agent_id(public_key_bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(public_key_bytes);
    let hash = hasher.finalize();
    bs58::encode(hash).into_string()
}

impl std::fmt::Debug for AgentIdentity {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AgentIdentity")
            .field("agent_id", &self.agent_id())
            .field("did", &self.did())
            .finish()
    }
}
