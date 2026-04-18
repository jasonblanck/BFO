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
    <svg viewBox="0 0 280 100" className="w-full h-full">
      <g stroke="#3DA9FC" strokeWidth="1" fill="none" opacity="0.9">
        {Array.from({ length: 14 }).map((_, i) => (
          <circle key={i} cx="140" cy="50" r={6 + i * 2.8} opacity={0.08 + i * 0.04} />
        ))}
        <line x1="0" y1="50" x2="280" y2="50" strokeDasharray="2 3" opacity="0.6" />
        <line x1="140" y1="0" x2="140" y2="100" strokeDasharray="2 3" opacity="0.6" />
        <circle cx="140" cy="50" r="4" fill="#3DA9FC" />
      </g>
      <text x="8" y="90" fill="#3DA9FC" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="0.12em">
        NEURALINK · N1-IMPLANT · r1.2
      </text>
    </svg>
  );
  if (id === 'figure') return (
    <svg viewBox="0 0 280 100" className="w-full h-full">
      <g stroke="#3DA9FC" strokeWidth="1" fill="none" opacity="0.9">
        <rect x="126" y="10" width="28" height="18" />
        <rect x="116" y="32" width="48" height="36" />
        <line x1="114" y1="38" x2="90"  y2="58" />
        <line x1="166" y1="38" x2="190" y2="58" />
        <line x1="130" y1="68" x2="124" y2="92" />
        <line x1="150" y1="68" x2="156" y2="92" />
        <circle cx="134" cy="18" r="2" fill="#3DA9FC" />
        <circle cx="146" cy="18" r="2" fill="#3DA9FC" />
        <line x1="20" y1="50" x2="260" y2="50" strokeDasharray="2 3" opacity="0.4" />
      </g>
      <text x="8" y="90" fill="#3DA9FC" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="0.12em">
        FIGURE 02 · HELIX-VLM · r2.4
      </text>
    </svg>
  );
  if (id === 'anduril') return (
    <svg viewBox="0 0 280 100" className="w-full h-full">
      <g stroke="#3DA9FC" strokeWidth="1" fill="none" opacity="0.9">
        <polygon points="140,10 220,50 184,88 96,88 60,50" />
        <polygon points="140,26 194,50 164,76 116,76 86,50" opacity="0.6" />
        <line x1="140" y1="10" x2="140" y2="88" strokeDasharray="2 3" />
        <line x1="60"  y1="50" x2="220" y2="50" strokeDasharray="2 3" />
        <circle cx="140" cy="50" r="3" fill="#3DA9FC" />
      </g>
      <text x="8" y="96" fill="#3DA9FC" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="0.12em">
        LATTICE · BARRACUDA-M · r1.0
      </text>
    </svg>
  );
  if (id === 'perplexity') return (
    <svg viewBox="0 0 280 100" className="w-full h-full">
      <g stroke="#3DA9FC" strokeWidth="1" fill="none" opacity="0.9">
        {Array.from({ length: 7 }).map((_, i) => (
          <circle key={i} cx="140" cy="50" r={10 + i * 6} opacity={0.2 + i * 0.09} />
        ))}
        <line x1="140" y1="4"  x2="140" y2="96" strokeDasharray="2 3" />
        <line x1="20"  y1="50" x2="260" y2="50" strokeDasharray="2 3" />
      </g>
      <text x="8" y="90" fill="#3DA9FC" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="0.12em">
        PAGES 2.0 · ENTERPRISE GA
      </text>
    </svg>
  );
  if (id === 'starlab') return (
    <svg viewBox="0 0 280 100" className="w-full h-full">
      <g stroke="#3DA9FC" strokeWidth="1" fill="none" opacity="0.9">
        <ellipse cx="140" cy="50" rx="84" ry="16" />
        <rect x="118" y="38" width="44" height="24" />
        <line x1="44"  y1="50" x2="118" y2="50" />
        <line x1="162" y1="50" x2="236" y2="50" />
        <circle cx="44"  cy="50" r="4" />
        <circle cx="236" cy="50" r="4" />
      </g>
      <text x="8" y="90" fill="#3DA9FC" fontFamily="JetBrains Mono" fontSize="9" letterSpacing="0.12em">
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
              {/* -------- Hero banner (100px) — decorative only, no name -------- */}
              <div className="relative h-[100px] overflow-hidden">
                {/* Base layer */}
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
                  {/* Top row: category chip + round pill (featured) */}
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

                  {/* Bottom-right mark delta (featured only) */}
                  {featured && (
                    <div className="absolute bottom-3 right-3">
                      <span className="mono text-[12px] text-gain-500 flex items-center gap-0.5 font-semibold">
                        <ArrowUpRight size={12} />
                        {venture.mark}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hover layer — blueprint wireframe for featured only */}
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
                  </div>
                )}
              </div>

              {/* -------- Info section — all text lives here on solid panel bg -------- */}
              <div className="p-4 flex flex-col gap-2">
                {/* Name — stark white, always crisp, no hero-scrim washout */}
                <h4 className="text-[15px] font-semibold text-white leading-snug line-clamp-2 min-h-[2.6em]">
                  {h.name}
                </h4>

                {/* Meta row: date + affordance */}
                <div className="flex items-center justify-between gap-2">
                  <div className="mono text-[10px] text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
                    />
                    {h.opened}
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

                {/* Value + milestone */}
                <div className="flex items-end justify-between gap-2 pt-1">
                  <div className="mono text-[20px] font-semibold text-white leading-none">
                    {usd(h.value)}
                  </div>
                  {featured && (
                    <div className="min-w-0 max-w-[58%] text-right">
                      <div className="mono text-[9.5px] tracking-[0.18em] text-slate-400 uppercase">
                        {venture.milestonePct}% · Next
                      </div>
                      <div className="text-[11px] text-slate-300 truncate">
                        {venture.nextMilestone}
                      </div>
                    </div>
                  )}
                </div>

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
