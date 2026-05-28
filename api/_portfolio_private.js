// Real owner-owned portfolio values. Server-side only — this module
// is imported exclusively by api/portfolio.js and NEVER bundled into
// the frontend. Consumers in the client receive this data only after
// authenticating and hitting GET /api/portfolio.
//
// The src/data/portfolio.js shipped to the browser carries sanitized
// demo values as its default seed. This file is where the real
// Morgan Stanley / Fidelity / TIAA / etc. figures live.

export const institutions = [
  {
    id: 'ms',
    name: 'Morgan Stanley',
    role: 'Master · Wealth Management',
    accent: '#005EB8',
    // 05/21/2026: total 18,277,773.75 · cash 30,878.89 · +23,126.07 (+0.13%)
    // Reconciled to MS Overview aggregate — brokerage absorbs the delta.
    accounts: [
      { id: 'ms-brokerage', name: 'Active Assets Account',    owner: 'Principal',    assets: 10_796_728.11, cash: 28_000.00, change: 12_739.86, changePct: 0.12 },
      { id: 'ms-ira',       name: 'Morgan Stanley IRA',       owner: 'Principal',    assets:  3_278_115.64, cash:  2_878.89, change: 10_386.21, changePct: 0.32 },
      { id: 'ms-trust',     name: 'Family Trust — Revocable', owner: 'Family Trust', assets:  4_202_930.00, cash:       0.00, change:      0.00, changePct: 0.00 },
    ],
  },
  {
    id: 'tiaa',
    name: 'TIAA',
    role: 'Retirement',
    accent: '#4C1D95',
    // 05/21/2026: total 5,886,008.69 · +23,976.72
    accounts: [
      { id: 'tiaa-403b', name: 'TIAA 403(b) Traditional', owner: 'Principal', assets: 3_429_578.71, cash: 0, change: 122.95, changePct: 0.00 },
      { id: 'tiaa-cref', name: 'CREF Equity Index',       owner: 'Principal', assets: 2_456_429.98, cash: 0, change: 23_853.77, changePct: 0.98 },
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
        assets: 0.00, cash: 0.00, change: 0.00, changePct: 0.00,
        holdings: [
          { symbol: '58507M107',  name: 'MedMen Enterprises · Common',      assetClass: 'Equity',   qty: 43,    avgCost: 0.50,  price: 0.00,    value:    0.00, change: 0.00, changePct: 0.00,      gainPct: -100.00 },
        ],
      },
      {
        id: 'fid-elise-tod', name: 'Elise Individual · TOD', owner: 'Elise · X69699561',
        assets: 0.00, cash: 0.00, change: 0.00, changePct: 0.00,
        holdings: [
          { symbol: 'CASH',       name: 'Held in Money Market',             assetClass: 'Cash',     qty: null,  avgCost: null,  price: null,    value:    0.00, change: 0.00, changePct: 0.00,      gainPct:    0.00 },
        ],
      },
      {
        id: 'fid-elise-hsa', name: 'Elise Health Savings Account', owner: 'Elise · 225353906',
        assets: 0.00, cash: 0.00, change: 0.00, changePct: 0.00,
        holdings: [
          { symbol: '58507M107',  name: 'MedMen Enterprises · Common',      assetClass: 'Equity',      qty: 25,    avgCost: 0.46,  price: 0.00,    value:    0.00, change: 0.00,      changePct: 0.00,     gainPct: -100.00 },
        ],
      },
      {
        id: 'fid-mj-tod', name: 'MJ Individual · TOD', owner: 'Jason · X66877287',
        assets: 465_362.26, cash: 0.00, change: 5_847.48, changePct: 1.27,
        holdings: [
          { symbol: 'AAPL', name: 'Apple Inc',                           assetClass: 'Equity',       qty: 462, avgCost: 113.30, price: 273.80, value: 126_495.60, change:   766.92, changePct: 0.61, gainPct: 141.66 },
          { symbol: 'GOOG', name: 'Alphabet Inc · Class C',              assetClass: 'Equity',       qty: 404, avgCost: 118.05, price: 312.77, value: 126_360.90, change:   749.22, changePct: 0.60, gainPct: 164.95 },
          { symbol: 'MSFT', name: 'Microsoft Corp',                      assetClass: 'Equity',       qty: 155, avgCost: 277.59, price: 398.35, value:  61_744.25, change: 1_449.25, changePct: 2.40, gainPct:  43.50 },
          { symbol: 'AMZN', name: 'Amazon.com Inc',                      assetClass: 'Equity',       qty: 271, avgCost: 132.01, price: 210.95, value:  57_167.45, change:   647.69, changePct: 1.15, gainPct:  59.80 },
          { symbol: 'META', name: 'Meta Platforms · Class A',            assetClass: 'Equity',       qty:  75, avgCost: 240.90, price: 650.98, value:  48_823.50, change:   876.00, changePct: 1.83, gainPct: 170.23 },
          { symbol: 'PLTR', name: 'Palantir Technologies · Class A',     assetClass: 'Equity',       qty: 250, avgCost:  75.03, price: 133.52, value:  33_380.00, change: 1_170.00, changePct: 3.63, gainPct:  77.96 },
          { symbol: 'TSLA', name: 'Tesla Inc',                           assetClass: 'Equity',       qty:  17, avgCost: 429.90, price: 416.36, value:   7_078.12, change:   118.66, changePct: 1.70, gainPct:  -3.15 },
          { symbol: 'NVDA', name: 'Nvidia Corporation',                  assetClass: 'Equity',       qty:  22, avgCost: 183.67, price: 196.02, value:   4_312.44, change:    69.74, changePct: 1.64, gainPct:   6.72 },
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
  { id: 'm-res-bedford', name: 'Residence · Bedford, NY',              category: 'Real Estate',    opened: '03/25/2026', value: 2_060_000.00 },
  { id: 'm-onshore',     name: 'OnShore Daytona L3 College Campus Promote', category: 'Real Estate', opened: '03/26/2026', value:   500_000 },
  { id: 'm-gator',       name: 'Gator Apartment Venture, LLC (L3)',     category: 'Real Estate',    opened: '01/28/2026', value:   460_000 },
  { id: 'm-buckeye',     name: 'Buckeye Apartment Investors, LLC',      category: 'Real Estate',    opened: '12/14/2023', value:   100_000 },
  { id: 'm-statehouse',  name: 'StateHouse',                            category: 'Real Estate',    opened: '04/23/2026', value:   100_000, url: 'https://statehousecolumbus.com/' },
  { id: 'm-college',     name: 'College House Partners LLC 2023',       category: 'Real Estate',    opened: '03/08/2024', value:   100_000 },

  // --- Private equity / SPVs / SAFEs ---
  { id: 'm-btr',         name: 'BTR Nation',                            category: 'Private Equity', opened: '05/25/2025', value:   150_000 },
  { id: 'm-coglee',      name: 'COGLEE 207TH Partners LLC (Inwood)',    category: 'Private Equity', opened: '09/04/2025', value:   133_000 },
  { id: 'm-cob',         name: 'Cob Inc.',                              category: 'Private Equity', opened: '10/01/2025', value:   100_000 },
  { id: 'm-neuralink',   name: 'Neuralink JUN 2025 · A Series of CGF',  category: 'Private Equity', opened: '01/28/2026', value:   100_000 },
  { id: 'm-perplexity',  name: 'Perplexity AI',                         category: 'Private Equity', opened: '02/02/2026', value:    55_555.56 },
  { id: 'm-kalshi',      name: 'Kalshi · KALS1 SPV Riverside',          category: 'Private Equity', opened: '04/09/2026', value:    50_000 },
  { id: 'm-onebrief',    name: 'OneBrief · Defense',                    category: 'Private Equity', opened: '04/23/2026', value:    40_000, url: 'http://onebrief.com/' },
  { id: 'm-drumroll',    name: 'Drumroll Snacks, Inc.',                 category: 'Private Equity', opened: '08/22/2025', value:    35_000 },
  { id: 'm-anthropic',   name: 'Anthropic (Series H) - Seed Labs',      category: 'Private Equity', opened: '05/26/2026', value:    25_000 },
  { id: 'm-figure',      name: 'Figure AI · FI-0208 Fund III Series C', category: 'Private Equity', opened: '03/16/2025', value:    25_000 },
  { id: 'm-ghia',        name: 'GHIA Dec 2023 · Series of CGF2021',     category: 'Private Equity', opened: '01/05/2024', value:    25_000 },
  { id: 'm-allergy',     name: 'Allergy Amulet',                        category: 'Private Equity', opened: '12/02/2024', value:    25_000 },
  { id: 'm-spring',      name: 'Spring & Mulberry Inc. · SAFE',         category: 'Private Equity', opened: '02/26/2024', value:    25_000 },
  { id: 'm-starlab',     name: 'Starlab Space · ST-0528 Fund I',        category: 'Private Equity', opened: '06/17/2025', value:    20_000 },
  { id: 'm-longshot',    name: 'Longshot Space · LO-0219 Gaingels F1',  category: 'Private Equity', opened: '03/02/2025', value:    10_000 },
  { id: 'm-nypc',        name: 'New York Padel Club, Inc.',             category: 'Private Equity', opened: '01/13/2025', value:    10_000 },
  { id: 'm-repurpose',   name: 'Repurpose · Feb 2025 a Series of CGF',  category: 'Private Equity', opened: '03/31/2025', value:    10_000 },
  { id: 'm-ripple',      name: 'Ripple · RIP2 SPV Riverside Ventures',  category: 'Private Equity', opened: '03/25/2025', value:    10_000 },
  { id: 'm-sandboxaq',   name: 'SandboxAQ · SANAQ1 SPV Riverside',      category: 'Private Equity', opened: '01/17/2025', value:    10_000 },
  { id: 'm-sku',         name: 'SKU LLC · 2024 Equity Membership',      category: 'Private Equity', opened: '01/09/2024', value:    10_000 },
  { id: 'm-neuma',       name: 'Neuma · NE-0825 Fund I',                category: 'Private Equity', opened: '10/14/2025', value:     6_000 },
  { id: 'm-liquid',      name: 'Liquid Death · LIQ6 SPV',               category: 'Private Equity', opened: '08/29/2025', value:     5_000 },
  { id: 'm-polymarket',  name: 'Polymarket - Poly2, Sandlot Ventures',  category: 'Private Equity', opened: '05/22/2026', value:     5_000 },
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
  { id: 'm-rolex',       name: 'Rolex',                                 category: 'Collectibles',   opened: '12/11/2024', value:    31_500 },

  // --- Household · Non-MS (tracked by MS aggregator as separate parent buckets) ---
  { id: 'm-peter-hamptons', name: 'Peter · Hamptons House Investment',  category: 'Real Estate',    opened: '07/29/2025', value: 1_250_000.00 },
  { id: 'm-wendy-trust',    name: 'Wendy · Trust Inheritance',          category: 'Fixed Income',   opened: '07/23/2025', value: 1_250_000.00 },
];

export const liabilities = [
  { id: 'mortgage', name: 'Bedford · First Mortgage',    institution: 'Morgan Stanley PLA', balance: 1_120_000, rate: 6.25, type: 'Mortgage' },
  { id: 'heloc',    name: 'Bedford · HELOC',             institution: 'Bank of America',    balance:   220_000, rate: 8.10, type: 'HELOC' },
  { id: 'liqline',  name: 'Liquidity Access Line',       institution: 'Morgan Stanley',     balance:   120_815.65, rate: 4.65, type: 'PLA' },
];
