import React, { useMemo, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Zap, Maximize2, Minimize2 } from 'lucide-react';
import { seriesFor } from '../data/portfolio';
import useIsLight from '../hooks/useIsLight';

const RANGES = [
  { id: '1d',  label: '1D',  slice: 24 },
  { id: '1w',  label: '1W',  slice: 48 },
  { id: '1m',  label: '1M',  slice: 96 },
  { id: 'ytd', label: 'YTD', slice: 96 },
];

function usd(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function TVCrosshair({ active, coordinate, stroke }) {
  // Custom vertical crosshair; rendered by Recharts when tooltip is active.
  if (!active || !coordinate) return null;
  return (
    <g>
      <line
        x1={coordinate.x}
        x2={coordinate.x}
        y1={0}
        y2={10000}
        stroke={stroke}
        strokeDasharray="3 3"
        strokeWidth={1}
      />
    </g>
  );
}

export default function PulseChart({ account, institution }) {
  const [range, setRange] = useState('1m');
  // Collapsed state for mobile — default collapsed under sm breakpoint to
  // keep the hero chart from eating the whole phone screen. Desktop is
  // always expanded (the toggle still works if the user wants to shrink).
  const [expanded, setExpanded] = useState(() =>
    typeof window === 'undefined' ||
    window.matchMedia?.('(min-width: 640px)').matches
  );
  const isLight = useIsLight();
  const allData = useMemo(() => seriesFor(account.id), [account.id]);

  // All derived chart values keyed on (accountId, range). Prevents the
  // wealth-jitter parent re-render from reslicing + rerunning math.
  const derived = useMemo(() => {
    if (!allData.length) return null;
    const slice = RANGES.find((r) => r.id === range)?.slice ?? 96;
    const data = allData.slice(-slice);
    const first = data[0].v || 1;
    const last = data[data.length - 1].v;
    const delta = ((last - first) / first) * 100;
    return {
      data,
      slice,
      first,
      delta,
      deltaAbs: last - first,
      up: delta >= 0,
    };
  }, [allData, range]);
  if (!derived) return null;
  const { data, slice, first, delta, deltaAbs, up } = derived;
  const stroke = up ? '#00FF88' : '#FF3B58';
  const gradId = `grad-${account.id}`;

  // Recharts props are SVG attributes, not CSS — so light/dark inks
  // have to be picked imperatively.
  const ink = {
    grid:       isLight ? 'rgba(15,23,42,0.08)'   : 'rgba(148,163,184,0.07)',
    tick:       isLight ? '#475569'                : '#64748B',
    reference:  isLight ? 'rgba(15,23,42,0.15)'   : 'rgba(148,163,184,0.15)',
    crosshair:  isLight ? 'rgba(15,23,42,0.35)'   : 'rgba(255,255,255,0.35)',
  };

  return (
    <section className="panel relative overflow-hidden">
      {/* Header — stacks on mobile, single row on sm+ */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 px-4 py-3 border-b border-white/10 min-h-[44px]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="chip chip-ms shrink-0">
            <Zap size={10} /> Active Assets
          </span>
          <div className="min-w-0">
            <div className="panel-title truncate">{account.name}</div>
            <div className="panel-subtitle truncate">{institution.name}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right">
            <div className="value-primary text-[18px] sm:text-[20px] leading-none">{usd(account.assets)}</div>
            <div
              className={`mono text-[11px] sm:text-[12px] flex items-center justify-end gap-1 mt-1 ${
                up ? 'text-gain-500' : 'text-loss-500'
              }`}
            >
              {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
              {up ? '+' : ''}
              {deltaAbs.toFixed(2)} ({up ? '+' : ''}
              {delta.toFixed(2)}%)
            </div>
          </div>
          <div
            role="group"
            aria-label="Chart range"
            className="flex items-center border border-white/10 rounded-sm overflow-hidden shrink-0"
          >
            {RANGES.map((r) => {
              const active = r.id === range;
              return (
                <button
                  key={r.id}
                  onClick={() => setRange(r.id)}
                  aria-pressed={active}
                  className={`mono text-[10px] tracking-wider px-2.5 py-1.5 border-r border-white/10 last:border-r-0 transition ${
                    active ? 'bg-ms-600/20 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            aria-pressed={expanded}
            aria-label={expanded ? 'Collapse chart' : 'Expand chart'}
            className="flex items-center justify-center h-[28px] w-[28px] border border-white/10 rounded-sm text-slate-400 hover:text-white hover:bg-white/5 transition shrink-0"
          >
            {expanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Hero chart — collapsible. Mobile default: 220px. Expanded: 420px. */}
      <div
        className="px-3 pt-4 pb-3 transition-[height] duration-300"
        style={{ height: expanded ? 420 : 220 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 24, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={ink.grid} vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fill: ink.tick, fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              interval={Math.ceil(data.length / 8)}
              tickFormatter={(v) => `T-${slice - v - 1}`}
            />
            <YAxis
              tick={{ fill: ink.tick, fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              width={36}
              domain={['dataMin - 4', 'dataMax + 4']}
              orientation="right"
            />
            <Tooltip
              cursor={<TVCrosshair stroke={ink.crosshair} />}
              formatter={(v) => [v, 'Price Index']}
              labelFormatter={(l) => `Tick · ${l}`}
            />
            <ReferenceLine y={first} stroke={ink.reference} strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="v"
              stroke={stroke}
              strokeWidth={1.8}
              fill={`url(#${gradId})`}
              dot={false}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stat strip — stark, no glows */}
      <div className="grid grid-cols-4 gap-px bg-white/[0.04] border-t border-white/10">
        <Stat label="24h Δ" value={`${(account.changePct ?? 0) >= 0 ? '+' : ''}${(account.changePct ?? 0).toFixed(2)}%`} tone={(account.changePct ?? 0) >= 0 ? 'gain' : 'loss'} />
        <Stat label="Cash" value={usd(account.cash || 0)} />
        <Stat label="Beta · SPY" value={(0.6 + Math.abs(delta) * 0.03).toFixed(2)} />
        <Stat label="Sharpe · TTM" value={(1.1 + Math.abs(delta) * 0.04).toFixed(2)} />
      </div>
    </section>
  );
}

function Stat({ label, value, tone }) {
  const toneClass =
    tone === 'gain' ? 'text-gain-500' :
    tone === 'loss' ? 'text-loss-500' :
    'text-white';
  return (
    <div className="bg-black/30 px-4 py-3">
      <div className="mono text-[10px] tracking-[0.22em] text-slate-400 uppercase">
        {label}
      </div>
      <div className={`mono text-[14px] font-semibold mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
}
