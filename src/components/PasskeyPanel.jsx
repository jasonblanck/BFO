import React, { useCallback, useEffect, useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import { Fingerprint, Plus, Trash2, Loader2, AlertTriangle, Check } from 'lucide-react';

// Lists registered passkeys + lets the owner register a new one
// (phone FaceID / Windows Hello / YubiKey). Lives in Connected
// Accounts. Delete revokes immediately — the credential is wiped
// from the server so the corresponding authenticator can no longer
// sign in.

export default function PasskeyPanel() {
  const [creds, setCreds] = useState([]);
  const [status, setStatus] = useState('loading');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  const refresh = useCallback(async () => {
    try {
      const r = await fetch('/api/auth/passkey', { cache: 'no-store' });
      if (r.status === 401 || r.status === 404) { setStatus('unavailable'); return; }
      const j = await r.json().catch(() => ({}));
      setCreds(Array.isArray(j?.credentials) ? j.credentials : []);
      setStatus('loaded');
    } catch { setStatus('unavailable'); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const register = async () => {
    setBusy(true); setErr(''); setOk('');
    try {
      const startRes = await fetch('/api/auth/passkey/register-start', { method: 'POST' });
      if (!startRes.ok) throw new Error((await startRes.json().catch(() => ({})))?.error || 'start_failed');
      const { challengeId, options } = await startRes.json();
      const attestation = await startRegistration({ optionsJSON: options });
      const finishRes = await fetch('/api/auth/passkey/register-finish', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ challengeId, attestation }),
      });
      const finish = await finishRes.json().catch(() => ({}));
      if (!finishRes.ok || !finish?.ok) throw new Error(finish?.error || 'register_failed');
      setOk(`Registered · ${finish.label || 'new device'}`);
      await refresh();
    } catch (e) {
      setErr(String(e?.message || e));
    } finally { setBusy(false); }
  };

  const revoke = async (id, label) => {
    if (!confirm(`Revoke passkey "${label}"? The authenticator can no longer be used to sign in.`)) return;
    setBusy(true); setErr(''); setOk('');
    try {
      const r = await fetch('/api/auth/passkey', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!r.ok) throw new Error('revoke_failed');
      setOk('Revoked');
      await refresh();
    } catch (e) {
      setErr(String(e?.message || e));
    } finally { setBusy(false); }
  };

  return (
    <section className="panel mt-4">
      <div className="panel-header">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Fingerprint size={14} className="text-ms-400 shrink-0" />
          <div className="min-w-0">
            <div className="panel-subtitle">Hardware-backed MFA · FaceID / YubiKey</div>
            <div className="panel-title truncate">Passkeys</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === 'unavailable' ? (
            <span className="chip text-slate-500">Backend pending</span>
          ) : (
            <span className="chip chip-ms">{creds.length} registered</span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        {status === 'unavailable' ? (
          <p className="text-[12.5px] text-slate-500">Passkeys require the deployed backend (Vercel). Not available on the GH Pages demo.</p>
        ) : (
          <>
            <p className="text-[12.5px] text-slate-400 leading-relaxed">
              Passkeys replace the Telegram MFA step on devices where one is registered — signing in becomes a single FaceID tap. Phishing-proof and hardware-backed.
            </p>
            <button
              onClick={register}
              disabled={busy}
              className={`mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-1.5 px-3 h-8 rounded-sm transition ${
                busy ? 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed' : 'bg-ms-600 text-white hover:bg-ms-500'
              }`}
            >
              {busy ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
              Register this device
            </button>
            {ok && (
              <div className="flex items-center gap-2 border border-gain-500/30 bg-gain-500/5 px-3 py-2 rounded-sm mono text-[11px] text-gain-500">
                <Check size={12} /> {ok}
              </div>
            )}
            {err && (
              <div className="flex items-start gap-2 border border-loss-500/30 bg-loss-500/5 px-3 py-2 rounded-sm mono text-[11px] text-loss-500">
                <AlertTriangle size={12} className="mt-0.5 shrink-0" /> {err}
              </div>
            )}
            {creds.length > 0 && (
              <div className="divide-y divide-white/5 border border-white/5 rounded-sm">
                {creds.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Fingerprint size={13} className="text-ms-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] text-slate-100 truncate">{c.label}</div>
                      <div className="mono text-[10px] text-slate-500 truncate">
                        linked {c.linked_at ? new Date(c.linked_at).toLocaleDateString() : '—'}
                        {c.last_used_at && <> · last used {new Date(c.last_used_at).toLocaleDateString()}</>}
                      </div>
                    </div>
                    <button
                      onClick={() => revoke(c.id, c.label)}
                      disabled={busy}
                      title="Revoke"
                      className="h-7 w-7 flex items-center justify-center border border-white/10 bg-black/40 text-slate-400 hover:text-loss-500 hover:border-loss-500/40 transition rounded-sm"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
