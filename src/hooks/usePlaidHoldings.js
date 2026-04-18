import { useEffect, useState } from 'react';

// Polls /api/plaid/holdings every 60s. Returns `{ data, status }` where
// status is 'seed' | 'empty_vault' | 'live'. Falls back to the
// portfolio.js seed on 404 / offline / empty vault.
//
// Visibility-gated: paused when the tab is hidden.

const REFRESH_MS = 60_000;

export default function usePlaidHoldings() {
  const [state, setState] = useState({ data: null, status: 'seed' });

  useEffect(() => {
    let alive = true;
    let timerId = null;

    async function tick() {
      try {
        const r = await fetch('/api/plaid/holdings', { cache: 'no-store' });
        if (r.status === 401) {
          // Session expired — stop polling. AppShell's focus-based
          // reconcile will flip the UI back to the login screen the
          // next time the tab is focused. Swallow quietly so we don't
          // flood the console every minute.
          stop();
          return;
        }
        if (!r.ok) return;
        const j = await r.json();
        if (!alive) return;
        setState({ data: j.institutions ?? [], status: j.status ?? 'seed' });
      } catch (_) { /* offline / no backend / stay seed */ }
    }

    function start() {
      if (timerId != null) return;
      tick();
      timerId = setInterval(tick, REFRESH_MS);
    }
    function stop() {
      if (timerId != null) { clearInterval(timerId); timerId = null; }
    }
    function onVis() {
      if (document.visibilityState === 'visible') start();
      else stop();
    }

    if (typeof document === 'undefined' || document.visibilityState === 'visible') {
      start();
    }
    document.addEventListener?.('visibilitychange', onVis);

    return () => {
      alive = false;
      stop();
      document.removeEventListener?.('visibilitychange', onVis);
    };
  }, []);

  return state;
}
