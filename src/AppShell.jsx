import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, RefreshCw } from 'lucide-react';
import App from './App';

const STORAGE_KEY = 'bci-view';

function getInitialView() {
  if (typeof window === 'undefined') return 'desktop';
  const url = new URL(window.location.href);
  if (url.searchParams.get('view') === 'mobile') return 'mobile';
  if (url.searchParams.get('view') === 'desktop') return 'desktop';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'mobile' || saved === 'desktop') return saved;
  } catch (_) {}
  if (window.matchMedia && window.matchMedia('(max-width: 767px)').matches) return 'mobile';
  return 'desktop';
}

function isFrame() {
  if (typeof window === 'undefined') return false;
  return new URL(window.location.href).searchParams.get('frame') === '1';
}

export default function AppShell() {
  // Read the ?frame=1 flag once per render — call all hooks unconditionally.
  const inFrame = isFrame();

  const [view, setView] = useState(getInitialView);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, view);
    } catch (_) {}
  }, [view]);

  if (inFrame) {
    return <App />;
  }

  const selectDesktop = () => setView('desktop');
  const selectMobile  = () => setView('mobile');
  const reload        = () => setIframeKey((k) => k + 1);

  return (
    <div className="min-h-screen text-slate-100">
      {/* Floating view toggle — visible on desktop only; on actual mobile
          viewport (<= 767px) the toggle is hidden since the app is already
          rendering mobile-first. */}
      <div className="fixed top-3 right-3 z-[200] hidden md:flex items-center gap-2">
        {view === 'mobile' && (
          <button
            onClick={reload}
            aria-label="Reload preview"
            className="h-9 w-9 flex items-center justify-center bg-black/70 border border-emerald-400/20 hover:border-emerald-400/60 hover:shadow-glow-green transition"
          >
            <RefreshCw size={14} className="text-emerald-300/80" />
          </button>
        )}
        <div className="flex items-center bg-black/70 border border-emerald-400/20 overflow-hidden">
          <ToggleBtn
            active={view === 'desktop'}
            onClick={selectDesktop}
            icon={Monitor}
            label="Desktop"
          />
          <div className="w-px self-stretch bg-emerald-400/15" />
          <ToggleBtn
            active={view === 'mobile'}
            onClick={selectMobile}
            icon={Smartphone}
            label="Mobile"
          />
        </div>
      </div>

      {view === 'desktop' ? (
        <App />
      ) : (
        <PhoneFrame key={iframeKey} />
      )}
    </div>
  );
}

function ToggleBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`flex items-center gap-1.5 px-3 h-9 mono text-[11px] tracking-[0.18em] uppercase transition ${
        active
          ? 'text-hud-emerald bg-emerald-500/10'
          : 'text-emerald-300/50 hover:text-emerald-200'
      }`}
      style={active ? { boxShadow: 'inset 0 0 0 1px rgba(0,255,65,0.35)' } : {}}
    >
      <Icon size={13} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function PhoneFrame() {
  // Ensure the src carries the ?frame=1 flag so the iframe skips the shell.
  const src = (() => {
    if (typeof window === 'undefined') return '?frame=1';
    const u = new URL(window.location.href);
    u.searchParams.set('frame', '1');
    u.searchParams.delete('view');
    return u.pathname + u.search;
  })();

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-20 pb-10 px-4">
      <div className="mono text-[10.5px] tracking-[0.3em] text-emerald-300/50 uppercase mb-4 flex items-center gap-2">
        <span className="h-1.5 w-1.5 bg-hud-emerald shadow-glow-green animate-pulse-dot" />
        Mobile Preview · 390 × 844
      </div>

      <div
        className="relative"
        style={{
          width: 420,
          maxWidth: '100%',
          padding: 14,
          background: 'linear-gradient(180deg, #0a0a0a, #000)',
          border: '1px solid rgba(0, 255, 65, 0.18)',
          borderRadius: 48,
          boxShadow:
            '0 30px 90px -20px rgba(0,0,0,0.9), inset 0 0 0 2px rgba(255,255,255,0.04), 0 0 40px -6px rgba(0,255,65,0.22)',
        }}
      >
        {/* Notch */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[22px] z-10"
          style={{
            width: 110,
            height: 26,
            background: '#000',
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />
        {/* Screen */}
        <div
          className="relative overflow-hidden"
          style={{
            width: 392,
            maxWidth: '100%',
            height: 812,
            borderRadius: 36,
            background: '#03060C',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          <iframe
            title="BCI Mobile Preview"
            src={src}
            className="w-full h-full block border-0"
            // Stackblitz and GitHub Pages both allow same-origin iframes; falls
            // back gracefully without extra flags.
          />
        </div>
      </div>

      <div className="mt-5 mono text-[10px] tracking-[0.22em] text-emerald-300/40 uppercase">
        Interact directly inside the frame · resize toggle above
      </div>
    </div>
  );
}
