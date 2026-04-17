import React, { useMemo } from 'react';
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
import { ArrowUpRight, ArrowDownRight, Zap, Crosshair } from 'lucide-react';
import { seriesFor } from '../data/portfolio';

function usd(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function PulseChart({ account, institution }) {
  const data = useMemo(() => seriesFor(account.id), [account.id]);
  if (!data.length) return null;
  const first = data[0].v || 1;
  const last = data[data.length - 1].v;
  const delta = ((last - first) / first) * 100;
  const up = delta >= 0;
  const stroke = up ? '#00FFA3' : '#FF4D6D';
  const gradId = `grad-${account.id}`;

  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className="flex items-start justify-between px-5 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="chip text-accent-green border-accent-green/30 bg-accent-green/5">
              <Zap size={10} /> Pulse
            </span>
            <span className="text-[10px] tracking-[0.24em] text-slate-500 uppercase">
              {institution.name}
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-3">
            <h3 className="text-[17px] font-semibold text-slate-100">{account.name}</h3>
            <span className="text-[11px] text-slate-500">{account.owner}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="mono text-[22px] font-semibold text-slate-100">{usd(account.assets)}</div>
          <div
            className={`mono text-[12.5px] flex items-center justify-end gap-1 ${
              up ? 'text-accent-green' : 'text-accent-red'
            }`}
          >
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {up ? '+' : ''}
            {delta.toFixed(2)}% <span className="text-slate-600 ml-1">· session</span>
          </div>
        </div>
      </div>

      <div className="px-2 pt-4 pb-2 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 24, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.45} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
              <filter id={`glow-${account.id}`} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fill: '#6A7894', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              interval={11}
              tickFormatter={(v) => `T-${96 - v}`}
            />
            <YAxis
              tick={{ fill: '#6A7894', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
              width={36}
              domain={['dataMin - 4', 'dataMax + 4']}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeDasharray: '4 4' }}
              formatter={(v) => [v, 'Price Index']}
              labelFormatter={(l) => `Tick · ${l}`}
            />
            <ReferenceLine
              y={first}
              stroke="rgba(255,255,255,0.12)"
              strokeDasharray="4 4"
            />
            <Area
              type="monotone"
              dataKey="v"
              stroke={stroke}
              strokeWidth={2}
              fill={`url(#${gradId})`}
              dot={false}
              isAnimationActive
              animationDuration={600}
              filter={`url(#glow-${account.id})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-px bg-white/[0.04] border-t border-white/5">
        <Stat label="24h Δ" value={`${up ? '+' : ''}${account.change.toFixed(2)}%`} tone={account.change >= 0 ? 'green' : 'red'} />
        <Stat label="Allocation" value={`${account.alloc.toFixed(1)}%`} tone="blue" />
        <Stat label="Beta · SPY" value={(0.6 + Math.abs(delta) * 0.03).toFixed(2)} tone="neutral" />
        <Stat label="Sharpe (TTM)" value={(1.1 + Math.abs(delta) * 0.04).toFixed(2)} tone="violet" />
      </div>
    </section>
  );
}

function Stat({ label, value, tone }) {
  const colors = {
    green: 'text-accent-green',
    red: 'text-accent-red',
    blue: 'text-accent-blue',
    violet: 'text-accent-violet',
    neutral: 'text-slate-200',
  };
  return (
    <div className="bg-navy-900/40 px-4 py-3">
      <div className="text-[10px] tracking-[0.22em] text-slate-500 uppercase flex items-center gap-1.5">
        <Crosshair size={9} /> {label}
      </div>
      <div className={`mono text-[14px] font-semibold mt-1 ${colors[tone]}`}>{value}</div>
    </div>
  );
}
