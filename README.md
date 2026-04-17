# BFO · Blanck Capital Source of Truth (v3)

An institutional-grade "Command Center" Family Office OS — Bloomberg-Terminal
data density with a private-wealth, Apple-finish UI.

## Stack

- React 18 + Vite 5
- Tailwind CSS (custom Bloomberg-Luxe palette)
- Recharts (area + radar charts with neon glow filters)
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

- **Macro ticker** — sticky top bar, animated scroll: S&P, NASDAQ, DJIA, VIX,
  BTC, ETH, SOL, US10Y, CPI, DXY, Gold, WTI.
- **Single Source View** — expandable institution tree (Morgan Stanley ·
  TIAA · Fidelity · NY 529 · BofA · Chase · Citibank · Blanck Capital PE)
  with per-account owner, assets, 24h Δ, allocation bar.
- **Pulse chart** — clicking an account dynamically redraws a neon area chart
  with beta / Sharpe / allocation strip.
- **Mission Control** — image-rich cards for Neuralink, Figure AI, Anduril,
  Perplexity, Starlab with Days-Since-Mark counter, Hype gauge, milestone
  progress. Click → Deep Dive modal.
- **Intelligence Feed** — live prediction markets from SexyBot & Kash
  (Kalshi / Polymarket) with conviction rings.
- **Liquidity Ladder** — Instant / Liquid / 1–3yr / 5yr+ time-to-cash bars.
- **Risk Parity** — current vs target allocation radar.
- **Command Line** — `/update realestate +100000`, `/mark anduril 9.2`, etc.,
  piped to a Command Log widget.
- **Developer Panel** — the BofA / Chase / Morgan Stanley bridge: Plaid Link
  + OAuth 2.0 flow, env template, webhook topology.
- **Weather** — local minimalist forecast.

## File map

```
src/
  App.jsx                     top-level layout + state
  main.jsx                    React entry
  index.css                   Tailwind + glass / glow primitives
  data/portfolio.js           institutions, ventures, tickers, series
  components/
    MacroTicker.jsx
    Header.jsx
    InstitutionsTable.jsx
    PulseChart.jsx
    PredictionFeed.jsx
    WeatherWidget.jsx
    MissionControl.jsx
    LiquidityLadder.jsx
    RiskParity.jsx
    DeepDiveModal.jsx
    DeveloperPanel.jsx
    CommandLog.jsx
```

Numbers in `data/portfolio.js` are illustrative placeholders. Real balances
flow through the Plaid / OAuth bridge documented in the Developer Panel.
