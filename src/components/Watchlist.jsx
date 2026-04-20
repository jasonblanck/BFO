import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import useMarketData from '../hooks/useMarketData';
import { fetchWatchlist } from '../data/markets';

// Right-rail ticker widget — Mag 7 + PLTR. Mirrors the IndexCard row
// pattern from IndexesInflation so both panels read consistently,
// with a ticker-letter "avatar" in place of the lucide index glyphs.
//
// Polygon's /snapshot/.../tickers/{T} endpoint gives live-ish
// todaysChangePerc; we fall back to seed values when the API key is
// missing OR a given ticker lookup fails.

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

export default function Watchlist() {
  const { data, loading } = useMarketData(fetchWatchlist, [], 60_000);
  const rows = data ?? [];
  return (
    <section className="panel hud-corners relative overflow-hidden flex flex-col max-h-[320px]">
      <span className="corner-tl" /><span className="corner-br" />
      <div className="px-5 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
        <div>
          <div className="panel-subtitle">Mag 7 · PLTR · Top caps</div>
          <div className="panel-title">Watchlist</div>
        </div>
        <span className="mono text-[10px] text-slate-500 tracking-wider">{rows.length}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-white/5">
        {rows.map((r) => <Row key={r.ticker} row={r} />)}
        {!rows.length && loading && (
          <div className="px-5 py-6 mono text-[11px] text-slate-500">Loading watchlist…</div>
        )}
      </div>
      <div className="px-5 py-2.5 border-t border-white/5 bg-white/[0.012] flex items-center justify-between shrink-0">
        <span className="mono text-[10px] text-slate-500 tracking-wider">Source · Polygon · refresh 1m</span>
      </div>
    </section>
  );
}
