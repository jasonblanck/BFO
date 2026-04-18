// Structured audit log — every auth + Plaid lifecycle event lands here
// with IP, truncated UA, and any event-specific metadata. Backed by a
// Redis capped list (LPUSH + LTRIM) so retention is automatic and the
// hot path is O(1).
//
// Retention: last 500 events. Plenty for a single-user app; if you
// ever need long-term forensics, pipe the list to external storage.
//
// Why not just console.log? Vercel logs are rotated aggressively on
// the hobby tier. A Redis list outlives the lambda, is queryable from
// the UI, and can't be tampered with from the browser.

import Redis from 'ioredis';

const LIST_KEY = 'bci:audit';
const MAX_ENTRIES = 500;

let client = null;
const memFallback = [];

function getClient() {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) return null;
  client = new Redis(url, { maxRetriesPerRequest: 2, connectTimeout: 3000 });
  client.on('error', () => {});
  return client;
}

// Sanitize any free-form string before persisting. Truncation limits
// log bloat from hostile user agents; stripping control chars keeps
// terminals safe if anyone cats the log.
function clean(s, max = 200) {
  if (s == null) return null;
  const str = String(s).replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);
  return str || null;
}

export function ipFrom(req) {
  const fwd = req?.headers?.['x-forwarded-for'];
  if (typeof fwd === 'string') return clean(fwd.split(',')[0], 64);
  if (Array.isArray(fwd)) return clean(fwd[0], 64);
  return clean(req?.socket?.remoteAddress, 64);
}

export async function audit(req, event, extra = {}) {
  const entry = {
    ts: new Date().toISOString(),
    event: clean(event, 64) || 'unknown',
    ip: ipFrom(req),
    ua: clean(req?.headers?.['user-agent'], 200),
    ...Object.fromEntries(
      Object.entries(extra).map(([k, v]) => [k, typeof v === 'string' ? clean(v, 200) : v]),
    ),
  };
  const line = JSON.stringify(entry);

  const c = getClient();
  if (!c) {
    memFallback.unshift(line);
    if (memFallback.length > MAX_ENTRIES) memFallback.length = MAX_ENTRIES;
    return;
  }
  try {
    await c.lpush(LIST_KEY, line);
    await c.ltrim(LIST_KEY, 0, MAX_ENTRIES - 1);
  } catch (_) { /* never block the primary flow */ }
}

export async function readAudit({ limit = 100 } = {}) {
  const n = Math.max(1, Math.min(MAX_ENTRIES, Number(limit) || 100));
  const c = getClient();
  if (!c) return memFallback.slice(0, n).map(safeParse).filter(Boolean);
  try {
    const rows = await c.lrange(LIST_KEY, 0, n - 1);
    return rows.map(safeParse).filter(Boolean);
  } catch (_) { return []; }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
