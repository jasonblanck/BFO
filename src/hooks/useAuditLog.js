import { useCallback, useEffect, useState } from 'react';

// Pulls recent audit events from /api/audit. Visibility-gated —
// pauses when the tab is hidden and kicks off a fresh fetch on
// visibility change so you always see current state when you come
// back to the page.
//
// Fails open ({events: []}) if the backend is offline / 404 so the
// Connected Accounts page still renders without an error.

const REFRESH_MS = 30_000;

export default function useAuditLog({ limit = 50 } = {}) {
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('idle');

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`/api/audit?limit=${limit}`, { cache: 'no-store' });
      if (r.status === 404) { setStatus('unavailable'); return; }
      if (r.status === 401) { setStatus('unavailable'); return; }
      if (!r.ok) { setStatus('error'); return; }
      const j = await r.json();
      setEvents(Array.isArray(j?.events) ? j.events : []);
      setStatus('ok');
    } catch (_) {
      setStatus('unavailable');
    }
  }, [limit]);

  useEffect(() => {
    let alive = true;
    let timer = null;
    const tick = async () => { if (alive) await refresh(); };
    const start = () => { tick(); if (timer == null) timer = setInterval(tick, REFRESH_MS); };
    const stop  = () => { if (timer != null) { clearInterval(timer); timer = null; } };
    const onVis = () => document.visibilityState === 'visible' ? start() : stop();
    if (typeof document === 'undefined' || document.visibilityState === 'visible') start();
    document.addEventListener?.('visibilitychange', onVis);
    return () => {
      alive = false;
      stop();
      document.removeEventListener?.('visibilitychange', onVis);
    };
  }, [refresh]);

  return { events, status, refresh };
}
