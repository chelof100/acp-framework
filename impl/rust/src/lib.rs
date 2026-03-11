//! # ACP SDK para Rust
//!
//! SDK cliente del Protocolo de Control de Agentes (ACP) v1.0.
//!
//! ## Inicio Rápido
//!
//! ```rust,no_run
//! use acp_sdk::{AgentIdentity, ACPSigner, ACPClient};
//!
//! let agent = AgentIdentity::generate();
//! let signer = ACPSigner::new(&agent);
//! let client = ACPClient::new("http://localhost:8080", &agent, &signer);
//!
//! client.register().unwrap();
//! let health = client.health().unwrap();
//! println!("{}", health);
//! ```

pub mod error;
pub mod identity;
pub mod signer;
pub mod client;

pub use error::ACPError;
pub use identity::{AgentIdentity, derive_agent_id};
pub use signer::{ACPSigner, jcs_canonicalize};
pub use client::ACPClient;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
