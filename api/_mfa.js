// MFA challenge store. On a successful password check we mint a
// random 6-digit code, stash it in Redis keyed by an unguessable
// challenge_id (32 random bytes), send the code via Telegram, and
// return the challenge_id to the browser. The browser submits the
// code with the challenge_id — we verify, consume the record, and
// only THEN issue a session cookie.
//
// Invariants:
// - One-time use: successful verify deletes the record.
// - 5-minute TTL: enough for Telegram latency + typing, tight enough
//   to blunt replay of a code leaked to an attacker's clipboard.
// - Max 5 verify attempts per challenge — 6th wipes the record so
//   the attacker must restart from the password step.
// - Codes are cryptographically random (crypto.randomInt), zero-padded.
// - Codes are compared constant-time.
//
// Storage model: a Redis hash keyed by challenge_id. If Redis isn't
// available we fall back to an in-memory Map — fine for local
// `vercel dev` but won't survive lambda cold starts, which is an
// acceptable tradeoff for an infra-unavailable development setup.

import crypto from 'node:crypto';
import Redis from 'ioredis';

const KEY_PREFIX = 'bci:mfa:';
const TTL_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 5;

let client = null;
const memFallback = new Map();

function getClient() {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;
  client = new Redis(url, { maxRetriesPerRequest: 2, connectTimeout: 3000 });
  client.on('error', () => {});
  return client;
}

export function newChallengeId() {
  return crypto.randomBytes(32).toString('base64url');
}

export function newCode() {
  // crypto.randomInt guarantees no modulo bias vs Math.random().
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
}

function timingSafeCodeEqual(a, b) {
  const ab = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function storeChallenge(challenge_id, code) {
  const record = { code, attempts: 0, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS };
  const c = getClient();
  if (!c) {
    memFallback.set(challenge_id, record);
    setTimeout(() => memFallback.delete(challenge_id), TTL_SECONDS * 1000).unref?.();
    return;
  }
  await c.set(KEY_PREFIX + challenge_id, JSON.stringify(record), 'EX', TTL_SECONDS);
}

// Returns one of:
//   { ok: true }           — code matched; record consumed
//   { ok: false, error }   — 'expired' | 'too_many_attempts' | 'invalid_code'
export async function verifyChallenge(challenge_id, submittedCode) {
  if (!challenge_id || typeof challenge_id !== 'string') return { ok: false, error: 'invalid_code' };
  if (!submittedCode || typeof submittedCode !== 'string') return { ok: false, error: 'invalid_code' };

  const c = getClient();
  const key = KEY_PREFIX + challenge_id;

  if (!c) {
    const rec = memFallback.get(challenge_id);
    if (!rec) return { ok: false, error: 'expired' };
    if (rec.exp < Math.floor(Date.now() / 1000)) {
      memFallback.delete(challenge_id);
      return { ok: false, error: 'expired' };
    }
    rec.attempts += 1;
    if (rec.attempts > MAX_ATTEMPTS) {
      memFallback.delete(challenge_id);
      return { ok: false, error: 'too_many_attempts' };
    }
    if (!timingSafeCodeEqual(rec.code, submittedCode)) {
      return { ok: false, error: 'invalid_code' };
    }
    memFallback.delete(challenge_id);
    return { ok: true };
  }

  const raw = await c.get(key);
  if (!raw) return { ok: false, error: 'expired' };
  let rec;
  try { rec = JSON.parse(raw); } catch { return { ok: false, error: 'expired' }; }
  if (!rec || !rec.code) { await c.del(key); return { ok: false, error: 'expired' }; }

  const nextAttempts = (rec.attempts || 0) + 1;
  if (nextAttempts > MAX_ATTEMPTS) {
    await c.del(key);
    return { ok: false, error: 'too_many_attempts' };
  }
  if (!timingSafeCodeEqual(rec.code, submittedCode)) {
    // Persist the incremented attempt count with the remaining TTL.
    const ttl = Math.max(1, rec.exp - Math.floor(Date.now() / 1000));
    rec.attempts = nextAttempts;
    await c.set(key, JSON.stringify(rec), 'EX', ttl);
    return { ok: false, error: 'invalid_code' };
  }

  await c.del(key);
  return { ok: true };
}
