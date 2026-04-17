import React from 'react';
import { Brain, Flame, Radar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { predictionFeed } from '../data/portfolio';

function ConvictionRing({ value, accent = '#00FFA3' }) {
  const r = 14;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-10 w-10 flex items-center justify-center">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none" />
        <circle
          cx="20"
          cy="20"
          r={r}
          stroke={accent}
          strokeWidth="3"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 20 20)"
          style={{ filter: `drop-shadow(0 0 4px ${accent})` }}
        />
      </svg>
      <span className="absolute mono text-[10px] font-semibold text-slate-100">{value}</span>
    </div>
  );
}

export default function PredictionFeed() {
  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Radar size={14} className="text-accent-green" />
          <div className="text-[10px] tracking-[0.28em] text-slate-500 uppercase">Intelligence Feed</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip text-accent-green border-accent-green/30 bg-accent-green/5">
            <Brain size={10} /> SexyBot
          </span>
          <span className="chip text-accent-blue border-accent-blue/30 bg-accent-blue/5">
            <Flame size={10} /> Kash
          </span>
        </div>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {predictionFeed.map((p, i) => {
          const pnlUp = p.pnl >= 0;
          const accent = p.agent === 'SexyBot' ? '#00FFA3' : '#3DA9FC';
          return (
            <div key={`${p.agent}-${p.market}`} className="px-5 py-3 flex items-center gap-4 hover:bg-white/[0.02] transition">
              <ConvictionRing value={p.conviction} accent={accent} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[11px] font-semibold tracking-wide"
                    style={{ color: accent }}
                  >
                    {p.agent}
                  </span>
                  <span className="text-slate-600 text-[10px]">·</span>
                  <span className="text-[10px] tracking-[0.2em] text-slate-500 uppercase">{p.venue}</span>
                  <span className="text-slate-600 text-[10px]">·</span>
                  <span className="text-[10px] text-slate-500 mono">{p.t} ago</span>
                </div>
                <div className="text-[13px] text-slate-100 truncate">{p.market}</div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <span
                    className={`chip ${
                      p.side === 'YES'
                        ? 'text-accent-green border-accent-green/30 bg-accent-green/5'
                        : 'text-accent-red border-accent-red/30 bg-accent-red/5'
                    }`}
                  >
                    {p.side}
                  </span>
                  <span className="mono text-[12px] text-slate-200">@{p.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-end gap-2 mt-0.5">
                  <span className="mono text-[11px] text-slate-500">{p.size}</span>
                  <span
                    className={`mono text-[11.5px] flex items-center ${
                      pnlUp ? 'text-accent-green' : 'text-accent-red'
                    }`}
                  >
                    {pnlUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                    {pnlUp ? '+' : '-'}$
                    {Math.abs(p.pnl).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
