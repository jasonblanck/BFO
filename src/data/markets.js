// Markets data layer — seed fallbacks + live-API stubs.
//
// Each fetcher transparently upgrades to a real API call when its env var
// is set, otherwise returns seeded data that mirrors TradingView's
// homepage widgets (so the UI stays populated during dev / demos).
//
// Env var wiring (Vite `.env`):
//   VITE_FRED_API_KEY          — https://fred.stlouisfed.org/docs/api/api_key.html
//   VITE_POLYGON_API_KEY       — https://polygon.io
//   VITE_FINNHUB_API_KEY       — https://finnhub.io
//   VITE_KALSHI_EMAIL          — SexyBot feed (optional)
//   VITE_KALSHI_PASSWORD
//   VITE_POLYMARKET_READONLY   — "1" to enable read-only Polymarket polling

const FRED_KEY     = import.meta.env?.VITE_FRED_API_KEY     || '';
const POLYGON_KEY  = import.meta.env?.VITE_POLYGON_API_KEY  || '';
const FINNHUB_KEY  = import.meta.env?.VITE_FINNHUB_API_KEY  || '';

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
  if (!POLYGON_KEY) {
    return {
      volume:     seedHighestVolume,
      volatility: seedMostVolatile,
      gainers:    seedGainers,
      losers:     seedLosers,
    }[kind] ?? [];
  }
  return cached(`mm:${kind}`, 60_000, async () => {
    const map = { gainers: 'gainers', losers: 'losers' };
    const endpoint = map[kind];
    if (!endpoint) {
      // Volume / volatility not directly on Polygon free tier — fall back
      return {
        volume:     seedHighestVolume,
        volatility: seedMostVolatile,
      }[kind] ?? [];
    }
    const url = `https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/${endpoint}?apiKey=${POLYGON_KEY}`;
    const json = await safeFetch(url);
    if (!json?.tickers) return [];
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
  if (!POLYGON_KEY) return seedIndexes;
  return cached('indexes', 60_000, async () => {
    // Polygon previous-close endpoint per symbol
    const symbols = ['I:DXY', 'USO', 'UNG', 'GLD', 'CPER'];
    const out = await Promise.all(symbols.map(async (s) => {
      const j = await safeFetch(`https://api.polygon.io/v2/aggs/ticker/${s}/prev?apiKey=${POLYGON_KEY}`);
      return j?.results?.[0];
    }));
    // Map back to our seed shape; live wiring is symbolic here
    return seedIndexes.map((r, i) => out[i] ? { ...r, value: out[i].c, changePct: ((out[i].c - out[i].o) / out[i].o) * 100 } : r);
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
    if (obs.length < 14) return seedInflation;
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
  if (!FINNHUB_KEY) return seedEarnings;
  return cached('earnings', 5 * 60 * 1000, async () => {
    const from = dateOffset(0);
    const to   = dateOffset(7);
    const j = await safeFetch(
      `https://finnhub.io/api/v1/calendar/earnings?from=${from}&to=${to}&token=${FINNHUB_KEY}`
    );
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
  if (!FINNHUB_KEY) return seedIPOs;
  return cached('ipos', 5 * 60 * 1000, async () => {
    const from = dateOffset(-1);
    const to   = dateOffset(14);
    const j = await safeFetch(
      `https://finnhub.io/api/v1/calendar/ipo?from=${from}&to=${to}&token=${FINNHUB_KEY}`
    );
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
  if (!FINNHUB_KEY) return seedNews.slice(0, limit);
  return cached('news', 60_000, async () => {
    const url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`;
    const j = await safeFetch(url);
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

// ---------------------------------------------------------------- API status

export function apiStatus() {
  return {
    fred:    !!FRED_KEY,
    polygon: !!POLYGON_KEY,
    finnhub: !!FINNHUB_KEY,
  };
}
