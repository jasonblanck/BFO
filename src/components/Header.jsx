import React, { useEffect, useRef, useState } from 'react';
import { Command, Hexagon, ShieldCheck, Lock, TerminalSquare, Activity } from 'lucide-react';

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="h-9 w-9 p-[1px]" style={{ background: 'linear-gradient(135deg, #00FF41 0%, #00F0FF 100%)' }}>
          <div className="h-full w-full bg-black flex items-center justify-center">
            <Hexagon size={16} className="text-hud-emerald drop-shadow-[0_0_6px_rgba(0,255,65,0.8)]" />
          </div>
        </div>
      </div>
      <div className="leading-tight">
        <div className="mono text-[10px] tracking-[0.32em] text-emerald-300/70 uppercase">Blanck Capital</div>
        <div className="text-[15px] font-semibold text-slate-100">
          Source of Truth <span className="mono text-emerald-300/40 font-normal">· v3.0</span>
        </div>
      </div>
    </div>
  );
}

export default function Header({ totalAUM, onCommand }) {
  const [cmd, setCmd] = useState('');
  const [pulseKey, setPulseKey] = useState(0);
  const prev = useRef(totalAUM);

  // Heartbeat on AUM change
  useEffect(() => {
    if (prev.current !== totalAUM) {
      setPulseKey((k) => k + 1);
      prev.current = totalAUM;
    }
  }, [totalAUM]);

  // Synthetic micro-jitter every 6s to make the number feel live
  useEffect(() => {
    const t = setInterval(() => setPulseKey((k) => k + 1), 6000);
    return () => clearInterval(t);
  }, []);

  const formatted = totalAUM.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  function submit(e) {
    e.preventDefault();
    if (!cmd.trim()) return;
    onCommand(cmd.trim());
    setCmd('');
  }

  return (
    <header className="hud hud-corners mx-2 sm:mx-4 mt-3 sm:mt-4 px-3 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center gap-3 sm:gap-6 relative">
      <span className="corner-tl" />
      <span className="corner-br" />
      <Brand />

      <div className="flex md:flex items-center gap-2 md:gap-3 md:pl-5 md:ml-1 md:border-l md:border-emerald-400/10 order-3 md:order-none w-full md:w-auto">
        <div className="mono text-[10px] tracking-[0.22em] text-emerald-300/60 uppercase flex items-center gap-1.5">
          <Activity size={10} className="text-hud-emerald" /> Total Net Worth
        </div>
        <div
          key={pulseKey}
          className="mono text-lg font-semibold text-slate-100"
          style={{ animation: 'heartbeat 1.4s ease-in-out 1' }}
        >
          {formatted}
        </div>
        <span className="chip text-hud-emerald">+0.84% · 24H</span>
      </div>

      <form onSubmit={submit} className="flex-1 flex items-center gap-2 relative w-full md:w-auto order-2 md:order-none min-w-[200px]">
        <div className="flex-1 flex items-center gap-2 border border-emerald-400/15 bg-black/60 px-3 py-2 focus-within:border-hud-emerald focus-within:shadow-glow-green transition">
          <TerminalSquare size={14} className="text-hud-emerald" />
          <span className="mono text-hud-emerald text-[12px]">bci@master:~$</span>
          <input
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            placeholder="/update realestate +100000  ·  /mark anduril 9.2"
            aria-label="Command line input"
            className="flex-1 bg-transparent outline-none mono text-[12.5px] text-slate-100 placeholder:text-emerald-300/25"
          />
          <span className="chip">
            <Command size={10} /> K
          </span>
        </div>
      </form>

      <div className="hidden lg:flex items-center gap-2">
        <span className="chip text-hud-emerald">
          <ShieldCheck size={11} /> OAuth 2.0
        </span>
        <span className="chip">
          <Lock size={11} /> Read-Only
        </span>
      </div>
    </header>
  );
}
