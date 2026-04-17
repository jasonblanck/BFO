import React, { useState } from 'react';
import { Command, Diamond, ShieldCheck, Lock, TerminalSquare } from 'lucide-react';

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent-green/30 via-accent-blue/30 to-accent-violet/30 p-[1px]">
          <div className="h-full w-full rounded-[11px] bg-navy-900 flex items-center justify-center">
            <Diamond size={16} className="text-accent-green drop-shadow-[0_0_6px_rgba(0,255,163,0.7)]" />
          </div>
        </div>
      </div>
      <div className="leading-tight">
        <div className="text-[10px] tracking-[0.32em] text-slate-400 uppercase">Blanck Capital</div>
        <div className="text-[15px] font-semibold text-slate-100">Source of Truth <span className="text-slate-500 font-normal">· v3</span></div>
      </div>
    </div>
  );
}

export default function Header({ totalAUM, onCommand, log }) {
  const [cmd, setCmd] = useState('');
  const formatted = totalAUM.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  function submit(e) {
    e.preventDefault();
    if (!cmd.trim()) return;
    onCommand(cmd.trim());
    setCmd('');
  }

  return (
    <header className="glass mx-4 mt-4 rounded-2xl px-5 py-4 flex items-center gap-6">
      <Brand />

      <div className="hidden md:flex items-center gap-2 pl-5 ml-1 border-l border-white/5">
        <div className="text-[10px] tracking-[0.22em] text-slate-500 uppercase">Total AUM</div>
        <div className="mono text-lg font-semibold text-slate-100">{formatted}</div>
        <span className="chip text-accent-green border-accent-green/30 bg-accent-green/5">+0.84% · 24h</span>
      </div>

      <form onSubmit={submit} className="flex-1 flex items-center gap-2 relative">
        <div className="flex-1 flex items-center gap-2 rounded-xl border border-white/8 bg-navy-900/60 px-3 py-2 focus-within:border-accent-green/50 focus-within:shadow-glow-green transition">
          <TerminalSquare size={14} className="text-accent-green" />
          <span className="mono text-accent-green text-[12px]">bci@master:~$</span>
          <input
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            placeholder="/update realestate +100000    ·    /rebalance venture 22    ·    /mark anduril 9.2"
            className="flex-1 bg-transparent outline-none mono text-[12.5px] text-slate-100 placeholder:text-slate-600"
          />
          <span className="chip text-slate-400">
            <Command size={10} /> K
          </span>
        </div>
      </form>

      <div className="hidden lg:flex items-center gap-2">
        <span className="chip text-accent-green border-accent-green/30 bg-accent-green/5">
          <ShieldCheck size={11} /> OAuth 2.0
        </span>
        <span className="chip text-slate-300">
          <Lock size={11} /> Read-Only
        </span>
      </div>
    </header>
  );
}
