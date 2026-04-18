import React from 'react';
import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';
import { Layers, Timer } from 'lucide-react';
import { liquidityLadder } from '../data/portfolio';
import useIsLight from '../hooks/useIsLight';

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

// Darken a hex color for readable text on pastel fills in light mode.
function darken(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return '#0F172A';
  let [r, g, b] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  // Scale toward black by 55% — keeps hue identity but pushes luminance down.
  r = Math.round(r * 0.45);
  g = Math.round(g * 0.45);
  b = Math.round(b * 0.45);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Shorten long vehicle names so they fit common cell widths at 10px mono.
function shortName(raw) {
  return raw
    .replace('Public Equities',    'Equities')
    .replace('US Equities',        'US Stocks')
    .replace('Intl Equities',      'Intl')
    .replace('Tech Single-Names',  'Tech Singles')
    .replace('Options · Hedge',    'Options')
    .replace('Venture · SPV',      'Venture SPV')
    .replace('Venture · Direct',   'Venture Direct')
    .replace('LP Interests',       'LP')
    .replace('Private Credit',     'Priv. Credit')
    .replace('IG Corp',            'IG Corp')
    .replace('USDC · Circle',      'USDC')
    .replace('USD · Operating',    'USD Cash')
    .replace('BTC · Cold',         'BTC')
    .replace('ETH · Cold',         'ETH')
    .replace('ETFs · SPY/QQQ',     'ETFs');
}

// eslint-disable-next-line react/prop-types
const TreeCell = (props) => {
  const {
    x, y, width, height, name, value, color, depth,
    ink,
  } = props;
  if (depth < 2) return null;
  if (width < 2 || height < 2) return null;

  const hot = color || '#005EB8';
  const short = shortName(name);
  const valueLabel = usd(value);

  const labelPx = short.length * 6.2 + 14;
  const valuePx = valueLabel.length * 6.8 + 14;

  const showLabel = width > labelPx && height > 24;
  const showValue = width > valuePx && height > 42 && showLabel;

  // Halo stroke rendered behind the fill via paint-order:stroke.
  // Gives labels/values a hard-contrast outline so text reads against
  // any cell color without calculating per-bucket luminance.
  const haloStyle = ink.halo
    ? { paintOrder: 'stroke', stroke: ink.halo, strokeWidth: 3, strokeLinejoin: 'round', strokeLinecap: 'round' }
    : undefined;

  // Explicit opacity=1 on the wrapping <g> AND inline style on the
  // fill rect — Recharts' Treemap internally wraps custom content in
  // an <Animate> element that mounts with fillOpacity < 1 and our
  // prop-level fill was losing to cascade. Forcing both wins it back.
  const rectStyle = {
    fill: hot,
    fillOpacity: 1,
    opacity: 1,
  };

  return (
    <g opacity={1} style={{ opacity: 1 }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={hot}
        fillOpacity={1}
        opacity={1}
        style={rectStyle}
      />
      <rect
        x={x + 0.5}
        y={y + 0.5}
        width={Math.max(0, width - 1)}
        height={Math.max(0, height - 1)}
        fill="none"
        stroke={ink.border}
        strokeWidth={1}
        style={{ strokeOpacity: 1 }}
      />
      {showLabel && (
        <text
          x={x + 8}
          y={y + 17}
          fill="#FFFFFF"
          fontFamily="JetBrains Mono"
          fontSize={11}
          letterSpacing="0.06em"
          fontWeight={700}
          style={{ ...haloStyle, fillOpacity: 1, opacity: 1 }}
        >
          {short.toUpperCase()}
        </text>
      )}
      {showValue && (
        <text
          x={x + 8}
          y={y + 34}
          fill="#FFFFFF"
          fontFamily="JetBrains Mono"
          fontSize={12}
          fontWeight={700}
          style={{ ...haloStyle, fillOpacity: 1, opacity: 1 }}
        >
          {valueLabel}
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
  const isLight = useIsLight();
  const total = data.reduce(
    (s, d) => s + d.children.reduce((ss, c) => ss + c.value, 0),
    0
  );

  // Theme-aware ink. Both modes now use saturated fills (no opacity
  // gymnastics) with white bold text + a dark halo so the labels pop
  // reliably on top of any bucket color.
  const ink = isLight
    ? {
        border: '#FFFFFF',                 // matches canvas — clean cell separation
        halo:   'rgba(15, 23, 42, 0.85)',  // near-black halo reads on bright pastels
      }
    : {
        border: '#03060C',
        halo:   'rgba(0, 0, 0, 0.55)',
      };

  // Pass ink into the Cell via render-content wrapper.
  const Cell = (props) => <TreeCell {...props} ink={ink} />;

  return (
    <section className="panel hud-corners relative overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-ms-400" />
          <div>
            <div className="mono text-[10px] tracking-[0.28em] text-slate-400 uppercase">Time-to-Cash</div>
            <div className="panel-title">Liquidity Tessellation</div>
          </div>
        </div>
        <span className="chip text-ms-400" style={{ borderColor: 'rgba(0,240,255,0.3)', background: 'rgba(0,240,255,0.05)' }}>
          <Timer size={10} /> T+0 → 5yr+
        </span>
      </div>

      <div className="h-[280px] px-2 py-2">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="value"
            stroke={ink.border}
            isAnimationActive={false}
            content={<Cell />}
          >
            <Tooltip content={<TreeTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>

      <div className="px-5 py-3 border-t border-white/10 grid grid-cols-4 gap-2 text-[10px]">
        {data.map((b) => {
          const sum = b.children.reduce((s, c) => s + c.value, 0);
          const pct = (sum / total) * 100;
          return (
            <div key={b.name} className="flex items-center gap-1.5 mono uppercase tracking-wider">
              <span className="h-1.5 w-1.5" style={{ background: b.color, boxShadow: `0 0 6px ${b.color}` }} />
              <span className="text-slate-400">{b.name}</span>
              <span className="text-slate-300 ml-auto">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
