import React, { useEffect, useRef, useState } from 'react';
import { Terminal, Radio } from 'lucide-react';

// Synthetic event stream — randomized snippets that look like live
// SexyBot / market / portfolio events. Deterministic-ish distribution so
// feed feels alive without being chaotic.
const PRODUCERS = [
  () => ({
    tag: 'sys',
    text: `SexyBot conviction ${60 + Math.floor(Math.random() * 35)}% · ${pick([
      'Fed cut 25bps (Jun)',
      'BTC > $110K Q3',
      'CPI < 2.8% (May)',
      'Anduril Series F close 2026',
      'SPX closes green',
    ])}`,
  }),
  () => ({
    tag: 'mkt',
    text: `${pick(['VIX', 'DXY', 'US10Y', 'BTC/USD', 'NVDA', 'SPX'])} ${pick(['spike', 'fade', 'bid', 'offer'])} detected · Δ ${signed(Math.random() * 3)}%`,
  }),
  () => ({
    tag: 'pf',
    text: `Portfolio Δ · ${pick(['Morgan Stanley', 'Fidelity', 'TIAA', 'Chase', 'BofA'])} ${signedUSD(Math.random() * 40000)}`,
  }),
  () => ({
    tag: 'sys',
    text: `Kash scanning Polymarket · ${pick(['BTC', 'ETH', 'Election', 'Macro'])} book depth ${Math.floor(Math.random() * 9 + 1)}×`,
  }),
  () => ({
    tag: 'mkt',
    text: `Secondary tender · ${pick(['Neuralink', 'Figure AI', 'Anduril', 'Perplexity'])} quote ${signed(5 + Math.random() * 20)}% vs last`,
  }),
  () => ({
    tag: 'warn',
    text: `Allocation drift · Venture +${(Math.random() * 3).toFixed(1)}pp over target — rebalance window open`,
  }),
  () => ({
    tag: 'pf',
    text: `Plaid sync · ${pick(['MS', 'BofA', 'Chase', 'Citi', 'Fidelity'])} holdings reconciled · latency ${Math.floor(80 + Math.random() * 120)}ms`,
  }),
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function signed(n) {
  const sign = Math.random() > 0.5 ? '+' : '-';
  return `${sign}${n.toFixed(2)}`;
}
function signedUSD(n) {
  const sign = Math.random() > 0.45 ? '+' : '-';
  return `${sign}$${Math.floor(n).toLocaleString()}`;
}

function nowStamp() {
  const d = new Date();
  return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
}

const SEED = [
  { tag: 'sys', text: 'Blanck Capital OS v3 · boot sequence complete' },
  { tag: 'sys', text: 'OAuth handshake · Morgan Stanley · Fidelity · BofA · Chase · Citi · TIAA → OK' },
  { tag: 'mkt', text: 'Tape in · S&P 5842.31 · NDX 20184.12 · VIX 14.22 · BTC 96,420' },
  { tag: 'pf',  text: 'Grand total $29.97M · 23 accounts · drift +6.2pp' },
  { tag: 'sys', text: 'SexyBot online · Kash online · Intelligence feed active' },
];

export default function SystemLog() {
  const [lines, setLines] = useState(() =>
    SEED.map((l, i) => ({ ...l, id: `seed-${i}`, ts: nowStamp() }))
  );
  const boxRef = useRef(null);

  useEffect(() => {
    const push = () => {
      const producer = PRODUCERS[Math.floor(Math.random() * PRODUCERS.length)];
      const event = producer();
      setLines((prev) => {
        const next = [...prev, { ...event, id: Math.random().toString(36).slice(2), ts: nowStamp() }];
        return next.length > 120 ? next.slice(-120) : next;
      });
    };
    // Irregular cadence feels more "alive"
    let timer;
    const schedule = () => {
      const delay = 1200 + Math.random() * 2800;
      timer = setTimeout(() => {
        push();
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!boxRef.current) return;
    boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [lines.length]);

  return (
    <section className="hud hud-corners overflow-hidden">
      <span className="corner-tl" /><span className="corner-br" />
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-ms-400" />
          <span className="mono text-[11px] tracking-[0.22em] text-ms-400 uppercase">
            System Terminal
          </span>
          <span className="text-[10px] text-slate-500 mono">· TTY/1</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip text-ms-400">
            <Radio size={10} className="animate-pulse-dot" /> Streaming
          </span>
          <span className="mono text-[10px] text-slate-500">{lines.length} events</span>
        </div>
      </div>

      <div
        ref={boxRef}
        className="terminal max-h-44 overflow-y-auto py-2 px-4 leading-[1.55]"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,255,65,0.02), rgba(0,0,0,0) 120px), radial-gradient(400px 100px at 10% 0%, rgba(0,255,65,0.05), transparent)',
        }}
      >
        {lines.map((l) => (
          <div key={l.id} className="animate-log-in whitespace-nowrap">
            <span className="ts">[{l.ts}]</span>{' '}
            <span className={l.tag}>
              {l.tag === 'sys' && '[SYSTEM]'}
              {l.tag === 'mkt' && '[MARKET]'}
              {l.tag === 'pf' && '[PORTFOLIO]'}
              {l.tag === 'warn' && '[WARN]'}
            </span>{' '}
            <span>{l.text}</span>
          </div>
        ))}
        <div className="inline-block mono text-ms-400 animate-pulse-dot">▊</div>
      </div>
    </section>
  );
}
