import React, { useMemo } from 'react';
import { Rocket, Sparkles, ChevronRight, Star } from 'lucide-react';
import { manualAccounts, ventures, venturesById, categoryColor } from '../data/portfolio';

function usd(n) {
  if (n == null) return '—';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M';
  if (n >= 10_000)    return '$' + (n / 1_000).toFixed(1) + 'K';
  if (n >= 1_000)     return '$' + (n / 1_000).toFixed(2) + 'K';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function fullUsd(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

export default function MissionControl({ onOpenDeepDive }) {
  const sorted = useMemo(
    () => [...manualAccounts].sort((a, b) => b.value - a.value),
    []
  );
  const total = sorted.reduce((s, r) => s + r.value, 0);

  const byId = useMemo(
    () => Object.fromEntries(ventures.map((v) => [v.id, v])),
    []
  );

  return (
    <section className="panel relative overflow-hidden">
      {/* Uniform header */}
      <div className="panel-header">
        <div className="flex items-center gap-3 min-w-0">
          <Rocket size={14} className="text-ms-400 shrink-0" />
          <div className="min-w-0">
            <div className="panel-subtitle">Mission Control</div>
            <div className="panel-title">High-Conviction Holdings</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="chip">
            <Sparkles size={10} /> {sorted.length} positions
          </span>
          <div className="mono text-[12px] text-slate-400">
            Total <span className="text-white ml-1">{fullUsd(total)}</span>
          </div>
        </div>
      </div>

      {/* Compact 4-col card grid — name + info always visible */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sorted.map((h) => {
          const ventureId = venturesById[h.id];
          const featured = ventureId && byId[ventureId];
          const color = categoryColor[h.category] ?? '#64748B';
          const onClick = featured ? () => onOpenDeepDive(featured) : undefined;

          return (
            <button
              key={h.id}
              onClick={onClick}
              disabled={!featured}
              className={`group relative text-left flex flex-col gap-2 p-4 border-r border-b border-white/10 row-hover transition ${
                featured ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Left category stripe */}
              <span
                aria-hidden
                className="absolute left-0 top-0 bottom-0 w-[2px]"
                style={{ background: color, opacity: 0.7 }}
              />

              {/* Name + category + date */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-white leading-snug line-clamp-2">
                    {h.name}
                  </div>
                  <div className="mono text-[10px] text-slate-400 tracking-wider uppercase mt-1 flex items-center gap-1.5 flex-wrap">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
                    />
                    <span style={{ color }}>{h.category}</span>
                    <span className="text-slate-600">·</span>
                    <span>{h.opened}</span>
                  </div>
                </div>
                {featured && (
                  <Star
                    size={12}
                    className="text-ms-400 shrink-0 mt-0.5"
                    fill="currentColor"
                    strokeWidth={0}
                  />
                )}
              </div>

              {/* Value + affordance */}
              <div className="flex items-end justify-between mt-auto pt-1">
                <div className="mono text-[15px] font-semibold text-white leading-none">
                  {usd(h.value)}
                </div>
                {featured ? (
                  <span className="chip chip-ms flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Deep Dive <ChevronRight size={11} />
                  </span>
                ) : (
                  <span className="mono text-[10px] text-slate-500 tracking-wider uppercase">
                    Direct
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/10 bg-white/[0.012]">
        <span className="mono text-[10px] text-slate-500 tracking-wider">
          Source · Manual entry · Sorted by position size
        </span>
        <span className="mono text-[10px] text-slate-500 tracking-wider flex items-center gap-1.5">
          <Star size={10} className="text-ms-400" fill="currentColor" strokeWidth={0} />
          Featured positions open curated Deep Dive
        </span>
      </div>
    </section>
  );
}
