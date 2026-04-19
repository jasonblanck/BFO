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
  institutionTotal,
  institutionCash,
  institutionChange,
  categoryRollups,
} from '../data/portfolio';
import useManualAccounts from '../hooks/useManualAccounts';
import usePlaidHoldings from '../hooks/usePlaidHoldings';
import usePortfolio from '../hooks/usePortfolio';
import HoldingsRollup from './HoldingsRollup';

// Reduce a Plaid-linked institution payload to the same shape the
// existing UI expects: { total, cash, change }. Prefers holdings
// valuation when Plaid returned it; otherwise falls back to account
// balances (Plaid Investments is optional per item).
function reducePlaidInstitution(inst) {
  const accounts = inst.accounts ?? [];
  const holdings = inst.holdings ?? [];
  const holdingsTotal = holdings.reduce((s, h) => s + (Number(h.institution_value) || 0), 0);
  const balancesTotal = accounts.reduce((s, a) => s + (Number(a?.balances?.current) || 0), 0);
  const cash = accounts
    .filter((a) => ['depository', 'credit'].includes(a.type) || ['checking', 'savings', 'cd', 'money market'].includes((a.subtype || '').toLowerCase()))
    .reduce((s, a) => s + (Number(a?.balances?.available ?? a?.balances?.current) || 0), 0);
  return {
    total: holdingsTotal > 0 ? holdingsTotal : balancesTotal,
    cash,
    change: 0, // Plaid doesn't give a clean "today's Δ" — leave 0 for v1
  };
}

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
// `manualAccounts` is passed in from the live store so edits in
// Connected Accounts reflect here on the next render.
function buildCategoryRollup(institutions, manualAccounts) {
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
  const [expandedAccountId, setExpandedAccountId] = useState(null);

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));
  const toggleAccountHoldings = (id) =>
    setExpandedAccountId((prev) => (prev === id ? null : id));

  const manualAccounts = useManualAccounts();
  const { data: plaidData, status: plaidStatus } = usePlaidHoldings();
  const { institutions } = usePortfolio();

  const instTotals = useMemo(() => {
    return institutions.map((i) => ({
      ...i,
      total: institutionTotal(i),
      cash: institutionCash(i),
      change: institutionChange(i),
    }));
  }, [institutions]);

  // Plaid-linked institutions render as *additional* rows — seed data
  // is never replaced. When the user wants to switch a seed institution
  // to its live Plaid counterpart, we'll add an opt-in mapping in a
  // later phase.
  const plaidTotals = useMemo(() => {
    const list = Array.isArray(plaidData) ? plaidData : [];
    return list.map((inst) => ({
      id: `plaid-${inst.institution_id}`,
      name: inst.institution_name || 'Linked Institution',
      role: inst.error ? 'Sync error — retrying' : 'Live · Plaid',
      accent: '#10B981',
      livePlaid: true,
      syncError: !!inst.error,
      ...reducePlaidInstitution(inst),
    }));
  }, [plaidData]);

  const manualTotal = useMemo(
    () => manualAccounts.reduce((s, a) => s + (Number(a.value) || 0), 0),
    [manualAccounts],
  );
  const categoryData = useMemo(
    () => buildCategoryRollup(institutions, manualAccounts),
    [institutions, manualAccounts],
  );

  const plaidGrandTotal = plaidTotals.reduce((s, i) => s + i.total, 0);
  const plaidCashTotal  = plaidTotals.reduce((s, i) => s + i.cash, 0);
  const assetsGrandTotal =
    instTotals.reduce((s, i) => s + i.total, 0) + manualTotal + plaidGrandTotal;
  const cashGrandTotal = instTotals.reduce((s, i) => s + i.cash, 0) + plaidCashTotal;
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

      {tab === 'overview' && (
      <>
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
                      const hasHoldings = Array.isArray(acct.holdings) && acct.holdings.length > 0;
                      const holdingsOpen = expandedAccountId === acct.id;
                      return (
                        <div key={acct.id}>
                          <div
                            className={`w-full md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.4fr)] flex flex-col md:flex-row items-stretch md:items-center gap-1 md:gap-0 pl-8 md:pl-[68px] pr-4 md:pr-5 py-2.5 transition ${
                              isSelected ? 'bg-ms-600/8' : 'hover:bg-row-hover'
                            }`}
                          >
                            <button
                              onClick={() => onSelectAccount(acct, inst)}
                              className="flex items-center gap-2 min-w-0 text-left"
                              aria-label={`Select ${acct.name}`}
                            >
                              {hasHoldings ? (
                                <ChevronRight
                                  size={12}
                                  onClick={(e) => { e.stopPropagation(); toggleAccountHoldings(acct.id); }}
                                  className={`shrink-0 transition-transform cursor-pointer ${holdingsOpen ? 'rotate-90 text-ms-400' : 'text-slate-500 hover:text-ms-400'}`}
                                />
                              ) : (
                                <span
                                  className="h-1.5 w-1.5 rounded-full shrink-0"
                                  style={{
                                    background: isSelected ? inst.accent : 'rgba(148,163,184,0.35)',
                                    boxShadow: isSelected ? `0 0 8px ${inst.accent}` : 'none',
                                  }}
                                />
                              )}
                              <span className="text-[13px] text-ms-400 hover:text-ms-300 truncate">{acct.name}</span>
                            </button>
                            <div className="hidden md:block mono text-right text-[12.5px] text-slate-100">{usd(acct.assets)}</div>
                            <div className="hidden md:block mono text-right text-[12.5px] text-slate-400">{acct.cash > 0 ? usd(acct.cash) : '—'}</div>
                            <div className="hidden md:block text-right">
                              <ChangeCell value={acct.change} pct={acct.changePct} size="sm" />
                            </div>
                            <div className="hidden md:flex items-center justify-end">
                              {hasHoldings ? (
                                <button
                                  onClick={() => toggleAccountHoldings(acct.id)}
                                  className="mono text-[10px] tracking-wider text-slate-500 hover:text-ms-400 uppercase"
                                >
                                  {holdingsOpen ? 'Hide' : `${acct.holdings.length} pos.`}
                                </button>
                              ) : (
                                <MoreVertical size={12} className="text-slate-600" />
                              )}
                            </div>
                            {/* Mobile inline */}
                            <div className="md:hidden flex items-center justify-between mt-1">
                              <span className="mono text-[12px] text-slate-100">{usd(acct.assets)}</span>
                              <ChangeCell value={acct.change} pct={acct.changePct} size="sm" />
                            </div>
                          </div>
                          {hasHoldings && holdingsOpen && (
                            <HoldingsTable holdings={acct.holdings} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Plaid-linked institutions — additive rows. Seed data is
              never replaced; these render underneath the seed block so
              existing reading habits stay intact. */}
          {plaidTotals.map((inst) => (
            <div key={inst.id} className="md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.4fr)] flex flex-col md:flex-row gap-2 md:gap-0 items-stretch md:items-center px-4 md:px-5 py-3 hover:bg-row-hover transition">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-[14px] shrink-0" />
                <div
                  className="h-7 w-7 shrink-0 flex items-center justify-center rounded-sm"
                  style={{
                    background: 'rgba(16,185,129,0.14)',
                    boxShadow: 'inset 0 0 0 1px rgba(16,185,129,0.35)',
                  }}
                >
                  <Landmark size={14} className="text-gain-500" />
                </div>
                <div className="leading-tight min-w-0 flex-1">
                  <div className="text-[13.5px] font-semibold text-slate-100 flex items-center gap-2 flex-wrap">
                    <span className="truncate">{inst.name}</span>
                    <span
                      className="chip"
                      style={{
                        color: inst.syncError ? '#FF3B58' : '#10B981',
                        borderColor: inst.syncError ? 'rgba(255,59,88,0.4)' : 'rgba(16,185,129,0.4)',
                        background: inst.syncError ? 'rgba(255,59,88,0.08)' : 'rgba(16,185,129,0.08)',
                      }}
                    >
                      {inst.syncError ? 'Sync error' : 'Live · Plaid'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">{inst.role}</div>
                </div>
              </div>
              <div className="hidden md:block mono text-right text-[13px] text-slate-100">{usd(inst.total)}</div>
              <div className="hidden md:block mono text-right text-[13px] text-slate-400">{inst.cash > 0 ? usd(inst.cash) : '—'}</div>
              <div className="hidden md:block mono text-right text-[13px] text-slate-400">—</div>
              <div className="hidden md:flex items-center justify-end">
                <MoreVertical size={13} className="text-slate-500" />
              </div>
              <div className="md:hidden flex items-center justify-between mt-1">
                <span className="mono text-[12px] text-slate-100">{usd(inst.total)}</span>
              </div>
            </div>
          ))}

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
      </>
      )}

      {tab === 'investments' && (
        <HoldingsRollup />
      )}

      {(tab === 'funds' || tab === 'allocation' || tab === 'income') && (
        <div className="px-5 py-16 text-center">
          <div className="mono text-[10.5px] tracking-[0.28em] text-slate-500 uppercase mb-2">
            {TABS.find((t) => t.id === tab)?.label}
          </div>
          <p className="text-[13px] text-slate-400 max-w-md mx-auto leading-relaxed">
            Coming soon — this tab will roll up available cash, current allocation mix, and projected annualized income once additional data feeds are wired.
          </p>
        </div>
      )}
    </section>
  );
}

// Compact positions table — rendered inline under any account whose
// seed carries a `holdings` array. Columns mirror a Fidelity Portfolio
// Positions view: Symbol / Qty / Price / Today / Value / Total gain.
function HoldingsTable({ holdings }) {
  const sorted = [...holdings].sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0));
  return (
    <div className="bg-black/35 border-y border-white/5 pl-8 md:pl-[68px] pr-4 md:pr-5 py-3">
      <div className="mono text-[9.5px] tracking-[0.22em] text-slate-500 uppercase mb-2 flex items-center justify-between">
        <span>Positions</span>
        <span>{holdings.length} symbol{holdings.length === 1 ? '' : 's'}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full mono text-[11.5px] min-w-[620px]">
          <thead>
            <tr className="text-left text-slate-500 uppercase tracking-[0.16em] text-[9.5px] border-b border-white/5">
              <th className="py-1.5 font-normal">Symbol</th>
              <th className="py-1.5 font-normal text-right">Qty</th>
              <th className="py-1.5 font-normal text-right">Price</th>
              <th className="py-1.5 font-normal text-right">Today</th>
              <th className="py-1.5 font-normal text-right">Value</th>
              <th className="py-1.5 font-normal text-right">Total G/L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.035]">
            {sorted.map((h) => {
              const hasPrice = h.price != null;
              const hasChange = h.change != null && h.changePct != null;
              const hasGain = h.gainPct != null;
              const todayUp = hasChange && h.change >= 0;
              const gainUp  = hasGain && h.gainPct >= 0;
              return (
                <tr key={`${h.symbol}-${h.name}`} className="hover:bg-white/[0.02]">
                  <td className="py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-100 font-semibold">{h.symbol}</span>
                      <span className="text-slate-500 text-[10.5px] truncate hidden sm:inline">{h.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right text-slate-300">{h.qty == null ? '—' : h.qty}</td>
                  <td className="py-1.5 text-right text-slate-300">{hasPrice ? `$${Number(h.price).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : '—'}</td>
                  <td className={`py-1.5 text-right ${hasChange ? (todayUp ? 'text-gain-500' : 'text-loss-500') : 'text-slate-500'}`}>
                    {hasChange ? `${todayUp ? '+' : ''}${h.changePct.toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-1.5 text-right text-slate-100">
                    ${Number(h.value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </td>
                  <td className={`py-1.5 text-right ${hasGain ? (gainUp ? 'text-gain-500' : 'text-loss-500') : 'text-slate-500'}`}>
                    {hasGain ? `${gainUp ? '+' : ''}${h.gainPct.toFixed(2)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
