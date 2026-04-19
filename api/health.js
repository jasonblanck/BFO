// GET /api/health — authenticated diagnostic endpoint.
//
// Reports which env vars are configured (booleans only — never values)
// and tests the Redis connection. Lets you debug a misconfigured
// deploy in 5 seconds without digging through Vercel function logs.
//
// Gated behind requireAuth so the flags can't be enumerated by a
// random internet visitor.

import Redis from 'ioredis';
import { requireAuth } from './_auth.js';

// Validate the VAULT_KEY format the same way _crypto.js does, without
// importing it (importing would throw on bad env and 500 the health
// check). Returns 'ok' | 'missing' | 'malformed'.
function vaultKeyStatus() {
  const k = process.env.VAULT_KEY;
  if (!k) return 'missing';
  const trimmed = String(k).trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) return 'ok';
  try {
    const buf = Buffer.from(trimmed, 'base64');
    return buf.length === 32 ? 'ok' : 'malformed';
  } catch { return 'malformed'; }
}

async function redisPing() {
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return { configured: false, reachable: false };
  const c = new Redis(url, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
  // Swallow errors — an unhandled 'error' event in some ioredis
  // versions crashes the lambda. We already track reachability via
  // the ping result.
  c.on('error', () => {});
  try {
    const pong = await c.ping();
    return { configured: true, reachable: pong === 'PONG' };
  } catch (_) {
    return { configured: true, reachable: false };
  } finally {
    // Always disconnect so the lambda doesn't keep a socket open
    // between invocations — health is a one-shot, not persistent.
    try { c.disconnect(); } catch (_) { /* noop */ }
  }
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const vaultKey = vaultKeyStatus();
  const env = {
    AUTH_SECRET:         !!process.env.AUTH_SECRET,
    AUTH_PASSWORD_HASH:  !!process.env.AUTH_PASSWORD_HASH, // optional
    VAULT_KEY:           vaultKey,                         // 'ok' | 'missing' | 'malformed'
    PLAID_CLIENT_ID:     !!process.env.PLAID_CLIENT_ID,
    PLAID_SECRET:        !!process.env.PLAID_SECRET,
    PLAID_ENV:           process.env.PLAID_ENV || null,   // non-secret
    TELEGRAM_BOT_TOKEN:  !!process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID:    !!process.env.TELEGRAM_CHAT_ID,
    REDIS_URL:           !!(process.env.REDIS_URL || process.env.KV_URL),
  };

  const redis = await redisPing();

  // Aggregate "is this deploy fully wired?" answer so the UI can show
  // a single red/green dot without the consumer having to enumerate.
  // VAULT_KEY must be 'ok' — presence alone isn't enough; a malformed
  // key passes presence but blows up at first vault write (this was
  // the 2026-04-19 Plaid exchange failure: env set, key invalid).
  const required = ['AUTH_SECRET', 'PLAID_CLIENT_ID', 'PLAID_SECRET',
                    'TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'REDIS_URL'];
  const missing = required.filter((k) => !env[k]);
  if (vaultKey !== 'ok') missing.push(`VAULT_KEY(${vaultKey})`);
  const status = missing.length === 0 && redis.reachable ? 'ok' : 'degraded';

  res.status(200).json({
    status,
    missing,
    env,
    redis,
    node: process.version,
    timestamp: new Date().toISOString(),
  });
}
