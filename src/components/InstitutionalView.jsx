import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  Building2,
  Landmark,
  GraduationCap,
  PiggyBank,
  Wallet,
  Globe,
  FolderOpen,
  MoreVertical,
  Star,
  ToggleLeft,
} from 'lucide-react';
import {
  institutions,
  manualAccounts,
  institutionTotal,
  institutionCash,
  institutionChange,
  manualAccountsTotal,
  categoryRollups,
} from '../data/portfolio';

const ICONS = {
  ms: Building2,
  tiaa: Landmark,
  fidelity: Landmark,
  ny529: GraduationCap,
  bofa: PiggyBank,
  chase: Wallet,
  citi: Globe,
};

const TABS = [
  { id: 'overview',     label: 'Overview' },
  { id: 'funds',        label: 'Available Funds (Cash + Loans)' },
  { id: 'investments',  label: 'Investment Details' },
  { id: 'allocation',   label: 'Allocation' },
  { id: 'income',       label: 'Projected Income' },
];

const GROUPINGS = [
  { id: 'institutions', label: 'Institutions' },
  { id: 'categories',   label: 'Categories' },
  { id: 'groups',       label: 'My Groups' },
];

function usd(n) {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}
function usdChange(n) {
  if (n == null || n === 0) return { el: '—', tone: 'dim' };
  const sign = n > 0 ? '+' : '';
  return {
    el: `${sign}${usd(n)}`,
    tone: n >= 0 ? 'gain' : 'loss',
  };
}
function pct(n) {
  if (n == null || n === 0) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

// Rolled-up categories view for the "Categories" grouping pill.
function buildCategoryRollup() {
  const out = categoryRollups.map((c) => ({ ...c, value: 0, count: 0 }));
  const add = (categoryLabel, value) => {
    const row =
      out.find((o) => o.label.toLowerCase() === categoryLabel.toLowerCase()) ||
      out[0];
    row.value += value;
    row.count += 1;
  };
  institutions.forEach((inst) => {
    const total = institutionTotal(inst);
    if (inst.id === 'bofa' || inst.id === 'chase' || inst.id === 'citi') {
      add('Cash & Treasuries', total);
    } else if (inst.id === 'tiaa') {
      add('Retirement', total);
    } else if (inst.id === 'ny529') {
      add('529 / Education', total);
    } else if (inst.id === 'ms' || inst.id === 'fidelity') {
      add('Public Equities', total);
    } else {
      add('Public Equities', total);
    }
  });
  manualAccounts.forEach((m) => add(m.category, m.value));
  return out.filter((o) => o.value > 0);
}

export default function InstitutionalView({ selectedAccountId, onSelectAccount }) {
  const [tab, setTab] = useState('overview');
  const [grouping, setGrouping] = useState('institutions');
  const [expanded, setExpanded] = useState(() => ({
    ms: true,
    manual: false,
    fidelity: false,
    tiaa: false,
  }));
  const [showZero, setShowZero] = useState(false);

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const instTotals = useMemo(() => {
    return institutions.map((i) => ({
      ...i,
      total: institutionTotal(i),
      cash: institutionCash(i),
      change: institutionChange(i),
    }));
  }, []);

  const manualTotal = useMemo(() => manualAccountsTotal(), []);
  const categoryData = useMemo(() => buildCategoryRollup(), []);

  const assetsGrandTotal =
    instTotals.reduce((s, i) => s + i.total, 0) + manualTotal;
  const cashGrandTotal = instTotals.reduce((s, i) => s + i.cash, 0);
  const changeGrandTotal = instTotals.reduce((s, i) => s + i.change, 0);

  return (
    <section className="panel hud-corners relative overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />

      {/* Tab bar */}
      <div className="flex items-center gap-0 px-2 pt-2 border-b border-white/5 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`ms-tab ${tab === t.id ? 'active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Grouping pills + controls */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          {GROUPINGS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGrouping(g.id)}
              className={`ms-pill ${grouping === g.id ? 'active' : ''}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowZero((z) => !z)}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-100 transition"
        >
          <ToggleLeft size={14} className={showZero ? 'text-ms-400' : ''} />
          <span className="mono">$0.00 balances</span>
        </button>
      </div>

      {/* Section header */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <div className="panel-title tracking-wide">Assets</div>
        <div className="mono text-[11px] text-slate-500">
          Grand total <span className="text-slate-100 ml-1">{usd(assetsGrandTotal)}</span>
        </div>
      </div>

      {/* Column headers */}
      <div className="hidden md:grid grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.4fr)] gap-0 px-5 py-2 text-[10px] tracking-[0.18em] text-slate-500 uppercase border-b border-white/10 bg-white/[0.015]">
        <div>Group / Account</div>
        <div className="text-right">Total Assets ($)</div>
        <div className="text-right">Available Cash ($)</div>
        <div className="text-right">Today's Change</div>
        <div className="text-right">Actions</div>
      </div>

      {/* Totals row */}
      <div className="hidden md:grid grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.4fr)] gap-0 px-5 py-3 border-b border-white/5 bg-white/[0.012]">
        <div className="text-[13px] font-semibold text-slate-100">Total</div>
        <div className="mono text-right text-[13px] text-slate-100">{usd(assetsGrandTotal)}</div>
        <div className="mono text-right text-[13px] text-slate-300">{usd(cashGrandTotal)}</div>
        <div className="text-right">
          <ChangeCell value={changeGrandTotal} pct={(changeGrandTotal / assetsGrandTotal) * 100} />
        </div>
        <div />
      </div>

      {grouping === 'institutions' && (
        <div className="divide-y divide-white/[0.04]">
          {instTotals.map((inst) => {
            const Icon = ICONS[inst.id] ?? Landmark;
            const isOpen = expanded[inst.id];
            return (
              <div key={inst.id}>
                <button
                  onClick={() => toggle(inst.id)}
                  className="w-full md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.4fr)] flex flex-col md:flex-row gap-2 md:gap-0 items-stretch md:items-center px-4 md:px-5 py-3 hover:bg-row-hover transition text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ChevronRight
                      size={14}
                      className={`text-slate-500 transition-transform shrink-0 ${isOpen ? 'rotate-90 text-slate-200' : ''}`}
                    />
                    <div
                      className="h-7 w-7 shrink-0 flex items-center justify-center rounded-sm"
                      style={{
                        background: `${inst.accent}18`,
                        boxShadow: `inset 0 0 0 1px ${inst.accent}38`,
                      }}
                    >
                      <Icon size={14} style={{ color: inst.accent }} />
                    </div>
                    <div className="leading-tight min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-slate-100 flex items-center gap-2 flex-wrap">
                        <span className="truncate">{inst.name}</span>
                        {inst.id === 'ms' && (
                          <span className="chip chip-ms"><Star size={9} /> Master</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{inst.role}</div>
                    </div>
                  </div>
                  <div className="hidden md:block mono text-right text-[13px] text-slate-100">{usd(inst.total)}</div>
                  <div className="hidden md:block mono text-right text-[13px] text-slate-400">{inst.cash > 0 ? usd(inst.cash) : '—'}</div>
                  <div className="hidden md:block text-right">
                    <ChangeCell value={inst.change} pct={inst.total > 0 ? (inst.change / inst.total) * 100 : 0} />
                  </div>
                  <div className="hidden md:flex items-center justify-end">
                    <span className="h-6 w-6 flex items-center justify-center text-slate-500 hover:text-slate-100">
                      <MoreVertical size={13} />
                    </span>
                  </div>
                </button>

                {isOpen && (
                  <div className="bg-black/20">
                    {inst.accounts.map((acct) => {
                      const isSelected = acct.id === selectedAccountId;
                      return (
                        <button
                          key={acct.id}
                          onClick={() => onSelectAccount(acct, inst)}
                          className={`w-full md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.4fr)] flex flex-col md:flex-row items-stretch md:items-center gap-1 md:gap-0 pl-8 md:pl-[68px] pr-4 md:pr-5 py-2.5 text-left transition ${
                            isSelected ? 'bg-ms-600/8' : 'hover:bg-row-hover'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{
                                background: isSelected ? inst.accent : 'rgba(148,163,184,0.35)',
                                boxShadow: isSelected ? `0 0 8px ${inst.accent}` : 'none',
                              }}
                            />
                            <span className="text-[13px] text-ms-400 hover:text-ms-300 truncate">{acct.name}</span>
                          </div>
                          <div className="hidden md:block mono text-right text-[12.5px] text-slate-100">{usd(acct.assets)}</div>
                          <div className="hidden md:block mono text-right text-[12.5px] text-slate-400">{acct.cash > 0 ? usd(acct.cash) : '—'}</div>
                          <div className="hidden md:block text-right">
                            <ChangeCell value={acct.change} pct={acct.changePct} size="sm" />
                          </div>
                          <div className="hidden md:flex items-center justify-end">
                            <MoreVertical size={12} className="text-slate-600" />
                          </div>
                          {/* Mobile inline */}
                          <div className="md:hidden flex items-center justify-between mt-1">
                            <span className="mono text-[12px] text-slate-100">{usd(acct.assets)}</span>
                            <ChangeCell value={acct.change} pct={acct.changePct} size="sm" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Manual Accounts — big parent row with 29 sub-rows */}
          <div>
            <button
              onClick={() => toggle('manual')}
              className="w-full md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.4fr)] flex flex-col md:flex-row gap-2 md:gap-0 items-stretch md:items-center px-4 md:px-5 py-3 hover:bg-row-hover transition text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ChevronRight
                  size={14}
                  className={`text-slate-500 transition-transform shrink-0 ${expanded.manual ? 'rotate-90 text-slate-200' : ''}`}
                />
                <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-sm"
                     style={{ background: 'rgba(139,92,246,0.12)', boxShadow: 'inset 0 0 0 1px rgba(139,92,246,0.28)' }}>
                  <FolderOpen size={14} className="text-accent-violet" />
                </div>
                <div className="leading-tight min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-slate-100 flex items-center gap-2 flex-wrap">
                    <span>Manual Accounts</span>
                    <span className="chip chip-violet">{manualAccounts.length} positions</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Direct · SPV · Real assets · Collectibles</div>
                </div>
              </div>
              <div className="hidden md:block mono text-right text-[13px] text-slate-100">{usd(manualTotal)}</div>
              <div className="hidden md:block mono text-right text-[13px] text-slate-400">—</div>
              <div className="hidden md:block mono text-right text-[13px] text-slate-400">—</div>
              <div className="hidden md:flex items-center justify-end">
                <MoreVertical size={13} className="text-slate-500" />
              </div>
            </button>

            {expanded.manual && (
              <div className="bg-black/20">
                {manualAccounts.map((m) => (
                  <div
                    key={m.id}
                    className="md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.4fr)] flex flex-col md:flex-row items-stretch md:items-center gap-1 md:gap-0 pl-8 md:pl-[68px] pr-4 md:pr-5 py-2.5 hover:bg-row-hover transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: 'rgba(148,163,184,0.35)' }} />
                      <div className="min-w-0">
                        <div className="text-[13px] text-ms-400 hover:text-ms-300 truncate">{m.name}</div>
                        <div className="mono text-[10.5px] text-slate-500">{m.category} · {m.opened}</div>
                      </div>
                    </div>
                    <div className="hidden md:block mono text-right text-[12.5px] text-slate-100">{usd(m.value)}</div>
                    <div className="hidden md:block mono text-right text-[12.5px] text-slate-500">—</div>
                    <div className="hidden md:block mono text-right text-[12.5px] text-slate-500">—</div>
                    <div className="hidden md:flex items-center justify-end">
                      <MoreVertical size={12} className="text-slate-600" />
                    </div>
                    <div className="md:hidden flex items-center justify-between mt-1">
                      <span className="mono text-[12px] text-slate-100">{usd(m.value)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {grouping === 'categories' && (
        <div className="divide-y divide-white/[0.04]">
          {categoryData.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.4fr)] gap-0 px-5 py-3 items-center"
            >
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 flex items-center justify-center rounded-sm"
                      style={{ background: `${c.color}18`, boxShadow: `inset 0 0 0 1px ${c.color}33` }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
                </span>
                <div>
                  <div className="text-[13.5px] font-semibold text-slate-100">{c.label}</div>
                  <div className="text-[11px] text-slate-500">{c.count} position{c.count === 1 ? '' : 's'}</div>
                </div>
              </div>
              <div className="mono text-right text-[13px] text-slate-100">{usd(c.value)}</div>
              <div className="mono text-right text-[12px] text-slate-500">—</div>
              <div className="mono text-right text-[12px] text-slate-400">
                {((c.value / assetsGrandTotal) * 100).toFixed(1)}%
              </div>
              <div className="flex items-center justify-end">
                <MoreVertical size={13} className="text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {grouping === 'groups' && (
        <div className="px-5 py-10 text-center text-slate-500 mono text-[12px]">
          No custom groups yet · Create one from any account's context menu
        </div>
      )}
    </section>
  );
}

function ChangeCell({ value, pct: p, size = 'md' }) {
  if (!value) {
    return <span className="mono text-slate-500">—</span>;
  }
  const up = value > 0;
  const toneClass = up ? 'text-gain-500' : 'text-loss-500';
  const szMain = size === 'sm' ? 'text-[12px]' : 'text-[13px]';
  const szPct = size === 'sm' ? 'text-[10.5px]' : 'text-[11px]';
  return (
    <div className={`mono ${toneClass} leading-tight`}>
      <div className={szMain}>
        {up ? '+' : ''}
        {value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })}
      </div>
      {p != null && p !== 0 && (
        <div className={`${szPct} opacity-80`}>
          {up ? '+' : ''}
          {p.toFixed(2)}%
        </div>
      )}
    </div>
  );
}
