// POST /api/plaid/webhook  — Vercel Edge runtime.
//
// Edge gives us `request.arrayBuffer()` — the ORIGINAL bytes Plaid
// signed, not a re-serialized parse-then-stringify that could drift
// on whitespace / key order. That's the whole reason this endpoint
// lives on Edge while everything else in api/ stays on Node.
//
// Tradeoff: Edge can't import ioredis or our _audit / _telegram
// helpers (they're Node-only). We skip the Redis staleness flag
// (holdings polls refetch on user action anyway) and the audit-log
// write (webhook events are rare — Vercel console logs capture them).
// The Telegram notifier is re-implemented inline with fetch, which is
// the only piece of that helper Edge actually needs.
//
// Configure on the Plaid dashboard (Team Settings → API →
// Webhooks): https://<your-vercel>.vercel.app/api/plaid/webhook

export const config = { runtime: 'edge' };

const PLAID_HOST = {
  sandbox:     'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production:  'https://production.plaid.com',
};

// Cache Plaid's webhook-verification JWKs for 10 min to avoid a
// round-trip on every call. Scope is per-isolate — Edge recycles
// isolates aggressively so this is best-effort, not a long-lived
// cache.
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

function base64urlToBytes(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Verify the Plaid-Verification JWT (ES256). Returns the decoded
// header on success, null on any failure. Web Crypto ECDSA verify
// takes the raw r||s signature directly — no JOSE→DER conversion
// like the Node crypto version needs.
async function verifyPlaidJwt(jwt, rawBodyHashHex) {
  if (!jwt || typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;

  const dec = new TextDecoder();
  let header;
  let payload;
  try {
    header  = JSON.parse(dec.decode(base64urlToBytes(parts[0])));
    payload = JSON.parse(dec.decode(base64urlToBytes(parts[1])));
  } catch { return null; }

  if (header.alg !== 'ES256' || !header.kid) return null;
  if (typeof payload.iat !== 'number') return null;
  // Reject JWTs older than 5 minutes — replay defense.
  if (Math.abs(Math.floor(Date.now() / 1000) - payload.iat) > 5 * 60) return null;
  // The payload must embed the SHA-256 of the raw body; prevents an
  // attacker from swapping the body while reusing a valid JWT.
  if (payload.request_body_sha256 !== rawBodyHashHex) return null;

  const jwk = await fetchVerificationKey(header.kid);
  if (!jwk) return null;

  try {
    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const sig = base64urlToBytes(parts[2]);
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      sig,
      signed,
    );
    return ok ? header : null;
  } catch { return null; }
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function notifyTelegram(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch { /* never block the webhook response */ }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

export default async function handler(request) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const raw = new Uint8Array(await request.arrayBuffer());
  const bodyHashHex = await sha256Hex(raw);
  const jwt = request.headers.get('plaid-verification');
  const valid = await verifyPlaidJwt(jwt, bodyHashHex);
  if (!valid) {
    console.warn('plaid webhook · signature invalid');
    return json({ error: 'invalid_signature' }, 401);
  }

  let event = {};
  try { event = JSON.parse(new TextDecoder().decode(raw)); } catch { event = {}; }
  const type = event.webhook_type;
  const code = event.webhook_code;
  const item_id = event.item_id;
  console.log('plaid webhook', { type, code, item_id });

  // Only notify Telegram for meaningful events; avoid spam from
  // every routine update.
  const notable = ['ITEM', 'HOLDINGS', 'AUTH'].includes(type) && code !== 'DEFAULT_UPDATE';
  if (notable) {
    const text = `🔄 <b>Plaid · ${escapeHtml(type || '?')} · ${escapeHtml(code || '?')}</b>\nItem: <code>${escapeHtml(item_id || '—')}</code>`;
    notifyTelegram(text);
  }

  return json({ ok: true });
}
