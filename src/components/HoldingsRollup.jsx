import React, { useMemo, useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Search,
  Layers,
} from 'lucide-react';
import useConsolidatedHoldings from '../hooks/useConsolidatedHoldings';

const CLASS_ORDER = ['All', 'Equity', 'ETF', 'Mutual Fund', 'Fixed Income', 'Cash', 'Crypto', 'Other'];

const CLASS_ACCENT = {
  'Equity':        '#3DA9FC',
  'ETF':           '#0EA5E9',
  'Mutual Fund':   '#8B5CF6',
  'Fixed Income':  '#2563EB',
  'Cash':          '#10B981',
  'Crypto':        '#EC4899',
  'Other':         '#64748B',
};

const COLUMNS = [
  { id: 'symbol',    label: 'Symbol',         align: 'left'  },
  { id: 'assetClass',label: 'Class',          align: 'left'  },
  { id: 'qty',       label: 'Qty',            align: 'right' },
  { id: 'avgCost',   label: 'Avg Cost',       align: 'right' },
  { id: 'price',     label: 'Price',          align: 'right' },
  { id: 'changePct', label: 'Today',          align: 'right' },
  { id: 'value',     label: 'Value',          align: 'right' },
  { id: 'weight',    label: '% Port',         align: 'right' },
  { id: 'gainPct',   label: 'Total G/L',      align: 'right' },
];

function usd(n, { maxFrac = 2 } = {}) {
  return (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: maxFrac });
}

export default function HoldingsRollup({ compact = false }) {
  const rows = useConsolidatedHoldings();
  const [filter, setFilter] = useState('');
  const [activeClass, setActiveClass] = useState('All');
  const [sortBy, setSortBy] = useState('value');
  const [sortDir, setSortDir] = useState('desc');

  const grandTotal = useMemo(
    () => rows.reduce((s, r) => s + (Number(r.value) || 0), 0),
    [rows],
  );

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return rows
      .filter((r) => activeClass === 'All' || r.assetClass === activeClass)
      .filter((r) => {
        if (!q) return true;
        return (
          (r.symbol || '').toLowerCase().includes(q) ||
          (r.name   || '').toLowerCase().includes(q)
        );
      });
  }, [rows, filter, activeClass]);

  const sorted = useMemo(() => {
    const out = [...filtered];
    const dir = sortDir === 'desc' ? -1 : 1;
    out.sort((a, b) => {
      let va, vb;
      if (sortBy === 'weight') {
        va = (Number(a.value) || 0) / (grandTotal || 1);
        vb = (Number(b.value) || 0) / (grandTotal || 1);
      } else if (sortBy === 'symbol' || sortBy === 'assetClass') {
        va = (a[sortBy] || '').toString();
        vb = (b[sortBy] || '').toString();
        return va.localeCompare(vb) * dir;
      } else {
        va = Number(a[sortBy]);
        vb = Number(b[sortBy]);
        if (!Number.isFinite(va)) va = -Infinity;
        if (!Number.isFinite(vb)) vb = -Infinity;
      }
      return (va - vb) * dir;
    });
    return out;
  }, [filtered, sortBy, sortDir, grandTotal]);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  // Class breakdown chips — always computed from the full (unfiltered) rows
  // so switching filters doesn't visually re-shuffle the totals you can pick.
  const classTotals = useMemo(() => {
    const out = { All: grandTotal };
    rows.forEach((r) => {
      const k = r.assetClass || 'Other';
      out[k] = (out[k] || 0) + (Number(r.value) || 0);
    });
    return out;
  }, [rows, grandTotal]);

  if (!rows.length) {
    return (
      <div className="px-5 py-10 text-center text-slate-500 text-[13px]">
        No positions yet — connect an institution or add per-account holdings to populate this view.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-1.5 border border-white/10 bg-black/40 px-2.5 py-1.5 rounded-sm">
          <Search size={11} className="text-slate-500" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by symbol or name…"
            aria-label="Filter holdings"
            className="bg-transparent outline-none mono text-[11px] text-slate-100 placeholder:text-slate-600 w-44 sm:w-60"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {CLASS_ORDER.map((c) => {
            const total = classTotals[c];
            if (c !== 'All' && (total == null || total === 0)) return null;
            const active = activeClass === c;
            const accent = CLASS_ACCENT[c] || '#94A3B8';
            return (
              <button
                key={c}
                onClick={() => setActiveClass(c)}
                className={`mono text-[10px] tracking-[0.18em] uppercase px-2.5 py-1.5 rounded-sm transition flex items-center gap-1.5 ${
                  active ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
                style={active ? {
                  background: `${accent}22`,
                  boxShadow: `inset 0 0 0 1px ${accent}55`,
                } : {
                  background: 'rgba(255,255,255,0.02)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: accent, boxShadow: `0 0 4px ${accent}` }}
                />
                {c}
                {c !== 'All' && total != null && (
                  <span className="text-slate-500 ml-1 text-[9.5px]">{usd(total, { maxFrac: 0 })}</span>
                )}
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="chip chip-ms">
            <Layers size={10} /> {sorted.length} / {rows.length}
          </span>
          <span className="mono text-[11px] text-slate-400">
            Total <span className="text-white ml-1">{usd(grandTotal, { maxFrac: 0 })}</span>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full mono text-[12px] min-w-[820px]">
          <thead>
            <tr className="text-slate-500 uppercase tracking-[0.16em] text-[9.5px] border-b border-white/5">
              {COLUMNS.map((c) => {
                const active = sortBy === c.id;
                const ArrowIcon = sortDir === 'desc' ? ArrowDown : ArrowUp;
                return (
                  <th
                    key={c.id}
                    onClick={() => toggleSort(c.id)}
                    className={`py-2 px-3 font-normal select-none cursor-pointer hover:text-slate-200 ${c.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {active && <ArrowIcon size={9} className="text-ms-400" />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.035]">
            {sorted.map((r) => {
              const weight = grandTotal > 0 ? ((Number(r.value) || 0) / grandTotal) * 100 : 0;
              const todayUp = (Number(r.changePct) ?? 0) >= 0;
              const hasToday = r.changePct != null;
              const hasGain = r.gainPct != null;
              const gainUp = (Number(r.gainPct) ?? 0) >= 0;
              const classAccent = CLASS_ACCENT[r.assetClass] || '#94A3B8';
              return (
                <tr key={r.symbol + '-' + r.name} className="hover:bg-white/[0.02]">
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-slate-100 font-semibold">{r.symbol}</span>
                      <span className="text-slate-500 truncate hidden md:inline">{r.name}</span>
                    </div>
                    {r.sources?.length > 0 && (
                      <div className="text-slate-600 text-[10px] mt-0.5 truncate">
                        {r.sources.slice(0, 2).map((s) => `${s.institution} · ${s.account}`).join(' · ')}
                        {r.sources.length > 2 && ` +${r.sources.length - 2}`}
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className="mono text-[10px] tracking-[0.18em] uppercase px-2 py-0.5 rounded-sm"
                      style={{
                        color: classAccent,
                        background: `${classAccent}14`,
                        boxShadow: `inset 0 0 0 1px ${classAccent}33`,
                      }}
                    >
                      {r.assetClass || 'Other'}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300">
                    {r.qty == null ? '—' : Number(r.qty).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300">
                    {r.avgCost == null || r.avgCost === 0 ? '—' : usd(r.avgCost, { maxFrac: 2 })}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300">
                    {r.price == null ? '—' : usd(r.price, { maxFrac: 2 })}
                  </td>
                  <td className={`py-2 px-3 text-right ${hasToday ? (todayUp ? 'text-gain-500' : 'text-loss-500') : 'text-slate-500'}`}>
                    {hasToday ? `${todayUp ? '+' : ''}${r.changePct.toFixed(2)}%` : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-100">{usd(r.value, { maxFrac: 2 })}</td>
                  <td className="py-2 px-3 text-right text-slate-400">{weight.toFixed(2)}%</td>
                  <td className={`py-2 px-3 text-right ${hasGain ? (gainUp ? 'text-gain-500' : 'text-loss-500') : 'text-slate-500'}`}>
                    {hasGain ? `${gainUp ? '+' : ''}${r.gainPct.toFixed(2)}%` : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {!compact && (
            <tfoot>
              <tr className="border-t border-white/10 bg-white/[0.015]">
                <td colSpan={6} className="py-2.5 px-3 mono text-[10px] text-slate-500 tracking-[0.18em] uppercase">
                  {activeClass === 'All' ? 'Grand total' : `${activeClass} total`}
                </td>
                <td className="py-2.5 px-3 text-right mono text-[12.5px] font-semibold text-white">
                  {usd(sorted.reduce((s, r) => s + (Number(r.value) || 0), 0), { maxFrac: 2 })}
                </td>
                <td className="py-2.5 px-3 text-right mono text-[11px] text-slate-400">
                  {((sorted.reduce((s, r) => s + (Number(r.value) || 0), 0) / (grandTotal || 1)) * 100).toFixed(2)}%
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
