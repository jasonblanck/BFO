// WebAuthn / Passkey primitives.
//
// Storage model:
//   bci:passkey:creds          Redis hash · credentialID (base64url) → JSON(credential)
//   bci:passkey:challenge:<id> Redis key  · short-lived challenge for register/login
//
// Registration creates a `credential` record: { id, publicKey, counter,
// transports, linked_at, label }. Authentication looks up by the
// asserted credential id, verifies the assertion signature, increments
// the signature counter, and issues the normal session cookie.
//
// RP (relying party) config is read from the request host so this
// works on bfo-ten.vercel.app, custom domains, and localhost dev.

import crypto from 'node:crypto';
import Redis from 'ioredis';

const CRED_KEY = 'bci:passkey:creds';
const CHAL_PREFIX = 'bci:passkey:challenge:';
const CHAL_TTL_SEC = 5 * 60;

let client = null;
function getClient() {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;
  client = new Redis(url, { maxRetriesPerRequest: 2, connectTimeout: 3000 });
  client.on('error', () => {});
  return client;
}

// Strip the port, if any — WebAuthn RP ID must be just the hostname.
//
// Host pinning: when PUBLIC_HOSTNAME is set we prefer it over the
// request headers. WebAuthn's rpID is the security boundary that
// binds a credential to a specific origin; trusting x-forwarded-host
// unconditionally means an attacker who can inject that header
// (bypassing the Vercel edge, misconfigured proxy, direct lambda
// invocation) can register or authenticate a credential against a
// different RP and later use it from a phishing origin. Header
// fallback kept for local `vercel dev` where PUBLIC_HOSTNAME is
// typically unset.
export function rpInfo(req) {
  const pinned = (process.env.PUBLIC_HOSTNAME || '').trim();
  const host = pinned || String(req.headers?.['x-forwarded-host'] || req.headers?.host || '');
  const rpID = host.split(':')[0] || 'localhost';
  const proto = pinned ? 'https' : (req.headers?.['x-forwarded-proto'] || 'https');
  const origin = `${proto}://${host}`;
  return { rpID, rpName: 'Blanck Capital', origin };
}

export function newChallengeId() {
  return crypto.randomBytes(16).toString('base64url');
}

export async function storeChallenge(id, challenge, purpose) {
  const c = getClient();
  if (!c) return;
  await c.set(CHAL_PREFIX + id, JSON.stringify({ challenge, purpose }), 'EX', CHAL_TTL_SEC);
}

export async function consumeChallenge(id, purpose) {
  const c = getClient();
  if (!c) return null;
  try {
    const raw = await c.get(CHAL_PREFIX + id);
    if (!raw) return null;
    await c.del(CHAL_PREFIX + id);
    const rec = JSON.parse(raw);
    if (!rec || rec.purpose !== purpose) return null;
    return rec.challenge;
  } catch { return null; }
}

export async function listCredentials() {
  const c = getClient();
  if (!c) return [];
  try {
    const raw = await c.hgetall(CRED_KEY);
    if (!raw || typeof raw !== 'object') return [];
    return Object.values(raw).map(safeParse).filter(Boolean);
  } catch { return []; }
}

export async function getCredentialById(id) {
  const c = getClient();
  if (!c) return null;
  try {
    const raw = await c.hget(CRED_KEY, id);
    return raw ? safeParse(raw) : null;
  } catch { return null; }
}

export async function saveCredential(cred) {
  if (!cred?.id) throw new Error('credential_id_required');
  const c = getClient();
  if (!c) return;
  await c.hset(CRED_KEY, cred.id, JSON.stringify(cred));
}

export async function deleteCredential(id) {
  const c = getClient();
  if (!c) return;
  try { await c.hdel(CRED_KEY, id); } catch { /* noop */ }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
