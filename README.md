# BFO · Blanck Capital Source of Truth (v3)

An institutional-grade "Command Center" Family Office OS — Bloomberg-Terminal
data density with a private-wealth, Apple-finish UI (now in full SexyBot HUD mode).

---

### ▶︎ Open the live demo (no install)

<!-- Tap/click either button to launch the dashboard in a sandbox. -->

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/jasonblanck/BFO/tree/claude/blanck-capital-command-center-PZ0du)

[![Edit in CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/github/jasonblanck/BFO/claude/blanck-capital-command-center-PZ0du)

Or paste this URL directly:
`https://stackblitz.com/github/jasonblanck/BFO/tree/claude/blanck-capital-command-center-PZ0du`

---

## Stack

- React 18 + Vite 5
- Tailwind CSS (custom Bloomberg-Luxe + HUD palette)
- Recharts (area, radar, and treemap with neon glow filters)
- Lucide icons
- Inter + JetBrains Mono via Google Fonts

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

## What's inside

**Command Center shell**
- **Macro ticker** — sticky top bar, animated scroll: S&P, NASDAQ, DJIA, VIX,
  BTC, ETH, SOL, US10Y, CPI, DXY, Gold, WTI.
- **Header** — live Total Net Worth with heartbeat pulse, `/command` CLI.
- **World Map background** — equirectangular dot grid with pulsing
  investment-hub nodes (NYC, SF Bay, LA, Austin, Houston, London, Singapore).
- **Scan Bar** + CRT scanlines + SVG feTurbulence grain overlay.
- **Desktop/Mobile toggle** — top-right floating pill; mobile view renders
  the app inside a 392×812 iPhone frame iframe.

**Hero HUD row**
- **Active Position · SexyBot** — 168px conviction dial with tick marks,
  live P/L ticker easing to new values.
- **Volatility Matrix** — 30-cell flickering ticker grid, cool→hot gradient.
- **Exposure · Risk** — vertical thermobar with alert state.

**Single Source View**
- Expandable institution tree (Morgan Stanley · TIAA · Fidelity · NY 529 ·
  BofA · Chase · Citibank · Blanck Capital PE) with per-account owner,
  assets, 24h Δ, allocation bar.

**Pulse & Ventures**
- **Pulse chart** — click any account to redraw a neon area chart with
  beta / Sharpe / allocation strip.
- **Mission Control** — image-rich cards for Neuralink, Figure AI, Anduril,
  Perplexity, Starlab. Hover to flip into a cyan blueprint wireframe with
  glitch effect. Click → Deep Dive modal.

**Intelligence & analytics**
- **Intelligence Feed** — live prediction markets from SexyBot & Kash
  (Kalshi / Polymarket) with conviction rings.
- **Liquidity Tessellation** — Voronoi-style Treemap with time-to-cash
  buckets subdivided into vehicle slices.
- **Risk Parity** — current vs target allocation radar.

**Operational**
- **System Terminal** — streaming `[SYSTEM]` / `[MARKET]` / `[PORTFOLIO]` /
  `[WARN]` events with millisecond timestamps.
- **Command Log** — captures `/update`, `/mark`, `/rebalance` etc.
- **Developer Panel** — BofA / Chase / Morgan Stanley bridge: Plaid Link +
  OAuth 2.0 flow, env template, webhook topology.
- **Weather** — local minimalist forecast.

## File map

```
src/
  AppShell.jsx                 view-toggle shell + phone-frame iframe
  App.jsx                      top-level layout + state
  main.jsx                     React entry
  index.css                    Tailwind + HUD primitives (scanlines, grain)
  data/portfolio.js            institutions, ventures, tickers, series
  components/
    MacroTicker.jsx
    Header.jsx
    HeroHUD.jsx                Active Position + Volatility + Exposure
    InstitutionsTable.jsx
    PulseChart.jsx
    PredictionFeed.jsx
    WeatherWidget.jsx
    MissionControl.jsx
    LiquidityTreemap.jsx
    RiskParity.jsx
    DeepDiveModal.jsx
    DeveloperPanel.jsx
    CommandLog.jsx
    SystemLog.jsx              streaming terminal
    WorldMapBg.jsx             procedural globe background
    ScanBar.jsx                vertical sweep overlay
```

Numbers in `data/portfolio.js` are illustrative placeholders. Real balances
flow through the Plaid / OAuth bridge documented in the Developer Panel.
