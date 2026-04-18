// Portfolio source-of-truth — seeded from the actual Morgan Stanley Overview
// page so the dashboard reads like a real position sheet until the Plaid /
// OAuth bridge is live.
//
// Current snapshot: Morgan Stanley aggregate as of 04/18/2026
//   Total Assets:       $31,423,500.69
//   Total Liabilities:  $1,443,835.51
//   Total Wealth:       $29,979,665.18
//
// Every dollar figure here is a placeholder for the real feed; when Plaid
// is wired in, `institutions` / `manualAccounts` / `liabilities` will be
// overwritten from the API and everything downstream keeps working.

export const institutions = [
  {
    id: 'ms',
    name: 'Morgan Stanley',
    role: 'Master · Wealth Management',
    accent: '#005EB8',
    // 04/18/2026: total 17,998,652.95 · cash 185,360.19 · +229,946.81 (+1.28%)
    // Reconciled to MS Overview aggregate — brokerage absorbs the delta.
    accounts: [
      { id: 'ms-brokerage', name: 'Active Assets Account',    owner: 'Principal',    assets: 11_169_614.95, cash: 140_122.34, change: 170_738.29, changePct: 1.53 },
      { id: 'ms-ira',       name: 'Morgan Stanley IRA',       owner: 'Principal',    assets:  2_626_108.00, cash:  22_110.00, change:  22_500.00, changePct: 0.86 },
      { id: 'ms-trust',     name: 'Family Trust — Revocable', owner: 'Family Trust', assets:  4_202_930.00, cash:  23_127.85, change:  36_708.52, changePct: 0.88 },
    ],
  },
  {
    id: 'tiaa',
    name: 'TIAA',
    role: 'Retirement',
    accent: '#4C1D95',
    // 04/18/2026: total 5,655,700.93 · +167.95 (+0.00%)
    accounts: [
      { id: 'tiaa-403b', name: 'TIAA 403(b) Traditional', owner: 'Principal', assets: 3_429_578.71, cash: 0, change: 122.95, changePct: 0.00 },
      { id: 'tiaa-cref', name: 'CREF Equity Index',       owner: 'Principal', assets: 2_226_122.22, cash: 0, change:  45.00, changePct: 0.00 },
    ],
  },
  {
    id: 'fidelity',
    name: 'Fidelity Investments',
    role: 'Brokerage · HSA · TOD',
    accent: '#0B7D3F',
    // EOD 04/18/2026: total 501,479.73 · +8,552.74 (+1.73%)
    // Fidelity does not expose Plaid access — manually seeded from the
    // Portfolio Positions page. Update the Connected Accounts editor
    // if account-level values drift.
    accounts: [
      {
        id: 'fid-jason-tod', name: 'Individual · TOD', owner: 'Jason · Z21498821',
        assets: 0.01, cash: 0.01, change: 0, changePct: 0.00,
        holdings: [
          { symbol: 'CASH',       name: 'Held in Money Market',             assetClass: 'Cash',     qty: null,  avgCost: null,  price: null,    value:    0.01, change: 0, changePct: 0,      gainPct:    0.00 },
          { symbol: '58507M107',  name: 'MedMen Enterprises · Common',      assetClass: 'Equity',   qty: 43,    avgCost: 0.50,  price: 0.00,    value:    0.00, change: 0, changePct: 0,      gainPct: -100.00 },
        ],
      },
      {
        id: 'fid-elise-tod', name: 'Elise Individual · TOD', owner: 'Elise · X69699561',
        assets: 0.01, cash: 0.01, change: 0, changePct: 0.00,
        holdings: [
          { symbol: 'CASH',       name: 'Held in Money Market',             assetClass: 'Cash',     qty: null,  avgCost: null,  price: null,    value:    0.01, change: 0, changePct: 0,      gainPct:    0.00 },
        ],
      },
      {
        id: 'fid-elise-hsa', name: 'Elise Health Savings Account', owner: 'Elise · 225353906',
        assets: 312.10, cash: 0.00, change: 6.08, changePct: 1.99,
        holdings: [
          { symbol: 'FSPTX',      name: 'Fidelity Select Technology',       assetClass: 'Mutual Fund', qty:  6.99, avgCost: 30.77, price:  44.65, value:  312.10, change:   6.08, changePct:  1.98, gainPct:  45.09 },
          { symbol: '58507M107',  name: 'MedMen Enterprises · Common',      assetClass: 'Equity',      qty: 25,    avgCost: 0.46,  price: 0.00,    value:    0.00, change: 0,      changePct: 0,     gainPct: -100.00 },
        ],
      },
      {
        id: 'fid-mj-tod', name: 'MJ Individual · TOD', owner: 'Jason · X66877287',
        assets: 501_167.62, cash: 1.54, change: 8_546.66, changePct: 1.73,
        holdings: [
          { symbol: 'GOOG', name: 'Alphabet Inc · Class C',              assetClass: 'Equity',       qty: 404, avgCost: 118.05, price: 339.40, value: 137_117.60, change: 2_678.52, changePct: 1.99, gainPct: 187.49 },
          { symbol: 'AAPL', name: 'Apple Inc',                           assetClass: 'Equity',       qty: 462, avgCost: 113.30, price: 270.23, value: 124_846.26, change: 3_155.46, changePct: 2.59, gainPct: 138.51 },
          { symbol: 'AMZN', name: 'Amazon.com Inc',                      assetClass: 'Equity',       qty: 271, avgCost: 132.01, price: 250.56, value:  67_901.76, change:   233.06, changePct: 0.34, gainPct:  89.80 },
          { symbol: 'MSFT', name: 'Microsoft Corp',                      assetClass: 'Equity',       qty: 155, avgCost: 277.59, price: 422.79, value:  65_532.45, change:   392.15, changePct: 0.60, gainPct:  52.30 },
          { symbol: 'META', name: 'Meta Platforms · Class A',            assetClass: 'Equity',       qty:  75, avgCost: 240.90, price: 688.55, value:  51_641.25, change:   876.00, changePct: 1.72, gainPct: 185.81 },
          { symbol: 'PLTR', name: 'Palantir Technologies · Class A',     assetClass: 'Equity',       qty: 250, avgCost:  75.03, price: 146.39, value:  36_597.50, change:   907.50, changePct: 2.54, gainPct:  95.10 },
          { symbol: 'TSLA', name: 'Tesla Inc',                           assetClass: 'Equity',       qty:  17, avgCost: 429.90, price: 400.62, value:   6_810.54, change:   199.24, changePct: 3.01, gainPct:  -6.82 },
          { symbol: 'AGG',  name: 'iShares Core US Aggregate Bond ETF',  assetClass: 'Fixed Income', qty:  57, avgCost: 100.34, price:  99.85, value:   5_691.45, change:    21.09, changePct: 0.37, gainPct:  -0.49 },
          { symbol: 'NVDA', name: 'Nvidia Corporation',                  assetClass: 'Equity',       qty:  22, avgCost: 183.67, price: 201.68, value:   4_436.96, change:    73.26, changePct: 1.67, gainPct:   9.80 },
          { symbol: 'ARCC', name: 'Ares Capital Corp',                   assetClass: 'Equity',       qty:  30, avgCost:  18.26, price:  19.09, value:     572.70, change:     9.30, changePct: 1.65, gainPct:   4.57 },
          { symbol: 'JBLU', name: 'JetBlue Airways Corp',                assetClass: 'Equity',       qty:   3, avgCost:   4.45, price:   5.87, value:      17.61, change:     1.08, changePct: 6.53, gainPct:  32.00 },
          { symbol: 'CASH', name: 'Held in Money Market',                assetClass: 'Cash',         qty: null, avgCost: null, price: null,   value:       1.54, change: 0,       changePct: 0,    gainPct:    0.00 },
        ],
      },
    ],
  },
  {
    id: 'ny529',
    name: 'NY 529 Advisor Guided',
    role: 'Education · College Savings',
    accent: '#B45309',
    // 04/18/2026: total 503,770.10 · -277.04 (-0.05%)
    accounts: [
      { id: '529-a', name: '529 — Beneficiary 1', owner: 'Minor · Custodial', assets: 261_735.73,  cash: 0, change: -142.40, changePct: -0.05 },
      { id: '529-b', name: '529 — Beneficiary 2', owner: 'Minor · Custodial', assets: 242_034.37,  cash: 0, change: -134.64, changePct: -0.06 },
    ],
  },
  {
    id: 'bofa',
    name: 'Bank of America',
    role: 'Cash & Treasury',
    accent: '#1E40AF',
    // EOD 04/17: 7,984.96 · -742.47 (-8.51%)
    accounts: [
      { id: 'bofa-check', name: 'BofA Checking', owner: 'Principal', assets: 7_984.96, cash: 7_984.96, change: -742.47, changePct: -8.51 },
    ],
  },
  {
    id: 'chase',
    name: 'Chase',
    role: 'Operating',
    accent: '#0EA5E9',
    // EOD 04/17: 2,100.04
    accounts: [
      { id: 'chase-op', name: 'Chase Business Operating', owner: 'Holdings LLC', assets: 2_100.04, cash: 2_100.04, change: 0, changePct: 0.00 },
    ],
  },
  {
    id: 'citi',
    name: 'Citibank',
    role: 'FX & Travel',
    accent: '#0369A1',
    // EOD 04/17: 3,756.42
    accounts: [
      { id: 'citi-priv', name: 'Citi Private Client', owner: 'Principal', assets: 3_756.42, cash: 3_756.42, change: 0, changePct: 0.00 },
    ],
  },
];

// Manual accounts / SPVs / direct holdings / real assets.
// Mirrors the actual Morgan Stanley "Manual Accounts" list; names +
// opened dates taken from the MS position sheet.
export const manualAccounts = [
  // --- Real assets / housing ---
  { id: 'm-res-bedford', name: 'Residence · Bedford, NY',              category: 'Real Estate',    opened: '03/25/2026', value: 4_591_500.00 },
  { id: 'm-onshore',     name: 'OnShore Daytona L3 College Campus Promote', category: 'Real Estate', opened: '03/26/2026', value:   500_000 },
  { id: 'm-gator',       name: 'Gator Apartment Venture, LLC (L3)',     category: 'Real Estate',    opened: '01/28/2026', value:   460_000 },
  { id: 'm-buckeye',     name: 'Buckeye Apartment Investors, LLC',      category: 'Real Estate',    opened: '12/14/2023', value:   100_000 },
  { id: 'm-college',     name: 'College House Partners LLC 2023',       category: 'Real Estate',    opened: '03/08/2024', value:   100_000 },

  // --- Private equity / SPVs / SAFEs ---
  { id: 'm-btr',         name: 'BTR Nation',                            category: 'Private Equity', opened: '05/25/2025', value:   150_000 },
  { id: 'm-coglee',      name: 'COGLEE 207TH Partners LLC (Inwood)',    category: 'Private Equity', opened: '09/04/2025', value:   133_000 },
  { id: 'm-cob',         name: 'Cob Inc.',                              category: 'Private Equity', opened: '10/01/2025', value:   100_000 },
  { id: 'm-neuralink',   name: 'Neuralink JUN 2025 · A Series of CGF',  category: 'Private Equity', opened: '01/28/2026', value:   100_000 },
  { id: 'm-perplexity',  name: 'Perplexity AI',                         category: 'Private Equity', opened: '02/02/2026', value:    55_555.56 },
  { id: 'm-kalshi',      name: 'Kalshi · KALS1 SPV Riverside',          category: 'Private Equity', opened: '04/09/2026', value:    50_000 },
  { id: 'm-drumroll',    name: 'Drumroll Snacks, Inc.',                 category: 'Private Equity', opened: '08/22/2025', value:    35_000 },
  { id: 'm-figure',      name: 'Figure AI · FI-0208 Fund III Series C', category: 'Private Equity', opened: '03/16/2025', value:    25_000 },
  { id: 'm-ghia',        name: 'GHIA Dec 2023 · Series of CGF2021',     category: 'Private Equity', opened: '01/05/2024', value:    25_000 },
  { id: 'm-allergy',     name: 'Allergy Amulet',                        category: 'Private Equity', opened: '12/02/2024', value:    25_000 },
  { id: 'm-spring',      name: 'Spring & Mulberry Inc. · SAFE',         category: 'Private Equity', opened: '02/26/2024', value:    25_000 },
  { id: 'm-starlab',     name: 'Starlab Space · ST-0528 Fund I',        category: 'Private Equity', opened: '06/17/2025', value:    20_000 },
  { id: 'm-anduril',     name: 'Anduril 325 · Series SLRTE I LLC',      category: 'Private Equity', opened: '03/23/2026', value:    15_000 },
  { id: 'm-longshot',    name: 'Longshot Space · LO-0219 Gaingels F1',  category: 'Private Equity', opened: '03/02/2025', value:    10_000 },
  { id: 'm-nypc',        name: 'New York Padel Club, Inc.',             category: 'Private Equity', opened: '01/13/2025', value:    10_000 },
  { id: 'm-repurpose',   name: 'Repurpose · Feb 2025 a Series of CGF',  category: 'Private Equity', opened: '03/31/2025', value:    10_000 },
  { id: 'm-ripple',      name: 'Ripple · RIP2 SPV Riverside Ventures',  category: 'Private Equity', opened: '03/25/2025', value:    10_000 },
  { id: 'm-sandboxaq',   name: 'SandboxAQ · SANAQ1 SPV Riverside',      category: 'Private Equity', opened: '01/17/2025', value:    10_000 },
  { id: 'm-sku',         name: 'SKU LLC · 2024 Equity Membership',      category: 'Private Equity', opened: '01/09/2024', value:    10_000 },
  { id: 'm-neuma',       name: 'Neuma · NE-0825 Fund I',                category: 'Private Equity', opened: '10/14/2025', value:     6_000 },
  { id: 'm-liquid',      name: 'Liquid Death · LIQ6 SPV',               category: 'Private Equity', opened: '08/29/2025', value:     5_000 },
  { id: 'm-autopilot',   name: 'Autopilot Invest · AU-0902 Fund II',    category: 'Private Equity', opened: '09/09/2025', value:     3_000 },
  { id: 'm-hermeus',     name: 'Hermeus · HE-0828 Fund II',             category: 'Private Equity', opened: '09/25/2025', value:     2_500 },

  // --- Fixed income ---
  { id: 'm-treasury',    name: 'Treasury Direct',                       category: 'Fixed Income',   opened: '02/26/2024', value:    13_000 },
  { id: 'm-israel',      name: 'Israel Bonds',                          category: 'Fixed Income',   opened: '12/01/2024', value:     7_000 },

  // --- Brokerage / digital ---
  { id: 'm-crypto',      name: 'Crypto · Coinbase + Phantom',           category: 'Digital Assets', opened: '01/07/2025', value:     5_000 },
  { id: 'm-webull',      name: 'Webull',                                category: 'Brokerage',      opened: '09/09/2025', value:       500 },

  // --- Collectibles ---
  { id: 'm-jewelry',     name: 'Jewelry & Diamonds',                    category: 'Collectibles',   opened: '09/13/2025', value:    60_500 },
  { id: 'm-art',         name: 'Art & Memorabilia',                     category: 'Collectibles',   opened: '09/30/2024', value:    50_000 },
  { id: 'm-handbags',    name: 'Handbags · Chanel, Gucci, Goyard',      category: 'Collectibles',   opened: '12/11/2024', value:    27_500 },
];

export const liabilities = [
  { id: 'mortgage', name: 'Bedford · First Mortgage',    institution: 'Morgan Stanley PLA', balance: 1_120_000, rate: 6.25, type: 'Mortgage' },
  { id: 'heloc',    name: 'Bedford · HELOC',             institution: 'Bank of America',    balance:   220_000, rate: 8.10, type: 'HELOC' },
  { id: 'liqline',  name: 'Liquidity Access Line',       institution: 'Morgan Stanley',     balance:   103_835.51, rate: 4.65, type: 'PLA' },
];

// Top-level categories — used by the "Categories" sub-toggle.
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

// Map manual-account category label → categoryRollups color for consistent
// accent colors across the dashboard.
export const categoryColor = {
  'Real Estate':    '#B45309',
  'Private Equity': '#8B5CF6',
  'Fixed Income':   '#2563EB',
  'Brokerage':      '#0EA5E9',
  'Digital Assets': '#EC4899',
  'Collectibles':   '#64748B',
};


// Macro ticker — TradingView-tight: 4 indices + 2 crypto only.
// Additional instruments surface in the Markets section below.
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
  { id: 'neuralink', name: 'Neuralink',     tag: 'BCI · Medtech',         round: 'Series D',   nextMilestone: 'PRIME trial N=10 readout',        milestonePct: 62, daysSinceMark: 41, hype: 86, mark: '+18.4%', markPositive: true,  accent: '#005EB8', image: 'linear-gradient(135deg, #0b1224 0%, #1a2b52 60%, #3DA9FC 140%)', imageLight: 'linear-gradient(135deg, #EFF6FF 0%, #BFDBFE 55%, #3DA9FC 160%)', news: [{t:'2d',h:'FDA grants expanded IDE cohort (N+6)'},{t:'9d',h:'Latency benchmark: 12ms median, below target'},{t:'21d',h:'Secondary market bid tightens to +18% on last round'}], synergy: 'Pairs with Figure AI (shared neuroprosthetic control stack) and Starlab (microgravity BCI study lane).' },
  { id: 'figure',    name: 'Figure AI',     tag: 'Humanoid Robotics',     round: 'Series B',   nextMilestone: 'Figure 02 @ 2nd OEM line',        milestonePct: 48, daysSinceMark: 27, hype: 92, mark: '+31.0%', markPositive: true,  accent: '#10B981', image: 'linear-gradient(135deg, #07110f 0%, #0f2e27 55%, #10B981 160%)', imageLight: 'linear-gradient(135deg, #ECFDF5 0%, #A7F3D0 55%, #10B981 160%)', news: [{t:'1d',h:'BMW extends pilot to second SC plant'},{t:'6d',h:'Helix VLM-02 open-benchmark +14% vs prior'},{t:'14d',h:'Secondary tender cleared at $39B'}], synergy: 'Vertical integration with Anduril autonomy stack; Neuralink control primitives reused in Helix.' },
  { id: 'anduril',   name: 'Anduril',       tag: 'Defense · Autonomy',    round: 'Series F',   nextMilestone: 'Series F final close',             milestonePct: 83, daysSinceMark: 12, hype: 78, mark: '+9.2%',  markPositive: true,  accent: '#8B5CF6', image: 'linear-gradient(135deg, #0b0a1e 0%, #1b1740 60%, #8B5CF6 160%)', imageLight: 'linear-gradient(135deg, #F5F3FF 0%, #DDD6FE 55%, #8B5CF6 160%)', news: [{t:'3h',h:'DoD awards Lattice expansion ceiling +$1.2B'},{t:'5d',h:'Barracuda-M autonomous cruise demo passes'},{t:'18d',h:'Series F oversubscribed; allocations trimmed'}], synergy: 'Lattice ↔ Figure for perimeter autonomy; Starlab for orbital ISR stack.' },
  { id: 'perplexity',name: 'Perplexity',    tag: 'AI · Answer Engine',    round: 'Series C',   nextMilestone: 'Enterprise API GA',                milestonePct: 71, daysSinceMark: 54, hype: 74, mark: '+12.6%', markPositive: true,  accent: '#0EA5E9', image: 'linear-gradient(135deg, #07141a 0%, #0e2a34 60%, #0EA5E9 160%)', imageLight: 'linear-gradient(135deg, #ECFEFF 0%, #A5F3FC 55%, #0EA5E9 160%)', news: [{t:'1d',h:'Pages 2.0 rolls to Pro tier'},{t:'7d',h:'Enterprise ACV $180K median, up 22% QoQ'},{t:'20d',h:'Secondary quoted +12% above last primary'}], synergy: 'Distribution channel for Figure/Anduril product search; Kalshi/Polymarket retrieval.' },
  { id: 'starlab',   name: 'Starlab Space', tag: 'Orbital · LEO Station', round: 'Seed Ext.',  nextMilestone: 'CDR — habitat module',             milestonePct: 38, daysSinceMark: 96, hype: 61, mark: 'Flat',   markPositive: true,  accent: '#F59E0B', image: 'linear-gradient(135deg, #141006 0%, #2c2210 60%, #F59E0B 160%)', imageLight: 'linear-gradient(135deg, #FFFBEB 0%, #FDE68A 55%, #F59E0B 160%)', news: [{t:'6d',h:'NASA CCSD milestone #3 signed'},{t:'29d',h:'Voyager–Airbus–MDA consortium confirmed'},{t:'64d',h:'Microgravity BCI payload slot reserved (Neuralink)'}], synergy: 'Launch cadence feeds Anduril orbital ISR and Neuralink microgravity research.' },
];

// Map manualAccount id suffix → curated venture (for Deep Dive modals).
export const venturesById = {
  'm-neuralink':  'neuralink',
  'm-figure':     'figure',
  'm-anduril':    'anduril',
  'm-perplexity': 'perplexity',
  'm-starlab':    'starlab',
};

export const liquidityLadder = [
  { bucket: 'Instant',  label: 'Cash / Crypto',         value:    209_370, color: '#10B981' },
  { bucket: 'Liquid',   label: 'Public Equities',       value: 18_355_787, color: '#005EB8' },
  { bucket: '1–3 yr',   label: 'Private Debt',          value:  1_450_187, color: '#0EA5E9' },
  { bucket: '5 yr +',   label: 'Venture / Real Estate', value:  7_870_056, color: '#8B5CF6' },
];

// Deterministic pseudo-random walk per account id so charts stay stable
// across renders but feel unique per account.
export function seriesFor(accountId) {
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
    out.push({ t: i, v: +value.toFixed(2), g: +(value + (rand() - 0.5) * 0.6).toFixed(2) });
  }
  return out;
}

export function institutionTotal(inst) {
  return inst.accounts.reduce((s, a) => s + a.assets, 0);
}

export function institutionCash(inst) {
  return inst.accounts.reduce((s, a) => s + (a.cash || 0), 0);
}

export function institutionChange(inst) {
  return inst.accounts.reduce((s, a) => s + (a.change || 0), 0);
}

export function manualAccountsTotal() {
  return manualAccounts.reduce((s, a) => s + a.value, 0);
}

export function totalAssets() {
  return institutions.reduce((s, i) => s + institutionTotal(i), 0) + manualAccountsTotal();
}

export function totalCash() {
  return institutions.reduce((s, i) => s + institutionCash(i), 0);
}

export function totalLiabilities() {
  return liabilities.reduce((s, l) => s + l.balance, 0);
}

export function totalWealth() {
  return totalAssets() - totalLiabilities();
}

export function todaysChange() {
  const pct = institutions.reduce((s, i) => s + institutionChange(i), 0);
  return pct;
}
