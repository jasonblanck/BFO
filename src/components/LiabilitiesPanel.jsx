import React from 'react';
import { CreditCard, MoreVertical } from 'lucide-react';
import { liabilities, totalLiabilities } from '../data/portfolio';

function usd(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

export default function LiabilitiesPanel() {
  const total = totalLiabilities();
  return (
    <section className="panel hud-corners relative overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />

      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-loss-500" />
          <div className="panel-title">Liabilities</div>
        </div>
        <div className="mono text-[11px] text-slate-500">
          Total <span className="text-slate-100 ml-1">{usd(total)}</span>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.4fr)] gap-0 px-5 py-2 text-[10px] tracking-[0.18em] text-slate-500 uppercase border-b border-white/10 bg-white/[0.015]">
        <div>Loan / Line</div>
        <div className="text-right">Balance</div>
        <div className="text-right">Rate (APR)</div>
        <div className="text-right">Type</div>
        <div className="text-right">Actions</div>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {liabilities.map((l) => (
          <div
            key={l.id}
            className="md:grid md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.4fr)] flex flex-col md:flex-row md:items-center gap-1 md:gap-0 px-4 md:px-5 py-3 hover:bg-row-hover transition"
          >
            <div className="min-w-0 flex items-center justify-between gap-2 md:block">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-ms-400 truncate">{l.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{l.institution}</div>
              </div>
              {/* Mobile inline: show balance + type on the name row */}
              <div className="md:hidden text-right shrink-0">
                <div className="mono text-[13px] text-slate-100">{usd(l.balance)}</div>
                <div className="mono text-[10px] text-slate-400 uppercase tracking-wider">{l.type} · {l.rate.toFixed(2)}%</div>
              </div>
            </div>
            <div className="hidden md:block mono text-right text-[13px] text-slate-100">{usd(l.balance)}</div>
            <div className="hidden md:block mono text-right text-[12.5px] text-slate-300">{l.rate.toFixed(2)}%</div>
            <div className="hidden md:block mono text-right text-[12px] text-slate-400 uppercase tracking-wider">{l.type}</div>
            <div className="hidden md:flex items-center justify-end">
              <MoreVertical size={13} className="text-slate-600" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
