import React, { useEffect, useState } from 'react';
import {
  Zap,
  Activity,
  Flame,
  Target,
  ArrowUpRight,
  Skull,
} from 'lucide-react';

// -------------- Active Position panel (left) --------------

function TickingNumber({ value, prefix = '+$', className = '' }) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    if (display === value) return;
    const start = display;
    const delta = value - start;
    const steps = 18;
    let i = 0;
    const t = setInterval(() => {
      i += 1;
      const eased = 1 - Math.pow(1 - i / steps, 3);
      setDisplay(Math.round(start + delta * eased));
      if (i >= steps) clearInterval(t);
    }, 22);
    return () => clearInterval(t);
  }, [value, display]);
  const positive = display >= 0;
  return (
    <span className={className}>
      {positive ? prefix : '-$'}
      {Math.abs(display).toLocaleString()}
    </span>
  );
}

function ConvictionDial({ value }) {
  const size = 168;
  const r = 72;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#00FF41" />
          </linearGradient>
          <filter id="dialGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" />
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(0,255,65,0.08)" strokeWidth="10" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#dialGrad)"
          strokeWidth="10"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          filter="url(#dialGlow)"
        />
        {/* Tick marks */}
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i / 36) * 2 * Math.PI - Math.PI / 2;
          const inner = r + 10;
          const outer = r + 16;
          const x1 = size / 2 + Math.cos(angle) * inner;
          const y1 = size / 2 + Math.sin(angle) * inner;
          const x2 = size / 2 + Math.cos(angle) * outer;
          const y2 = size / 2 + Math.sin(angle) * outer;
          const active = (i / 36) * 100 <= value;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={active ? '#00FF41' : 'rgba(0,255,65,0.12)'}
              strokeWidth="1.2"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="mono text-[9.5px] tracking-[0.3em] text-emerald-300/70 uppercase">
          Conviction
        </div>
        <div className="mono text-[44px] font-semibold leading-none text-hud-emerald drop-shadow-[0_0_8px_rgba(0,255,65,0.6)]">
          {value}
        </div>
        <div className="mono text-[10px] tracking-[0.18em] text-emerald-300/60 uppercase mt-1">
          / 100
        </div>
      </div>
    </div>
  );
}

function ActivePosition() {
  // Simulate a live P&L tick every 2.5s
  const [pnl, setPnl] = useState(8240);
  const [conv, setConv] = useState(88);
  useEffect(() => {
    const t = setInterval(() => {
      setPnl((p) => Math.max(0, Math.round(p + (Math.random() - 0.4) * 800)));
      setConv((c) => Math.max(50, Math.min(99, Math.round(c + (Math.random() - 0.5) * 3))));
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hud hud-corners relative overflow-hidden p-5 min-h-[360px]">
      <span className="corner-tl" /><span className="corner-br" />
      <div className="absolute top-0 left-0 right-0 h-[2px] shimmer-line" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-hud-emerald" />
          <span className="mono text-[10.5px] tracking-[0.32em] text-hud-emerald uppercase">
            Active Position · SexyBot
          </span>
        </div>
        <span className="chip text-hud-emerald animate-pulse-dot">
          <Activity size={10} /> Live
        </span>
      </div>

      <div className="mt-4 flex items-center gap-5">
        <ConvictionDial value={conv} />
        <div className="flex-1 min-w-0">
          <div className="mono text-[10px] tracking-[0.24em] text-emerald-300/50 uppercase">
            Market · Kalshi
          </div>
          <h2 className="mt-1 text-[22px] font-semibold text-white leading-tight tracking-tight uppercase">
            Fed cuts 25bps<br/>
            <span className="text-slate-400">· June FOMC</span>
          </h2>

          <div className="mt-4 flex items-center gap-2">
            <span
              className="mono text-[13px] px-3 py-1 border font-semibold tracking-[0.2em]"
              style={{
                color: '#00FF41',
                borderColor: 'rgba(0,255,65,0.5)',
                background: 'rgba(0,255,65,0.08)',
                boxShadow: '0 0 14px rgba(0,255,65,0.3), inset 0 0 0 1px rgba(0,255,65,0.25)',
              }}
            >
              YES @ 0.64
            </span>
            <span className="mono text-[11px] text-emerald-300/60">SIZE $42K</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-emerald-400/10 flex items-end justify-between gap-4">
        <div>
          <div className="mono text-[9.5px] tracking-[0.28em] text-emerald-300/50 uppercase">
            Unrealized P/L
          </div>
          <TickingNumber
            value={pnl}
            className="mono text-[36px] font-semibold text-hud-emerald drop-shadow-[0_0_10px_rgba(0,255,65,0.6)] leading-none"
          />
        </div>
        <div className="text-right">
          <div className="mono text-[9.5px] tracking-[0.28em] text-emerald-300/50 uppercase">Edge · IV</div>
          <div className="mono text-[18px] text-slate-100">+{(conv - 50).toFixed(1)}%</div>
          <div className="mono text-[10px] text-emerald-300/50 mt-0.5">vs market @ 0.50</div>
        </div>
      </div>
    </div>
  );
}

// -------------- Volatility Matrix (middle) --------------

const VOL_TICKERS = [
  'SPX','NDX','DJIA','VIX','RUT','DXY',
  'BTC','ETH','SOL','TLT','IEF','HYG',
  'GOLD','SILV','WTI','BRENT','NG','URA',
  'NVDA','MSFT','META','GOOG','AAPL','TSLA',
  'PLTR','MSTR','COIN','HOOD','SHOP','ARKK',
];

function volToColor(v) {
  // 0..100 → cyan → emerald → amber → red
  if (v < 25) return { bg: `rgba(0,240,255,${0.1 + v / 200})`, fg: '#00F0FF' };
  if (v < 50) return { bg: `rgba(0,255,65,${0.12 + (v - 25) / 200})`, fg: '#00FF41' };
  if (v < 75) return { bg: `rgba(255,176,32,${0.16 + (v - 50) / 200})`, fg: '#FFB020' };
  return { bg: `rgba(255,51,85,${0.20 + (v - 75) / 160})`, fg: '#FF3355' };
}

function VolatilityMatrix() {
  const [cells, setCells] = useState(() =>
    VOL_TICKERS.map((t) => ({ t, v: Math.floor(Math.random() * 100) }))
  );

  useEffect(() => {
    const t = setInterval(() => {
      setCells((prev) =>
        prev.map((c) => {
          const drift = (Math.random() - 0.5) * 14;
          const nv = Math.max(1, Math.min(99, Math.round(c.v + drift)));
          return { ...c, v: nv };
        })
      );
    }, 900);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="hud hud-corners relative overflow-hidden p-5 min-h-[360px]">
      <span className="corner-tl" /><span className="corner-br" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame size={13} className="text-hud-amber" />
          <span className="mono text-[10.5px] tracking-[0.32em] text-hud-amber uppercase">
            Volatility Matrix · 1D
          </span>
        </div>
        <span className="chip text-hud-amber" style={{ borderColor: 'rgba(255,176,32,0.3)', background: 'rgba(255,176,32,0.05)' }}>
          {cells.filter((c) => c.v > 75).length} hot
        </span>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-1.5">
        {cells.map((c, i) => {
          const color = volToColor(c.v);
          const hot = c.v > 80;
          return (
            <div
              key={c.t}
              className={`relative p-2 border transition-colors ${hot ? 'animate-flicker' : ''}`}
              style={{
                background: color.bg,
                borderColor: `${color.fg}44`,
                boxShadow: hot ? `0 0 10px ${color.fg}66, inset 0 0 0 1px ${color.fg}55` : 'none',
              }}
            >
              <div className="mono text-[9.5px] tracking-wider uppercase" style={{ color: color.fg, opacity: 0.85 }}>
                {c.t}
              </div>
              <div className="mono text-[13px] font-semibold leading-none mt-0.5" style={{ color: color.fg }}>
                {c.v}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-amber-500/10 flex items-center justify-between mono text-[10px] text-emerald-300/50 uppercase tracking-wider">
        <span>cool</span>
        <div className="flex-1 mx-3 h-[3px]" style={{ background: 'linear-gradient(90deg, #00F0FF, #00FF41 33%, #FFB020 66%, #FF3355)' }} />
        <span>hot</span>
      </div>
    </div>
  );
}

// -------------- Risk / Exposure panel (right) --------------

function RiskExposure() {
  const [exposure, setExposure] = useState(68);
  useEffect(() => {
    const t = setInterval(() => {
      setExposure((e) => Math.max(30, Math.min(92, Math.round(e + (Math.random() - 0.5) * 6))));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  const alert = exposure > 80;

  return (
    <div className="hud hud-corners relative overflow-hidden p-5 min-h-[360px]">
      <span className="corner-tl" /><span className="corner-br" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={13} className={alert ? 'text-hud-red' : 'text-hud-cyan'} />
          <span className={`mono text-[10.5px] tracking-[0.32em] uppercase ${alert ? 'text-hud-red' : 'text-hud-cyan'}`}>
            Exposure · Risk
          </span>
        </div>
        <span className={`chip ${alert ? 'animate-flicker' : ''}`} style={alert ? { color: '#FF3355', borderColor: 'rgba(255,51,85,0.4)', background: 'rgba(255,51,85,0.07)' } : { color: '#00F0FF', borderColor: 'rgba(0,240,255,0.25)', background: 'rgba(0,240,255,0.04)' }}>
          {alert ? <Skull size={10} /> : <Activity size={10} />}
          {alert ? 'Elevated' : 'Within band'}
        </span>
      </div>

      <div className="mt-4 flex items-stretch gap-4 h-[220px]">
        {/* Thermobar */}
        <div className="relative w-10 shrink-0">
          <div className="absolute inset-0 border border-emerald-400/15"
               style={{ background: 'linear-gradient(180deg, rgba(255,51,85,0.25) 0%, rgba(255,176,32,0.2) 30%, rgba(0,255,65,0.2) 60%, rgba(0,240,255,0.18) 100%)' }} />
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((m) => (
            <div key={m} className="absolute left-0 right-0 border-t border-emerald-400/15"
                 style={{ top: `${100 - m}%` }} />
          ))}
          {/* Current marker */}
          <div
            className="absolute left-[-6px] right-[-6px] h-[3px] bg-white transition-[top] duration-700"
            style={{
              top: `${100 - exposure}%`,
              boxShadow: alert
                ? '0 0 12px rgba(255,51,85,0.8), 0 0 2px rgba(255,51,85,1)'
                : '0 0 12px rgba(0,255,65,0.8), 0 0 2px rgba(0,255,65,1)',
              background: alert ? '#FF3355' : '#00FF41',
            }}
          />
        </div>

        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <div className="mono text-[9.5px] tracking-[0.22em] text-emerald-300/50 uppercase">Net Exposure</div>
            <div className={`mono text-[44px] leading-none font-semibold ${alert ? 'text-hud-red' : 'text-hud-emerald'} drop-shadow-[0_0_8px_rgba(0,255,65,0.5)]`}>
              {exposure}%
            </div>
            <div className="mono text-[10px] text-emerald-300/50 mt-1">of $30.0M AUM</div>
          </div>

          <div className="space-y-1.5">
            <RiskRow k="Long" v="72%" color="#00FF41" />
            <RiskRow k="Short" v="14%" color="#FF3355" />
            <RiskRow k="Cash" v="14%" color="#00F0FF" />
          </div>

          <div className={`mono text-[10px] px-2 py-1.5 border ${alert ? 'text-hud-red border-red-500/30 bg-red-500/5 animate-flicker' : 'text-hud-cyan border-cyan-400/20 bg-cyan-400/5'} uppercase tracking-wider`}>
            <ArrowUpRight size={10} className="inline -mt-0.5 mr-1" />
            {alert ? 'Reduce · Target 70%' : 'Headroom · +12 pts'}
          </div>
        </div>
      </div>
    </div>
  );
}

function RiskRow({ k, v, color }) {
  return (
    <div className="flex items-center justify-between mono text-[11px]">
      <span className="flex items-center gap-1.5 text-emerald-300/60 uppercase tracking-wider">
        <span className="h-1.5 w-1.5" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        {k}
      </span>
      <span className="text-slate-100">{v}</span>
    </div>
  );
}

// -------------- Top-level hero --------------

export default function HeroHUD() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.1fr_0.9fr] gap-4">
      <ActivePosition />
      <VolatilityMatrix />
      <RiskExposure />
    </section>
  );
}
