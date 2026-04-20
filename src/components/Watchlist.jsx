import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, ArrowUpDown } from 'lucide-react';
import useMarketData from '../hooks/useMarketData';
import { fetchWatchlist, apiStatus } from '../data/markets';

// Right-rail ticker widget. Stretches to fill remaining vertical
// space in the aside so its bottom lines up with the main column's
// last section (High-Conviction Holdings). Internal scroll handles
// overflow when the list is longer than the available space.
//
// The size strategy: NO max-h / min-h on the panel — the parent
// flex-1 min-h-0 wrapper hands it a bounded height derived from the
// grid row stretch, and flex-col inside makes the row body the
// scroll area. Any fixed-height attempt will fight the grid.

function sparklineFor(seed, up) {
  let s = seed;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  const out = [];
  let v = 50;
  for (let i = 0; i < 40; i += 1) {
    v += (rand() - (up ? 0.4 : 0.6)) * 3;
    out.push({ t: i, v: +v.toFixed(2) });
  }
  return out;
}

function formatPrice(v) {
  if (v >= 1000) return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (v >= 1)    return v.toFixed(2);
  return v.toFixed(4);
}

function Row({ row }) {
  const up = row.changePct >= 0;
  const data = React.useMemo(
    () => sparklineFor([...row.ticker].reduce((a, c) => a + c.charCodeAt(0), 0), up),
    [row.ticker, up],
  );
  const stroke = up ? '#10B981' : '#EF4444';
  const grad = `grad-wl-${row.ticker}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition">
      <span
        className="h-8 w-8 rounded-sm flex items-center justify-center shrink-0 mono text-[10px] text-ms-400 tracking-wider"
        style={{ background: 'rgba(0,94,184,0.12)', boxShadow: 'inset 0 0 0 1px rgba(0,94,184,0.28)' }}
      >
        {row.ticker.slice(0, 4)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] text-slate-100 leading-tight truncate">{row.name}</div>
        <div className="mono text-[10.5px] text-slate-500 tracking-wider">{row.ticker}</div>
      </div>
      <div className="h-8 w-16 shrink-0">
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
      <div className="text-right shrink-0 w-[88px]">
        <div className="mono text-[13px] text-slate-100">{formatPrice(row.price)}</div>
        <div className={`mono text-[11px] ${up ? 'text-gain-500' : 'text-loss-500'} flex items-center justify-end gap-0.5`}>
          {up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {up ? '+' : ''}{row.changePct.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

// Sort controls. `key` = 'default' | 'name' | 'price'; `dir` =
// 'asc' | 'desc'. Default preserves the order in seedWatchlist so
// the owner-curated pinning (Mag 7 at the top) is respected.
function SortButton({ active, dir, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mono text-[10px] tracking-wider px-2 py-1 rounded-sm border transition flex items-center gap-1 ${
        active
          ? 'border-ms-400/40 bg-ms-600/15 text-ms-300'
          : 'border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/20'
      }`}
    >
      {children}
      {active && <ArrowUpDown size={9} className={dir === 'desc' ? 'rotate-180' : ''} />}
    </button>
  );
}

export default function Watchlist() {
  const { data, loading } = useMarketData(fetchWatchlist, [], 60_000);
  const rows = data ?? [];
  const polyLive = apiStatus().polygon;
  const [sortKey, setSortKey] = React.useState('default'); // default | name | price
  const [sortDir, setSortDir] = React.useState('asc');

  const cycle = (key) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('asc'); return; }
    if (sortDir === 'asc') { setSortDir('desc'); return; }
    setSortKey('default');
    setSortDir('asc');
  };

  const sorted = React.useMemo(() => {
    if (sortKey === 'default') return rows;
    const copy = [...rows];
    const cmp = sortKey === 'name'
      ? (a, b) => a.name.localeCompare(b.name)
      : (a, b) => (a.price ?? 0) - (b.price ?? 0);
    copy.sort(cmp);
    if (sortDir === 'desc') copy.reverse();
    return copy;
  }, [rows, sortKey, sortDir]);

  return (
    <section className="panel hud-corners relative overflow-hidden flex flex-col h-full">
      <span className="corner-tl" /><span className="corner-br" />
      <div className="px-5 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="panel-subtitle">Market action today</div>
            <div className="panel-title">Watchlist</div>
          </div>
          <span className="mono text-[10px] text-slate-500 tracking-wider">{rows.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mono text-[9.5px] text-slate-500 tracking-[0.22em] uppercase">Sort</span>
          <SortButton active={sortKey === 'name'}  dir={sortDir} onClick={() => cycle('name')}>Name</SortButton>
          <SortButton active={sortKey === 'price'} dir={sortDir} onClick={() => cycle('price')}>Price</SortButton>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/5">
        {sorted.map((r) => <Row key={r.ticker} row={r} />)}
        {!rows.length && loading && (
          <div className="px-5 py-6 mono text-[11px] text-slate-500">Loading watchlist…</div>
        )}
      </div>
      <div className="px-5 py-2.5 border-t border-white/5 bg-white/[0.012] flex items-center justify-between shrink-0">
        <span className="mono text-[10px] text-slate-500 tracking-wider">
          Source · Polygon ·{' '}
          {polyLive
            ? <span className="text-gain-500">LIVE · refresh 1m</span>
            : <span className="text-amber-400">SEED · VITE_POLYGON_API_KEY not set</span>}
        </span>
      </div>
    </section>
  );
}
