// Sanitized demo seed for the public GitHub Pages preview.
// No real family names, no real account numbers, no real portfolio values.
// Structure mirrors portfolio.js so every downstream consumer works
// identically against this file.

export const institutions = [
  {
    id: 'ms', name: 'Morgan Stanley', role: 'Master · Wealth Management', accent: '#005EB8',
    accounts: [
      { id: 'ms-brokerage', name: 'Active Assets Account', owner: 'Principal', assets: 6_500_000, cash: 120_000, change:  85_000, changePct: 1.32 },
      { id: 'ms-ira',       name: 'Traditional IRA',       owner: 'Principal', assets: 1_800_000, cash:  20_000, change:  15_000, changePct: 0.84 },
      { id: 'ms-trust',     name: 'Family Trust',          owner: 'Trust',     assets: 2_200_000, cash:  30_000, change:  20_000, changePct: 0.91 },
    ],
  },
  {
    id: 'tiaa', name: 'TIAA', role: 'Retirement', accent: '#4C1D95',
    accounts: [
      { id: 'tiaa-403b', name: '403(b) Traditional', owner: 'Principal', assets: 2_200_000, cash: 0, change: 500, changePct: 0.02 },
      { id: 'tiaa-cref', name: 'CREF Equity Index',  owner: 'Principal', assets: 1_500_000, cash: 0, change: 300, changePct: 0.02 },
    ],
  },
  {
    id: 'fidelity', name: 'Fidelity Investments', role: 'Brokerage · HSA · TOD', accent: '#0B7D3F',
    accounts: [
      {
        id: 'fid-tod', name: 'Individual · TOD', owner: 'Principal',
        assets: 450_000, cash: 5_000, change: 6_200, changePct: 1.40,
        holdings: [
          { symbol: 'GOOG', name: 'Alphabet Cl C',  assetClass: 'Equity',       qty: 300, avgCost: 120, price: 340, value: 102_000, change: 2_000, changePct: 2.00, gainPct: 180 },
          { symbol: 'AAPL', name: 'Apple',          assetClass: 'Equity',       qty: 400, avgCost: 120, price: 270, value: 108_000, change: 2_500, changePct: 2.30, gainPct: 125 },
          { symbol: 'MSFT', name: 'Microsoft',      assetClass: 'Equity',       qty: 150, avgCost: 280, price: 420, value:  63_000, change:   400, changePct: 0.64, gainPct:  50 },
          { symbol: 'NVDA', name: 'Nvidia',         assetClass: 'Equity',       qty:  50, avgCost: 180, price: 200, value:  10_000, change:   150, changePct: 1.50, gainPct:  10 },
          { symbol: 'AGG',  name: 'US Agg Bond ETF',assetClass: 'Fixed Income', qty: 100, avgCost: 100, price: 100, value:  10_000, change:    50, changePct: 0.50, gainPct:   0 },
          { symbol: 'CASH', name: 'Money Market',   assetClass: 'Cash',         qty: null, avgCost: null, price: null, value: 5_000, change: 0, changePct: 0, gainPct: 0 },
        ],
      },
      { id: 'fid-hsa', name: 'Health Savings Account', owner: 'Spouse', assets: 40_000, cash: 0, change: 500, changePct: 1.25 },
    ],
  },
  {
    id: 'ny529', name: '529 Advisor Guided', role: 'Education · College Savings', accent: '#B45309',
    accounts: [
      { id: '529-a', name: '529 · Beneficiary A', owner: 'Minor · Custodial', assets: 250_000, cash: 0, change: -120, changePct: -0.05 },
      { id: '529-b', name: '529 · Beneficiary B', owner: 'Minor · Custodial', assets: 230_000, cash: 0, change: -110, changePct: -0.05 },
    ],
  },
  {
    id: 'bofa',  name: 'Bank of America', role: 'Cash & Treasury', accent: '#1E40AF',
    accounts: [{ id: 'bofa-check', name: 'Checking', owner: 'Principal', assets: 25_000, cash: 25_000, change: 0, changePct: 0 }],
  },
  {
    id: 'chase', name: 'Chase', role: 'Operating', accent: '#0EA5E9',
    accounts: [{ id: 'chase-op', name: 'Business Operating', owner: 'Holdings LLC', assets: 8_000, cash: 8_000, change: 0, changePct: 0 }],
  },
  {
    id: 'citi',  name: 'Citibank', role: 'FX & Travel', accent: '#0369A1',
    accounts: [{ id: 'citi-priv', name: 'Private Client', owner: 'Principal', assets: 5_000, cash: 5_000, change: 0, changePct: 0 }],
  },
];

export const manualAccounts = [
  { id: 'm-res-primary',  name: 'Primary Residence',                 category: 'Real Estate',    opened: '01/15/2024', value: 1_800_000 },
  { id: 'm-re-fund',      name: 'Real Estate Fund I',                category: 'Real Estate',    opened: '06/01/2024', value:   400_000 },
  { id: 'm-neuralink',    name: 'Neuralink · Series D',              category: 'Private Equity', opened: '01/28/2026', value:   100_000 },
  { id: 'm-figure',       name: 'Figure AI · Series B',              category: 'Private Equity', opened: '03/16/2025', value:    25_000 },
  { id: 'm-anduril',      name: 'Anduril · Series F',                category: 'Private Equity', opened: '03/23/2026', value:    15_000 },
  { id: 'm-perplexity',   name: 'Perplexity · Series C',             category: 'Private Equity', opened: '02/02/2026', value:    50_000 },
  { id: 'm-starlab',      name: 'Starlab Space · Seed Ext.',         category: 'Private Equity', opened: '06/17/2025', value:    20_000 },
  { id: 'm-demo-spv1',    name: 'Demo SPV · Venture I',              category: 'Private Equity', opened: '09/04/2025', value:   100_000 },
  { id: 'm-demo-spv2',    name: 'Demo SPV · Venture II',             category: 'Private Equity', opened: '10/01/2025', value:    75_000 },
  { id: 'm-demo-spv3',    name: 'Demo SPV · Venture III',            category: 'Private Equity', opened: '08/22/2025', value:    35_000 },
  { id: 'm-treasury',     name: 'Treasury Direct',                   category: 'Fixed Income',   opened: '02/26/2024', value:    20_000 },
  { id: 'm-crypto',       name: 'Crypto Wallet',                     category: 'Digital Assets', opened: '01/07/2025', value:     8_000 },
  { id: 'm-collectibles', name: 'Collectibles · Art + Watches',      category: 'Collectibles',   opened: '09/13/2025', value:   150_000 },
];

export const liabilities = [
  { id: 'mortgage', name: 'Primary Residence Mortgage', institution: 'Morgan Stanley PLA', balance: 800_000, rate: 6.25, type: 'Mortgage' },
  { id: 'heloc',    name: 'HELOC',                      institution: 'Bank of America',    balance: 100_000, rate: 8.10, type: 'HELOC' },
];

export const categoryRollups = [
  { id: 'equities',  label: 'Public Equities',   color: '#005EB8' },
  { id: 'cash',      label: 'Cash & Treasuries', color: '#10B981' },
  { id: 'pe',        label: 'Private Equity',    color: '#8B5CF6' },
  { id: 're',        label: 'Real Estate',       color: '#B45309' },
  { id: 'fi',        label: 'Fixed Income',      color: '#2563EB' },
  { id: 'brokerage', label: 'Brokerage',         color: '#0EA5E9' },
  { id: 'retire',    label: 'Retirement',        color: '#7C3AED' },
  { id: 'college',   label: '529 / Education',   color: '#F59E0B' },
  { id: 'crypto',    label: 'Digital Assets',    color: '#EC4899' },
  { id: 'collect',   label: 'Collectibles',      color: '#64748B' },
];

export const categoryColor = {
  'Real Estate':    '#B45309',
  'Private Equity': '#8B5CF6',
  'Fixed Income':   '#2563EB',
  'Brokerage':      '#0EA5E9',
  'Digital Assets': '#EC4899',
  'Collectibles':   '#64748B',
};

export const macroTickers = [
  { sym: 'SPX',     val:  7_101.73, chg:  0.86, unit: 'pts' },
  { sym: 'NDX',     val: 24_380.11, chg:  1.15, unit: 'pts' },
  { sym: 'DJIA',    val: 49_189.47, chg:  1.26, unit: 'pts' },
  { sym: 'VIX',     val:     14.22, chg: -2.10, unit: 'pts' },
  { sym: 'DXY',     val:    106.41, chg:  0.11, unit: 'idx' },
  { sym: 'US10Y',   val:      4.28, chg: -0.04, unit: '%'   },
  { sym: 'BTC/USD', val: 96_420.10, chg:  1.84, unit: '$'   },
  { sym: 'ETH/USD', val:  3_412.55, chg:  2.41, unit: '$'   },
];

export const predictionFeed = [
  { agent: 'SexyBot', venue: 'Kalshi',     market: 'Fed cuts 25bps in June',         conviction: 72, side: 'YES', price: 0.64, size: '$42K', pnl:  8240, t: '12s' },
  { agent: 'Kash',    venue: 'Polymarket', market: 'BTC > $110K by Q3',              conviction: 58, side: 'YES', price: 0.41, size: '$28K', pnl:  3110, t: '1m'  },
  { agent: 'SexyBot', venue: 'Kalshi',     market: 'CPI print < 2.8% (May)',         conviction: 63, side: 'NO',  price: 0.55, size: '$18K', pnl:  -640, t: '4m'  },
  { agent: 'Kash',    venue: 'Polymarket', market: 'Anduril closes Series F in 2026',conviction: 81, side: 'YES', price: 0.77, size: '$12K', pnl:  1920, t: '9m'  },
  { agent: 'SexyBot', venue: 'Kalshi',     market: 'S&P 500 closes green today',     conviction: 55, side: 'YES', price: 0.58, size: '$9K',  pnl:   410, t: '16m' },
];

export const ventures = [
  { id: 'neuralink', name: 'Neuralink',     tag: 'BCI · Medtech',         round: 'Series D',  nextMilestone: 'PRIME trial readout',    milestonePct: 62, daysSinceMark: 41, hype: 86, mark: '+18.4%', markPositive: true, accent: '#005EB8', image: 'linear-gradient(135deg, #0b1224 0%, #1a2b52 60%, #3DA9FC 140%)', imageLight: 'linear-gradient(135deg, #EFF6FF 0%, #BFDBFE 55%, #3DA9FC 160%)', news: [{t:'2d',h:'FDA grants expanded IDE cohort'}], synergy: 'Demo venture.' },
  { id: 'figure',    name: 'Figure AI',     tag: 'Humanoid Robotics',     round: 'Series B',  nextMilestone: 'Figure 02 @ 2nd OEM',     milestonePct: 48, daysSinceMark: 27, hype: 92, mark: '+31.0%', markPositive: true, accent: '#10B981', image: 'linear-gradient(135deg, #07110f 0%, #0f2e27 55%, #10B981 160%)', imageLight: 'linear-gradient(135deg, #ECFDF5 0%, #A7F3D0 55%, #10B981 160%)', news: [{t:'1d',h:'BMW extends pilot'}], synergy: 'Demo venture.' },
  { id: 'anduril',   name: 'Anduril',       tag: 'Defense · Autonomy',    round: 'Series F',  nextMilestone: 'Series F final close',    milestonePct: 83, daysSinceMark: 12, hype: 78, mark: '+9.2%',  markPositive: true, accent: '#8B5CF6', image: 'linear-gradient(135deg, #0b0a1e 0%, #1b1740 60%, #8B5CF6 160%)', imageLight: 'linear-gradient(135deg, #F5F3FF 0%, #DDD6FE 55%, #8B5CF6 160%)', news: [{t:'3h',h:'DoD awards Lattice +$1.2B'}], synergy: 'Demo venture.' },
  { id: 'perplexity',name: 'Perplexity',    tag: 'AI · Answer Engine',    round: 'Series C',  nextMilestone: 'Enterprise API GA',       milestonePct: 71, daysSinceMark: 54, hype: 74, mark: '+12.6%', markPositive: true, accent: '#0EA5E9', image: 'linear-gradient(135deg, #07141a 0%, #0e2a34 60%, #0EA5E9 160%)', imageLight: 'linear-gradient(135deg, #ECFEFF 0%, #A5F3FC 55%, #0EA5E9 160%)', news: [{t:'1d',h:'Pages 2.0 rolls to Pro'}], synergy: 'Demo venture.' },
  { id: 'starlab',   name: 'Starlab Space', tag: 'Orbital · LEO Station', round: 'Seed Ext.', nextMilestone: 'CDR — habitat module',    milestonePct: 38, daysSinceMark: 96, hype: 61, mark: 'Flat',   markPositive: true, accent: '#F59E0B', image: 'linear-gradient(135deg, #141006 0%, #2c2210 60%, #F59E0B 160%)', imageLight: 'linear-gradient(135deg, #FFFBEB 0%, #FDE68A 55%, #F59E0B 160%)', news: [{t:'6d',h:'NASA CCSD milestone signed'}], synergy: 'Demo venture.' },
];

export const venturesById = {
  'm-neuralink':  'neuralink',
  'm-figure':     'figure',
  'm-anduril':    'anduril',
  'm-perplexity': 'perplexity',
  'm-starlab':    'starlab',
};

export const liquidityLadder = [
  { bucket: 'Instant',  label: 'Cash / Crypto',         value:   200_000, color: '#10B981' },
  { bucket: 'Liquid',   label: 'Public Equities',       value: 9_000_000, color: '#005EB8' },
  { bucket: '1–3 yr',   label: 'Private Debt',          value:   800_000, color: '#0EA5E9' },
  { bucket: '5 yr +',   label: 'Venture / Real Estate', value: 3_500_000, color: '#8B5CF6' },
];

export function seriesFor(accountId) {
  const seed = [...accountId].reduce((a, c) => a + c.charCodeAt(0), 0);
  let s = seed % 97;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const out = [];
  let value = 100;
  for (let i = 0; i < 96; i++) {
    const drift = (rand() - 0.48) * 1.6;
    value = Math.max(55, Math.min(160, value + drift));
    out.push({ t: i, v: +value.toFixed(2), g: +(value + (rand() - 0.5) * 0.6).toFixed(2) });
  }
  return out;
}

export function institutionTotal(inst)  { return inst.accounts.reduce((s, a) => s + a.assets, 0); }
export function institutionCash(inst)   { return inst.accounts.reduce((s, a) => s + (a.cash || 0), 0); }
export function institutionChange(inst) { return inst.accounts.reduce((s, a) => s + (a.change || 0), 0); }
export function manualAccountsTotal()   { return manualAccounts.reduce((s, a) => s + a.value, 0); }
export function totalAssets()           { return institutions.reduce((s, i) => s + institutionTotal(i), 0) + manualAccountsTotal(); }
export function totalCash()             { return institutions.reduce((s, i) => s + institutionCash(i), 0); }
export function totalLiabilities()      { return liabilities.reduce((s, l) => s + l.balance, 0); }
export function totalWealth()           { return totalAssets() - totalLiabilities(); }
export function todaysChange()          { return institutions.reduce((s, i) => s + institutionChange(i), 0); }
