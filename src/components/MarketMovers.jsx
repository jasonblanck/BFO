import React, { useMemo, useState } from 'react';
import { BarChart2, Zap, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import useMarketData from '../hooks/useMarketData';
import { fetchMarketMovers } from '../data/markets';

const TABS = [
  { id: 'volume',     label: 'Highest Volume',   Icon: BarChart2 },
  { id: 'volatility', label: 'Most Volatile',    Icon: Zap },
  { id: 'gainers',    label: 'Top Gainers',      Icon: TrendingUp },
  { id: 'losers',     label: 'Top Losers',       Icon: TrendingDown },
];

function usd(n) {
  if (n == null) return '—';
  // Handle tiny prices (<$1) with more precision.
  const digits = Math.abs(n) < 1 ? 4 : 2;
  return n.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtPct(n) {
  if (n == null) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function TickerBadge({ t, accent }) {
  const char = (t || '?')[0].toUpperCase();
  return (
    <span
      className="mono inline-flex items-center justify-center h-7 w-7 rounded-sm text-[11px] font-semibold shrink-0"
      style={{
        background: `${accent}18`,
        color: accent,
        boxShadow: `inset 0 0 0 1px ${accent}33`,
      }}
    >
      {char}
    </span>
  );
}

function Row({ m, positive }) {
  const accent = positive ? '#10B981' : '#EF4444';
  const tone = m.changePct >= 0 ? 'gain' : 'loss';
  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-white/[0.025] transition">
      <TickerBadge t={m.ticker} accent={accent} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-slate-100 truncate">{m.name}</div>
        <div className="mono text-[10.5px] text-slate-500 tracking-wider">{m.ticker}</div>
      </div>
      <div className="text-right">
        <div className="mono text-[13px] text-slate-100">{usd(m.price)} <span className="text-slate-500 text-[10px]">USD</span></div>
        <div
          className={`mono inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold mt-0.5 ${
            tone === 'gain' ? 'bg-gain-500/12 text-gain-500' : 'bg-loss-500/12 text-loss-500'
          }`}
          style={{ borderRadius: 2 }}
        >
          {fmtPct(m.changePct)}
        </div>
      </div>
    </div>
  );
}

export default function MarketMovers() {
  const [tab, setTab] = useState('volume');
  const { data, loading } = useMarketData(
    () => fetchMarketMovers(tab),
    [tab],
    90_000
  );
  const rows = data ?? [];
  const positive = tab === 'gainers' || tab === 'volume';

  const splitIdx = Math.ceil(rows.length / 2);
  const left = rows.slice(0, splitIdx);
  const right = rows.slice(splitIdx);

  const tabLabel = useMemo(() => TABS.find((t) => t.id === tab)?.label, [tab]);

  return (
    <section className="panel hud-corners relative overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />

      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div>
          <div className="mono text-[10px] tracking-[0.28em] text-slate-500 uppercase">Market Movers</div>
          <div className="text-[14px] font-semibold text-slate-100">{tabLabel}</div>
        </div>
        <div className="flex items-center gap-1 flex-wrap" role="tablist" aria-label="Market movers">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={active}
                aria-label={t.label}
                onClick={() => setTab(t.id)}
                className={`ms-pill ${active ? 'active' : ''} flex items-center gap-1.5`}
              >
                <t.Icon size={11} />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="divide-y divide-white/5 border-b md:border-b-0 md:border-r border-white/5">
          {left.map((m) => (
            <Row key={`${m.ticker}-${m.name}`} m={m} positive={m.changePct >= 0} />
          ))}
          {!left.length && loading && <SkeletonRows />}
        </div>
        <div className="divide-y divide-white/5">
          {right.map((m) => (
            <Row key={`${m.ticker}-${m.name}-r`} m={m} positive={m.changePct >= 0} />
          ))}
          {!right.length && loading && <SkeletonRows />}
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/5 bg-white/[0.012]">
        <span className="mono text-[10px] text-slate-500 tracking-wider">
          Source · Polygon.io · refresh 90s
        </span>
        <button className="mono text-[11px] text-ms-400 hover:text-ms-300 transition flex items-center gap-1">
          See all <ArrowRight size={11} />
        </button>
      </div>
    </section>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-7 w-7 bg-white/5" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-40 bg-white/5" />
            <div className="h-2.5 w-14 bg-white/5" />
          </div>
          <div className="space-y-1.5 text-right">
            <div className="h-3 w-16 bg-white/5 ml-auto" />
            <div className="h-3 w-12 bg-white/5 ml-auto" />
          </div>
        </div>
      ))}
    </>
  );
}
