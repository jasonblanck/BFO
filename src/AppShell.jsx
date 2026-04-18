import React, { useEffect, useState } from 'react';
import { Monitor, Smartphone, RefreshCw, Sun, Moon } from 'lucide-react';
import App from './App';

const STORAGE_VIEW  = 'bci-view';
const STORAGE_THEME = 'bci-theme';

function getInitialView() {
  if (typeof window === 'undefined') return 'desktop';
  const url = new URL(window.location.href);
  if (url.searchParams.get('view') === 'mobile') return 'mobile';
  if (url.searchParams.get('view') === 'desktop') return 'desktop';
  try {
    const saved = localStorage.getItem(STORAGE_VIEW);
    if (saved === 'mobile' || saved === 'desktop') return saved;
  } catch (_) {}
  if (window.matchMedia && window.matchMedia('(max-width: 767px)').matches) return 'mobile';
  return 'desktop';
}

function getInitialTheme() {
  if (typeof window === 'undefined') return 'light';
  const url = new URL(window.location.href);
  const q = url.searchParams.get('theme');
  if (q === 'light' || q === 'dark') return q;
  try {
    const saved = localStorage.getItem(STORAGE_THEME);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (_) {}
  return 'light';
}

function isFrame() {
  if (typeof window === 'undefined') return false;
  return new URL(window.location.href).searchParams.get('frame') === '1';
}

export default function AppShell() {
  const inFrame = isFrame();

  const [view, setView]   = useState(getInitialView);
  const [theme, setTheme] = useState(getInitialTheme);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_VIEW, view); } catch (_) {}
  }, [view]);

  // Apply theme to the document root AND broadcast to any nested iframe
  // so the mobile-preview frame stays in sync without a reload.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(STORAGE_THEME, theme); } catch (_) {}
  }, [theme]);

  // If this window IS the frame, listen for theme messages from the parent.
  useEffect(() => {
    if (!inFrame) return;
    function onMsg(e) {
      // Only accept from the same origin — prevents arbitrary embedders
      // from flipping our theme via postMessage.
      if (e.origin !== window.location.origin) return;
      if (e?.data?.type === 'bci-theme' && (e.data.theme === 'light' || e.data.theme === 'dark')) {
        document.documentElement.dataset.theme = e.data.theme;
      }
    }
    window.addEventListener('message', onMsg);
    // Request the current theme from parent on mount
    try { window.parent?.postMessage({ type: 'bci-theme-req' }, window.location.origin); } catch (_) {}
    return () => window.removeEventListener('message', onMsg);
  }, [inFrame]);

  // On the parent side, answer theme requests from any mounted iframe.
  useEffect(() => {
    if (inFrame) return;
    function onMsg(e) {
      if (e.origin !== window.location.origin) return;
      if (e?.data?.type === 'bci-theme-req') {
        try { e.source?.postMessage({ type: 'bci-theme', theme }, window.location.origin); } catch (_) {}
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [inFrame, theme]);

  // Push theme to the iframe whenever it changes
  useEffect(() => {
    if (inFrame) return;
    const frames = document.querySelectorAll('iframe');
    frames.forEach((f) => {
      try { f.contentWindow?.postMessage({ type: 'bci-theme', theme }, window.location.origin); } catch (_) {}
    });
  }, [inFrame, theme, view, iframeKey]);

  if (inFrame) {
    return <App />;
  }

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const selectDesktop = () => setView('desktop');
  const selectMobile  = () => setView('mobile');
  const reload        = () => setIframeKey((k) => k + 1);

  const isLight = theme === 'light';

  // Shell chrome uses theme-aware classes so the toggle controls themselves
  // read correctly on both canvases.
  const shellBtn = isLight
    ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'
    : 'bg-black/70 border-white/10 text-slate-300 hover:text-white hover:border-white/25';

  return (
    <div className="min-h-screen">
      {/* Floating shell chrome (top-right): theme toggle + desktop/mobile pill */}
      <div className="fixed top-3 right-3 z-[200] flex items-center gap-2">
        <button
          onClick={toggleTheme}
          aria-pressed={isLight}
          aria-label={`Switch to ${isLight ? 'night' : 'day'} mode`}
          title={`Switch to ${isLight ? 'night' : 'day'} mode`}
          className={`h-9 w-9 flex items-center justify-center border transition ${shellBtn}`}
        >
          {isLight ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {view === 'mobile' && (
          <button
            onClick={reload}
            aria-label="Reload preview"
            className={`h-9 w-9 hidden md:flex items-center justify-center border transition ${shellBtn}`}
          >
            <RefreshCw size={14} />
          </button>
        )}

        <div className={`hidden md:flex items-center border overflow-hidden ${shellBtn}`}>
          <ToggleBtn active={view === 'desktop'} onClick={selectDesktop} icon={Monitor}    label="Desktop" light={isLight} />
          <div className={`w-px self-stretch ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
          <ToggleBtn active={view === 'mobile'}  onClick={selectMobile}  icon={Smartphone} label="Mobile"  light={isLight} />
        </div>
      </div>

      {view === 'desktop' ? (
        <App />
      ) : (
        <PhoneFrame key={iframeKey} isLight={isLight} />
      )}
    </div>
  );
}

function ToggleBtn({ active, onClick, icon: Icon, label, light }) {
  const activeStyles = light
    ? { color: '#005EB8', background: 'rgba(0, 94, 184, 0.08)', boxShadow: 'inset 0 0 0 1px rgba(0,94,184,0.3)' }
    : { color: '#3DA9FC', background: 'rgba(0, 94, 184, 0.12)', boxShadow: 'inset 0 0 0 1px rgba(0,94,184,0.35)' };
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className="flex items-center gap-1.5 px-3 h-9 mono text-[11px] tracking-[0.18em] uppercase transition"
      style={active ? activeStyles : {}}
    >
      <Icon size={13} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

function PhoneFrame({ isLight }) {
  const src = (() => {
    if (typeof window === 'undefined') return '?frame=1';
    const u = new URL(window.location.href);
    u.searchParams.set('frame', '1');
    u.searchParams.delete('view');
    return u.pathname + u.search;
  })();

  const caption = isLight ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start pt-20 pb-10 px-4">
      <div className={`mono text-[10.5px] tracking-[0.3em] uppercase mb-4 flex items-center gap-2 ${caption}`}>
        <span className="h-1.5 w-1.5 bg-gain-500 shadow-glow-green animate-pulse-dot" />
        Mobile Preview · 390 × 844
      </div>

      <div
        className="relative"
        style={{
          width: 420,
          maxWidth: '100%',
          padding: 14,
          background: isLight ? 'linear-gradient(180deg, #E2E8F0, #CBD5E1)' : 'linear-gradient(180deg, #0a0a0a, #000)',
          border: isLight ? '1px solid rgba(15,23,42,0.12)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 48,
          boxShadow: isLight
            ? '0 30px 80px -20px rgba(15,23,42,0.25), inset 0 0 0 2px rgba(255,255,255,0.5)'
            : '0 30px 90px -20px rgba(0,0,0,0.9), inset 0 0 0 2px rgba(255,255,255,0.04)',
        }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 top-[22px] z-10"
          style={{
            width: 110,
            height: 26,
            background: isLight ? '#0F172A' : '#000',
            borderRadius: 18,
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />
        <div
          className="relative overflow-hidden"
          style={{
            width: 392,
            maxWidth: '100%',
            height: 812,
            borderRadius: 36,
            background: isLight ? '#F8FAFC' : '#03060C',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
          }}
        >
          <iframe
            title="BCI Mobile Preview"
            src={src}
            className="w-full h-full block border-0"
          />
        </div>
      </div>

      <div className={`mt-5 mono text-[10px] tracking-[0.22em] uppercase ${caption}`}>
        Interact directly inside the frame · resize toggle above
      </div>
    </div>
  );
}
