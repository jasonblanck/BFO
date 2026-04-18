// Shared auth primitives for the API layer.
//
// Architecture:
// - Login posts a password → we SHA-256 it and timing-safe-compare against
//   AUTH_PASSWORD_HASH env var (defaulting to the hash of "Harry" so the
//   site doesn't lock the owner out on first deploy before they rotate).
// - On success we sign a minimal payload { exp } with HMAC-SHA256 using
//   AUTH_SECRET and set it as an HttpOnly + Secure + SameSite=Lax cookie.
// - Every sensitive /api/plaid/* route calls requireAuth(req, res) as the
//   first line — it reads the cookie, verifies the HMAC, checks expiry,
//   and short-circuits with 401 if anything is off.
//
// Why not a JWT library? This is ~40 LoC of node:crypto with zero
// dependencies. HS256 is enough for a single-tenant session cookie.

import crypto from 'node:crypto';

const COOKIE_NAME   = 'bci-session';
const TTL_SECONDS   = 12 * 60 * 60; // 12 hours
// SHA-256("Harry") — matches what the client already ships.
// Override in env so rotating the password doesn't require a code change.
const DEFAULT_HASH  = 'a0fef9d66eaf1936fe23f42985d112491e98155b02071850720dc21e19546474';

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    // Fail closed — if no secret is configured we refuse to issue tokens
    // rather than sign with a predictable value.
    throw new Error('AUTH_SECRET missing or too short (≥16 chars required)');
  }
  return s;
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

async function sha256Hex(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function timingSafeStringEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function verifyPassword(password) {
  if (typeof password !== 'string' || !password) return false;
  const expected = (process.env.AUTH_PASSWORD_HASH || DEFAULT_HASH).toLowerCase().trim();
  const actual   = await sha256Hex(password);
  return timingSafeStringEqual(actual, expected);
}

export function sign(payload) {
  const body = b64url(JSON.stringify(payload));
  const sig  = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
  return `${body}.${sig}`;
}

export function verify(token) {
  // Never let verify() throw — always return null for an invalid
  // token. Callers (requireAuth) rely on this to map failure to a
  // clean 401 instead of crashing the handler with a 500 (which
  // would also hide the real reason).
  try {
    if (typeof token !== 'string' || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    if (!body || !sig) return null;
    const expected = b64url(crypto.createHmac('sha256', secret()).update(body).digest());
    if (!timingSafeStringEqual(sig, expected)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (_) {
    return null;
  }
}

export function issueSessionCookie() {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const token = sign({ exp, v: 1 });
  return [
    `${COOKIE_NAME}=${token}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${TTL_SECONDS}`,
  ].join('; ');
}

export function clearSessionCookie() {
  return [
    `${COOKIE_NAME}=`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Path=/',
    'Max-Age=0',
  ].join('; ');
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  String(header).split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

// Middleware used as the first line of each protected handler:
//   if (!requireAuth(req, res)) return;
// Returns the decoded payload on success, or null after writing a 401.
// Belt-and-suspenders: wrapped in try/catch so any unexpected header
// parsing quirk can't crash the handler — always responds with 401
// or a valid payload.
export function requireAuth(req, res) {
  try {
    const cookies = parseCookies(req.headers?.cookie);
    const token   = cookies[COOKIE_NAME];
    const payload = token ? verify(token) : null;
    if (!payload) {
      res.status(401).json({ error: 'unauthorized' });
      return null;
    }
    return payload;
  } catch (_) {
    res.status(401).json({ error: 'unauthorized' });
    return null;
  }
}

// --- Rate limiting ---------------------------------------------------------
// Very small token bucket keyed on IP + label. Backed by Redis when
// REDIS_URL is available; falls back to in-memory Map (ephemeral per
// lambda instance). Good enough for single-tenant brute-force defense.

import Redis from 'ioredis';
let rlClient = null;
const rlFallback = new Map();

function getRlClient() {
  if (rlClient) return rlClient;
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;
  rlClient = new Redis(url, { maxRetriesPerRequest: 2, connectTimeout: 3000 });
  rlClient.on('error', () => {});
  return rlClient;
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string') return fwd.split(',')[0].trim();
  if (Array.isArray(fwd)) return fwd[0];
  return req.socket?.remoteAddress || 'unknown';
}

// Returns { allowed: boolean, remaining: number }. On Redis failure it
// fails OPEN (allowed=true) — we'd rather serve legit traffic than lock
// the owner out on a transient infra blip.
export async function rateLimit({ key, limit, windowSec }) {
  const c = getRlClient();
  if (!c) {
    const now = Date.now();
    const bucket = rlFallback.get(key) || { count: 0, resetAt: now + windowSec * 1000 };
    if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + windowSec * 1000; }
    bucket.count += 1;
    rlFallback.set(key, bucket);
    return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
  }
  try {
    const v = await c.incr(key);
    if (v === 1) await c.expire(key, windowSec);
    return { allowed: v <= limit, remaining: Math.max(0, limit - v) };
  } catch (_) {
    return { allowed: true, remaining: limit };
  }
}

export async function resetRateLimit(key) {
  const c = getRlClient();
  if (!c) { rlFallback.delete(key); return; }
  try { await c.del(key); } catch (_) { /* noop */ }
}
