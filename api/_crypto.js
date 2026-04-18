// Envelope encryption for Plaid access tokens at rest.
//
// Blast-radius reasoning: if `REDIS_URL` or the Upstash infra is ever
// compromised, plaintext access_tokens in the vault = attacker can hit
// Plaid directly as us. Wrapping them with AES-256-GCM keyed on
// VAULT_KEY (held only by the serverless runtime) means a Redis
// dump alone is useless.
//
// Format on-disk:  <iv>.<authTag>.<ciphertext>   — all base64url.
// Algorithm: AES-256-GCM, 96-bit random IV per record, 128-bit tag.
//
// Key provisioning: set VAULT_KEY in Vercel env. Accepts either
//   - 64 hex chars (32 bytes), or
//   - 44 base64 chars that decode to exactly 32 bytes.
// Generate with:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';

function key() {
  const k = process.env.VAULT_KEY;
  if (!k) throw new Error('VAULT_KEY missing');
  const trimmed = String(k).trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return Buffer.from(trimmed, 'hex');
  const buf = Buffer.from(trimmed, 'base64');
  if (buf.length !== 32) throw new Error('VAULT_KEY must decode to 32 bytes (AES-256)');
  return buf;
}

export function encrypt(plaintext) {
  if (plaintext == null) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key(), iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString('base64url'),
    tag.toString('base64url'),
    enc.toString('base64url'),
  ].join('.');
}

export function decrypt(ciphertext) {
  if (typeof ciphertext !== 'string' || !ciphertext.includes('.')) return null;
  const parts = ciphertext.split('.');
  if (parts.length !== 3) return null;
  try {
    const iv  = Buffer.from(parts[0], 'base64url');
    const tag = Buffer.from(parts[1], 'base64url');
    const ct  = Buffer.from(parts[2], 'base64url');
    const decipher = crypto.createDecipheriv(ALGO, key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  } catch (_) {
    // Wrong key, tampered ciphertext, or pre-encryption legacy value.
    return null;
  }
}

// Cheap detection for records we haven't encrypted yet — lets the vault
// read legacy plaintext tokens transparently during the rollout window
// and rewrite them as encrypted on the next write.
export function looksEncrypted(value) {
  return typeof value === 'string' && value.split('.').length === 3 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
}
