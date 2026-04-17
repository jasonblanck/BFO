import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  Building2,
  Landmark,
  GraduationCap,
  PiggyBank,
  Wallet,
  Globe,
  Rocket,
  Star,
  CircleDot,
} from 'lucide-react';
import { institutions, institutionTotal, totalAssets } from '../data/portfolio';

const ICONS = {
  ms: Building2,
  tiaa: Landmark,
  fidelity: Landmark,
  ny529: GraduationCap,
  bofa: PiggyBank,
  chase: Wallet,
  citi: Globe,
  'bci-pe': Rocket,
};

function usd(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function pct(n) {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function AllocationBar({ value, color = '#3DA9FC' }) {
  const w = Math.min(100, Math.max(0, value));
  return (
    <div className="relative h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${w}%`,
          background: `linear-gradient(90deg, ${color}00, ${color} 50%, ${color}CC)`,
          boxShadow: `0 0 12px ${color}66`,
        }}
      />
    </div>
  );
}

export default function InstitutionsTable({ selectedAccountId, onSelectAccount }) {
  const grand = useMemo(() => totalAssets(), []);
  const [expanded, setExpanded] = useState(() => ({
    ms: true,
    'bci-pe': true,
    fidelity: true,
    tiaa: false,
    ny529: false,
    bofa: false,
    chase: false,
    citi: false,
  }));

  function toggle(id) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <div>
          <div className="text-[10px] tracking-[0.28em] text-slate-500 uppercase">Single Source View</div>
          <div className="text-[15px] font-semibold text-slate-100">Institutional Accounts</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip text-accent-green border-accent-green/30 bg-accent-green/5">
            <CircleDot size={10} className="animate-pulse-dot" /> Synced 2s ago
          </span>
          <span className="chip text-slate-300">{institutions.length} Institutions</span>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-[1.6fr_1fr_0.9fr_0.7fr_1fr] gap-0 px-5 py-2 text-[10px] tracking-[0.2em] text-slate-500 uppercase border-b border-white/5 bg-white/[0.015]">
        <div>Account</div>
        <div>Owner</div>
        <div className="text-right">Assets</div>
        <div className="text-right">24h Δ</div>
        <div>Allocation</div>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {institutions.map((inst) => {
          const Icon = ICONS[inst.id] ?? Landmark;
          const total = institutionTotal(inst);
          const allocPct = (total / grand) * 100;
          const isOpen = expanded[inst.id];
          return (
            <div key={inst.id}>
              <button
                onClick={() => toggle(inst.id)}
                className="w-full md:grid md:grid-cols-[1.6fr_1fr_0.9fr_0.7fr_1fr] flex flex-col md:flex-row gap-2 md:gap-0 items-stretch md:items-center px-4 md:px-5 py-3 hover:bg-white/[0.025] transition text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ChevronRight
                    size={14}
                    className={`text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-90 text-slate-300' : ''}`}
                  />
                  <div
                    className="h-7 w-7 shrink-0 flex items-center justify-center"
                    style={{
                      background: `${inst.accent}18`,
                      boxShadow: `inset 0 0 0 1px ${inst.accent}33`,
                    }}
                  >
                    <Icon size={14} style={{ color: inst.accent }} />
                  </div>
                  <div className="leading-tight min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-slate-100 flex items-center gap-2 flex-wrap">
                      <span className="truncate">{inst.name}</span>
                      {inst.role === 'Master' && (
                        <span className="chip text-accent-blue border-accent-blue/30 bg-accent-blue/5">
                          <Star size={9} /> Master
                        </span>
                      )}
                      {inst.manual && (
                        <span className="chip text-accent-green border-accent-green/30 bg-accent-green/5">
                          Manual
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{inst.role}</div>
                  </div>
                  {/* Mobile: show assets inline with name */}
                  <div className="md:hidden text-right shrink-0">
                    <div className="mono text-[13px] text-slate-100">{usd(total)}</div>
                    <div className="mono text-[10px] text-emerald-300/50">{allocPct.toFixed(1)}%</div>
                  </div>
                </div>
                <div className="hidden md:block text-[12px] text-slate-400">
                  {inst.accounts.length} accounts
                </div>
                <div className="hidden md:block mono text-right text-[13px] text-slate-100">{usd(total)}</div>
                <div className="hidden md:block mono text-right text-[12px] text-slate-400">—</div>
                <div className="flex items-center gap-3 md:pl-0">
                  <AllocationBar value={allocPct} color={inst.accent} />
                  <span className="mono text-[11px] text-slate-400 w-12 text-right">
                    {allocPct.toFixed(1)}%
                  </span>
                </div>
              </button>

              {isOpen && (
                <div className="bg-navy-950/40 border-t border-white/[0.04]">
                  {inst.accounts.map((acct) => {
                    const isSelected = acct.id === selectedAccountId;
                    const chgUp = acct.change >= 0;
                    return (
                      <button
                        key={acct.id}
                        onClick={() => onSelectAccount(acct, inst)}
                        className={`w-full md:grid md:grid-cols-[1.6fr_1fr_0.9fr_0.7fr_1fr] flex flex-col md:flex-row items-stretch md:items-center gap-1 md:gap-0 pl-8 md:pl-[68px] pr-4 md:pr-5 py-2.5 text-left transition ${
                          isSelected
                            ? 'bg-accent-green/[0.06]'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{
                              background: isSelected ? inst.accent : 'rgba(255,255,255,0.25)',
                              boxShadow: isSelected ? `0 0 8px ${inst.accent}` : 'none',
                            }}
                          />
                          <span className="text-[13px] text-slate-200 truncate">{acct.name}</span>
                          {isSelected && (
                            <span className="chip text-accent-green border-accent-green/30 bg-accent-green/5 shrink-0">
                              Focused
                            </span>
                          )}
                          {/* Mobile: inline assets + change */}
                          <span className="md:hidden ml-auto flex items-center gap-2 shrink-0">
                            <span className="mono text-[12px] text-slate-100">{usd(acct.assets)}</span>
                            <span
                              className={`mono text-[11px] ${chgUp ? 'text-accent-green' : 'text-accent-red'}`}
                            >
                              {pct(acct.change)}
                            </span>
                          </span>
                        </div>
                        <div className="hidden md:block text-[11.5px] text-slate-500 truncate">{acct.owner}</div>
                        <div className="hidden md:block mono text-right text-[12.5px] text-slate-100">{usd(acct.assets)}</div>
                        <div
                          className={`hidden md:block mono text-right text-[12px] ${
                            chgUp ? 'text-accent-green' : 'text-accent-red'
                          }`}
                        >
                          {pct(acct.change)}
                        </div>
                        <div className="flex items-center gap-3">
                          <AllocationBar value={acct.alloc} color={inst.accent} />
                          <span className="mono text-[11px] text-slate-500 w-12 text-right">
                            {acct.alloc.toFixed(1)}%
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-5 py-3 border-t border-white/5 bg-white/[0.02]">
        <div className="text-[11px] text-slate-500 mono">
          {institutions.reduce((s, i) => s + i.accounts.length, 0)} accounts · grand total
        </div>
        <div className="mono text-[14px] font-semibold text-slate-100">{usd(grand)}</div>
      </div>
    </section>
  );
}
