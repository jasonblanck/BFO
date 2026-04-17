import React from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { Layers, Timer } from 'lucide-react';
import { liquidityLadder } from '../data/portfolio';

// Voronoi/Sunburst-ish visualization using Recharts Treemap.
// Each top-level bucket is sub-divided into synthetic vehicle slices so
// the treemap breathes instead of being 4 flat rectangles.

const breakdown = {
  Instant: [
    { name: 'USD · Operating',  value: 0.45 },
    { name: 'USDC · Circle',    value: 0.20 },
    { name: 'BTC · Cold',       value: 0.22 },
    { name: 'ETH · Cold',       value: 0.13 },
  ],
  Liquid: [
    { name: 'US Equities',       value: 0.42 },
    { name: 'ETFs · SPY/QQQ',    value: 0.18 },
    { name: 'Intl Equities',     value: 0.14 },
    { name: 'Tech Single-Names', value: 0.16 },
    { name: 'Options · Hedge',   value: 0.05 },
    { name: 'REITs',             value: 0.05 },
  ],
  '1–3 yr': [
    { name: 'Private Credit',    value: 0.55 },
    { name: 'IG Corp',           value: 0.25 },
    { name: 'Muni',              value: 0.20 },
  ],
  '5 yr +': [
    { name: 'Venture · SPV',     value: 0.38 },
    { name: 'Venture · Direct',  value: 0.30 },
    { name: 'Real Estate',       value: 0.22 },
    { name: 'LP Interests',      value: 0.10 },
  ],
};

const data = liquidityLadder.map((b) => {
  const slices = breakdown[b.bucket] ?? [{ name: b.label, value: 1 }];
  return {
    name: b.bucket,
    label: b.label,
    color: b.color,
    children: slices.map((c) => ({
      name: c.name,
      value: Math.round(b.value * c.value),
      color: b.color,
      bucket: b.bucket,
    })),
  };
});

function usd(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

// eslint-disable-next-line react/prop-types
const TreeCell = (props) => {
  const { x, y, width, height, name, value, color, depth } = props;
  if (depth === 0) return null;
  if (width < 2 || height < 2) return null;

  const showLabel = width > 72 && height > 36;
  const showValue = width > 80 && height > 54;
  const hot = color || '#00FF41';

  return (
    <g>
      <rect
        x={x + 1}
        y={y + 1}
        width={Math.max(0, width - 2)}
        height={Math.max(0, height - 2)}
        fill={hot}
        fillOpacity={0.12}
        stroke={hot}
        strokeOpacity={0.45}
        strokeWidth={1}
      />
      {/* Corner ticks */}
      <line x1={x + 1} y1={y + 7} x2={x + 1} y2={y + 1} stroke={hot} strokeWidth={1.2} />
      <line x1={x + 1} y1={y + 1} x2={x + 7} y2={y + 1} stroke={hot} strokeWidth={1.2} />
      <line x1={x + width - 1} y1={y + 1} x2={x + width - 7} y2={y + 1} stroke={hot} strokeWidth={1.2} />
      <line x1={x + width - 1} y1={y + 1} x2={x + width - 1} y2={y + 7} stroke={hot} strokeWidth={1.2} />
      {showLabel && (
        <text
          x={x + 8}
          y={y + 18}
          fill={hot}
          fontFamily="JetBrains Mono"
          fontSize={10}
          letterSpacing="0.08em"
          opacity={0.95}
        >
          {name.toUpperCase()}
        </text>
      )}
      {showValue && (
        <text
          x={x + 8}
          y={y + 36}
          fill="#E6FFE6"
          fontFamily="JetBrains Mono"
          fontSize={12}
          fontWeight={600}
        >
          {usd(value)}
        </text>
      )}
    </g>
  );
};

function TreeTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload || {};
  if (!p.name) return null;
  return (
    <div className="mono text-[11px] px-3 py-2 bg-black/95 border" style={{ borderColor: `${p.color}88` }}>
      <div style={{ color: p.color }} className="tracking-[0.18em] uppercase text-[9.5px]">
        {p.bucket || p.name}
      </div>
      <div className="text-slate-100">{p.name}</div>
      <div className="text-slate-300">{usd(p.value)}</div>
    </div>
  );
}

export default function LiquidityTreemap() {
  const total = data.reduce(
    (s, d) => s + d.children.reduce((ss, c) => ss + c.value, 0),
    0
  );
  return (
    <section className="hud hud-corners relative overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />
      <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-400/10">
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-hud-cyan" />
          <div>
            <div className="mono text-[10px] tracking-[0.28em] text-emerald-300/60 uppercase">Time-to-Cash</div>
            <div className="text-[14.5px] font-semibold text-slate-100">Liquidity Tessellation</div>
          </div>
        </div>
        <span className="chip text-hud-cyan" style={{ borderColor: 'rgba(0,240,255,0.3)', background: 'rgba(0,240,255,0.05)' }}>
          <Timer size={10} /> T+0 → 5yr+
        </span>
      </div>

      <div className="h-[280px] px-2 py-2">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="value"
            stroke="#03060C"
            isAnimationActive
            animationDuration={600}
            content={<TreeCell />}
          >
            <Tooltip content={<TreeTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>

      <div className="px-5 py-3 border-t border-emerald-400/10 grid grid-cols-4 gap-2 text-[10px]">
        {data.map((b) => {
          const sum = b.children.reduce((s, c) => s + c.value, 0);
          const pct = (sum / total) * 100;
          return (
            <div key={b.name} className="flex items-center gap-1.5 mono uppercase tracking-wider">
              <span className="h-1.5 w-1.5" style={{ background: b.color, boxShadow: `0 0 6px ${b.color}` }} />
              <span className="text-emerald-300/70">{b.name}</span>
              <span className="text-slate-300 ml-auto">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
