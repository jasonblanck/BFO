import React, { useState } from 'react';
import { Calendar, CircleDollarSign, Rocket, Globe2, ChevronRight } from 'lucide-react';
import useMarketData from '../hooks/useMarketData';
import { fetchEarnings, fetchIPOs, fetchEconomic } from '../data/markets';

const TABS = [
  { id: 'earnings', label: 'Earnings',  Icon: CircleDollarSign },
  { id: 'ipo',      label: 'IPOs',      Icon: Rocket },
  { id: 'econ',     label: 'Economic',  Icon: Globe2 },
];

function EarningsCard({ e }) {
  const beat = e.actual != null && e.estimate != null && e.actual >= e.estimate;
  return (
    <div className="min-w-[220px] rounded-sm border border-white/8 bg-black/30 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] text-slate-500 tracking-wider uppercase">{e.day}</span>
        {e.actual != null && (
          <span className={`chip ${beat ? 'chip-gain' : 'chip-loss'}`}>{beat ? 'Beat' : 'Miss'}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="mono inline-flex items-center justify-center h-7 w-7 rounded-sm text-[10.5px] font-semibold"
          style={{ background: 'rgba(0,94,184,0.14)', color: '#7BC6FF', boxShadow: 'inset 0 0 0 1px rgba(0,94,184,0.3)' }}
        >
          {(e.ticker || '?')[0]}
        </span>
        <div className="min-w-0">
          <div className="mono text-[12px] text-slate-100 font-semibold">{e.ticker}</div>
          <div className="text-[11px] text-slate-500 truncate">{e.name}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <div className="mono text-[9.5px] tracking-[0.2em] text-slate-500 uppercase">Actual</div>
          <div className={`mono text-[13px] ${e.actual == null ? 'text-slate-500' : beat ? 'text-gain-500' : 'text-loss-500'}`}>
            {e.actual != null ? `${e.actual.toFixed(2)} USD` : '—'}
          </div>
        </div>
        <div>
          <div className="mono text-[9.5px] tracking-[0.2em] text-slate-500 uppercase">Estimate</div>
          <div className="mono text-[13px] text-slate-200">{e.estimate != null ? `${e.estimate.toFixed(2)} USD` : '—'}</div>
        </div>
      </div>
    </div>
  );
}

function IPOCard({ e }) {
  return (
    <div className="min-w-[220px] rounded-sm border border-white/8 bg-black/30 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] text-slate-500 tracking-wider uppercase">{e.day}</span>
        <span className="chip chip-ms">{e.exchange}</span>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="mono inline-flex items-center justify-center h-7 w-7 rounded-sm text-[10.5px] font-semibold"
          style={{ background: 'rgba(139,92,246,0.14)', color: '#C4B5FD', boxShadow: 'inset 0 0 0 1px rgba(139,92,246,0.3)' }}
        >
          {(e.ticker || '?')[0]}
        </span>
        <div className="min-w-0">
          <div className="mono text-[12px] text-slate-100 font-semibold">{e.ticker}</div>
          <div className="text-[11px] text-slate-500 truncate">{e.name}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div>
          <div className="mono text-[9.5px] tracking-[0.2em] text-slate-500 uppercase">Exchange</div>
          <div className="mono text-[12.5px] text-slate-200">{e.exchange}</div>
        </div>
        <div>
          <div className="mono text-[9.5px] tracking-[0.2em] text-slate-500 uppercase">Offer</div>
          <div className="mono text-[12.5px] text-slate-200">{e.price ? `${e.price.toFixed(3)} USD` : '—'}</div>
        </div>
      </div>
    </div>
  );
}

function EconCard({ e }) {
  return (
    <div className="min-w-[240px] rounded-sm border border-white/8 bg-black/30 p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="mono text-[10px] text-slate-500 tracking-wider uppercase">{e.day} · {e.time}</span>
        <span
          className="chip"
          style={{
            color: e.region === 'US' ? '#7BC6FF' : '#C4B5FD',
            borderColor: e.region === 'US' ? 'rgba(0,94,184,0.35)' : 'rgba(139,92,246,0.35)',
            background: e.region === 'US' ? 'rgba(0,94,184,0.06)' : 'rgba(139,92,246,0.06)',
          }}
        >
          {e.region}
        </span>
      </div>
      <div className="text-[12.5px] text-slate-100 font-semibold leading-tight">{e.name}</div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <Cell label="Actual"   value={e.actual}   tone={e.actual && e.actual !== '—' ? 'gain' : 'muted'} />
        <Cell label="Forecast" value={e.forecast} />
        <Cell label="Prior"    value={e.prior} />
      </div>
    </div>
  );
}

function Cell({ label, value, tone = 'muted' }) {
  const toneClass =
    tone === 'gain' ? 'text-loss-500' : // flagged high reads like the TV red
    'text-slate-400';
  return (
    <div>
      <div className="mono text-[9.5px] tracking-[0.2em] text-slate-500 uppercase">{label}</div>
      <div className={`mono text-[12.5px] ${value === '—' ? 'text-slate-600' : toneClass}`}>{value}</div>
    </div>
  );
}

export default function EventsCalendar() {
  const [tab, setTab] = useState('earnings');

  const { data: earnings } = useMarketData(fetchEarnings, [], 5 * 60 * 1000);
  const { data: ipos }     = useMarketData(fetchIPOs,     [], 5 * 60 * 1000);
  const { data: econ }     = useMarketData(fetchEconomic, [], 5 * 60 * 1000);

  const title = TABS.find((t) => t.id === tab)?.label;

  const rows = tab === 'earnings' ? (earnings ?? []) : tab === 'ipo' ? (ipos ?? []) : (econ ?? []);

  return (
    <section className="panel hud-corners relative overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />

      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-ms-400" />
          <div>
            <div className="mono text-[10px] tracking-[0.28em] text-slate-500 uppercase">Events</div>
            <div className="text-[14px] font-semibold text-slate-100">{title} Calendar</div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`ms-pill ${active ? 'active' : ''} flex items-center gap-1.5`}
              >
                <t.Icon size={11} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 overflow-x-auto">
        <div className="flex items-stretch gap-3 min-w-max">
          {tab === 'earnings' && rows.map((e, i) => <EarningsCard key={e.ticker + i} e={e} />)}
          {tab === 'ipo'      && rows.map((e, i) => <IPOCard      key={e.ticker + i} e={e} />)}
          {tab === 'econ'     && rows.map((e, i) => <EconCard     key={e.name + i}  e={e} />)}
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/5 bg-white/[0.012]">
        <span className="mono text-[10px] text-slate-500 tracking-wider">
          Source · Finnhub · Trading Economics · refresh 5m
        </span>
        <button className="mono text-[11px] text-ms-400 hover:text-ms-300 transition flex items-center gap-1">
          See all events <ChevronRight size={12} />
        </button>
      </div>
    </section>
  );
}
