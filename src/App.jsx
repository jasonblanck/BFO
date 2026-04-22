import React, { useState, useMemo, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import MacroTicker from './components/MacroTicker';
import Header from './components/Header';
import WealthHero from './components/WealthHero';
import InstitutionalView from './components/InstitutionalView';
import LiabilitiesPanel from './components/LiabilitiesPanel';
import PredictionFeed from './components/PredictionFeed';
import WeatherWidget from './components/WeatherWidget';
import MissionControl from './components/MissionControl';
import DeepDiveModal from './components/DeepDiveModal';
// Recharts-dependent components — lazy-loaded so the recharts-vendor
// chunk (160 kB gzipped) doesn't block first paint of the app shell.
// Each has a lightweight skeleton while streaming in.
const PulseChart       = lazy(() => import('./components/PulseChart'));
const LiquidityTreemap = lazy(() => import('./components/LiquidityTreemap'));
const RiskParity       = lazy(() => import('./components/RiskParity'));
const DeveloperPanel   = lazy(() => import('./components/DeveloperPanel'));
const Watchlist        = lazy(() => import('./components/Watchlist'));
import CommandLog from './components/CommandLog';
import WorldMapBg from './components/WorldMapBg';
import SystemLog from './components/SystemLog';
import SystemDrawer from './components/SystemDrawer';
import HeroHUD from './components/HeroHUD';
import CommandPalette from './components/CommandPalette';
const IndexesInflation = lazy(() => import('./components/IndexesInflation'));
import MarketMovers from './components/MarketMovers';
import EventsCalendar from './components/EventsCalendar';
import NewsFeed from './components/NewsFeed';
import { institutionTotal } from './data/portfolio';
import useManualAccounts from './hooks/useManualAccounts';
import usePlaidHoldings from './hooks/usePlaidHoldings';
import usePortfolio from './hooks/usePortfolio';

export default function App({ onOpenAccounts, onOpenHoldings }) {
  const manualAccounts = useManualAccounts();
  const { data: plaidData } = usePlaidHoldings();
  const portfolio = usePortfolio();
  // Recomputes when store / plaid / portfolio overlay change so the
  // heartbeat re-centers after an add/edit/delete or a live sync.
  const baseWealth = useMemo(() => {
    const inst = (portfolio.institutions || []).reduce((s, i) => s + institutionTotal(i), 0);
    const manual = manualAccounts.reduce((s, a) => s + (Number(a.value) || 0), 0);
    const plaidList = Array.isArray(plaidData) ? plaidData : [];
    const plaid = plaidList.reduce((s, x) => {
      const hv = (x.holdings ?? []).reduce((a, h) => a + (Number(h.institution_value) || 0), 0);
      const bv = (x.accounts ?? []).reduce((a, c) => a + (Number(c?.balances?.current) || 0), 0);
      return s + (hv > 0 ? hv : bv);
    }, 0);
    const liab = (portfolio.liabilities || []).reduce((s, l) => s + (Number(l.balance) || 0), 0);
    return inst + manual + plaid - liab;
  }, [manualAccounts, plaidData, portfolio]);
  const [wealth, setWealth] = useState(baseWealth);
  const [selected, setSelected] = useState(() => ({
    account: portfolio.institutions[0].accounts[0],
    institution: portfolio.institutions[0],
  }));
  // When the authenticated portfolio overlay lands, the `selected`
  // reference above points at the demo account. Re-anchor onto the
  // same id in the new institution array so the PulseChart shows
  // real values instead of the bundled demo.
  useEffect(() => {
    if (portfolio.status !== 'live') return;
    setSelected((prev) => {
      const inst = portfolio.institutions.find((i) => i.id === prev.institution?.id) || portfolio.institutions[0];
      const acct = inst.accounts.find((a) => a.id === prev.account?.id) || inst.accounts[0];
      return { account: acct, institution: inst };
    });
  }, [portfolio]);
  const [deepDive, setDeepDive] = useState(null);
  const [log, setLog] = useState([]);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Right-rail height clamp. On the 2-col xl layout the aside stacks
  // HeroHUD → RiskParity → PredictionFeed → LiquidityTreemap →
  // WeatherWidget → Watchlist and is naturally much taller than the
  // left column (which ends at High-Conviction Holdings). The grid
  // parent uses `items-start` so both cells size to their intrinsic
  // content (otherwise stretching makes the left column match the
  // taller aside, and measuring it gives us the aside's height — a
  // no-op). ResizeObserver reads the left column's real height and
  // applies it as max-height on the aside; the aside has
  // xl:overflow-hidden + min-h-0 so the flex-1 Watchlist is the one
  // that gives up space, and its internal scroll handles the overflow.
  const leftColRef = useRef(null);
  const [asideMaxH, setAsideMaxH] = useState(null);
  useEffect(() => {
    const el = leftColRef.current;
    if (!el || typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(min-width: 1280px)');
    let ro = null;
    const update = () => {
      if (!mq.matches) { setAsideMaxH(null); return; }
      setAsideMaxH(Math.round(el.getBoundingClientRect().height));
    };
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }
    mq.addEventListener?.('change', update);
    update();
    return () => { ro?.disconnect(); mq.removeEventListener?.('change', update); };
  }, []);

  // ⌘K / Ctrl+K opens the command palette from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onPaletteCommand = useCallback((run) => {
    if (typeof run === 'function') { run(); return; }
    if (typeof run !== 'string') return;
    if (run.startsWith('scroll:')) {
      const sel = run.slice('scroll:'.length);
      document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (run === 'theme') {
      const el = document.documentElement;
      el.dataset.theme = el.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('bci-theme', el.dataset.theme); } catch (_) {}
    }
  }, []);

  // Re-anchor jittered wealth whenever the underlying total changes
  // (e.g. user added or edited a manual account in Connected Accounts).
  useEffect(() => { setWealth(baseWealth); }, [baseWealth]);

  // Live wealth jitter — drives the Heartbeat pulse on the header figure.
  useEffect(() => {
    const t = setInterval(() => {
      const drift = (Math.random() - 0.48) * 60000;
      setWealth((v) => Math.round(Math.max(baseWealth * 0.97, Math.min(baseWealth * 1.03, v + drift))));
    }, 3400);
    return () => clearInterval(t);
  }, [baseWealth]);

  const onSelectAccount = useCallback((account, institution) => {
    setSelected({ account, institution });
  }, []);

  const onCommand = useCallback((cmd) => {
    const time = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
    let result = 'OK';
    const parts = cmd.trim().split(/\s+/);
    const op = (parts[0] || '').toLowerCase();
    if (op === '/update' && parts.length >= 3) result = `adjusted ${parts[1]} by ${parts[2]}`;
    else if (op === '/rebalance') result = `rebalance queued → ${parts.slice(1).join(' ')}`;
    else if (op === '/mark') result = `venture ${parts[1]} marked ${parts[2]}`;
    else if (op.startsWith('/')) result = 'queued for review';
    else result = 'unknown command';
    setLog((l) => [...l, { time, cmd, result }]);
  }, []);

  return (
    <div className="min-h-screen text-slate-100 relative">
      <WorldMapBg />

      <MacroTicker />
      <Header totalAUM={wealth} onCommand={onCommand} />

      <main className="px-2 sm:px-4 pb-24 pt-3 sm:pt-4 space-y-4 sm:space-y-6">
        {/* 1. Wealth summary — full-width hero header */}
        <WealthHero />

        {/* 2. Top-left hero chart + right rail analytics.
               Vertical scanning flow: chart leads, table below. */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 sm:gap-6 items-start">
          <div ref={leftColRef} className="space-y-4 sm:space-y-6">
            <Suspense fallback={<ChartSkeleton height={420} />}>
              <PulseChart account={selected.account} institution={selected.institution} />
            </Suspense>
            <InstitutionalView
              selectedAccountId={selected.account.id}
              onSelectAccount={onSelectAccount}
            />
            <LiabilitiesPanel />
            <MissionControl onOpenDeepDive={setDeepDive} />
          </div>

          <aside
            className="flex flex-col gap-4 sm:gap-6 min-h-0 xl:overflow-hidden"
            style={asideMaxH ? { maxHeight: asideMaxH } : undefined}
          >
            <HeroHUD />
            <Suspense fallback={<ChartSkeleton height={260} />}>
              <RiskParity />
            </Suspense>
            <PredictionFeed />
            <Suspense fallback={<ChartSkeleton height={260} />}>
              <LiquidityTreemap />
            </Suspense>
            <WeatherWidget />
            <Suspense fallback={<ChartSkeleton height={320} />}>
              <div className="flex-1 min-h-0 flex flex-col">
                <Watchlist />
              </div>
            </Suspense>
          </aside>
        </div>

        {/* 3. Markets section — TradingView-style widgets */}
        <div>
          <SectionHeader title="Markets" subtitle="Tape · Indexes · Events · News" />
          <div className="space-y-4 sm:space-y-6">
            <Suspense fallback={<ChartSkeleton height={320} />}>
              <IndexesInflation />
            </Suspense>
            <MarketMovers />
            <EventsCalendar />
            <NewsFeed />
          </div>
        </div>

        <CommandLog entries={log} />
        <Suspense fallback={<div className="panel px-5 py-4 mono text-[11px] text-slate-500">Loading developer panel…</div>}>
          <DeveloperPanel />
        </Suspense>

        <footer className="flex flex-wrap items-center justify-between gap-y-2 mono text-[11px] text-slate-500 px-2 pt-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gain-500 shadow-glow-green animate-pulse-dot" />
            blanck capital OS · v3.3 · all systems nominal
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline">
              signal · morgan stanley · tiaa · fidelity · ny 529 · bofa · chase · citi · manual
            </span>
            <span className="hidden md:inline text-slate-700">·</span>
            <button
              onClick={onOpenHoldings}
              className="mono text-[11px] tracking-wider text-ms-400 hover:text-ms-300 transition uppercase"
            >
              All Holdings →
            </button>
            <span className="text-slate-700">·</span>
            <button
              onClick={onOpenAccounts}
              className="mono text-[11px] tracking-wider text-ms-400 hover:text-ms-300 transition uppercase"
            >
              Connected Accounts →
            </button>
          </div>
        </footer>
      </main>

      <DeepDiveModal venture={deepDive} onClose={() => setDeepDive(null)} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSelectAccount={onSelectAccount}
        onOpenDeepDive={setDeepDive}
        onCommand={onPaletteCommand}
      />
      <SystemDrawer>
        <SystemLog />
      </SystemDrawer>
    </div>
  );
}

// Lazy-chart placeholder — preserves layout height so the page doesn't
// shift when recharts-vendor finishes loading.
function ChartSkeleton({ height = 280 }) {
  return (
    <section
      className="panel overflow-hidden"
      style={{ minHeight: height }}
      aria-hidden
    >
      <div className="h-full w-full flex items-center justify-center">
        <div className="mono text-[10px] tracking-[0.28em] text-slate-600 uppercase">
          Loading…
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="flex items-end justify-between mb-3 px-1">
      <div>
        <div className="mono text-[10px] tracking-[0.3em] text-slate-500 uppercase">{subtitle}</div>
        <h2 className="text-[18px] font-semibold text-slate-100 mt-0.5">{title}</h2>
      </div>
      <div className="h-px flex-1 mx-4 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <span className="chip chip-ms">Live</span>
    </div>
  );
}
