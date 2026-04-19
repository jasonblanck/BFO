import React, { useEffect, useState } from 'react';
import { Shield, RefreshCw, Copy, Check, AlertTriangle, KeyRound, Loader2 } from 'lucide-react';

// Tiny panel that lets the signed-in owner regenerate MFA backup
// codes and copy them once to safe storage. Lives inside the
// Connected Accounts page.

export default function BackupCodesPanel() {
  const [remaining, setRemaining] = useState(null);
  const [codes, setCodes] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | unavailable | loaded

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch('/api/auth/backup-codes', { cache: 'no-store' });
        if (!alive) return;
        if (r.status === 404 || r.status === 401) { setStatus('unavailable'); return; }
        const j = await r.json().catch(() => ({}));
        if (r.ok) { setRemaining(Number(j?.remaining) || 0); setStatus('loaded'); }
      } catch (_) { if (alive) setStatus('unavailable'); }
    })();
    return () => { alive = false; };
  }, []);

  const regenerate = async () => {
    if (!confirm('Regenerate backup codes? Any unused codes from the previous set will stop working immediately.')) return;
    setBusy(true); setErr(''); setCopied(false);
    try {
      const r = await fetch('/api/auth/backup-codes', { method: 'POST' });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !Array.isArray(j?.codes)) {
        setErr(j?.error || 'Regenerate failed');
      } else {
        setCodes(j.codes);
        setRemaining(j.codes.length);
      }
    } catch (_) {
      setErr('Network error · try again');
    } finally { setBusy(false); }
  };

  const copyAll = async () => {
    if (!codes) return;
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  return (
    <section className="panel mt-4">
      <div className="panel-header">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Shield size={14} className="text-ms-400 shrink-0" />
          <div className="min-w-0">
            <div className="panel-subtitle">MFA recovery · single-use codes</div>
            <div className="panel-title truncate">Backup Codes</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'unavailable' ? (
            <span className="chip text-slate-500">Backend pending</span>
          ) : (
            <span className="chip chip-ms">{remaining ?? '—'} remaining</span>
          )}
        </div>
      </div>
      <div className="px-5 py-4 space-y-3">
        {status === 'unavailable' ? (
          <p className="text-[12.5px] text-slate-500">
            Backup codes require the deployed backend (Vercel). They aren't available on the GH Pages demo.
          </p>
        ) : (
          <>
            <p className="text-[12.5px] text-slate-400 leading-relaxed">
              If Telegram is unreachable (lost phone, no signal, bot revoked), these codes let you sign in. Each code works exactly once. Store them somewhere safe — 1Password / printed + locked drawer / etc.
            </p>
            <button
              onClick={regenerate}
              disabled={busy}
              className={`mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-1.5 px-3 h-8 rounded-sm transition ${
                busy ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed' : 'bg-ms-600 text-white hover:bg-ms-500'
              }`}
            >
              {busy ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              {remaining ? 'Regenerate codes' : 'Generate codes'}
            </button>
            {err && (
              <div className="flex items-start gap-2 border border-loss-500/30 bg-loss-500/5 px-3 py-2 rounded-sm mono text-[11px] text-loss-500">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {err}
              </div>
            )}
            {codes && (
              <div className="border border-ms-600/40 bg-ms-600/[0.05] rounded-sm p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="mono text-[10px] tracking-[0.22em] text-ms-400 uppercase flex items-center gap-1.5">
                    <KeyRound size={11} /> New codes · shown once
                  </div>
                  <button
                    onClick={copyAll}
                    className="mono text-[10px] tracking-wider text-ms-400 hover:text-ms-300 flex items-center gap-1"
                  >
                    {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy all</>}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {codes.map((c) => (
                    <div key={c} className="mono text-[12.5px] text-slate-100 tracking-wider">{c}</div>
                  ))}
                </div>
                <div className="mt-2 text-[10.5px] text-slate-500">
                  Leaving this page or regenerating will hide these permanently. The server only retains hashes — we can't show them again.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
