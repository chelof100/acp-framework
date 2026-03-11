//! Firmante de Capacidades ACP — canonicalización JCS (RFC 8785) + firma Ed25519
//!
//! Implementa el pipeline de firma ACP-SIGN-1.0:
//!   JCS(capacidad sin "sig") → SHA-256 → Ed25519.sign → base64url

use ed25519_dalek::{VerifyingKey, Signature, Verifier};
use serde_json::Value;
use sha2::{Sha256, Digest};
use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine};
use crate::identity::AgentIdentity;
use crate::error::ACPError;

/// Firmante de capacidades ACP.
pub struct ACPSigner<'a> {
    identity: &'a AgentIdentity,
}

impl<'a> ACPSigner<'a> {
    /// Crea un firmante vinculado a la identidad dada.
    pub fn new(identity: &'a AgentIdentity) -> Self {
        Self { identity }
    }

    /// Firma un token de capacidad (objeto JSON).
    ///
    /// 1. Elimina cualquier campo "sig" existente
    /// 2. Canonicaliza los campos restantes con JCS
    /// 3. Aplica SHA-256 a los bytes canónicos
    /// 4. Firma el hash con Ed25519
    /// 5. Devuelve el objeto con "sig" = base64url(firma)
    pub fn sign_capability(&self, capability: &Value) -> Result<Value, ACPError> {
        let obj = capability.as_object()
            .ok_or_else(|| ACPError::InvalidInput("la capacidad debe ser un objeto JSON".into()))?;

        // Elimina el campo "sig"
        let mut without_sig: serde_json::Map<String, Value> = obj.clone();
        without_sig.remove("sig");
        let stripped = Value::Object(without_sig);

        // Canonicalización JCS
        let canonical = jcs_canonicalize(&stripped)?;

        // SHA-256
        let mut hasher = Sha256::new();
        hasher.update(&canonical);
        let digest = hasher.finalize();

        // Firma Ed25519
        let sig = self.identity.sign(&digest);
        let sig_b64 = URL_SAFE_NO_PAD.encode(sig.to_bytes());

        // Reconstruye con sig
        let mut result = obj.clone();
        result.insert("sig".to_string(), Value::String(sig_b64));
        Ok(Value::Object(result))
    }

    /// Firma bytes raw. Devuelve base64url(Ed25519(SHA-256(datos))).
    pub fn sign_bytes(&self, data: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(data);
        let digest = hasher.finalize();
        let sig = self.identity.sign(&digest);
        URL_SAFE_NO_PAD.encode(sig.to_bytes())
    }

    /// Firma bytes raw sin hashear primero (para PoP donde se hace el hash manualmente).
    pub(crate) fn sign_raw(&self, message: &[u8]) -> Signature {
        self.identity.sign(message)
    }

    /// Verifica una capacidad firmada.
    ///
    /// 1. Extrae el campo "sig" (base64url)
    /// 2. Elimina "sig" → JCS → SHA-256
    /// 3. Verifica con Ed25519 usando los bytes de clave pública provistos
    pub fn verify_capability(capability: &Value, public_key_bytes: &[u8; 32]) -> Result<bool, ACPError> {
        let obj = capability.as_object()
            .ok_or_else(|| ACPError::InvalidInput("la capacidad debe ser un objeto JSON".into()))?;

        let sig_b64 = obj.get("sig")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ACPError::MissingSignature)?;

        let sig_bytes = URL_SAFE_NO_PAD.decode(sig_b64)
            .map_err(|e| ACPError::InvalidInput(format!("firma base64url inválida: {e}")))?;

        let sig_array: [u8; 64] = sig_bytes.try_into()
            .map_err(|_| ACPError::InvalidInput("la firma debe tener 64 bytes".into()))?;
        let signature = Signature::from_bytes(&sig_array);

        // Elimina sig y canonicaliza
        let mut without_sig = obj.clone();
        without_sig.remove("sig");
        let stripped = Value::Object(without_sig);
        let canonical = jcs_canonicalize(&stripped)?;

        // SHA-256
        let mut hasher = Sha256::new();
        hasher.update(&canonical);
        let digest = hasher.finalize();

        // Verificación
        let verifying_key = VerifyingKey::from_bytes(public_key_bytes)
            .map_err(|e| ACPError::CryptoError(e.to_string()))?;

        Ok(verifying_key.verify(&digest, &signature).is_ok())
    }

    /// Canonicaliza un valor JSON con JCS. Expuesto públicamente para uso avanzado.
    pub fn canonicalize(value: &Value) -> Result<Vec<u8>, ACPError> {
        jcs_canonicalize(value)
    }
}

/// Canonicalización JCS (RFC 8785).
///
/// Reglas:
/// - Claves de objeto ordenadas lexicográficamente (unidades de código UTF-16)
/// - Sin espacios en blanco
/// - Strings: escapado JSON estándar
/// - Números: sin ceros finales en fracciones, sin exponente si es evitable
/// - null, true, false: literales en minúscula
pub fn jcs_canonicalize(value: &Value) -> Result<Vec<u8>, ACPError> {
    let s = jcs_str(value);
    Ok(s.into_bytes())
}

fn jcs_str(value: &Value) -> String {
    match value {
        Value::Null => "null".to_string(),
        Value::Bool(b) => b.to_string(),
        Value::Number(n) => n.to_string(),
        Value::String(s) => {
            // serde_json maneja el escapado correcto de strings JSON
            serde_json::to_string(s).unwrap_or_else(|_| "\"\"".to_string())
        }
        Value::Array(arr) => {
            let items: Vec<String> = arr.iter().map(jcs_str).collect();
            format!("[{}]", items.join(","))
        }
        Value::Object(map) => {
            // Ordena las claves lexicográficamente
            let mut keys: Vec<&String> = map.keys().collect();
            keys.sort();
            let entries: Vec<String> = keys
                .iter()
                .map(|k| {
                    let key_json = serde_json::to_string(*k).unwrap_or_else(|_| "\"\"".to_string());
                    let val_json = jcs_str(&map[*k]);
                    format!("{}:{}", key_json, val_json)
                })
                .collect();
            format!("{{{}}}", entries.join(","))
        }
    }
}
