import React from 'react';
import { Terminal } from 'lucide-react';

export default function CommandLog({ entries }) {
  if (!entries || entries.length === 0) return null;
  return (
    <section className="glass rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-accent-green" />
          <div className="text-[10px] tracking-[0.28em] text-slate-500 uppercase">
            Command Log
          </div>
        </div>
        <span className="chip text-accent-green border-accent-green/30 bg-accent-green/5">
          {entries.length} entries
        </span>
      </div>
      <div className="divide-y divide-white/5 max-h-44 overflow-y-auto">
        {entries.slice().reverse().map((e) => (
          <div key={`${e.time}-${e.cmd}`} className="px-5 py-2.5 flex items-center gap-3">
            <span className="mono text-[10.5px] text-slate-500 w-16 shrink-0">{e.time}</span>
            <span className="mono text-[11.5px] text-accent-green shrink-0">bci@master:~$</span>
            <span className="mono text-[12px] text-slate-100 truncate">{e.cmd}</span>
            <span className="ml-auto mono text-[11px] text-slate-400">{e.result}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
