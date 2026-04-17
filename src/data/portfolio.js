// Seed data for Blanck Capital Source of Truth v3
// Numbers are illustrative — this dashboard is the presentation layer;
// real balances are wired through the Plaid/OAuth bridge documented in the
// Developer Panel.

export const institutions = [
  {
    id: 'ms',
    name: 'Morgan Stanley',
    role: 'Master',
    accent: '#3DA9FC',
    accounts: [
      { id: 'ms-core',  name: 'Master Brokerage',     owner: 'Principal',    assets: 8_500_000, change: 0.62,  alloc: 28.3 },
      { id: 'ms-ira',   name: 'Morgan Stanley IRA',   owner: 'Principal',    assets: 2_000_000, change: 0.41,  alloc: 6.7  },
      { id: 'ms-trust', name: 'Family Trust',          owner: 'Family Trust', assets: 3_200_000, change: 0.18,  alloc: 10.7 },
    ],
  },
  {
    id: 'tiaa',
    name: 'TIAA',
    role: 'Retirement',
    accent: '#A78BFA',
    accounts: [
      { id: 'tiaa-403b', name: 'TIAA 403(b) Traditional', owner: 'Principal', assets: 600_000, change: 0.22, alloc: 2.0 },
      { id: 'tiaa-cref', name: 'CREF Equity Index',       owner: 'Principal', assets: 400_000, change: 0.55, alloc: 1.3 },
    ],
  },
  {
    id: 'fidelity',
    name: 'Fidelity',
    role: 'Equities & IRA',
    accent: '#00FFA3',
    accounts: [
      { id: 'fid-ind',     name: 'Fidelity Individual', owner: 'Principal', assets: 1_250_000, change: 0.94, alloc: 4.2 },
      { id: 'fid-rothira', name: 'Fidelity Roth IRA',   owner: 'Principal', assets:   350_000, change: 1.12, alloc: 1.2 },
    ],
  },
  {
    id: 'ny529',
    name: 'NY 529',
    role: 'Education',
    accent: '#FFB020',
    accounts: [
      { id: '529-a', name: '529 — Beneficiary 1', owner: 'Minor · Custodial', assets: 150_000, change: 0.34, alloc: 0.5 },
      { id: '529-l', name: '529 — Beneficiary 2', owner: 'Minor · Custodial', assets: 130_000, change: 0.34, alloc: 0.4 },
    ],
  },
  {
    id: 'bofa',
    name: 'Bank of America',
    role: 'Cash & Treasury',
    accent: '#3DA9FC',
    accounts: [
      { id: 'bofa-check', name: 'BofA Checking',      owner: 'Principal', assets: 200_000, change: 0.00, alloc: 0.7 },
      { id: 'bofa-pref',  name: 'BofA Preferred HYS', owner: 'Principal', assets: 850_000, change: 0.01, alloc: 2.8 },
    ],
  },
  {
    id: 'chase',
    name: 'Chase',
    role: 'Operating',
    accent: '#00FFA3',
    accounts: [
      { id: 'chase-op',  name: 'Chase Business Operating', owner: 'Holdings LLC', assets: 400_000, change: 0.00, alloc: 1.3 },
      { id: 'chase-res', name: 'Chase Reserve',            owner: 'Principal',    assets: 100_000, change: 0.00, alloc: 0.3 },
    ],
  },
  {
    id: 'citi',
    name: 'Citibank',
    role: 'FX & Travel',
    accent: '#A78BFA',
    accounts: [
      { id: 'citi-priv', name: 'Citi Private Client',   owner: 'Principal', assets: 550_000, change: 0.08, alloc: 1.8 },
      { id: 'citi-fx',   name: 'Citi FX (USD/CHF/JPY)', owner: 'Principal', assets: 200_000, change: -0.12, alloc: 0.7 },
    ],
  },
  {
    id: 'bci-pe',
    name: 'Blanck Capital Private Equity',
    role: 'Manual · Direct Holdings',
    accent: '#00FFA3',
    manual: true,
    accounts: [
      { id: 'pe-btr',     name: 'BTR Nation',     owner: 'Direct · SAFE',      assets: 1_800_000, change: 0.00, alloc: 6.0 },
      { id: 'pe-liquid',  name: 'Liquid Death',   owner: 'Direct · Series D',  assets: 2_650_000, change: 0.00, alloc: 8.8 },
      { id: 'pe-siete',   name: 'Siete Foods',    owner: 'Direct · Secondary', assets: 1_400_000, change: 0.00, alloc: 4.7 },
      { id: 'pe-neural',  name: 'Neuralink',      owner: 'SPV · Series D',     assets: 1_100_000, change: 0.00, alloc: 3.7 },
      { id: 'pe-figure',  name: 'Figure AI',      owner: 'SPV · Series B',     assets:   950_000, change: 0.00, alloc: 3.2 },
      { id: 'pe-anduril', name: 'Anduril',        owner: 'SPV · Series F',     assets: 1_550_000, change: 0.00, alloc: 5.2 },
      { id: 'pe-pplx',    name: 'Perplexity',     owner: 'SPV · Series C',     assets:   720_000, change: 0.00, alloc: 2.4 },
      { id: 'pe-starlab', name: 'Starlab Space',  owner: 'Direct · Seed',      assets:   600_000, change: 0.00, alloc: 2.0 },
    ],
  },
];

export const macroTickers = [
  { sym: 'S&P 500',   val: 5842.31,   chg:  0.47, unit: 'pts' },
  { sym: 'NASDAQ',    val: 20184.12,  chg:  0.81, unit: 'pts' },
  { sym: 'DJIA',      val: 42018.55,  chg:  0.22, unit: 'pts' },
  { sym: 'VIX',       val: 14.22,     chg: -2.10, unit: 'pts' },
  { sym: 'BTC/USD',   val: 96420.10,  chg:  1.84, unit: '$'   },
  { sym: 'ETH/USD',   val: 3412.55,   chg:  2.41, unit: '$'   },
  { sym: 'SOL/USD',   val: 198.33,    chg:  3.12, unit: '$'   },
  { sym: 'US10Y',     val: 4.28,      chg: -0.04, unit: '%'   },
  { sym: 'CPI YoY',   val: 2.9,       chg:  0.00, unit: '%'   },
  { sym: 'DXY',       val: 106.41,    chg:  0.11, unit: 'idx' },
  { sym: 'GOLD',      val: 2712.40,   chg:  0.54, unit: '$'   },
  { sym: 'WTI',       val: 71.20,     chg: -0.68, unit: '$'   },
];

export const predictionFeed = [
  {
    agent: 'SexyBot',
    venue: 'Kalshi',
    market: 'Fed cuts 25bps in June',
    conviction: 72,
    side: 'YES',
    price: 0.64,
    size: '$42K',
    pnl: +8_240,
    t: '12s',
  },
  {
    agent: 'Kash',
    venue: 'Polymarket',
    market: 'BTC > $110K by Q3',
    conviction: 58,
    side: 'YES',
    price: 0.41,
    size: '$28K',
    pnl: +3_110,
    t: '1m',
  },
  {
    agent: 'SexyBot',
    venue: 'Kalshi',
    market: 'CPI print < 2.8% (May)',
    conviction: 63,
    side: 'NO',
    price: 0.55,
    size: '$18K',
    pnl: -640,
    t: '4m',
  },
  {
    agent: 'Kash',
    venue: 'Polymarket',
    market: 'Anduril closes Series F in 2026',
    conviction: 81,
    side: 'YES',
    price: 0.77,
    size: '$12K',
    pnl: +1_920,
    t: '9m',
  },
  {
    agent: 'SexyBot',
    venue: 'Kalshi',
    market: 'S&P 500 closes green today',
    conviction: 55,
    side: 'YES',
    price: 0.58,
    size: '$9K',
    pnl: +410,
    t: '16m',
  },
];

export const ventures = [
  {
    id: 'neuralink',
    name: 'Neuralink',
    tag: 'BCI · Medtech',
    round: 'Series D',
    nextMilestone: 'PRIME trial N=10 readout',
    milestonePct: 62,
    daysSinceMark: 41,
    hype: 86,
    mark: '+18.4%',
    markPositive: true,
    accent: '#3DA9FC',
    image: 'linear-gradient(135deg, #0b1224 0%, #1a2b52 60%, #3DA9FC 140%)',
    news: [
      { t: '2d', h: 'FDA grants expanded IDE cohort (N+6)' },
      { t: '9d', h: 'Latency benchmark: 12ms median, below target' },
      { t: '21d', h: 'Secondary market bid tightens to +18% on last round' },
    ],
    synergy: 'Pairs with Figure AI (shared neuroprosthetic control stack) and Starlab (microgravity BCI study lane).',
  },
  {
    id: 'figure',
    name: 'Figure AI',
    tag: 'Humanoid Robotics',
    round: 'Series B',
    nextMilestone: 'Figure 02 @ 2nd OEM line',
    milestonePct: 48,
    daysSinceMark: 27,
    hype: 92,
    mark: '+31.0%',
    markPositive: true,
    accent: '#00FFA3',
    image: 'linear-gradient(135deg, #07110f 0%, #0f2e27 55%, #00FFA3 160%)',
    news: [
      { t: '1d', h: 'BMW extends pilot to second SC plant' },
      { t: '6d', h: 'Helix VLM-02 open-benchmark +14% vs prior' },
      { t: '14d', h: 'Secondary tender cleared at $39B' },
    ],
    synergy: 'Vertical integration with Anduril autonomy stack; Neuralink control primitives reused in Helix.',
  },
  {
    id: 'anduril',
    name: 'Anduril',
    tag: 'Defense · Autonomy',
    round: 'Series F',
    nextMilestone: 'Series F final close',
    milestonePct: 83,
    daysSinceMark: 12,
    hype: 78,
    mark: '+9.2%',
    markPositive: true,
    accent: '#A78BFA',
    image: 'linear-gradient(135deg, #0b0a1e 0%, #1b1740 60%, #A78BFA 160%)',
    news: [
      { t: '3h', h: 'DoD awards Lattice expansion ceiling +$1.2B' },
      { t: '5d', h: 'Barracuda-M autonomous cruise demo passes' },
      { t: '18d', h: 'Series F oversubscribed; allocations trimmed' },
    ],
    synergy: 'Lattice ↔ Figure for perimeter autonomy; Starlab for orbital ISR stack.',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    tag: 'AI · Answer Engine',
    round: 'Series C',
    nextMilestone: 'Enterprise API GA',
    milestonePct: 71,
    daysSinceMark: 54,
    hype: 74,
    mark: '+12.6%',
    markPositive: true,
    accent: '#00FFA3',
    image: 'linear-gradient(135deg, #07141a 0%, #0e2a34 60%, #00FFA3 160%)',
    news: [
      { t: '1d', h: 'Pages 2.0 rolls to Pro tier' },
      { t: '7d', h: 'Enterprise ACV $180K median, up 22% QoQ' },
      { t: '20d', h: 'Secondary quoted +12% above last primary' },
    ],
    synergy: 'Distribution channel for Figure/Anduril product search; Kalshi/Polymarket retrieval.',
  },
  {
    id: 'starlab',
    name: 'Starlab Space',
    tag: 'Orbital · LEO Station',
    round: 'Seed Ext.',
    nextMilestone: 'CDR — habitat module',
    milestonePct: 38,
    daysSinceMark: 96,
    hype: 61,
    mark: 'Flat',
    markPositive: true,
    accent: '#FFB020',
    image: 'linear-gradient(135deg, #141006 0%, #2c2210 60%, #FFB020 160%)',
    news: [
      { t: '6d', h: 'NASA CCSD milestone #3 signed' },
      { t: '29d', h: 'Voyager–Airbus–MDA consortium confirmed' },
      { t: '64d', h: 'Microgravity BCI payload slot reserved (Neuralink)' },
    ],
    synergy: 'Launch cadence feeds Anduril orbital ISR and Neuralink microgravity research.',
  },
];

// Liquidity ladder — buckets representing "time-to-cash"
export const liquidityLadder = [
  { bucket: 'Instant',  label: 'Cash / Crypto',         value: 1_881_000, color: '#00FFA3' },
  { bucket: 'Liquid',   label: 'Public Equities',       value: 16_211_300, color: '#3DA9FC' },
  { bucket: '1–3 yr',   label: 'Private Debt',          value: 2_450_000, color: '#A78BFA' },
  { bucket: '5 yr +',   label: 'Venture / Real Estate', value: 9_700_000, color: '#FFB020' },
];

// Per-account sparkline / price series — keyed by account id.
export function seriesFor(accountId) {
  // Deterministic pseudo-random walk per account id so charts are stable
  // across renders but feel unique.
  const seed = [...accountId].reduce((a, c) => a + c.charCodeAt(0), 0);
  let s = seed % 97;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const base = 100;
  const points = 96;
  let value = base;
  const out = [];
  for (let i = 0; i < points; i++) {
    const drift = (rand() - 0.48) * 1.6;
    value = Math.max(55, Math.min(160, value + drift));
    out.push({
      t: i,
      v: +value.toFixed(2),
      g: +(value + (rand() - 0.5) * 0.6).toFixed(2),
    });
  }
  return out;
}

export function totalAssets() {
  return institutions.reduce(
    (sum, inst) => sum + inst.accounts.reduce((s, a) => s + a.assets, 0),
    0
  );
}

export function institutionTotal(inst) {
  return inst.accounts.reduce((s, a) => s + a.assets, 0);
}
