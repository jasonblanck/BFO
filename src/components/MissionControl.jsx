import React from 'react';
import {
  Rocket,
  Flame,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ventures } from '../data/portfolio';

function HypeGauge({ value, accent }) {
  const segs = 12;
  const active = Math.round((value / 100) * segs);
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: segs }).map((_, i) => {
          const on = i < active;
          return (
            <span
              key={i}
              className="block h-3 w-[3px] rounded-sm"
              style={{
                background: on ? accent : 'rgba(255,255,255,0.08)',
                boxShadow: on ? `0 0 6px ${accent}` : 'none',
              }}
            />
          );
        })}
      </div>
      <span className="mono text-[10.5px] text-slate-300">{value}</span>
    </div>
  );
}

function MilestoneBar({ pct, accent }) {
  return (
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${accent}66, ${accent})`,
          boxShadow: `0 0 10px ${accent}66`,
        }}
      />
    </div>
  );
}

export default function MissionControl({ onOpenDeepDive }) {
  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Rocket size={14} className="text-accent-violet drop-shadow-[0_0_6px_rgba(167,139,250,0.6)]" />
          <div>
            <div className="text-[10px] tracking-[0.28em] text-slate-500 uppercase">Mission Control</div>
            <div className="text-[14.5px] font-semibold text-slate-100">High-Conviction Ventures</div>
          </div>
        </div>
        <span className="chip text-accent-violet border-accent-violet/30 bg-accent-violet/5">
          <Sparkles size={10} /> {ventures.length} positions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
        {ventures.map((v) => (
          <button
            key={v.id}
            onClick={() => onOpenDeepDive(v)}
            className="card-lift group text-left relative overflow-hidden rounded-xl border border-white/5 bg-navy-900/50"
          >
            <div
              className="relative h-28 w-full overflow-hidden"
              style={{ background: v.image }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900/95 via-navy-900/30 to-transparent" />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full animate-pulse-dot"
                  style={{ background: v.accent, boxShadow: `0 0 8px ${v.accent}` }}
                />
                <span className="text-[10px] tracking-[0.24em] text-slate-200 uppercase">
                  {v.tag}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <span
                  className="chip"
                  style={{
                    color: v.accent,
                    borderColor: `${v.accent}55`,
                    background: `${v.accent}10`,
                  }}
                >
                  {v.round}
                </span>
              </div>
              <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between">
                <h4 className="text-[18px] font-semibold text-white drop-shadow">{v.name}</h4>
                <span
                  className={`mono text-[12px] flex items-center gap-0.5 ${
                    v.markPositive ? 'text-accent-green' : 'text-accent-red'
                  }`}
                >
                  <ArrowUpRight size={12} />
                  {v.mark}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <div className="flex items-center justify-between text-[10.5px] text-slate-400 mb-1.5">
                  <span className="tracking-[0.18em] uppercase">Next milestone</span>
                  <span className="mono text-slate-300">{v.milestonePct}%</span>
                </div>
                <MilestoneBar pct={v.milestonePct} accent={v.accent} />
                <div className="text-[11.5px] text-slate-300 mt-1.5">{v.nextMilestone}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="text-[9.5px] tracking-[0.18em] text-slate-500 uppercase flex items-center gap-1">
                    <Clock size={9} /> Days since mark
                  </div>
                  <div className="mono text-[14px] text-slate-100 mt-0.5">{v.daysSinceMark}d</div>
                </div>
                <div>
                  <div className="text-[9.5px] tracking-[0.18em] text-slate-500 uppercase flex items-center gap-1">
                    <Flame size={9} /> Hype
                  </div>
                  <HypeGauge value={v.hype} accent={v.accent} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-[10.5px] text-slate-500 tracking-wide">Deep Dive</span>
                <ChevronRight
                  size={14}
                  className="text-slate-500 group-hover:translate-x-0.5 group-hover:text-slate-200 transition"
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
