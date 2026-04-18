import React, { useEffect, useRef, useState } from 'react';
import { Command, Hexagon, ShieldCheck, Lock, TerminalSquare, Activity } from 'lucide-react';

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="h-9 w-9 p-[1px]" style={{ background: 'linear-gradient(135deg, #005EB8 0%, #3DA9FC 100%)' }}>
          <div className="h-full w-full bg-black flex items-center justify-center">
            <Hexagon size={16} className="text-ms-400 drop-shadow-[0_0_6px_rgba(61,169,252,0.6)]" />
          </div>
        </div>
      </div>
      <div className="leading-tight">
        <div className="mono text-[10px] tracking-[0.32em] text-slate-400 uppercase">Blanck Capital</div>
        <div className="text-[15px] font-semibold text-slate-100">
          Source of Truth <span className="mono text-slate-500 font-normal">· v3.2</span>
        </div>
      </div>
    </div>
  );
}

export default function Header({ totalAUM, onCommand }) {
  const [cmd, setCmd] = useState('');
  const [pulseKey, setPulseKey] = useState(0);
  const prev = useRef(totalAUM);

  useEffect(() => {
    if (prev.current !== totalAUM) {
      setPulseKey((k) => k + 1);
      prev.current = totalAUM;
    }
  }, [totalAUM]);
  // Removed the unconditional 6s pulse interval — it was remounting
  // the heartbeat span forever even when AUM hadn't budged. The
  // wealth-jitter interval in App already bumps totalAUM every 3.4s,
  // which drives the pulse via the effect above.

  const formatted = totalAUM.toLocaleString('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  });

  function submit(e) {
    e.preventDefault();
    if (!cmd.trim()) return;
    onCommand(cmd.trim());
    setCmd('');
  }

  return (
    <header className="panel hud-corners mx-2 sm:mx-4 mt-3 sm:mt-4 px-3 sm:px-5 py-3 sm:py-4 flex flex-wrap items-center gap-3 sm:gap-6 relative">
      <span className="corner-tl" />
      <span className="corner-br" />
      <Brand />

      <div className="flex md:flex items-center gap-2 md:gap-3 md:pl-5 md:ml-1 md:border-l md:border-white/10 order-3 md:order-none w-full md:w-auto">
        <div className="mono text-[10px] tracking-[0.22em] text-slate-400 uppercase flex items-center gap-1.5">
          <Activity size={10} className="text-ms-400" /> Total Net Worth
        </div>
        <div
          key={pulseKey}
          className="mono text-lg font-semibold text-slate-100"
          style={{ animation: 'heartbeat 1.4s ease-in-out 1' }}
        >
          {formatted}
        </div>
        <span className="chip chip-gain">+0.84% · 24H</span>
      </div>

      <form onSubmit={submit} className="flex-1 flex items-center gap-2 relative w-full md:w-auto order-2 md:order-none min-w-[200px]">
        <div className="flex-1 flex items-center gap-2 border border-white/10 bg-black/60 px-3 py-2 focus-within:border-ms-600 focus-within:shadow-glow-blue transition rounded-sm">
          <TerminalSquare size={14} className="text-ms-400" />
          <span className="mono text-ms-400 text-[12px]">bci@master:~$</span>
          <input
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            placeholder="/update realestate +100000  ·  /mark anduril 9.2"
            aria-label="Command line input"
            className="flex-1 bg-transparent outline-none mono text-[12.5px] text-slate-100 placeholder:text-slate-600"
          />
          <span className="chip">
            <Command size={10} /> K
          </span>
        </div>
      </form>

      <div className="hidden lg:flex items-center gap-2">
        <span className="chip chip-ms">
          <ShieldCheck size={11} /> OAuth 2.0
        </span>
        <span className="chip">
          <Lock size={11} /> Read-Only
        </span>
      </div>
    </header>
  );
}
