// POST /api/plaid/webhook
//
// Plaid calls this endpoint when an Item's holdings / transactions /
// auth change. We capture the notification, log to the audit stream,
// and poke Redis with a "stale" marker so the next /holdings poll on
// the browser forces a refetch instead of serving cached data.
//
// This endpoint is PUBLIC (no requireAuth) — Plaid is the caller, not
// a signed-in user. We authenticate via Plaid's JWT signature on the
// Plaid-Verification header. Spoofed webhooks that don't verify are
// rejected at the door.
//
// Configure on the Plaid dashboard (Team Settings → API →
// Webhooks): https://<your-vercel>.vercel.app/api/plaid/webhook

import crypto from 'node:crypto';
import Redis from 'ioredis';
import { audit } from '../_audit.js';
import { sendMessage, escapeHtml } from '../_telegram.js';

const PLAID_HOST = {
  sandbox:     'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production:  'https://production.plaid.com',
};

// Cache Plaid's webhook-verification JWKs for 10 min to avoid a
// round-trip on every call.
const kidCache = new Map();
const CACHE_MS = 10 * 60 * 1000;

async function fetchVerificationKey(kid) {
  const now = Date.now();
  const cached = kidCache.get(kid);
  if (cached && cached.expires > now) return cached.key;

  const env = process.env.PLAID_ENV || 'sandbox';
  const host = PLAID_HOST[env];
  if (!host) return null;

  const r = await fetch(`${host}/webhook_verification_key/get`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret:    process.env.PLAID_SECRET,
      key_id:    kid,
    }),
  });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  if (!j?.key) return null;
  kidCache.set(kid, { key: j.key, expires: now + CACHE_MS });
  return j.key;
}

function base64urlDecode(str) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

// Verify the Plaid-Verification JWT (ES256). Returns the decoded
// header object if valid, or null on any failure.
async function verifyPlaidJwt(jwt, rawBodyHashHex) {
  if (!jwt || typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  let header, payload;
  try {
    header  = JSON.parse(base64urlDecode(parts[0]).toString('utf8'));
    payload = JSON.parse(base64urlDecode(parts[1]).toString('utf8'));
  } catch { return null; }
  if (header.alg !== 'ES256' || !header.kid) return null;
  if (typeof payload.iat !== 'number') return null;
  // Reject JWTs older than 5 minutes — replay defense.
  if (Math.abs(Math.floor(Date.now() / 1000) - payload.iat) > 5 * 60) return null;
  // The payload must embed the SHA-256 of the raw body; prevents
  // an attacker from swapping the body while reusing a valid JWT.
  if (payload.request_body_sha256 !== rawBodyHashHex) return null;

  const jwk = await fetchVerificationKey(header.kid);
  if (!jwk) return null;

  try {
    const keyObj = crypto.createPublicKey({ key: jwk, format: 'jwk' });
    const signed = Buffer.from(`${parts[0]}.${parts[1]}`);
    const sig    = base64urlDecode(parts[2]);
    // ES256 JOSE signatures are r||s; node verify expects DER.
    const derSig = joseToDer(sig);
    const ok = crypto.verify('sha256', signed, {
      key: keyObj,
      dsaEncoding: 'der',
    }, derSig);
    return ok ? header : null;
  } catch { return null; }
}

// Convert a JOSE ES256 signature (64 bytes, r||s) to ASN.1 DER.
function joseToDer(sig) {
  if (sig.length !== 64) throw new Error('bad_jose_sig_len');
  const r = sig.subarray(0, 32);
  const s = sig.subarray(32);
  const enc = (b) => {
    let i = 0;
    while (i < b.length - 1 && b[i] === 0) i += 1;
    let out = b.subarray(i);
    if (out[0] & 0x80) out = Buffer.concat([Buffer.from([0]), out]);
    return Buffer.concat([Buffer.from([0x02, out.length]), out]);
  };
  const body = Buffer.concat([enc(r), enc(s)]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

let redisClient = null;
function getRedis() {
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;
  redisClient = new Redis(url, { maxRetriesPerRequest: 2, connectTimeout: 3000 });
  redisClient.on('error', () => {});
  return redisClient;
}

// Vercel's Node runtime serializes req.body to an object by default,
// but Plaid's signature is computed over the raw bytes. We need the
// raw body. The `bodyParser: false` export below tells Vercel to
// leave it alone.
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end',  () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  let raw;
  try { raw = await readRawBody(req); }
  catch { res.status(400).json({ error: 'bad_body' }); return; }

  const bodyHashHex = crypto.createHash('sha256').update(raw).digest('hex');
  const jwt = req.headers['plaid-verification'];
  const valid = await verifyPlaidJwt(jwt, bodyHashHex);
  if (!valid) {
    // Don't audit on every spoofed attempt — would fill the log.
    // Do console.warn so Vercel logs capture it.
    console.warn('plaid webhook · signature invalid');
    res.status(401).json({ error: 'invalid_signature' });
    return;
  }

  let event = {};
  try { event = JSON.parse(raw.toString('utf8')); } catch { event = {}; }
  const type = event.webhook_type;
  const code = event.webhook_code;
  const item_id = event.item_id;

  // Mark the holdings cache stale so the next /holdings poll skips
  // any in-memory lambda-warm cache and refetches.
  const r = getRedis();
  if (r) {
    try { await r.set('bci:plaid:stale', Date.now().toString(), 'EX', 24 * 3600); }
    catch { /* noop */ }
  }

  await audit(req, 'plaid.webhook', { type, code, item_id });

  // Only notify Telegram for meaningful events; avoid spam from
  // every routine update.
  const notable = ['ITEM', 'HOLDINGS', 'AUTH'].includes(type) && code !== 'DEFAULT_UPDATE';
  if (notable) {
    const text = `🔄 <b>Plaid · ${escapeHtml(type || '?')} · ${escapeHtml(code || '?')}</b>\nItem: <code>${escapeHtml(item_id || '—')}</code>`;
    sendMessage(text).catch(() => { /* never block */ });
  }

  res.status(200).json({ ok: true });
}
