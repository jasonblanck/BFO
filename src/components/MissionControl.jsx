import React, { useMemo } from 'react';
import { Rocket, Sparkles, Crosshair, ArrowUpRight, Star } from 'lucide-react';
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

// Blueprint wireframe SVGs — one geometric schematic per curated venture.
// Rendered in the hero area on hover. Cyan ink on a blue-dot grid.
function Blueprint({ id }) {
  if (id === 'neuralink') return (
    <svg viewBox="0 0 280 120" className="w-full h-full">
      <g stroke="#3DA9FC" strokeWidth="1" fill="none" opacity="0.9">
        {Array.from({ length: 16 }).map((_, i) => (
          <circle key={i} cx="140" cy="60" r={6 + i * 3.2} opacity={0.08 + i * 0.04} />
        ))}
        <line x1="0" y1="60" x2="280" y2="60" strokeDasharray="2 3" opacity="0.7" />
        <line x1="140" y1="0" x2="140" y2="120" strokeDasharray="2 3" opacity="0.7" />
        <circle cx="140" cy="60" r="4" fill="#3DA9FC" />
      </g>
      <text x="10" y="108" fill="#3DA9FC" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="0.12em">
        NEURALINK · N1-IMPLANT · r1.2
      </text>
    </svg>
  );
  if (id === 'figure') return (
    <svg viewBox="0 0 280 120" className="w-full h-full">
      <g stroke="#3DA9FC" strokeWidth="1" fill="none" opacity="0.9">
        <rect x="124" y="14" width="32" height="22" />
        <rect x="112" y="40" width="56" height="44" />
        <line x1="110" y1="48" x2="82"  y2="72" />
        <line x1="170" y1="48" x2="198" y2="72" />
        <line x1="128" y1="84" x2="122" y2="112" />
        <line x1="152" y1="84" x2="158" y2="112" />
        <circle cx="132" cy="24" r="2" fill="#3DA9FC" />
        <circle cx="148" cy="24" r="2" fill="#3DA9FC" />
        <line x1="20" y1="60" x2="260" y2="60" strokeDasharray="2 3" opacity="0.5" />
      </g>
      <text x="10" y="108" fill="#3DA9FC" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="0.12em">
        FIGURE 02 · HELIX-VLM · r2.4
      </text>
    </svg>
  );
  if (id === 'anduril') return (
    <svg viewBox="0 0 280 120" className="w-full h-full">
      <g stroke="#3DA9FC" strokeWidth="1" fill="none" opacity="0.9">
        <polygon points="140,14 230,60 190,104 90,104 50,60" />
        <polygon points="140,30 200,60 170,90 110,90 80,60" opacity="0.6" />
        <line x1="140" y1="14" x2="140" y2="104" strokeDasharray="2 3" />
        <line x1="50"  y1="60" x2="230" y2="60" strokeDasharray="2 3" />
        <circle cx="140" cy="60" r="3" fill="#3DA9FC" />
      </g>
      <text x="10" y="112" fill="#3DA9FC" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="0.12em">
        LATTICE · BARRACUDA-M · r1.0
      </text>
    </svg>
  );
  if (id === 'perplexity') return (
    <svg viewBox="0 0 280 120" className="w-full h-full">
      <g stroke="#3DA9FC" strokeWidth="1" fill="none" opacity="0.9">
        {Array.from({ length: 8 }).map((_, i) => (
          <circle key={i} cx="140" cy="60" r={10 + i * 7} opacity={0.2 + i * 0.08} />
        ))}
        <line x1="140" y1="4"  x2="140" y2="116" strokeDasharray="2 3" />
        <line x1="20"  y1="60" x2="260" y2="60" strokeDasharray="2 3" />
      </g>
      <text x="10" y="108" fill="#3DA9FC" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="0.12em">
        PAGES 2.0 · ENTERPRISE GA
      </text>
    </svg>
  );
  if (id === 'starlab') return (
    <svg viewBox="0 0 280 120" className="w-full h-full">
      <g stroke="#3DA9FC" strokeWidth="1" fill="none" opacity="0.9">
        <ellipse cx="140" cy="60" rx="94" ry="20" />
        <rect x="116" y="44" width="48" height="32" />
        <line x1="40"  y1="60" x2="116" y2="60" />
        <line x1="164" y1="60" x2="240" y2="60" />
        <circle cx="40"  cy="60" r="4" />
        <circle cx="240" cy="60" r="4" />
      </g>
      <text x="10" y="108" fill="#3DA9FC" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="0.12em">
        STARLAB · HAB MOD · CDR
      </text>
    </svg>
  );
  return null;
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-3 sm:p-4">
        {sorted.map((h) => {
          const ventureId = venturesById[h.id];
          const venture = ventureId ? byId[ventureId] : null;
          const featured = !!venture;
          const color = categoryColor[h.category] ?? '#64748B';
          const onClick = featured ? () => onOpenDeepDive(venture) : undefined;

          return (
            <button
              key={h.id}
              onClick={onClick}
              disabled={!featured}
              className={`group text-left relative overflow-hidden border border-white/10 bg-black/40 ${
                featured ? 'card-lift glitch-on-hover cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* -------- Hero banner (140px tall) -------- */}
              <div className="relative h-[140px] overflow-hidden">
                {/* Base layer — image for featured, category tint for others */}
                <div
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    featured ? 'group-hover:opacity-0' : ''
                  }`}
                  style={{
                    background: featured
                      ? venture.image
                      : `linear-gradient(135deg, rgba(3,6,12,0.9), ${color}22 80%, ${color}44)`,
                  }}
                >
                  {/* Readability scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Top metadata row */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                    <span
                      className="mono text-[9.5px] tracking-[0.22em] uppercase px-2 py-1 border rounded-sm"
                      style={{
                        color,
                        borderColor: `${color}55`,
                        background: `${color}14`,
                      }}
                    >
                      {h.category}
                    </span>
                    {featured && (
                      <span className="chip chip-ms flex items-center gap-1">
                        <Star size={9} fill="currentColor" strokeWidth={0} />
                        {venture.round}
                      </span>
                    )}
                  </div>

                  {/* Bottom name + mark */}
                  <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between gap-3">
                    <h4 className="text-[16px] font-semibold text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.6)] leading-tight">
                      {h.name}
                    </h4>
                    {featured && (
                      <span className="mono text-[12px] text-gain-500 flex items-center gap-0.5 shrink-0">
                        <ArrowUpRight size={12} />
                        {venture.mark}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover layer — cyan blueprint wireframe for featured only */}
                {featured && (
                  <div className="absolute inset-0 blueprint opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="glitch-layer absolute inset-0 p-3">
                      <Blueprint id={venture.id} />
                    </div>
                    <div className="absolute top-2 left-3 flex items-center gap-1.5">
                      <Crosshair size={10} className="text-ms-400" />
                      <span className="mono text-[9.5px] tracking-[0.22em] text-ms-400 uppercase">
                        Wireframe · {venture.name}
                      </span>
                    </div>
                    <div className="absolute top-2 right-3 mono text-[9.5px] text-ms-400 uppercase tracking-wider">
                      REV · {venture.round}
                    </div>
                    <div className="absolute bottom-2 right-3 mono text-[9.5px] text-ms-400 uppercase tracking-wider">
                      MARK {venture.mark}
                    </div>
                  </div>
                )}
              </div>

              {/* -------- Info section (always visible) -------- */}
              <div className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="mono text-[10px] text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
                    />
                    <span>{h.opened}</span>
                  </div>
                  {featured ? (
                    <span className="mono text-[10px] text-ms-400 uppercase tracking-wider">
                      Deep Dive →
                    </span>
                  ) : (
                    <span className="mono text-[10px] text-slate-500 uppercase tracking-wider">
                      Direct
                    </span>
                  )}
                </div>

                {/* Value + milestone (if featured) */}
                <div className="flex items-end justify-between gap-2">
                  <div className="mono text-[20px] font-semibold text-white leading-none">
                    {usd(h.value)}
                  </div>
                  {featured && (
                    <div className="min-w-0 max-w-[55%] text-right">
                      <div className="mono text-[9.5px] tracking-[0.18em] text-slate-400 uppercase">
                        {venture.milestonePct}% · Next
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">
                        {venture.nextMilestone}
                      </div>
                    </div>
                  )}
                </div>

                {/* Featured milestone progress bar */}
                {featured && (
                  <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${venture.milestonePct}%`,
                        background: `linear-gradient(90deg, ${venture.accent}66, ${venture.accent})`,
                      }}
                    />
                  </div>
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
          Hover featured cards for wireframe view
        </span>
      </div>
    </section>
  );
}
