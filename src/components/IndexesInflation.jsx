import React from 'react';
import { AreaChart, Area, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, Flag, Droplet, Flame, Gem, Wrench, Globe, Info } from 'lucide-react';
import useMarketData from '../hooks/useMarketData';
import { fetchIndexes, fetchInflationSeries, fetchFredLatest } from '../data/markets';

function sparklineFor(seed, up) {
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const out = [];
  let v = 50;
  for (let i = 0; i < 40; i++) {
    v += (rand() - (up ? 0.4 : 0.6)) * 3;
    out.push({ t: i, v: +v.toFixed(2) });
  }
  return out;
}

const ICONS = {
  DXY:   DollarSign,
  US10Y: Flag,
  CL:    Droplet,
  NG:    Flame,
  GC:    Gem,
  HG:    Wrench,
};

function IndexCard({ idx }) {
  const up = idx.changePct >= 0;
  const Icon = ICONS[idx.id] ?? Globe;
  const data = React.useMemo(
    () => sparklineFor([...idx.id].reduce((a, c) => a + c.charCodeAt(0), 0), up),
    [idx.id, up]
  );
  const stroke = up ? '#10B981' : '#EF4444';
  const grad = `grad-${idx.id}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition">
      <span
        className="h-8 w-8 rounded-sm flex items-center justify-center shrink-0"
        style={{ background: 'rgba(0,94,184,0.12)', boxShadow: 'inset 0 0 0 1px rgba(0,94,184,0.28)' }}
      >
        <Icon size={14} className="text-ms-400" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] text-slate-100 leading-tight truncate">{idx.label}</div>
        <div className="mono text-[10.5px] text-slate-500 tracking-wider">{idx.ticker}</div>
      </div>
      <div className="h-8 w-20 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 1, right: 0, left: 0, bottom: 1 }}>
            <defs>
              <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={stroke} stopOpacity={0.45} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={stroke} strokeWidth={1.3} fill={`url(#${grad})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-right shrink-0 w-[110px]">
        <div className="mono text-[13px] text-slate-100">{formatValue(idx.value, idx.id)}</div>
        <div className={`mono text-[11px] ${up ? 'text-gain-500' : 'text-loss-500'} flex items-center justify-end gap-0.5`}>
          {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {up ? '+' : ''}{idx.changePct.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

function formatValue(v, id) {
  if (id === 'US10Y') return v.toFixed(3) + '%';
  if (id === 'GC') return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (id === 'HG') return v.toFixed(4);
  if (id === 'DXY') return v.toFixed(3);
  return v.toFixed(3);
}

function IndexesList() {
  const { data, loading } = useMarketData(fetchIndexes, [], 120_000);
  const rows = data ?? [];
  return (
    <section className="panel hud-corners relative overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />
      <div className="px-5 py-3 border-b border-white/5">
        <div className="panel-subtitle">Indexes · Rates · Commodities</div>
        <div className="panel-title">Market Summary</div>
      </div>
      <div className="divide-y divide-white/5">
        {rows.map((r) => <IndexCard key={r.id} idx={r} />)}
        {!rows.length && loading && (
          <div className="px-5 py-6 mono text-[11px] text-slate-500">Loading market summary…</div>
        )}
      </div>
      <div className="px-5 py-2.5 border-t border-white/5 bg-white/[0.012] flex items-center justify-between">
        <span className="mono text-[10px] text-slate-500 tracking-wider">Source · Polygon · FRED · refresh 2m</span>
      </div>
    </section>
  );
}

function InflationBars() {
  const { data, loading } = useMarketData(fetchInflationSeries, [], 6 * 60 * 60 * 1000);
  const rows = data ?? [];
  const { data: rateData } = useMarketData(
    () => fetchFredLatest('DFF', { value: 4.58, delta: 0, date: '' }),
    [], 60 * 60 * 1000
  );
  const rate = rateData ?? { value: 4.58 };

  return (
    <section className="panel hud-corners relative overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between">
        <div>
          <div className="panel-subtitle">US Annual Inflation · CPI-YoY</div>
          <div className="panel-title">FRED · USIRYY (via CPIAUCSL)</div>
        </div>
        <span className="chip chip-ms">Live</span>
      </div>

      <div className="h-[188px] px-3 pt-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
            <XAxis
              dataKey="month"
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              interval={1}
            />
            <YAxis
              domain={[0, (max) => Math.ceil(max + 1)]}
              tick={{ fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              width={32}
              tickFormatter={(v) => `${v.toFixed(1)}%`}
            />
            <Bar dataKey="value" radius={[2, 2, 0, 0]}>
              {rows.map((r, i) => (
                <Cell
                  key={i}
                  fill={i === rows.length - 1 ? '#3DA9FC' : '#005EB8'}
                  opacity={i === rows.length - 1 ? 1 : 0.78}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="px-5 py-3 border-t border-white/5 grid grid-cols-3 gap-3">
        <Stat label="Latest" value={rows.length ? `${rows[rows.length - 1].value.toFixed(1)}%` : '—'} />
        <Stat label="12m Avg" value={rows.length ? `${(rows.reduce((s, r) => s + r.value, 0) / rows.length).toFixed(1)}%` : '—'} />
        <Stat label="Fed Funds" value={`${rate.value.toFixed(2)}%`} />
      </div>

      <div className="px-5 py-2 border-t border-white/5 bg-white/[0.012] flex items-center justify-between">
        <span className="mono text-[10px] text-slate-500 tracking-wider flex items-center gap-1">
          <Info size={10} /> Fallback → St. Louis Fed FRED API
        </span>
        {loading && <span className="mono text-[10px] text-ms-400">syncing…</span>}
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="mono text-[9.5px] tracking-[0.22em] text-slate-500 uppercase">{label}</div>
      <div className="mono panel-title mt-0.5">{value}</div>
    </div>
  );
}

export default function IndexesInflation() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
      <IndexesList />
      <InflationBars />
    </div>
  );
}
