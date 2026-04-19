import React, { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Plug, Loader2, AlertTriangle } from 'lucide-react';

// Wraps react-plaid-link with our backend:
//   1. GET /api/plaid/link-token → returns a fresh link_token
//   2. User completes Plaid Link flow in the popup
//   3. POST /api/plaid/exchange { public_token, metadata } →
//      backend persists access_token in the vault
//   4. Fires `onLinked(institution)` so the parent can refresh its list
//
// If the backend is not deployed (404) the button renders disabled
// with a "pending backend" hint — keeps the UI honest in Phase 1.

export default function PlaidLinkButton({ onLinked, className = '' }) {
  const [linkToken, setLinkToken] = useState(null);
  const [backendReady, setBackendReady] = useState(null); // null | true | false
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Fetch a link token on mount so the button is "ready" to open.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/plaid/link-token', { method: 'POST' });
        if (!alive) return;
        if (r.status === 404) { setBackendReady(false); return; }
        if (r.status === 401) {
          // Session expired between page load and click. Trigger a
          // reload so AppShell's status check flips us back to the
          // login screen — UX beats a cryptic "Link token failed".
          setBackendReady(false);
          setErr('Session expired · reloading');
          setTimeout(() => window.location.reload(), 800);
          return;
        }
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j?.link_token) {
          setBackendReady(!!j?.error && j.error !== 'plaid_not_configured');
          setErr(j?.error === 'plaid_not_configured' ? 'Plaid env not set on server' : 'Link token failed');
          return;
        }
        setLinkToken(j.link_token);
        setBackendReady(true);
      } catch (_) {
        if (!alive) return;
        setBackendReady(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const onSuccess = useCallback(async (public_token, metadata) => {
    setBusy(true);
    setErr('');
    try {
      const r = await fetch('/api/plaid/exchange', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ public_token, metadata }),
      });
      if (r.status === 401) {
        setErr('Session expired · reloading');
        setTimeout(() => window.location.reload(), 800);
        return;
      }
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.ok) {
        const parts = [j?.error || 'unknown'];
        if (j?.stage)  parts.push(`stage:${j.stage}`);
        if (j?.detail) parts.push(j.detail);
        setErr(`Exchange failed · ${parts.join(' · ')}`);
      } else if (onLinked) {
        onLinked({
          institution_id: j.institution_id,
          institution_name: j.institution_name,
        });
      }
    } catch (e) {
      setErr(`Network · ${e?.message || 'failed'}`);
    } finally {
      setBusy(false);
    }
  }, [onLinked]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: (exitErr) => {
      if (exitErr) setErr(`Link closed · ${exitErr.error_message || exitErr.error_code || 'cancelled'}`);
    },
  });

  const disabled = !ready || !linkToken || busy || backendReady === false;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={() => open()}
        disabled={disabled}
        className={`mono text-[11px] tracking-[0.24em] uppercase flex items-center gap-2 px-4 py-2.5 rounded-sm transition ${
          disabled
            ? 'border border-white/10 bg-white/5 text-slate-500 cursor-not-allowed'
            : 'bg-ms-600 text-white hover:bg-ms-500 shadow-glow-blue'
        } ${className}`}
      >
        {busy ? <Loader2 size={12} className="animate-spin" /> : <Plug size={12} />}
        {backendReady === false
          ? 'Connect via Plaid · backend pending'
          : busy
            ? 'Linking…'
            : 'Connect via Plaid'}
      </button>
      {err && (
        <div className="flex items-center gap-1.5 mono text-[10.5px] text-loss-500">
          <AlertTriangle size={10} /> {err}
        </div>
      )}
    </div>
  );
}
