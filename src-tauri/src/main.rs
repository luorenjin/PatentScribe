// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use sha2::{Sha256, Digest};
use rsa::{RsaPublicKey, Pkcs1v15Sign, pkcs8::DecodePublicKey};
use base64::{Engine as _, engine::general_purpose};
use serde::Deserialize;

const PUBLIC_KEY_PEM_FALLBACK: &str = "-----BEGIN PUBLIC KEY-----\n\
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAn/0l9KEauCpQ9vk1nU0r\n\
5jrTtUxyREvTbdq0rs5vQRDVsBKNwwCP1LlmQnpYneBBvICLx/QqJK5Cvvbfzb4b\n\
0YUDit0CHvQc9NspbSY/FJ8dTREFiob8eknD7IopgCXRXu5FZkUXi58RhaVeE7dl\n\
qncpeKAVcScUlQMRDavxZOBMty+mvK8uk2RTiJifdJkqCkh84u8c4XYI7F+y9+jo\n\
bIACmA3cFTc7ameucwL3/SG1ngJmaAVq7t5jAtpW8rzGjBciXQrYl+dr8/dN/LMX\n\
QWtXhM/wVJQk2DLSg1puXfT/dMM85fqbX6jITOT9gBbYjZzVzwNL8MoTZAbmCYvS\n\
YQIDAQAB\n\
-----END PUBLIC KEY-----";

#[derive(Deserialize)]
struct LicenseEnvelope {
  data: String,
  signature: String,
}

#[derive(Deserialize)]
struct LicenseContent {
  #[serde(rename = "machineCode")]
  machine_code: String,
  #[allow(dead_code)]
  #[serde(rename = "expiryDate")]
  expiry_date: String,
}

#[tauri::command]
fn get_machine_code() -> String {
  let uid = machine_uid::get().unwrap_or_else(|_| "DEVICE-UID-FALLBACK".to_string());
  let mut hasher = Sha256::new();
  hasher.update(uid.as_bytes());
  let hash = hasher.finalize();
  let hex_hash = hex::encode_upper(hash);
  
  let short = &hex_hash[..16];
  format!("{}-{}-{}-{}", &short[0..4], &short[4..8], &short[8..12], &short[12..16])
}

#[tauri::command]
fn verify_license(license_data: String, machine_code: String) -> bool {
  if license_data.is_empty() { return false; }

  // 1. Decode Envelope
  let envelope_bytes = match general_purpose::STANDARD.decode(license_data.trim()) {
    Ok(b) => b,
    Err(_) => return false,
  };

  let envelope: LicenseEnvelope = match serde_json::from_slice(&envelope_bytes) {
    Ok(e) => e,
    Err(_) => return false,
  };

  // 2. Load Public Key from Env or Fallback
  let pub_key_pem = std::env::var("LICENSE_PUBLIC_KEY")
    .unwrap_or_else(|_| PUBLIC_KEY_PEM_FALLBACK.to_string())
    .replace("\\n", "\n"); // Handle escaped newlines in .env

  let pub_key = match RsaPublicKey::from_public_key_pem(&pub_key_pem) {
    Ok(k) => k,
    Err(_) => return false,
  };

  // 3. Verify Signature
  let sig_bytes = match general_purpose::STANDARD.decode(&envelope.signature) {
    Ok(b) => b,
    Err(_) => return false,
  };

  let mut hasher = Sha256::new();
  hasher.update(envelope.data.as_bytes());
  let hashed = hasher.finalize();

  if pub_key.verify(Pkcs1v15Sign::new::<Sha256>(), &hashed, &sig_bytes).is_err() {
    return false;
  }

  // 4. Check Content
  let content: LicenseContent = match serde_json::from_str(&envelope.data) {
    Ok(c) => c,
    Err(_) => return false,
  };

  content.machine_code == machine_code
}

fn main() {
  // Load environment variables from .env file
  dotenvy::dotenv().ok();

  tauri::Builder::default()
    .plugin(tauri_plugin_sql::Builder::default().build())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![get_machine_code, verify_license])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
