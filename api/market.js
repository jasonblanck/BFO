// Server-side proxy for Polygon + Finnhub. Exists so the provider API
// keys never ship to the browser (the previous architecture embedded
// them as VITE_* env vars that were readable from the bundle).
//
// All actions are auth-gated. Single handler with req.query.action
// dispatch to stay inside the Vercel Hobby 12-function cap.
//
// Required env (server-side only):
//   POLYGON_API_KEY   — polygon.io
//   FINNHUB_API_KEY   — finnhub.io
//
// Actions:
//   GET /api/market?action=status
//     → { polygon: boolean, finnhub: boolean }
//
//   GET /api/market?action=polygon-snapshot-gainers|losers
//     → Polygon /v2/snapshot/locale/us/markets/stocks/{gainers|losers}
//
//   GET /api/market?action=polygon-prev&ticker=SPY
//     → Polygon /v2/aggs/ticker/{ticker}/prev
//
//   GET /api/market?action=polygon-grouped&date=2026-04-18
//     → Polygon /v2/aggs/grouped/locale/us/market/stocks/{date}
//
//   GET /api/market?action=finnhub-earnings&from=YYYY-MM-DD&to=YYYY-MM-DD
//     → Finnhub /api/v1/calendar/earnings
//
//   GET /api/market?action=finnhub-ipo&from=YYYY-MM-DD&to=YYYY-MM-DD
//     → Finnhub /api/v1/calendar/ipo
//
//   GET /api/market?action=finnhub-news&category=general
//     → Finnhub /api/v1/news
//
// All actions cache server-side nothing — the client data layer already
// has its own cache. Response bodies are forwarded as JSON; upstream
// errors collapse to { error: 'upstream_error' } with the status echoed
// so the client can still fall back to seeds.

import { requireAuth } from './_auth.js';

const POLYGON_BASE = 'https://api.polygon.io';
const FINNHUB_BASE = 'https://finnhub.io';

function sanitizeDate(s) {
  // ISO YYYY-MM-DD only. Rejects anything with slashes, dots, or path
  // traversal — these values are templated straight into upstream URLs.
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function sanitizeTickers(s) {
  // Comma-separated uppercase tickers, 1-6 chars each (allow dots for
  // BRK.A/B-class symbols), max 300 tickers per call. Rejects anything
  // else to keep the upstream URL clean.
  if (typeof s !== 'string' || !s) return null;
  const parts = s.split(',').map((t) => t.trim().toUpperCase());
  if (parts.length > 300) return null;
  if (!parts.every((t) => /^[A-Z0-9.]{1,8}$/.test(t))) return null;
  return parts.join(',');
}

function sanitizeTicker(s) {
  return typeof s === 'string' && /^[A-Z0-9.]{1,8}$/.test(s.toUpperCase())
    ? s.toUpperCase()
    : null;
}

async function forward(upstreamUrl, res) {
  try {
    const r = await fetch(upstreamUrl);
    const body = await r.json().catch(() => null);
    if (!r.ok) {
      // Log upstream status server-side; never echo the raw body to the
      // browser (may contain request IDs / rate-limit internals).
      console.error('market proxy · upstream error', { status: r.status, url: upstreamUrl.split('?')[0] });
      res.status(502).json({ error: 'upstream_error', status: r.status });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(body);
  } catch (e) {
    console.error('market proxy · fetch threw', e?.message || e);
    res.status(502).json({ error: 'upstream_fetch_failed' });
  }
}

async function handleStatus(_req, res) {
  res.status(200).json({
    polygon: !!process.env.POLYGON_API_KEY,
    finnhub: !!process.env.FINNHUB_API_KEY,
  });
}

async function handlePolygonSnapshot(kind, res) {
  const key = process.env.POLYGON_API_KEY;
  if (!key) { res.status(503).json({ error: 'polygon_not_configured' }); return; }
  if (kind !== 'gainers' && kind !== 'losers') {
    res.status(400).json({ error: 'bad_kind' });
    return;
  }
  const url = `${POLYGON_BASE}/v2/snapshot/locale/us/markets/stocks/${kind}?apiKey=${key}`;
  await forward(url, res);
}

async function handlePolygonPrev(req, res) {
  const key = process.env.POLYGON_API_KEY;
  if (!key) { res.status(503).json({ error: 'polygon_not_configured' }); return; }
  const ticker = sanitizeTicker(req.query?.ticker);
  if (!ticker) { res.status(400).json({ error: 'bad_ticker' }); return; }
  const url = `${POLYGON_BASE}/v2/aggs/ticker/${ticker}/prev?apiKey=${key}`;
  await forward(url, res);
}

async function handlePolygonGrouped(req, res) {
  const key = process.env.POLYGON_API_KEY;
  if (!key) { res.status(503).json({ error: 'polygon_not_configured' }); return; }
  const date = sanitizeDate(req.query?.date);
  if (!date) { res.status(400).json({ error: 'bad_date' }); return; }
  const url = `${POLYGON_BASE}/v2/aggs/grouped/locale/us/market/stocks/${date}?adjusted=true&apiKey=${key}`;
  await forward(url, res);
}

async function handleFinnhubRange(path, req, res) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) { res.status(503).json({ error: 'finnhub_not_configured' }); return; }
  const from = sanitizeDate(req.query?.from);
  const to   = sanitizeDate(req.query?.to);
  if (!from || !to) { res.status(400).json({ error: 'bad_range' }); return; }
  const url = `${FINNHUB_BASE}${path}?from=${from}&to=${to}&token=${key}`;
  await forward(url, res);
}

async function handleFinnhubNews(req, res) {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) { res.status(503).json({ error: 'finnhub_not_configured' }); return; }
  const category = typeof req.query?.category === 'string'
    && /^[a-z]{1,20}$/.test(req.query.category)
    ? req.query.category
    : 'general';
  const url = `${FINNHUB_BASE}/api/v1/news?category=${category}&token=${key}`;
  await forward(url, res);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!requireAuth(req, res)) return;

  const action = req.query?.action;
  switch (action) {
    case 'status':                    return handleStatus(req, res);
    case 'polygon-snapshot-gainers':  return handlePolygonSnapshot('gainers', res);
    case 'polygon-snapshot-losers':   return handlePolygonSnapshot('losers',  res);
    case 'polygon-prev':              return handlePolygonPrev(req, res);
    case 'polygon-grouped':           return handlePolygonGrouped(req, res);
    case 'finnhub-earnings':          return handleFinnhubRange('/api/v1/calendar/earnings', req, res);
    case 'finnhub-ipo':               return handleFinnhubRange('/api/v1/calendar/ipo',      req, res);
    case 'finnhub-news':              return handleFinnhubNews(req, res);
    default:                           res.status(404).json({ error: 'unknown_action' });
  }
}
