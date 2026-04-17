import React from 'react';
import { Layers, Timer } from 'lucide-react';
import { liquidityLadder } from '../data/portfolio';

function usd(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export default function LiquidityLadder() {
  const total = liquidityLadder.reduce((s, b) => s + b.value, 0);
  const max = Math.max(...liquidityLadder.map((b) => b.value));

  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-accent-blue" />
          <div>
            <div className="text-[10px] tracking-[0.28em] text-slate-500 uppercase">Time-to-Cash</div>
            <div className="text-[14.5px] font-semibold text-slate-100">Liquidity Ladder</div>
          </div>
        </div>
        <span className="chip text-slate-300">
          <Timer size={10} /> Weighted T+0 → 5yr
        </span>
      </div>

      <div className="p-5 space-y-4">
        {liquidityLadder.map((b) => {
          const pct = (b.value / total) * 100;
          const w = (b.value / max) * 100;
          return (
            <div key={b.bucket}>
              <div className="flex items-end justify-between text-[11px] text-slate-300 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-sm"
                    style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }}
                  />
                  <span className="font-semibold tracking-wide">{b.bucket}</span>
                  <span className="text-slate-500">· {b.label}</span>
                </div>
                <div className="mono text-slate-100">
                  {usd(b.value)} <span className="text-slate-500">· {pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-2.5 rounded-full bg-white/5 overflow-hidden relative">
                <div
                  className="h-full rounded-full relative"
                  style={{
                    width: `${w}%`,
                    background: `linear-gradient(90deg, ${b.color}22, ${b.color} 60%, ${b.color}dd)`,
                    boxShadow: `0 0 14px ${b.color}66`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 3s linear infinite',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 py-3 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
        <span className="text-[11px] text-slate-500 mono">Weighted liquidity score</span>
        <span className="mono text-[13px] font-semibold text-accent-blue">0.61 · moderate</span>
      </div>
    </section>
  );
}
