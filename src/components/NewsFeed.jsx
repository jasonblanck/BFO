import React, { useEffect, useRef, useState } from 'react';
import { Newspaper, Rss, ExternalLink } from 'lucide-react';
import useMarketData from '../hooks/useMarketData';
import { fetchNews } from '../data/markets';

export default function NewsFeed() {
  const { data } = useMarketData(() => fetchNews(16), [], 120_000);
  const items = data ?? [];
  const scrollRef = useRef(null);
  const [active, setActive] = useState(0);

  // Cycle the "active" highlight across headlines so it feels alive.
  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(() => setActive((a) => (a + 1) % items.length), 3500);
    return () => clearInterval(t);
  }, [items.length]);

  return (
    <section className="panel hud-corners relative overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />

      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-ms-400" />
          <div>
            <div className="mono text-[10px] tracking-[0.28em] text-slate-500 uppercase">US Stocks · News Stream</div>
            <div className="text-[14px] font-semibold text-slate-100">Headlines</div>
          </div>
        </div>
        <span className="chip chip-ms"><Rss size={10} /> Live feed</span>
      </div>

      <div ref={scrollRef} className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
        {items.map((n, i) => {
          const Tag = n.url ? 'a' : 'div';
          const anchorProps = n.url
            ? { href: n.url, target: '_blank', rel: 'noreferrer' }
            : {};
          return (
          <Tag
            key={`${n.source}-${n.time}-${i}`}
            {...anchorProps}
            className={`group flex items-start gap-3 px-5 py-3 transition ${
              i === active ? 'bg-ms-600/5' : 'hover:bg-white/[0.025]'
            } ${n.url ? 'cursor-pointer' : ''}`}
          >
            <span
              className="mono inline-flex items-center justify-center h-7 w-7 rounded-sm text-[10.5px] font-semibold shrink-0"
              style={{ background: 'rgba(0,94,184,0.14)', color: '#7BC6FF', boxShadow: 'inset 0 0 0 1px rgba(0,94,184,0.3)' }}
            >
              {(n.ticker || '?')[0]}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-slate-100 leading-snug group-hover:text-ms-300 transition">
                {n.headline}
              </div>
              <div className="mono text-[10.5px] text-slate-500 mt-1 tracking-wider flex items-center gap-2">
                <span className="text-slate-400">{n.source}</span>
                <span>·</span>
                <span>{n.time} ago</span>
                <span>·</span>
                <span>{n.ticker}</span>
              </div>
            </div>
            {n.url && (
              <ExternalLink size={12} className="text-slate-600 group-hover:text-ms-400 shrink-0" />
            )}
          </Tag>
          );
        })}
        {!items.length && (
          <div className="px-5 py-8 mono text-[11px] text-slate-500 text-center">
            Connecting to news feed…
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/5 bg-white/[0.012]">
        <span className="mono text-[10px] text-slate-500 tracking-wider">
          Source · Finnhub · refresh 2m · auto-highlight 3.5s
        </span>
        <button className="mono text-[11px] text-ms-400 hover:text-ms-300 transition">
          Full stream →
        </button>
      </div>
    </section>
  );
}
