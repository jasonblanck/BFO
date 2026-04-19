// MFA backup codes. Purpose: if Telegram is unreachable (lost phone,
// no signal, bot revoked), the owner can still sign in using one of a
// small set of pre-generated single-use codes.
//
// Storage: each code is SHA-256 hashed before persistence. Redis set
// `bci:backup:codes:active` holds active-code hashes. On verify we
// check membership, and on match we SREM to consume. A code can only
// be used once.
//
// Generation: 10 codes per rotation, 10 chars base32-alphabet (easy to
// read aloud, no ambiguous 0/O/1/I). Total entropy ≈ 50 bits per code.
// Regenerating wipes the old set — always replace all at once.

import crypto from 'node:crypto';
import Redis from 'ioredis';

const SET_KEY = 'bci:backup:codes:active';
const CODE_LEN = 10;
const NUM_CODES = 10;
// Unambiguous base32 — no O/0, no I/1, no U (too easy to mistype as V).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTVWXYZ23456789';

let client = null;
function getClient() {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;
  client = new Redis(url, { maxRetriesPerRequest: 2, connectTimeout: 3000 });
  client.on('error', () => {});
  return client;
}

function hash(code) {
  return crypto.createHash('sha256').update(String(code).toUpperCase()).digest('hex');
}

function randomCode() {
  const bytes = crypto.randomBytes(CODE_LEN);
  let out = '';
  for (let i = 0; i < CODE_LEN; i += 1) out += ALPHABET[bytes[i] % ALPHABET.length];
  // Insert a hyphen halfway through for readability.
  return out.slice(0, 5) + '-' + out.slice(5);
}

// Regenerate — wipes old set, returns the plaintext codes ONCE so the
// caller (the API route) can surface them to the browser. The server
// never stores plaintext.
export async function regenerate() {
  const c = getClient();
  const plaintext = Array.from({ length: NUM_CODES }, randomCode);
  const hashes   = plaintext.map(hash);
  if (!c) return plaintext; // in-memory fallback can't persist — best effort
  await c.del(SET_KEY);
  await c.sadd(SET_KEY, ...hashes);
  return plaintext;
}

export async function remainingCount() {
  const c = getClient();
  if (!c) return 0;
  try { return await c.scard(SET_KEY); } catch { return 0; }
}

// Try to consume one backup code. Case-insensitive, hyphen-tolerant.
// Returns true iff the code was active (and is now removed).
export async function consume(code) {
  if (typeof code !== 'string') return false;
  // Normalize: uppercase + strip anything that isn't alphanumeric,
  // then re-insert the hyphen so it matches what we stored.
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length !== CODE_LEN) return false;
  const normalized = clean.slice(0, 5) + '-' + clean.slice(5);
  const c = getClient();
  if (!c) return false;
  try {
    const removed = await c.srem(SET_KEY, hash(normalized));
    return removed === 1;
  } catch {
    return false;
  }
}
