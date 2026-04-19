import React, { useEffect, useState, lazy, Suspense } from 'react';
import { Monitor, Smartphone, RefreshCw, Sun, Moon, LogOut, Loader2 } from 'lucide-react';
import App from './App';
import Login from './components/Login';
// Route-level code-split: Connected Accounts + All Holdings are
// off-dashboard pages that most visits never open. Defer them until
// the user navigates, keeping the main-bundle parse/execute cost low.
const ConnectedAccounts = lazy(() => import('./components/ConnectedAccounts'));
const AllHoldings       = lazy(() => import('./components/AllHoldings'));

function RouteFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="panel px-5 py-4 flex items-center gap-2 mono text-[11px] text-slate-400">
        <Loader2 size={14} className="animate-spin text-ms-400" /> Loading…
      </div>
    </div>
  );
}

const STORAGE_VIEW  = 'bci-view';
const STORAGE_THEME = 'bci-theme';
const STORAGE_AUTH  = 'bci-auth';

// Hash-based mini-router. Avoids pulling in react-router for a handful
// of routes. '#/accounts' → Connected Accounts · '#/holdings' → All
// Holdings · anything else → main dashboard.
function readRoute() {
  if (typeof window === 'undefined') return 'dashboard';
  const h = window.location.hash;
  if (h === '#/accounts') return 'accounts';
  if (h === '#/holdings') return 'holdings';
  return 'dashboard';
}

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

function getInitialAuth() {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(STORAGE_AUTH) === '1';
  } catch (_) {
    return false;
  }
}

export default function AppShell() {
  const inFrame = isFrame();

  const [view, setView]   = useState(getInitialView);
  const [theme, setTheme] = useState(getInitialTheme);
  const [iframeKey, setIframeKey] = useState(0);
  // Auth gate — session-scoped so closing the tab logs you out. The
  // mobile-preview iframe is same-origin so it reads the same flag.
  const [authed, setAuthed] = useState(getInitialAuth);
  const [route, setRoute]   = useState(readRoute);

  // Listen for hash changes so back/forward + manual edits both work.
  useEffect(() => {
    const onHash = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const goToAccounts  = () => { window.location.hash = '#/accounts'; };
  const goToHoldings  = () => { window.location.hash = '#/holdings'; };
  const goToDashboard = () => { window.location.hash = ''; };

  const login  = () => {
    try { sessionStorage.setItem(STORAGE_AUTH, '1'); } catch (_) {}
    setAuthed(true);
  };
  const logout = async () => {
    // Clear the backend cookie first so Plaid API routes stop accepting
    // the session; then drop the local flag. Swallow errors — even if
    // the network call fails we still want to fall back to the login
    // screen locally.
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (_) { /* noop */ }
    try { sessionStorage.removeItem(STORAGE_AUTH); } catch (_) {}
    setAuthed(false);
  };

  // Reconcile the local auth flag with the server-side session cookie.
  // Runs on mount + every time the tab regains focus — catches the
  // case where a cookie expires / was cleared while the tab was in
  // the background, so the next action doesn't hit a phantom 401.
  // No backend (404) → trust local; network error → trust local.
  useEffect(() => {
    if (inFrame) return;
    let alive = true;
    let busy = false;
    const reconcile = async () => {
      if (busy) return;
      busy = true;
      try {
        const r = await fetch('/api/auth/status', { credentials: 'include' });
        if (!alive) return;
        if (r.status === 404) return;
        if (r.ok) {
          setAuthed(true);
          try { sessionStorage.setItem(STORAGE_AUTH, '1'); } catch (_) {}
        } else {
          setAuthed(false);
          try { sessionStorage.removeItem(STORAGE_AUTH); } catch (_) {}
        }
      } catch (_) {
        // offline — trust local
      } finally {
        busy = false;
      }
    };
    reconcile();
    const onFocus = () => reconcile();
    window.addEventListener('focus', onFocus);
    return () => { alive = false; window.removeEventListener('focus', onFocus); };
  }, [inFrame]);

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

  // Inside the mobile-preview iframe we skip the gate — the parent has
  // already authenticated, and we don't want a double login screen.
  if (inFrame) {
    return <App />;
  }

  if (!authed) {
    return (
      <div className="min-h-screen">
        {/* Theme toggle on the login screen — sized to match the live-bar
            chrome the user gets post-auth for visual continuity. */}
        <div className="fixed top-0 right-0 z-[200] h-[40px] flex items-center pr-2 sm:pr-3">
          <button
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label={`Switch to ${isLightPrelogin(theme) ? 'night' : 'day'} mode`}
            className={`h-7 w-7 flex items-center justify-center border transition ${
              isLightPrelogin(theme)
                ? 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'
                : 'bg-black/70 border-white/10 text-slate-300 hover:text-white hover:border-white/25'
            }`}
          >
            {isLightPrelogin(theme) ? <Moon size={13} /> : <Sun size={13} />}
          </button>
        </div>
        <Login onAuth={login} />
      </div>
    );
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
      {/* Top-right chrome — pinned to the top edge so the buttons align
          with the MacroTicker live bar instead of floating over it. */}
      <div className="fixed top-0 right-0 z-[200] h-[40px] flex items-center gap-1.5 pr-2 sm:pr-3">
        <button
          onClick={toggleTheme}
          aria-pressed={isLight}
          aria-label={`Switch to ${isLight ? 'night' : 'day'} mode`}
          title={`Switch to ${isLight ? 'night' : 'day'} mode`}
          className={`h-7 w-7 flex items-center justify-center border transition ${shellBtn}`}
        >
          {isLight ? <Moon size={13} /> : <Sun size={13} />}
        </button>

        {view === 'mobile' && (
          <button
            onClick={reload}
            aria-label="Reload preview"
            className={`h-7 w-7 hidden md:flex items-center justify-center border transition ${shellBtn}`}
          >
            <RefreshCw size={13} />
          </button>
        )}

        <div className={`hidden md:flex items-center border overflow-hidden ${shellBtn}`}>
          <ToggleBtn active={view === 'desktop'} onClick={selectDesktop} icon={Monitor}    label="Desktop" light={isLight} />
          <div className={`w-px self-stretch ${isLight ? 'bg-slate-200' : 'bg-white/10'}`} />
          <ToggleBtn active={view === 'mobile'}  onClick={selectMobile}  icon={Smartphone} label="Mobile"  light={isLight} />
        </div>

        <button
          onClick={logout}
          aria-label="Log out"
          title="Log out"
          className={`h-7 flex items-center gap-1.5 px-2.5 mono text-[10px] tracking-[0.18em] uppercase border transition ${shellBtn}`}
        >
          <LogOut size={12} />
          <span className="hidden lg:inline">Log out</span>
        </button>
      </div>

      {route === 'accounts' ? (
        <Suspense fallback={<RouteFallback />}>
          <ConnectedAccounts onBack={goToDashboard} />
        </Suspense>
      ) : route === 'holdings' ? (
        <Suspense fallback={<RouteFallback />}>
          <AllHoldings onBack={goToDashboard} />
        </Suspense>
      ) : view === 'desktop' ? (
        <App onOpenAccounts={goToAccounts} onOpenHoldings={goToHoldings} />
      ) : (
        <PhoneFrame key={iframeKey} isLight={isLight} />
      )}
    </div>
  );
}

function isLightPrelogin(theme) {
  return theme === 'light';
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
      className="flex items-center gap-1.5 px-2.5 h-7 mono text-[10px] tracking-[0.18em] uppercase transition"
      style={active ? activeStyles : {}}
    >
      <Icon size={12} />
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
