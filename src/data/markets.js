// Markets data layer — seed fallbacks + live-API stubs.
//
// Each fetcher transparently upgrades to a real API call when the relevant
// upstream is configured, otherwise returns seeded data (so the UI stays
// populated during dev / demos).
//
// Env var wiring:
//   VITE_FRED_API_KEY   (client) — public, read-only, safe to bundle.
//   POLYGON_API_KEY     (server) — proxied via /api/market?action=polygon-*
//   FINNHUB_API_KEY     (server) — proxied via /api/market?action=finnhub-*
//
// Polygon + Finnhub keys are deliberately NOT exposed to the browser.
// Earlier builds shipped them as VITE_* vars; the audit flagged that the
// keys were readable from any cached copy of the bundle and from every
// browser devtools pane. The /api/market proxy (in api/market.js) keeps
// them server-side and rate-limited behind requireAuth.
//
//   VITE_KALSHI_EMAIL          — SexyBot feed (optional)
//   VITE_KALSHI_PASSWORD
//   VITE_POLYMARKET_READONLY   — "1" to enable read-only Polymarket polling

import { WATCHLIST_TICKERS } from './tickers';

const FRED_KEY     = import.meta.env?.VITE_FRED_API_KEY     || '';
const MARKET_PROXY = '/api/market';

// ---------------------------------------------------------------- Utilities

async function safeFetch(url, opts) {
  try {
    const r = await fetch(url, opts);
    if (!r.ok) return null;
    return await r.json();
  } catch (_) {
    return null;
  }
}

const cache = new Map();
async function cached(key, ttlMs, producer) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttlMs) return hit.v;
  const v = await producer();
  cache.set(key, { t: Date.now(), v });
  return v;
}

// Call the /api/market proxy. Returns parsed JSON or null on any
// upstream / auth failure so callers can cleanly fall back to seeds.
// The session cookie is sent automatically same-origin.
async function fetchMarket(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  return safeFetch(`${MARKET_PROXY}?${qs}`);
}

// ------------------------------------------------------------ Market Movers

export const seedHighestVolume = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation',    price: 200.77, changePct:  1.22 },
  { ticker: 'TSLA', name: 'Tesla, Inc.',           price: 393.86, changePct:  1.28 },
  { ticker: 'MU',   name: 'Micron Technology',     price: 457.16, changePct: -0.02 },
  { ticker: 'NFLX', name: 'Netflix, Inc.',         price:  97.30, changePct: -9.73 },
  { ticker: 'MSFT', name: 'Microsoft Corporation', price: 424.71, changePct:  1.06 },
  { ticker: 'AAPL', name: 'Apple Inc.',            price: 269.16, changePct:  2.19 },
];

export const seedMostVolatile = [
  { ticker: 'FCHL', name: 'Fitness Champs Holdings', price:  0.54,  changePct: -65.16 },
  { ticker: 'EFOI', name: 'Energy Focus, Inc.',      price:  8.06,  changePct: 285.65 },
  { ticker: 'ISPC', name: 'iSpecimen Inc.',          price:  0.1907,changePct:  63.69 },
  { ticker: 'PBM',  name: 'Psyence Biomedical Ltd.', price:  8.23,  changePct:  40.20 },
  { ticker: 'JLHL', name: 'Julong Holding Limited',  price:  8.06,  changePct: -17.08 },
  { ticker: 'HUBC', name: 'Hub Cyber Security Ltd.', price:  0.1311,changePct: -28.48 },
];

export const seedGainers = [
  { ticker: 'EFOI', name: 'Energy Focus, Inc.',              price:  8.08, changePct: 286.60 },
  { ticker: 'ZDAI', name: 'DirectBooking Technology Co.',     price:  5.25, changePct:  38.89 },
  { ticker: 'PBM',  name: 'Psyence Biomedical Ltd.',          price:  8.21, changePct:  39.86 },
  { ticker: 'CRML', name: 'Critical Metals Corp.',            price: 12.25, changePct:  32.15 },
  { ticker: 'LZM',  name: 'Lifezone Metals Limited',          price:  5.12, changePct:  31.62 },
  { ticker: 'RPAY', name: 'Repay Holdings Corporation',       price:  4.06, changePct:  27.67 },
];

export const seedLosers = [
  { ticker: 'GLND', name: 'Greenland Energy Company',         price:   6.28, changePct: -21.11 },
  { ticker: 'BMI',  name: 'Badger Meter, Inc.',               price: 125.36, changePct: -17.68 },
  { ticker: 'JLHL', name: 'Julong Holding Limited',           price:   8.06, changePct: -17.08 },
  { ticker: 'BATL', name: 'Battalion Oil Corporation',        price:   3.04, changePct: -14.99 },
  { ticker: 'WNW',  name: 'Meiwu Technology Company Limited', price:   4.78, changePct: -14.03 },
  { ticker: 'OPTX', name: 'Syntec Optics Holdings, Inc.',     price:   9.66, changePct: -12.58 },
];

export async function fetchMarketMovers(kind) {
  // kind: 'volume' | 'volatility' | 'gainers' | 'losers'
  const seeds = {
    volume:     seedHighestVolume,
    volatility: seedMostVolatile,
    gainers:    seedGainers,
    losers:     seedLosers,
  };
  return cached(`mm:${kind}`, 60_000, async () => {
    // Volume / volatility not directly on Polygon free tier — seed only.
    if (kind !== 'gainers' && kind !== 'losers') return seeds[kind] ?? [];
    const json = await fetchMarket(`polygon-snapshot-${kind}`);
    if (!json?.tickers) return seeds[kind] ?? [];
    return json.tickers.slice(0, 6).map((t) => ({
      ticker: t.ticker,
      name: t.ticker,
      price: t.day?.c ?? 0,
      changePct: t.todaysChangePerc ?? 0,
    }));
  });
}

// ---------------------------------------------------------------- Indexes

export const seedIndexes = [
  { id: 'DXY',   label: 'US Dollar index',   ticker: 'DXY',    value:   97.746, changePct: -1.81, unit: 'USD' },
  { id: 'US10Y', label: 'US 10-year yield',  ticker: '91282CPJ4', value:  4.300, changePct:  0.62, unit: '%'   },
  { id: 'CL',    label: 'Light crude oil',   ticker: 'CL1!',   value:   82.74,  changePct: -12.62, unit: 'USD / barrel' },
  { id: 'NG',    label: 'Natural gas',       ticker: 'NG1!',   value:    2.662, changePct:  0.57,  unit: 'USD / MMBtu'  },
  { id: 'GC',    label: 'Gold',              ticker: 'GC1!',   value: 4_882.0,  changePct:  1.53,  unit: 'USD / troy oz'},
  { id: 'HG',    label: 'Copper',            ticker: 'HG1!',   value:    6.0795,changePct:  0.05,  unit: 'USD / lb'     },
];

export async function fetchIndexes() {
  return cached('indexes', 120_000, async () => {
    // Map each row in seedIndexes to a Polygon ticker or skip if not
    // available on the free tier.
    const ROW_TO_TICKER = {
      DXY:   'I:DXY',
      US10Y: null,   // Yield — Polygon doesn't expose cleanly; keep seed
      CL:    'USO',  // Oil proxy ETF
      NG:    'UNG',  // Nat gas proxy ETF
      GC:    'GLD',  // Gold proxy ETF
      HG:    'CPER', // Copper proxy ETF
    };
    const out = await Promise.all(
      seedIndexes.map(async (row) => {
        const ticker = ROW_TO_TICKER[row.id];
        if (!ticker) return row; // Keep seed value
        const j = await fetchMarket('polygon-prev', { ticker });
        const r = j?.results?.[0];
        if (!r?.c || !r?.o) return row;
        return { ...row, value: r.c, changePct: ((r.c - r.o) / r.o) * 100 };
      })
    );
    return out;
  });
}

// ---------------------------------------------------------------- Watchlist

// Seed values populate the UI when the /api/market proxy is not
// configured or when Polygon has no daily aggregate for a ticker.
// FNV-1a gives a
// well-distributed hash so short tickers don't all cluster to the
// same placeholder price — which is what happened with the naive
// *31 hash and tickers like AIG / AIN / AIQ / ALB all ending up near
// $742 when Polygon omitted them from the snapshot response.
function hashStr(s, seed) {
  let h = seed >>> 0;
  for (let i = 0; i < s.length; i++) {
    h = (h ^ s.charCodeAt(i)) >>> 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export const seedWatchlist = WATCHLIST_TICKERS.map((ticker) => ({
  ticker,
  name: ticker,
  price:     +(((hashStr(ticker, 0x811c9dc5) % 99500) + 500) / 100).toFixed(2),
  changePct: +(((hashStr(ticker, 0x1a2b3c4d) % 800) - 400) / 100).toFixed(2),
}));

// Polygon Grouped Daily — ONE call returns OHLC for every US equity
// for a given trading day. This is the correct shape for a 719-row
// watchlist: the bulk /snapshot/...?tickers= endpoint quietly drops
// symbols that don't have intraday day bars yet (e.g. AIG, AIN, AIQ,
// ALL — leaving them stuck on seed prices), whereas Grouped Daily
// covers every listed security. We fetch two consecutive trading
// days so changePct is computed as (last close − prior close) / prior
// close, matching what the UI label implies.
async function fetchPolygonGroupedDaily() {
  const maps = [];
  let back = 1;
  while (maps.length < 2 && back <= 10) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - back);
    back += 1;
    const wk = d.getUTCDay();
    if (wk === 0 || wk === 6) continue;
    const date = d.toISOString().slice(0, 10);
    const j = await fetchMarket('polygon-grouped', { date });
    if (Array.isArray(j?.results) && j.results.length) {
      const m = new Map();
      for (const r of j.results) m.set(r.T, r);
      maps.push(m);
    }
  }
  return maps; // [latest, prior]
}

export async function fetchWatchlist() {
  return cached('watchlist', 60_000, async () => {
    const [latest, prior] = await fetchPolygonGroupedDaily();
    if (!latest || latest.size === 0) return seedWatchlist;
    return seedWatchlist.map((seed) => {
      const r = latest.get(seed.ticker);
      if (!r || typeof r.c !== 'number') return seed;
      const p = prior?.get(seed.ticker);
      const change = p && typeof p.c === 'number' && p.c > 0
        ? ((r.c - p.c) / p.c) * 100
        : (typeof r.o === 'number' && r.o > 0 ? ((r.c - r.o) / r.o) * 100 : seed.changePct);
      return { ...seed, price: r.c, changePct: +change.toFixed(2) };
    });
  });
}

// ---------------------------------------------------------------- Inflation / FRED

// US YoY CPI — most recent 13 months. Seeded to look like the TV screenshot.
export const seedInflation = [
  { month: 'Feb 25', value: 2.7 },
  { month: 'Mar 25', value: 2.4 },
  { month: 'Apr 25', value: 2.3 },
  { month: 'May 25', value: 2.6 },
  { month: 'Jun 25', value: 2.9 },
  { month: 'Jul 25', value: 2.7 },
  { month: 'Aug 25', value: 2.6 },
  { month: 'Sep 25', value: 2.5 },
  { month: 'Oct 25', value: 2.6 },
  { month: 'Nov 25', value: 2.6 },
  { month: 'Dec 25', value: 2.7 },
  { month: 'Jan 26', value: 2.9 },
  { month: 'Feb 26', value: 3.5 },
];

export async function fetchInflationSeries() {
  if (!FRED_KEY) return seedInflation;
  return cached('fred:cpi', 6 * 60 * 60 * 1000, async () => {
    // CPIAUCSL — raw index level; compute YoY against 12 months prior
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCSL&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=26`;
    const j = await safeFetch(url);
    const obs = j?.observations ?? [];
    // Need 25 rows: 13 target points × 1 YoY comparison 12 rows back.
    if (obs.length < 25) return seedInflation;
    // Most recent 13 vs 12 months prior
    const out = [];
    for (let i = 12; i >= 0; i--) {
      const cur = parseFloat(obs[i].value);
      const prior = parseFloat(obs[i + 12].value);
      if (Number.isFinite(cur) && Number.isFinite(prior) && prior > 0) {
        out.push({
          month: new Date(obs[i].date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          value: +((cur - prior) / prior * 100).toFixed(2),
        });
      }
    }
    return out.length ? out : seedInflation;
  });
}

// Single FRED observation — most recent value + prior-period delta.
export async function fetchFredLatest(seriesId, fallback) {
  if (!FRED_KEY) return fallback;
  return cached(`fred:latest:${seriesId}`, 6 * 60 * 60 * 1000, async () => {
    const j = await safeFetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=2`
    );
    const obs = j?.observations;
    if (!obs || obs.length < 2) return fallback;
    const cur = parseFloat(obs[0].value);
    const prev = parseFloat(obs[1].value);
    return { value: cur, delta: cur - prev, date: obs[0].date };
  });
}

// ------------------------------------------------------------ Calendars

export const seedEarnings = [
  { day: 'Today', ticker: 'ALV',  name: 'Autoliv, Inc.',                 actual: 2.05, estimate:  1.83 },
  { day: 'Today', ticker: 'RF',   name: 'Regions Financial Corporation',  actual: 0.62, estimate:  0.60 },
  { day: 'Today', ticker: 'FITB', name: 'Fifth Third Bancorp',            actual: 0.15, estimate: -0.10 },
  { day: 'Today', ticker: 'ALLY', name: 'Ally Financial Inc.',            actual: 1.11, estimate:  0.93 },
  { day: 'Apr 21',ticker: 'VZ',   name: 'Verizon Communications',         actual: null, estimate:  1.18 },
  { day: 'Apr 22',ticker: 'TSLA', name: 'Tesla, Inc.',                    actual: null, estimate:  0.58 },
];

export const seedIPOs = [
  { day: 'Today',  ticker: 'KLRA',  name: 'Kailera Therapeutics Inc.',  exchange: 'NASDAQ', price: 16.00 },
  { day: 'Today',  ticker: 'ALMR',  name: 'Alamar Biosciences Inc.',    exchange: 'NASDAQ', price: 17.00 },
  { day: 'Today',  ticker: 'AVEX',  name: 'Aevex Corp.',                exchange: 'NYSE',   price: 20.00 },
  { day: 'Apr 22', ticker: 'EMI',   name: 'Encore Medical Inc.',        exchange: 'NYSE',   price: null  },
  { day: 'Apr 23', ticker: 'NIRX',  name: 'Nirx Medical',               exchange: 'NASDAQ', price: 12.50 },
];

export const seedEconomic = [
  { day: 'Today', time: '10:30', region: 'EU', name: 'ECB Buch Speech',             actual: '31:04', forecast: '—',   prior: '—'  },
  { day: 'Today', time: '12:15', region: 'US', name: 'Fed Barkin Speech',           actual: '—',     forecast: '—',   prior: '—'  },
  { day: 'Today', time: '13:00', region: 'US', name: 'Baker Hughes Oil Rig Count',  actual: '—',     forecast: '—',   prior: '411' },
  { day: 'Today', time: '13:00', region: 'US', name: 'Baker Hughes Total Rigs',     actual: '—',     forecast: '—',   prior: '545' },
  { day: 'Apr 21',time: '08:30', region: 'US', name: 'Initial Jobless Claims',       actual: '—',     forecast: '218K', prior: '221K' },
  { day: 'Apr 22',time: '10:00', region: 'US', name: 'Existing Home Sales',          actual: '—',     forecast: '4.02M',prior: '4.06M' },
  { day: 'Apr 23',time: '14:00', region: 'US', name: 'FOMC Meeting Minutes',         actual: '—',     forecast: '—',   prior: '—'  },
];

function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmtDay(iso) {
  const d = new Date(iso + 'T00:00:00');
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return 'Today';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function fetchEarnings() {
  return cached('earnings', 5 * 60 * 1000, async () => {
    const from = dateOffset(0);
    const to   = dateOffset(7);
    const j = await fetchMarket('finnhub-earnings', { from, to });
    const rows = j?.earningsCalendar;
    if (!Array.isArray(rows) || rows.length === 0) return seedEarnings;
    return rows.slice(0, 10).map((r) => ({
      day: fmtDay(r.date),
      ticker: r.symbol,
      name: r.symbol, // Finnhub doesn't return full company name on this endpoint
      actual: r.epsActual ?? null,
      estimate: r.epsEstimate ?? null,
    }));
  });
}

export async function fetchIPOs() {
  return cached('ipos', 5 * 60 * 1000, async () => {
    const from = dateOffset(-1);
    const to   = dateOffset(14);
    const j = await fetchMarket('finnhub-ipo', { from, to });
    const rows = j?.ipoCalendar;
    if (!Array.isArray(rows) || rows.length === 0) return seedIPOs;
    return rows.slice(0, 10).map((r) => ({
      day: fmtDay(r.date),
      ticker: r.symbol || '—',
      name: r.name,
      exchange: (r.exchange || '').toUpperCase(),
      price: parseFloat((r.price || '').toString().split('-')[0]) || null,
    }));
  });
}

// Economic calendar is a paid tier on Finnhub; keep seed for now but leave
// the hook here so it's obvious where to upgrade.
export async function fetchEconomic()  { return seedEconomic; }

// ------------------------------------------------------------------- News

export const seedNews = [
  { id: 'n1',  source: 'Reuters',     time: '3m',  ticker: 'AAPL', headline: "Apple's iPhone shipments in China rose 20% in Q1, strongest growth among major smartphone vendors" },
  { id: 'n2',  source: 'Bloomberg',   time: '11m', ticker: 'NFLX', headline: 'Netflix slides 9.7% after Q1 subscriber miss; management cites "ad-tier digestion"' },
  { id: 'n3',  source: 'CNBC',        time: '18m', ticker: 'TSLA', headline: 'Tesla to open second Shanghai Megapack factory; capacity doubles by 2027' },
  { id: 'n4',  source: 'WSJ',         time: '22m', ticker: 'NVDA', headline: 'Nvidia extends AI partnership with Figure, Helix-2 integration on H200 cluster' },
  { id: 'n5',  source: 'Axios',       time: '34m', ticker: 'MSFT', headline: 'Microsoft CFO: Azure AI revenue run-rate crosses $28B, up 52% YoY' },
  { id: 'n6',  source: 'FT',          time: '41m', ticker: 'SPX',  headline: 'S&P 500 turns green as regional bank earnings beat; KRE +3.1%' },
  { id: 'n7',  source: 'Reuters',     time: '58m', ticker: 'GOLD', headline: 'Gold edges higher as Fed Barkin signals patient-but-dovish posture' },
  { id: 'n8',  source: 'CNBC',        time: '1h',  ticker: 'XOP',  headline: 'Baker Hughes: US oil rig count dips to 411 (−3 WoW)' },
  { id: 'n9',  source: 'Bloomberg',   time: '1h',  ticker: 'BTC',  headline: 'BTC reclaims $96.4K after brief sweep of $94K; funding resets neutral' },
  { id: 'n10', source: 'The Block',   time: '2h',  ticker: 'ETH',  headline: 'Ethereum restaking TVL crosses $24B; Eigenlayer LRTs lead inflows' },
  { id: 'n11', source: 'Semafor',     time: '2h',  ticker: 'DEF',  headline: 'Anduril awarded expanded Lattice ceiling for CENTCOM integration' },
  { id: 'n12', source: 'TechCrunch',  time: '3h',  ticker: 'PPLX', headline: 'Perplexity rolls out Pages 2.0 to Pro tier; enterprise pilot list doubles QoQ' },
];

export async function fetchNews(limit = 12) {
  return cached('news', 60_000, async () => {
    const j = await fetchMarket('finnhub-news', { category: 'general' });
    if (!Array.isArray(j)) return seedNews.slice(0, limit);
    return j.slice(0, limit).map((n) => ({
      id: String(n.id),
      source: n.source ?? 'Finnhub',
      time: relTime(new Date(n.datetime * 1000)),
      ticker: n.related?.split(',')[0] ?? '—',
      headline: n.headline,
      url: n.url,
    }));
  });
}

function relTime(d) {
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// --------------------------------------------------- Prediction markets

// Polymarket — public CLOB / Gamma API. No auth required.
async function fetchPolymarketMarkets() {
  const j = await safeFetch(
    'https://gamma-api.polymarket.com/markets?closed=false&limit=12&order=volume24hr&ascending=false'
  );
  if (!Array.isArray(j)) return [];
  return j
    .map((m) => {
      // outcomePrices is a stringified JSON array: '["0.64", "0.36"]'
      let prices = [];
      try { prices = JSON.parse(m.outcomePrices || '[]').map(parseFloat); } catch (_) {}
      const yesPrice = prices[0] ?? null;
      if (yesPrice == null) return null;
      return {
        agent: 'Kash',
        venue: 'Polymarket',
        market: (m.question || '').slice(0, 80),
        conviction: Math.round(Math.min(99, Math.max(40, 50 + (yesPrice - 0.5) * 120))),
        side: yesPrice >= 0.5 ? 'YES' : 'NO',
        price: +yesPrice.toFixed(2),
        size: '$' + (Math.round((m.volume24hr ?? 0) / 1000) + 'K'),
        pnl: Math.round((yesPrice - 0.5) * 20000),
        t: 'live',
      };
    })
    .filter(Boolean)
    .slice(0, 3);
}

// Kalshi — public /markets endpoint (no auth needed for read).
async function fetchKalshiMarkets() {
  const j = await safeFetch(
    'https://api.elections.kalshi.com/trade-api/v2/markets?limit=20&status=open'
  );
  const markets = j?.markets;
  if (!Array.isArray(markets)) return [];
  return markets
    .filter((m) => m.yes_bid != null && m.title)
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 3)
    .map((m) => {
      const yes = (m.yes_bid ?? 0) / 100; // Kalshi prices are in cents (0-100)
      return {
        agent: 'SexyBot',
        venue: 'Kalshi',
        market: (m.title || '').slice(0, 80),
        conviction: Math.round(Math.min(99, Math.max(40, 50 + (yes - 0.5) * 120))),
        side: yes >= 0.5 ? 'YES' : 'NO',
        price: +yes.toFixed(2),
        size: '$' + (Math.round((m.volume || 0) / 1000) + 'K'),
        pnl: Math.round((yes - 0.5) * 18000),
        t: 'live',
      };
    });
}

export async function fetchPredictionFeed() {
  return cached('predfeed', 60_000, async () => {
    const [poly, kalshi] = await Promise.all([
      fetchPolymarketMarkets(),
      fetchKalshiMarkets(),
    ]);
    // Interleave SexyBot/Kash so the feed alternates agents
    const out = [];
    const max = Math.max(poly.length, kalshi.length);
    for (let i = 0; i < max; i++) {
      if (kalshi[i]) out.push(kalshi[i]);
      if (poly[i])   out.push(poly[i]);
    }
    return out.length ? out : null; // null → caller falls back to seed
  });
}

// ---------------------------------------------------------------- API status

// Synchronous snapshot — only reflects client-side env (FRED). Polygon
// and Finnhub are server-side now, so their configured state has to be
// queried through fetchMarketStatus() below.
export function apiStatus() {
  return {
    fred:       !!FRED_KEY,
    polymarket: true,                                    // always public
    kalshi:     true,                                    // public reads, no key needed
  };
}

// Async lookup of server-side provider wiring. Returns
// { polygon: boolean, finnhub: boolean } or null on auth / network
// failure. Used by the Watchlist footer to surface LIVE vs SEED state.
export async function fetchMarketStatus() {
  const j = await fetchMarket('status');
  if (!j || typeof j !== 'object') return null;
  return {
    polygon: !!j.polygon,
    finnhub: !!j.finnhub,
  };
}
