import React, { useState, cloneElement } from 'react';
import { Terminal, ChevronUp, ChevronDown } from 'lucide-react';

// Slide-up drawer that pins to the viewport bottom. Collapsed shows a
// 36px handle with a "Live" pulse; expanded reveals the SystemLog.
// Passes `active` down to the child so it can pause its interval when
// the drawer is closed.
export default function SystemDrawer({ children }) {
  const [open, setOpen] = useState(false);
  const child = children && React.isValidElement(children)
    ? cloneElement(children, { active: open })
    : children;
  return (
    <div
      className="fixed left-0 right-0 bottom-0 z-[70] pointer-events-none"
      aria-label="System terminal"
    >
      <div
        className="pointer-events-auto mx-auto max-w-[1760px] px-2 sm:px-4"
        style={{
          transform: open ? 'translateY(0)' : 'translateY(calc(100% - 36px))',
          transition: 'transform 280ms cubic-bezier(.2,.7,.2,1)',
        }}
      >
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="system-drawer-body"
          className="w-full h-9 flex items-center justify-between px-4 border border-white/10 bg-black/90 backdrop-blur-md hover:bg-black transition"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-gain-500 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gain-500 shadow-glow-green" />
            </span>
            <Terminal size={12} className="text-ms-400" />
            <span className="mono text-[11px] tracking-[0.22em] text-white uppercase">System Terminal</span>
            <span className="mono text-[10px] text-slate-500">· TTY/1</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="mono text-[10px] text-slate-400 tracking-wider">
              {open ? 'Collapse' : 'Expand'}
            </span>
            {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronUp size={14} className="text-slate-400" />}
          </div>
        </button>

        <div
          id="system-drawer-body"
          hidden={!open}
          className="border border-t-0 border-white/10 bg-black/95 backdrop-blur-md"
          style={{ maxHeight: '40vh', overflow: 'hidden' }}
        >
          {child}
        </div>
      </div>
    </div>
  );
}
