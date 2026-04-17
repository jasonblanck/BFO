import React from 'react';
import {
  Rocket,
  Flame,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  Crosshair,
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
              className="block h-3 w-[3px]"
              style={{
                background: on ? accent : 'rgba(255,255,255,0.08)',
                boxShadow: on ? `0 0 6px ${accent}` : 'none',
              }}
            />
          );
        })}
      </div>
      <span className="mono text-[10.5px] text-emerald-200/80">{value}</span>
    </div>
  );
}

function MilestoneBar({ pct, accent }) {
  return (
    <div className="h-1.5 bg-black/40 overflow-hidden relative border border-white/5">
      <div
        className="h-full"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${accent}66, ${accent})`,
          boxShadow: `0 0 10px ${accent}88`,
        }}
      />
    </div>
  );
}

// Wireframe "blueprint" logo — rendered on hover to replace the hero.
// Geometrical abstraction per venture so each still reads as distinct.
function Blueprint({ id }) {
  if (id === 'neuralink')
    return (
      <svg viewBox="0 0 200 110" className="w-full h-full">
        <g stroke="#00F0FF" strokeWidth="1" fill="none" opacity="0.9">
          {Array.from({ length: 24 }).map((_, i) => (
            <circle key={i} cx="100" cy="55" r={6 + i * 2} opacity={0.05 + i * 0.025} />
          ))}
          <line x1="0" y1="55" x2="200" y2="55" strokeDasharray="2 3" opacity="0.6" />
          <line x1="100" y1="0" x2="100" y2="110" strokeDasharray="2 3" opacity="0.6" />
          <circle cx="100" cy="55" r="4" fill="#00F0FF" />
        </g>
        <text x="8" y="100" fill="#00F0FF" fontFamily="JetBrains Mono" fontSize="8" letterSpacing="0.1em">
          NEURALINK · N1-IMPLANT · r1.2
        </text>
      </svg>
    );
  if (id === 'figure')
    return (
      <svg viewBox="0 0 200 110" className="w-full h-full">
        <g stroke="#00F0FF" strokeWidth="1" fill="none" opacity="0.9">
          <rect x="80" y="18" width="40" height="22" />
          <rect x="72" y="44" width="56" height="40" />
          <line x1="70" y1="50" x2="50" y2="70" />
          <line x1="130" y1="50" x2="150" y2="70" />
          <line x1="88" y1="84" x2="84" y2="104" />
          <line x1="112" y1="84" x2="116" y2="104" />
          <circle cx="92" cy="28" r="2" fill="#00F0FF" />
          <circle cx="108" cy="28" r="2" fill="#00F0FF" />
        </g>
        <text x="8" y="100" fill="#00F0FF" fontFamily="JetBrains Mono" fontSize="8" letterSpacing="0.1em">
          FIGURE 02 · HELIX-VLM · r2.4
        </text>
      </svg>
    );
  if (id === 'anduril')
    return (
      <svg viewBox="0 0 200 110" className="w-full h-full">
        <g stroke="#00F0FF" strokeWidth="1" fill="none" opacity="0.9">
          <polygon points="100,14 180,56 140,96 60,96 20,56" />
          <polygon points="100,30 160,56 130,82 70,82 40,56" opacity="0.6" />
          <line x1="100" y1="14" x2="100" y2="96" strokeDasharray="2 3" />
          <line x1="20" y1="56" x2="180" y2="56" strokeDasharray="2 3" />
        </g>
        <text x="8" y="100" fill="#00F0FF" fontFamily="JetBrains Mono" fontSize="8" letterSpacing="0.1em">
          LATTICE · BARRACUDA-M · r1.0
        </text>
      </svg>
    );
  if (id === 'perplexity')
    return (
      <svg viewBox="0 0 200 110" className="w-full h-full">
        <g stroke="#00F0FF" strokeWidth="1" fill="none" opacity="0.9">
          {Array.from({ length: 8 }).map((_, i) => (
            <circle key={i} cx="100" cy="55" r={8 + i * 6} />
          ))}
          <line x1="100" y1="5" x2="100" y2="105" strokeDasharray="2 3" />
          <line x1="30" y1="55" x2="170" y2="55" strokeDasharray="2 3" />
        </g>
        <text x="8" y="100" fill="#00F0FF" fontFamily="JetBrains Mono" fontSize="8" letterSpacing="0.1em">
          PAGES 2.0 · ENTERPRISE GA
        </text>
      </svg>
    );
  if (id === 'starlab')
    return (
      <svg viewBox="0 0 200 110" className="w-full h-full">
        <g stroke="#00F0FF" strokeWidth="1" fill="none" opacity="0.9">
          <ellipse cx="100" cy="55" rx="70" ry="16" />
          <rect x="80" y="42" width="40" height="26" />
          <line x1="30" y1="55" x2="80" y2="55" />
          <line x1="120" y1="55" x2="170" y2="55" />
          <circle cx="30" cy="55" r="4" />
          <circle cx="170" cy="55" r="4" />
        </g>
        <text x="8" y="100" fill="#00F0FF" fontFamily="JetBrains Mono" fontSize="8" letterSpacing="0.1em">
          STARLAB · HAB MOD · CDR
        </text>
      </svg>
    );
  return null;
}

export default function MissionControl({ onOpenDeepDive }) {
  return (
    <section className="hud hud-corners overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />
      <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-400/10">
        <div className="flex items-center gap-2">
          <Rocket size={14} className="text-hud-emerald drop-shadow-[0_0_6px_rgba(0,255,65,0.6)]" />
          <div>
            <div className="mono text-[10px] tracking-[0.28em] text-emerald-300/60 uppercase">
              Mission Control
            </div>
            <div className="text-[14.5px] font-semibold text-slate-100">
              High-Conviction Ventures
            </div>
          </div>
        </div>
        <span className="chip">
          <Sparkles size={10} className="text-hud-emerald" /> {ventures.length} positions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
        {ventures.map((v) => (
          <button
            key={v.id}
            onClick={() => onOpenDeepDive(v)}
            className="card-lift glitch-on-hover group text-left relative overflow-hidden border border-emerald-400/10 bg-black/40"
          >
            {/* Hero (image) — fades out on hover */}
            <div
              className="relative h-28 w-full overflow-hidden transition-opacity duration-300 group-hover:opacity-0"
              style={{ background: v.image }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span
                  className="h-2 w-2 animate-pulse-dot"
                  style={{ background: v.accent, boxShadow: `0 0 10px ${v.accent}` }}
                />
                <span className="mono text-[10px] tracking-[0.22em] text-slate-100 uppercase">
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
                  className={`mono text-[12px] flex items-center gap-0.5 text-hud-emerald`}
                >
                  <ArrowUpRight size={12} />
                  {v.mark}
                </span>
              </div>
            </div>

            {/* Blueprint — appears on hover, slightly glitches */}
            <div className="absolute top-0 left-0 right-0 h-28 blueprint opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
              <div className="absolute inset-0 p-3">
                <div className="glitch-layer w-full h-full">
                  <Blueprint id={v.id} />
                </div>
              </div>
              <div className="absolute top-2 left-3 flex items-center gap-1.5">
                <Crosshair size={10} className="text-hud-cyan" />
                <span className="mono text-[9.5px] tracking-[0.2em] text-hud-cyan uppercase">
                  Wireframe · {v.name}
                </span>
              </div>
              <div className="absolute top-2 right-3 mono text-[9.5px] text-hud-cyan uppercase tracking-wider">
                REV · {v.round}
              </div>
              <div className="absolute bottom-2 right-3 mono text-[9.5px] text-hud-cyan uppercase tracking-wider">
                MARK {v.mark}
              </div>
            </div>

            <div className="p-4 space-y-3 relative">
              <div>
                <div className="flex items-center justify-between text-[10.5px] text-emerald-300/60 mb-1.5">
                  <span className="mono tracking-[0.18em] uppercase">Next milestone</span>
                  <span className="mono text-slate-200">{v.milestonePct}%</span>
                </div>
                <MilestoneBar pct={v.milestonePct} accent={v.accent} />
                <div className="text-[11.5px] text-slate-300 mt-1.5">{v.nextMilestone}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <div className="mono text-[9.5px] tracking-[0.18em] text-emerald-300/60 uppercase flex items-center gap-1">
                    <Clock size={9} /> Days since mark
                  </div>
                  <div className="mono text-[14px] text-slate-100 mt-0.5">{v.daysSinceMark}d</div>
                </div>
                <div>
                  <div className="mono text-[9.5px] tracking-[0.18em] text-emerald-300/60 uppercase flex items-center gap-1">
                    <Flame size={9} /> Hype
                  </div>
                  <HypeGauge value={v.hype} accent={v.accent} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-emerald-400/10">
                <span className="mono text-[10.5px] text-emerald-300/50 tracking-wider uppercase">Deep Dive</span>
                <ChevronRight
                  size={14}
                  className="text-emerald-300/50 group-hover:translate-x-0.5 group-hover:text-hud-emerald transition"
                />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
