import React, { useMemo } from 'react';
import { Link2, ArrowUpRight, ArrowDownRight, Info, Download, Printer, RefreshCw } from 'lucide-react';
import {
  totalWealth,
  totalAssets,
  totalLiabilities,
  todaysChange,
  institutions,
  manualAccounts,
} from '../data/portfolio';

function usd(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}
function usdNoCents(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function pct(n) {
  const sign = n > 0 ? '+' : n < 0 ? '' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function Stat({ label, value, sub, linked = true, tone = 'neutral', small }) {
  const toneClass =
    tone === 'gain' ? 'text-gain-500' :
    tone === 'loss' ? 'text-loss-500' :
    'text-white';
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <span className="tracking-wide">{label}</span>
        {linked && <Link2 size={10} className="text-slate-600" />}
      </div>
      <div className={`mono ${small ? 'text-[20px]' : 'text-[22px] sm:text-[26px] lg:text-[32px]'} font-semibold leading-tight break-words ${toneClass}`}>
        {value}
      </div>
      {sub && <div className="mono text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

export default function WealthHero() {
  // Seed-derived totals are static across renders. Memoize so App's
  // 3.4s wealth-jitter interval doesn't re-run four institution-tree
  // reductions + an account-count reduction on every parent render.
  const { tWealth, tAssets, tLiab, change, changePct, changeUp, instCount } = useMemo(() => {
    const tAssets = totalAssets();
    const tLiab = totalLiabilities();
    const tWealth = totalWealth();
    const change = todaysChange();
    return {
      tAssets,
      tLiab,
      tWealth,
      change,
      changePct: tAssets > 0 ? (change / tAssets) * 100 : 0,
      changeUp: change >= 0,
      instCount: institutions.reduce((s, i) => s + i.accounts.length, 0),
    };
  }, []);
  const nowStr = new Date().toLocaleString('en-US', {
    month: 'numeric', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <section className="panel hud-corners relative overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />

      {/* Top utility row — like MS "Add external accounts" area */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 sm:px-5 pt-4">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gain-500 shadow-glow-green animate-pulse-dot" />
            <span className="mono text-[10px] tracking-[0.22em] text-slate-400 uppercase">
              Account Aggregate
            </span>
          </div>
          <span className="hidden sm:inline text-slate-700">|</span>
          <span className="text-[11px] sm:text-[12px] text-slate-400">
            As of <span className="mono text-slate-200">{nowStr} ET</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <IconBtn><RefreshCw size={12} /></IconBtn>
          <IconBtn><Printer size={12} /></IconBtn>
          <IconBtn><Download size={12} /></IconBtn>
        </div>
      </div>

      {/* Four-stat row — stacks single-col on mobile, 2-col on tablet, 4-col on desktop */}
      <div className="px-4 sm:px-5 pt-4 pb-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        <Stat
          label="Total Wealth"
          value={usdNoCents(tWealth)}
          sub="Assets net of liabilities"
        />
        <Stat
          label="Total Assets"
          value={usdNoCents(tAssets)}
          sub={`${instCount + manualAccounts.length} accounts · ${instCount} institutional · ${manualAccounts.length} manual`}
        />
        <Stat
          label="Today's Change"
          tone={changeUp ? 'gain' : 'loss'}
          value={
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span>{changeUp ? '+' : ''}{usdNoCents(change)}</span>
              <span className="text-[16px] sm:text-[18px] opacity-80">{pct(changePct)}</span>
            </span>
          }
          sub={
            <span className="flex items-center gap-1.5">
              {changeUp ? <ArrowUpRight size={11} className="text-gain-500" /> : <ArrowDownRight size={11} className="text-loss-500" />}
              Live intraday · vs yesterday close
            </span>
          }
        />
        <Stat
          label="Total Liabilities"
          value={usdNoCents(tLiab)}
          sub="Mortgages · HELOC · PLA"
        />
      </div>

      {/* MS-style footer */}
      <div className="px-5 py-2.5 border-t border-white/10 bg-white/[0.015] flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1.5">
            <Info size={10} /> Includes external account data
          </span>
          <span className="text-slate-700">|</span>
          <span className="mono">Plaid-ready · OAuth 2.0</span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <button className="hover:text-ms-400 transition">Refresh market data</button>
          <span className="text-slate-700">·</span>
          <button className="hover:text-ms-400 transition">Help</button>
        </div>
      </div>
    </section>
  );
}

function IconBtn({ children }) {
  return (
    <button className="h-7 w-7 flex items-center justify-center border border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-100 hover:border-ms-600/40 transition rounded-sm">
      {children}
    </button>
  );
}
