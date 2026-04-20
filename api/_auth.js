// Shared auth primitives for the API layer.
//
// Architecture:
// - Login posts a password → verifyPassword() checks it against
//   AUTH_PASSWORD_HASH. The env var can be either:
//     (a) scrypt$N$r$p$saltB64$hashB64  — preferred
//     (b) 64 hex chars (legacy SHA-256) — accepted with a deprecation
//         warning so existing deploys keep working during rotation
//   Failing closed: if AUTH_PASSWORD_HASH is unset or malformed,
//   verifyPassword returns false. No "default password" exists.
// - On success we sign a minimal payload { exp } with HMAC-SHA256 using
//   AUTH_SECRET and set it as an HttpOnly + Secure + SameSite=Lax cookie.
// - Every sensitive /api/plaid/* route calls requireAuth(req, res) as the
//   first line — it reads the cookie, verifies the HMAC, checks expiry,
//   and short-circuits with 401 if anything is off.
//
// To generate a new scrypt hash locally:
//   node -e "const c=require('crypto'),p=process.argv[1],s=c.randomBytes(16);c.scrypt(p,s,32,{N:16384,r:8,p:1},(e,h)=>console.log('scrypt\$16384\$8\$1\$'+s.toString('base64')+'\$'+h.toString('base64')))" 'YourPassword'
// Paste the output into AUTH_PASSWORD_HASH in Vercel, redeploy.
//
// Why not a JWT library? This is ~40 LoC of node:crypto with zero
// dependencies. HS256 is enough for a single-tenant session cookie.

import crypto from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(crypto.scrypt);

const COOKIE_NAME   = 'bci-session';
// Short TTL + sliding refresh: 1h window, auto-extended on every
// authenticated request. Active users never see a logout, idle
// sessions expire fast — shrinks the usable window of a stolen cookie
// from 12h → 1h after last use.
const TTL_SECONDS   = 60 * 60;

// scrypt cost parameters. N=16384 is ~50 ms on a modern x86 lambda —
// slow enough to break offline GPU cracking, fast enough that login
// latency isn't noticeable. r=8, p=1 are Colin Percival's defaults.
const SCRYPT_N    = 16384;
const SCRYPT_R    = 8;
const SCRYPT_P    = 1;
const SCRYPT_KEY  = 32;
const SCRYPT_SALT = 16;

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

// Generate a new scrypt-formatted hash. Exported so ops can compute
// the value from a Node one-liner and paste into AUTH_PASSWORD_HASH.
// Format: scrypt$N$r$p$saltB64$hashB64
export async function hashPassword(password) {
  if (typeof password !== 'string' || !password) {
    throw new Error('password required');
  }
  const salt = crypto.randomBytes(SCRYPT_SALT);
  const hash = await scryptAsync(password, salt, SCRYPT_KEY,
    { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P });
  return [
    'scrypt',
    SCRYPT_N, SCRYPT_R, SCRYPT_P,
    salt.toString('base64'),
    hash.toString('base64'),
  ].join('$');
}

async function verifyScrypt(password, stored) {
  // Format: scrypt$N$r$p$saltB64$hashB64
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;
  // Clamp to sane bounds so a malformed env var can't DoS the lambda by
  // requesting N=2^30. Real params should fall well inside these.
  if (N > 65536 || r > 16 || p > 4) return false;
  let salt, expected;
  try {
    salt     = Buffer.from(parts[4], 'base64');
    expected = Buffer.from(parts[5], 'base64');
  } catch { return false; }
  if (expected.length < 16) return false;
  let actual;
  try {
    actual = await scryptAsync(password, salt, expected.length, { N, r, p });
  } catch { return false; }
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// Warn once per cold start when legacy SHA-256 is in use. Upgrading to
// scrypt is a one-line env-var change (see doc block at top of file).
let _legacyWarned = false;
function warnLegacyOnce() {
  if (_legacyWarned) return;
  _legacyWarned = true;
  console.warn('auth · AUTH_PASSWORD_HASH is legacy SHA-256; rotate to scrypt (see api/_auth.js header comment)');
}

export async function verifyPassword(password) {
  if (typeof password !== 'string' || !password) return false;
  const stored = (process.env.AUTH_PASSWORD_HASH || '').trim();
  // Fail closed on missing or obviously unusable config — no "default
  // password" fallback and no magic debug bypass.
  if (!stored) return false;

  if (stored.startsWith('scrypt$')) {
    return verifyScrypt(password, stored);
  }
  // Legacy path: unsalted SHA-256 hex. Accepted so existing deploys
  // keep working until the operator rotates to scrypt. Timing-safe
  // comparison; warning logged once per cold-start.
  const hexCandidate = stored.toLowerCase();
  if (/^[0-9a-f]{64}$/.test(hexCandidate)) {
    warnLegacyOnce();
    const actual = await sha256Hex(password);
    return timingSafeStringEqual(actual, hexCandidate);
  }
  // Unrecognized format — fail closed.
  return false;
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
//
// Sliding refresh: if the caller's session is past its halfway point
// we piggy-back a new Set-Cookie on the response, extending the TTL
// by another full window. Active users never get logged out; idle
// sessions still expire fast.
export function requireAuth(req, res) {
  try {
    const cookies = parseCookies(req.headers?.cookie);
    const token   = cookies[COOKIE_NAME];
    const payload = token ? verify(token) : null;
    if (!payload) {
      res.status(401).json({ error: 'unauthorized' });
      return null;
    }
    try {
      const now       = Math.floor(Date.now() / 1000);
      const remaining = payload.exp - now;
      if (remaining > 0 && remaining < TTL_SECONDS / 2) {
        res.setHeader('Set-Cookie', issueSessionCookie());
      }
    } catch (_) { /* refresh is best-effort — don't block the request */ }
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
