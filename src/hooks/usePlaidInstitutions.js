import { useCallback, useEffect, useState } from 'react';

// Polls /api/plaid/institutions for the list of linked institutions.
// Separate endpoint from /holdings so the UI can render the list fast
// even if Plaid is slow to hydrate balances.
//
// Returns { institutions, status, refresh }. Status:
//   'idle'        — haven't hit the backend yet
//   'loading'     — initial fetch in-flight
//   'empty'       — backend responded, no links (or vault empty)
//   'ok'          — have links
//   'unavailable' — backend not deployed (404, offline, etc)
//   'error'       — backend returned 5xx

const REFRESH_MS = 60_000;

export default function usePlaidInstitutions() {
  const [institutions, setInstitutions] = useState([]);
  const [status, setStatus] = useState('idle');

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/plaid/institutions', { cache: 'no-store' });
      if (r.status === 404) { setStatus('unavailable'); return; }
      if (r.status === 401) { setStatus('unavailable'); return; } // AppShell reconciles on focus
      if (!r.ok) { setStatus('error'); return; }
      const j = await r.json();
      const list = Array.isArray(j?.institutions) ? j.institutions : [];
      setInstitutions(list);
      setStatus(list.length ? 'ok' : 'empty');
    } catch (_) {
      // Network-level failure (offline, backend not deployed) → no
      // overrides; dashboard renders seed data as normal.
      setStatus('unavailable');
    }
  }, []);

  useEffect(() => {
    let alive = true;
    let timer = null;
    setStatus((s) => (s === 'idle' ? 'loading' : s));
    const tick = async () => {
      if (!alive) return;
      await refresh();
    };
    const start = () => {
      tick();
      if (timer == null) timer = setInterval(tick, REFRESH_MS);
    };
    const stop = () => {
      if (timer != null) { clearInterval(timer); timer = null; }
    };
    const onVis = () => {
      if (document.visibilityState === 'visible') start();
      else stop();
    };
    if (typeof document === 'undefined' || document.visibilityState === 'visible') start();
    document.addEventListener?.('visibilitychange', onVis);
    return () => {
      alive = false;
      stop();
      document.removeEventListener?.('visibilitychange', onVis);
    };
  }, [refresh]);

  return { institutions, status, refresh };
}
