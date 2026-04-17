import React, { useEffect } from 'react';
import { X, Newspaper, GitBranch, TrendingUp, Rocket } from 'lucide-react';

export default function DeepDiveModal({ venture, onClose }) {
  useEffect(() => {
    if (!venture) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [venture, onClose]);

  if (!venture) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl overflow-hidden glass-strong shadow-lift"
      >
        <div
          className="relative h-44 overflow-hidden"
          style={{ background: venture.image }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/95 via-navy-900/50 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-lg border border-white/10 bg-navy-900/60 flex items-center justify-center hover:bg-navy-800 transition"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="chip"
                  style={{
                    color: venture.accent,
                    borderColor: `${venture.accent}55`,
                    background: `${venture.accent}10`,
                  }}
                >
                  <Rocket size={10} /> {venture.round}
                </span>
                <span className="text-[10px] tracking-[0.24em] uppercase text-slate-300">
                  {venture.tag}
                </span>
              </div>
              <h2 className="text-[26px] font-semibold text-white mt-1">{venture.name}</h2>
            </div>
            <div className="text-right">
              <div className="text-[10.5px] tracking-[0.18em] uppercase text-slate-400">Mark</div>
              <div className="mono text-[18px] text-accent-green flex items-center gap-1 justify-end">
                <TrendingUp size={14} /> {venture.mark}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
          <div className="md:col-span-3 p-5 border-r border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <Newspaper size={13} className="text-accent-blue" />
              <div className="text-[10px] tracking-[0.28em] text-slate-500 uppercase">News & Signals</div>
            </div>
            <ul className="space-y-3">
              {venture.news.map((n, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-navy-900/40 px-3 py-2.5"
                >
                  <span className="mono text-[10.5px] text-slate-500 pt-0.5 w-12 shrink-0">
                    {n.t} ago
                  </span>
                  <span className="text-[13px] text-slate-100 leading-snug">{n.h}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <div className="text-[10px] tracking-[0.28em] text-slate-500 uppercase mb-2">
                Next Milestone
              </div>
              <div className="rounded-lg border border-white/5 bg-navy-900/40 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[13px] text-slate-100">{venture.nextMilestone}</span>
                  <span className="mono text-[11.5px] text-slate-300">
                    {venture.milestonePct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${venture.milestonePct}%`,
                      background: `linear-gradient(90deg, ${venture.accent}66, ${venture.accent})`,
                      boxShadow: `0 0 10px ${venture.accent}66`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 p-5">
            <div className="flex items-center gap-2 mb-3">
              <GitBranch size={13} className="text-accent-violet" />
              <div className="text-[10px] tracking-[0.28em] text-slate-500 uppercase">
                Portfolio Synergy
              </div>
            </div>
            <p className="text-[12.5px] leading-relaxed text-slate-300">{venture.synergy}</p>

            <div className="mt-5 space-y-2.5 text-[12px]">
              <Row k="Days Since Last Mark" v={`${venture.daysSinceMark} d`} />
              <Row k="Hype / Sentiment" v={`${venture.hype} / 100`} />
              <Row k="Thesis Conviction" v="Tier 1 · Strong Buy" />
              <Row k="Reserve Allocation" v="+$400K earmarked" />
              <Row k="Secondary Liquidity" v="Tender window open · 90d" />
            </div>

            <button
              className="mt-6 w-full rounded-lg border border-accent-green/30 bg-accent-green/5 text-accent-green text-[12px] font-semibold tracking-wider uppercase py-2.5 hover:bg-accent-green/10 transition"
              onClick={onClose}
            >
              Log Update to Ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2">
      <span className="text-slate-500">{k}</span>
      <span className="mono text-slate-100">{v}</span>
    </div>
  );
}
