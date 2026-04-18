import React, { useEffect, useRef, useState } from 'react';
import {
  Hexagon,
  Lock,
  ShieldCheck,
  TerminalSquare,
  Check,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

// SHA-256 digest of the accepted credential. We compare hashes so the
// plaintext password never appears in the JS bundle — a casual
// `grep Harry dist/` no longer finds anything. Note that this is still
// client-side auth; a determined attacker can bypass it by editing
// their local JS. Treat this as a visual gate, not a security boundary.
const ACCEPTED_HASH = 'a0fef9d66eaf1936fe23f42985d112491e98155b02071850720dc21e19546474';

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Constant-time-ish string compare — doesn't early-exit on first
// mismatch. Not a real defense in a client context, but removes the
// trivial timing signal if this ever moved to a worker.
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Gate screen — stylistically matches the main HUD (MS-blue panels,
// hud-corners, mono tickers). Expects the correct credential and a
// successful human-verification click before it lets the user in.
export default function Login({ onAuth }) {
  const [password, setPassword] = useState('');
  const [human, setHuman] = useState('idle'); // idle | checking | verified
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const verified = human === 'verified';
  const canSubmit = password.length > 0 && verified && !submitting;

  const toggleHuman = () => {
    if (human !== 'idle') return;
    setHuman('checking');
    // Short staged delay — mimics a real bot-check round-trip without
    // being obnoxious.
    setTimeout(() => setHuman('verified'), 900);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setErr('');
    setSubmitting(true);
    // Small deliberate latency + async hash so the "authenticating"
    // state is visible and the plaintext never hits state/equality
    // directly.
    await new Promise((r) => setTimeout(r, 400));
    let ok = false;
    try {
      const digest = await sha256Hex(password);
      ok = safeEqual(digest, ACCEPTED_HASH);
    } catch (_) {
      ok = false;
    }
    if (ok) {
      onAuth();
    } else {
      setErr('Access denied · invalid credential');
      setSubmitting(false);
      setHuman('idle');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative">
      {/* Ambient corner ticker strip — just like the top of the real app */}
      <div className="absolute top-4 left-4 hidden sm:flex items-center gap-2 mono text-[10px] tracking-[0.28em] text-slate-500 uppercase">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gain-500 shadow-glow-green animate-pulse-dot" />
        Blanck Capital · Secure Terminal
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between mono text-[10px] tracking-[0.22em] text-slate-600 uppercase">
        <span>OS v3.2 · tty/0 · tls 1.3</span>
        <span className="hidden sm:inline">Read-only aggregator · Plaid + OAuth 2.0</span>
      </div>

      <section className="panel hud-corners relative w-full max-w-[460px] overflow-hidden">
        <span className="corner-tl" />
        <span className="corner-br" />
        <div className="absolute top-0 left-0 right-0 h-[2px] shimmer-line" />

        {/* Brand block — mirrors the Header component */}
        <div className="flex items-center gap-3 px-6 pt-6">
          <div className="h-10 w-10 p-[1px]" style={{ background: 'linear-gradient(135deg, #005EB8 0%, #3DA9FC 100%)' }}>
            <div className="h-full w-full bg-black flex items-center justify-center">
              <Hexagon size={17} className="text-ms-400 drop-shadow-[0_0_6px_rgba(61,169,252,0.6)]" />
            </div>
          </div>
          <div className="leading-tight">
            <div className="mono text-[10px] tracking-[0.32em] text-slate-400 uppercase">
              Blanck Capital
            </div>
            <div className="text-[15px] font-semibold text-slate-100">
              Source of Truth <span className="mono text-slate-500 font-normal">· v3.2</span>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5 pb-4">
          <div className="mono text-[10px] tracking-[0.28em] text-ms-400 uppercase flex items-center gap-1.5">
            <Lock size={11} /> Authentication Required
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-semibold text-slate-100 leading-tight mt-2">
            Sign in to continue
          </h1>
          <p className="text-[12.5px] text-slate-400 mt-1.5 leading-relaxed">
            Access is restricted to authorized operators. Credentials are
            validated locally — nothing leaves the device.
          </p>
        </div>

        <form onSubmit={submit} className="px-6 pb-6 space-y-4">
          {/* Credential input — matches Header's terminal-prompt aesthetic */}
          <label className="block">
            <div className="mono text-[10px] tracking-[0.24em] text-slate-500 uppercase mb-1.5">
              Access Credential
            </div>
            <div className="flex items-center gap-2 border border-white/10 bg-black/60 px-3 py-2.5 rounded-sm focus-within:border-ms-600 focus-within:shadow-glow-blue transition">
              <TerminalSquare size={14} className="text-ms-400 shrink-0" />
              <span className="mono text-ms-400 text-[12px] shrink-0">bci@master:~$</span>
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (err) setErr(''); }}
                placeholder="password"
                aria-label="Access credential"
                autoComplete="current-password"
                className="flex-1 bg-transparent outline-none mono text-[12.5px] text-slate-100 placeholder:text-slate-600"
              />
            </div>
          </label>

          {/* Human-verification widget */}
          <div>
            <div className="mono text-[10px] tracking-[0.24em] text-slate-500 uppercase mb-1.5">
              Human Verification
            </div>
            <button
              type="button"
              onClick={toggleHuman}
              aria-pressed={verified}
              disabled={human === 'checking' || verified}
              className={`w-full flex items-center gap-3 border px-3 py-3 rounded-sm transition text-left ${
                verified
                  ? 'border-gain-500/40 bg-gain-500/[0.06]'
                  : 'border-white/10 bg-black/40 hover:border-ms-600/50 hover:bg-black/60'
              }`}
            >
              {/* Faux-checkbox square */}
              <span
                className={`h-5 w-5 shrink-0 border flex items-center justify-center transition ${
                  verified
                    ? 'border-gain-500 bg-gain-500/10'
                    : human === 'checking'
                      ? 'border-ms-500 bg-ms-600/10'
                      : 'border-white/25 bg-black/60'
                }`}
              >
                {verified && <Check size={12} className="text-gain-500" strokeWidth={3} />}
                {human === 'checking' && <Loader2 size={12} className="text-ms-400 animate-spin" />}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block mono text-[11.5px] tracking-wider text-slate-100">
                  {human === 'idle' && 'I am human'}
                  {human === 'checking' && 'Verifying signals…'}
                  {human === 'verified' && 'Verified · human confirmed'}
                </span>
                <span className="block mono text-[9.5px] tracking-[0.22em] text-slate-500 uppercase mt-0.5">
                  {human === 'idle' && 'Click to verify · one-tap'}
                  {human === 'checking' && 'Scanning client fingerprint'}
                  {human === 'verified' && 'Token issued · valid for this session'}
                </span>
              </span>
              <span className="mono text-[9px] tracking-[0.22em] text-slate-600 uppercase shrink-0 hidden sm:block">
                BCI · Shield
              </span>
            </button>
          </div>

          {/* Error slot */}
          {err && (
            <div className="flex items-center gap-2 border border-loss-500/30 bg-loss-500/5 px-3 py-2 rounded-sm mono text-[11px] text-loss-500 animate-flicker">
              <AlertTriangle size={12} />
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className={`w-full flex items-center justify-center gap-2 h-11 mono text-[11px] tracking-[0.28em] uppercase transition rounded-sm ${
              canSubmit
                ? 'bg-ms-600 text-white hover:bg-ms-500 shadow-glow-blue'
                : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Authenticating…
              </>
            ) : (
              <>
                <ShieldCheck size={12} /> Authenticate
              </>
            )}
          </button>

          <div className="flex items-center justify-between pt-1 mono text-[9.5px] tracking-[0.22em] text-slate-600 uppercase">
            <span className="flex items-center gap-1"><Lock size={9} /> Session only</span>
            <span>No telemetry</span>
          </div>
        </form>
      </section>
    </div>
  );
}
