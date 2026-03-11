//! Tipos de error del SDK ACP.

use thiserror::Error;

/// Errores del SDK ACP.
#[derive(Debug, Error)]
pub enum ACPError {
    #[error("Error HTTP {status}: {body}")]
    Http { status: u16, body: String },

    #[error("Error de red: {0}")]
    Network(String),

    #[error("Entrada inválida: {0}")]
    InvalidInput(String),

    #[error("Campo de firma ausente en la capacidad")]
    MissingSignature,

    #[error("Error criptográfico: {0}")]
    CryptoError(String),

    #[error("Error JSON: {0}")]
    Json(#[from] serde_json::Error),

    #[error("El servidor devolvió una respuesta inesperada: {0}")]
    UnexpectedResponse(String),
}

impl ACPError {
    /// Devuelve el código de estado HTTP si este es un error HTTP.
    pub fn status_code(&self) -> Option<u16> {
        match self {
            ACPError::Http { status, .. } => Some(*status),
            _ => None,
        }
    }
}
