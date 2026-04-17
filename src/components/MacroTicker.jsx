import React from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { macroTickers } from '../data/portfolio';

function fmt(n) {
  if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return n.toFixed(2);
}

function TickerItem({ t }) {
  const up = t.chg >= 0;
  const color = up ? 'text-gain-500' : 'text-loss-500';
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <div className="ticker-sep flex items-center gap-2 px-4 py-2 whitespace-nowrap">
      <span className="text-[11px] tracking-[0.18em] text-slate-400 uppercase font-semibold">{t.sym}</span>
      <span className="mono text-[13px] text-white">{fmt(t.val)}</span>
      <span className={`mono text-[12px] ${color} flex items-center gap-0.5`}>
        <Icon size={11} strokeWidth={2.5} />
        {up ? '+' : ''}{t.chg.toFixed(2)}%
      </span>
    </div>
  );
}

export default function MacroTicker() {
  // Duplicate for seamless horizontal scroll
  const loop = [...macroTickers, ...macroTickers];
  return (
    <div className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="flex items-center">
        <div className="flex items-center gap-2 px-4 py-2 border-r border-white/10 bg-black/60">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-gain-500 opacity-60 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-gain-500 shadow-glow-green" />
          </span>
          <span className="text-[10px] font-semibold tracking-[0.22em] text-slate-300 uppercase">Live</span>
          <Activity size={12} className="text-gain-500" />
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex animate-ticker" style={{ width: 'max-content' }}>
            {loop.map((t, i) => (
              <TickerItem key={`${t.sym}-${i}`} t={t} />
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-12 ticker-fade-l" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 ticker-fade-r" />
        </div>
      </div>
    </div>
  );
}
