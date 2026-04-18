# BFO · Blanck Capital Source of Truth (v3.2)

Institutional-grade Family Office OS — TradingView-level data density with
a private-wealth, MS-blue finish. Day + Night themes, mobile-first with a
desktop/mobile preview toggle, live FRED + Polygon + Finnhub + Kalshi +
Polymarket feeds, and a Plaid bridge scaffolded for real institutional data.

---

### ▶︎ Open the live demo

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/jasonblanck/BFO/tree/claude/blanck-capital-command-center-PZ0du)
[![Edit in CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/github/jasonblanck/BFO/claude/blanck-capital-command-center-PZ0du)

Or the live GitHub Pages build: **https://jasonblanck.github.io/BFO/**

---

## Stack

- React 18 + Vite 5 (vendor-chunked Recharts, Lucide, React for faster first paint)
- Tailwind CSS with a custom Morgan Stanley-blue palette + TradingView emerald / crimson for deltas
- Recharts · area / bar / treemap / radar
- Lucide icons
- Inter + JetBrains Mono via Google Fonts

## Running locally

```bash
npm install
npm run dev       # http://localhost:5173
npm run build
npm run preview
```

## Keyboard

- **⌘K** / Ctrl+K — open the command palette (fuzzy search over every account, holding, venture, and command)
- **Esc** — close the palette or any open modal
- **Enter** — activate the selected row

## What's inside

**App shell**
- **Macro ticker** — sticky top bar, animated scroll: SPX, NDX, DJIA, VIX, DXY, US10Y, BTC, ETH. 1px vertical dividers between items, theme-aware edge fades.
- **Header** — live Total Net Worth with heartbeat pulse, live `/command` CLI, OAuth + Read-only chips.
- **Desktop / Mobile toggle** — floating pill top-right; Mobile renders the app inside a 392×812 iPhone frame iframe with theme syncing via postMessage.
- **Day / Night theme toggle** — Sun / Moon pill next to the view toggle. Defaults to Day. Persists to localStorage; `?theme=light|dark` override available.
- **World map background** — procedural dot-grid with pulsing investment-hub nodes (NYC / SF Bay / LA / Austin / Houston / London / Singapore). Hidden in Day mode.

**Wealth Hero row**
- Four MS-style stats — Total Wealth · Total Assets · Today's Change · Total Liabilities.
- Live intraday jitter, refresh / print / download icon buttons, account-count subtitle derived from seed.

**Active Assets hero chart** (PulseChart)
- 420px on desktop (collapsible), 220px default on mobile (tap-expand).
- Range pills 1D · 1W · 1M · YTD · TradingView-style vertical crosshair.
- Theme-aware grid / axis / crosshair ink.

**Single Source View** (Institutional table)
- Tabs: Overview · Available Funds · Investment Details · Allocation · Projected Income.
- Sub-toggle: Institutions · Categories · My Groups · `$0.00 balances` filter.
- Morgan Stanley / TIAA / Fidelity / NY 529 / BofA / Chase / Citibank — expandable with per-account rows.
- Manual Accounts as a 35-position parent row with full breakdown.
- Click any account → focuses the Pulse chart above.

**Liabilities**
- Bedford mortgage, HELOC, Morgan Stanley PLA. Mobile rows stack cleanly.

**Mission Control · High-Conviction Holdings**
- 35-card 3-column grid, sorted by position size.
- Hover (desktop) or tap (mobile) any card to flip to a cyan blueprint wireframe with a glitch effect.
- 5 featured ventures (Neuralink, Figure AI, Anduril, Perplexity, Starlab) get their own geometric SVG schematic; the other 30 show a generic data-sheet with position / opened / type.
- Deep Dive modal with news + synergy + milestone progress.

**Markets section** (TradingView-style)
- **Indexes + Rates + Commodities** — DXY, US10Y, WTI, Nat Gas, Gold, Copper with inline sparklines.
- **US Annual Inflation (CPI-YoY)** — FRED bar chart, 13 months, with Latest / 12m Avg / Fed Funds stats.
- **Market Movers** — 4-tab pill (Volume · Volatility · Gainers · Losers).
- **Events Calendar** — Earnings (beat/miss) · IPOs · Economic.
- **News Feed** — streaming Finnhub headlines, auto-highlight cycler.

**Right-rail HUD**
- **Active Position** (SexyBot) — 168px conviction dial with tick marks, live P/L ticker.
- **Volatility Matrix** — 30-cell flat heatmap with live drift.
- **Exposure · Risk** — vertical thermobar with alert state.
- **Liquidity Tessellation** — TradingView-heatmap treemap subdivided into vehicle slices. Theme-aware ink + white halo text.
- **Intelligence Feed** — live prediction markets from SexyBot (Kalshi) + Kash (Polymarket).
- **Risk Parity** — current vs target allocation radar.
- **Weather** — local minimalist forecast.

**Operational**
- **System Terminal** — streaming `[SYSTEM]` / `[MARKET]` / `[PORTFOLIO]` / `[WARN]` events with ms timestamps. Slide-up bottom drawer, default collapsed.
- **Command Log** — captures `/update`, `/mark`, `/rebalance` etc.
- **Developer Panel** — lazy-loaded; documents the Plaid + OAuth 2.0 bridge, live status chips for Plaid / FRED / Polygon / Finnhub.

## Live data

Wire any of the following via `.env` (or a `.env.local` override). Widgets
auto-upgrade from seed to live once the key is present.

```env
VITE_FRED_API_KEY      = ...   # inflation + Fed Funds
VITE_POLYGON_API_KEY   = ...   # indexes + gainers / losers
VITE_FINNHUB_API_KEY   = ...   # earnings / IPOs / news
```

Kalshi and Polymarket use public read-only endpoints — no key needed.

### Plaid (institutional balances)

Plaid credentials must **never** sit in a `VITE_*` var — they'd be bundled
into the browser. The `api/plaid/*.js` serverless functions handle the
OAuth handshake server-side. Deploy to Vercel, Netlify, Cloudflare Pages
Functions, or similar; set these env vars in the backend runtime:

```
PLAID_CLIENT_ID
PLAID_SECRET
PLAID_ENV              # sandbox | development | production
```

Endpoints:

- `POST /api/plaid/link-token` — mint a short-lived Link token for the browser
- `POST /api/plaid/exchange`   — swap `public_token` → `access_token`, persist server-side
- `GET  /api/plaid/holdings`   — return consolidated holdings + balances

Client polls `/api/plaid/holdings` every 60 s via `usePlaidHoldings()`.
If the endpoint 404s or the vault is empty, the UI stays on seed data.

## File map

```
api/
  plaid/
    link-token.js       scaffold · mint Plaid Link token server-side
    exchange.js         scaffold · public_token → access_token
    holdings.js         scaffold · consolidated balances + holdings
src/
  AppShell.jsx          desktop/mobile + day/night toggles, phone-frame iframe, postMessage sync
  App.jsx               top-level layout + state + ⌘K shortcut
  main.jsx              React entry
  index.css             Tailwind + panel primitives + light-theme override block
  data/
    portfolio.js        institutions, ventures, tickers, series, EOD totals
    markets.js          FRED / Polygon / Finnhub / Kalshi / Polymarket fetchers + seed fallback
  hooks/
    useMarketData.js    polling hook with last-good-value retention
    useIsLight.js       MutationObserver on [data-theme]
    usePlaidHoldings.js Plaid holdings polling hook
  components/
    MacroTicker.jsx
    Header.jsx
    WealthHero.jsx
    PulseChart.jsx          collapsible hero chart + TV crosshair
    InstitutionalView.jsx   MS-style tabbed table
    LiabilitiesPanel.jsx
    MissionControl.jsx      35-card flip grid
    LiquidityTreemap.jsx    TV-heatmap tessellation
    PredictionFeed.jsx
    RiskParity.jsx
    HeroHUD.jsx             Active Position + Volatility + Exposure
    IndexesInflation.jsx
    MarketMovers.jsx
    EventsCalendar.jsx
    NewsFeed.jsx
    WeatherWidget.jsx
    DeepDiveModal.jsx
    DeveloperPanel.jsx      lazy-loaded
    SystemDrawer.jsx        slide-up bottom drawer
    SystemLog.jsx
    CommandLog.jsx
    CommandPalette.jsx      ⌘K fuzzy search
    WorldMapBg.jsx
```

Numbers in `data/portfolio.js` mirror the MS Overview snapshot
($31.4M aggregate / +$237K today / +0.76%). Real balances flow
through the Plaid bridge once the backend is deployed.
