import React, { useMemo, useState } from 'react';
import {
  Rocket,
  Sparkles,
  Crosshair,
  ArrowUpRight,
  Star,
  ChevronRight,
  Home,
  Briefcase,
  Landmark,
  Gem,
  Coins,
  BarChart3,
} from 'lucide-react';
import { manualAccounts, ventures, venturesById, categoryColor } from '../data/portfolio';
import useIsLight from '../hooks/useIsLight';

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

const CATEGORY_ICON = {
  'Real Estate':    Home,
  'Private Equity': Briefcase,
  'Fixed Income':   Landmark,
  'Brokerage':      BarChart3,
  'Digital Assets': Coins,
  'Collectibles':   Gem,
};

// Blueprint wireframe SVGs for the 5 curated ventures.
function VentureSchematic({ id }) {
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

// Spec-sheet wireframe for the 30 non-curated positions.
function DataSheet({ h }) {
  const Icon = CATEGORY_ICON[h.category] ?? Briefcase;
  const id = h.id.replace(/^m-/, '').toUpperCase();
  return (
    <div className="absolute inset-0 p-3 flex flex-col justify-between text-ms-400">
      {/* Header row */}
      <div className="flex items-center justify-between mono text-[9.5px] tracking-[0.22em] uppercase">
        <span className="flex items-center gap-1.5">
          <Crosshair size={10} /> DATA · {h.category}
        </span>
        <span className="opacity-70">ID · {id}</span>
      </div>
      {/* Big icon + faint diagonal grid lines */}
      <svg
        viewBox="0 0 280 60"
        className="absolute inset-x-3 top-1/2 -translate-y-1/2 w-[calc(100%-24px)] h-[60px] pointer-events-none opacity-70"
      >
        <line x1="0" y1="30" x2="280" y2="30" stroke="#3DA9FC" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
        <line x1="140" y1="0" x2="140" y2="60" stroke="#3DA9FC" strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
      </svg>
      <div className="relative z-10 flex items-center gap-2">
        <Icon size={16} className="opacity-80" />
        <span className="mono text-[10px] tracking-[0.18em] uppercase opacity-85">
          {h.name.replace(/[·—]/g, '·').slice(0, 34)}
        </span>
      </div>
      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-2 mono text-[9.5px] tracking-[0.18em] uppercase">
        <div>
          <div className="opacity-60">POSITION</div>
          <div className="text-[11px] text-white">{usd(h.value)}</div>
        </div>
        <div>
          <div className="opacity-60">OPENED</div>
          <div className="text-[11px] text-white">{h.opened}</div>
        </div>
        <div className="text-right">
          <div className="opacity-60">TYPE</div>
          <div className="text-[11px] text-white">DIRECT</div>
        </div>
      </div>
    </div>
  );
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

  const isLight = useIsLight();
  // Per-card flip state for touch devices (desktop uses CSS :hover).
  const [flippedId, setFlippedId] = useState(null);

  const handleCardClick = (h, venture, e) => {
    // Skip if the tap was on a nested interactive element (Deep Dive link).
    if (e.target.closest('[data-deep-dive]')) return;

    const canHover =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(hover: hover)').matches;

    // Desktop + featured: click is the Deep Dive shortcut (hover already
    // reveals the wireframe).
    if (canHover && venture) {
      onOpenDeepDive(venture);
      return;
    }
    // Everything else — touch devices AND desktop clicks on non-featured
    // cards — toggles the flip state. Avoids a dead-click on non-featured
    // desktop rows and makes the whole card universally interactive.
    setFlippedId((prev) => (prev === h.id ? null : h.id));
  };

  return (
    <section className="panel relative overflow-hidden">
      <div className="panel-header">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Rocket size={14} className="text-ms-400 shrink-0" />
          <div className="min-w-0">
            <div className="panel-subtitle">Mission Control</div>
            <div className="panel-title truncate">High-Conviction Holdings</div>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="chip">
            <Sparkles size={10} /> {sorted.length}
          </span>
          <div className="hidden sm:block mono text-[12px] text-slate-400">
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
          const isFlipped = flippedId === h.id;

          return (
            <button
              key={h.id}
              onClick={(e) => handleCardClick(h, venture, e)}
              type="button"
              aria-pressed={isFlipped}
              className={`group card-lift glitch-on-hover text-left relative overflow-hidden border border-white/10 bg-black/40 cursor-pointer ${
                isFlipped ? 'is-flipped' : ''
              }`}
            >
              {/* -------- Hero banner (100px) -------- */}
              <div className="relative h-[100px] overflow-hidden">
                {/* Base layer — hidden on hover (desktop) OR when flipped (mobile) */}
                <div
                  className={`absolute inset-0 transition-opacity duration-300 group-hover:opacity-0 ${
                    isFlipped ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{
                    background: featured
                      ? (isLight && venture.imageLight ? venture.imageLight : venture.image)
                      : isLight
                        ? `linear-gradient(135deg, #FFFFFF, ${color}18 80%, ${color}3C)`
                        : `linear-gradient(135deg, rgba(3,6,12,0.9), ${color}22 80%, ${color}44)`,
                  }}
                >
                  {/* Top row: category + round pill */}
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
                  {featured && (
                    <div className="absolute bottom-3 right-3">
                      <span className="mono text-[12px] text-gain-500 flex items-center gap-0.5 font-semibold">
                        <ArrowUpRight size={12} />
                        {venture.mark}
                      </span>
                    </div>
                  )}
                </div>

                {/* Flip / hover layer — blueprint wireframe for ALL cards */}
                <div
                  className={`absolute inset-0 blueprint transition-opacity duration-300 pointer-events-none group-hover:opacity-100 ${
                    isFlipped ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <div className="glitch-layer absolute inset-0">
                    {featured ? (
                      <div className="p-3 w-full h-full"><VentureSchematic id={venture.id} /></div>
                    ) : (
                      <DataSheet h={h} />
                    )}
                  </div>

                  {featured && (
                    <>
                      <div className="absolute top-2 left-3 flex items-center gap-1.5">
                        <Crosshair size={10} className="text-ms-400" />
                        <span className="mono text-[9.5px] tracking-[0.22em] text-ms-400 uppercase">
                          Wireframe · {venture.name}
                        </span>
                      </div>
                      <div className="absolute top-2 right-3 mono text-[9.5px] text-ms-400 uppercase tracking-wider">
                        REV · {venture.round}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* -------- Info section -------- */}
              <div className="p-4 flex flex-col gap-2">
                <h4 className="text-[15px] font-semibold text-white leading-snug line-clamp-2 min-h-[2.6em]">
                  {h.name}
                </h4>
                <div className="flex items-center justify-between gap-2">
                  <div className="mono text-[10px] text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
                    />
                    {h.opened}
                  </div>
                  {featured ? (
                    <span
                      data-deep-dive
                      onClick={(e) => { e.stopPropagation(); onOpenDeepDive(venture); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onOpenDeepDive(venture);
                        }
                      }}
                      role="link"
                      tabIndex={0}
                      aria-label={`Open Deep Dive for ${venture.name}`}
                      className="mono text-[10px] text-ms-400 uppercase tracking-wider flex items-center gap-1 hover:text-ms-300 focus:outline-none focus:text-ms-300 cursor-pointer"
                    >
                      Deep Dive <ChevronRight size={11} />
                    </span>
                  ) : (
                    <span className="mono text-[10px] text-slate-500 uppercase tracking-wider">
                      {isFlipped ? 'Tap to Close' : 'Direct'}
                    </span>
                  )}
                </div>

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
          <Crosshair size={10} className="text-ms-400" />
          Hover (desktop) or tap (mobile) any card for wireframe view
        </span>
      </div>
    </section>
  );
}
