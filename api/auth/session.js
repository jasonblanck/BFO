// Unified session/admin endpoint — consolidates what used to be four
// separate functions (auth/status, auth/logout, audit, health). Vercel
// Hobby caps deployments at 12 serverless functions, so these session-
// adjacent reads/writes share one handler dispatched by req.query.action
// (populated from the URL by vercel.json rewrites).
//
// Actions:
//   GET  /api/auth/status              → session status (auth)
//   POST /api/auth/logout              → clear session cookie
//   GET  /api/audit?limit=N            → recent audit events (auth)
//   GET  /api/health                   → infra diagnostic (auth)

import Redis from 'ioredis';
import { requireAuth, clearSessionCookie } from '../_auth.js';
import { audit, readAudit } from '../_audit.js';

async function handleStatus(req, res) {
  const payload = requireAuth(req, res);
  if (!payload) return;
  res.status(200).json({ ok: true, exp: payload.exp });
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  res.setHeader('Set-Cookie', clearSessionCookie());
  await audit(req, 'logout');
  res.status(200).json({ ok: true });
}

async function handleAudit(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const limit = Number(req.query?.limit) || 100;
  try {
    const events = await readAudit({ limit });
    res.status(200).json({ events });
  } catch (e) {
    console.error('audit read failed', e?.message || e);
    res.status(500).json({ error: 'audit_read_failed' });
  }
}

// --- Health ---------------------------------------------------------------
// Reports which env vars are configured (booleans only — never values) and
// tests the Redis connection. Gated behind requireAuth so the flags can't
// be enumerated by a random internet visitor.

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
  c.on('error', () => {});
  try {
    const pong = await c.ping();
    return { configured: true, reachable: pong === 'PONG' };
  } catch (_) {
    return { configured: true, reachable: false };
  } finally {
    try { c.disconnect(); } catch (_) { /* noop */ }
  }
}

async function handleHealth(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const vaultKey = vaultKeyStatus();
  const env = {
    AUTH_SECRET:        !!process.env.AUTH_SECRET,
    AUTH_PASSWORD_HASH: !!process.env.AUTH_PASSWORD_HASH,
    VAULT_KEY:          vaultKey,
    PLAID_CLIENT_ID:    !!process.env.PLAID_CLIENT_ID,
    PLAID_SECRET:       !!process.env.PLAID_SECRET,
    PLAID_ENV:          process.env.PLAID_ENV || null,
    TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
    TELEGRAM_CHAT_ID:   !!process.env.TELEGRAM_CHAT_ID,
    REDIS_URL:          !!(process.env.REDIS_URL || process.env.KV_URL),
    POLYGON_API_KEY:    !!process.env.POLYGON_API_KEY,
    FINNHUB_API_KEY:    !!process.env.FINNHUB_API_KEY,
    FRED_API_KEY:       !!process.env.FRED_API_KEY,
  };
  const redis = await redisPing();
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

export default async function handler(req, res) {
  const action = req.query?.action;

  switch (action) {
    case 'status': return handleStatus(req, res);
    case 'logout': return handleLogout(req, res);
    case 'audit':  return handleAudit(req, res);
    case 'health': return handleHealth(req, res);
    default:
      res.status(404).json({ error: 'unknown_action' });
  }
}
