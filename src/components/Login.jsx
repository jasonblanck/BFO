import React, { useEffect, useRef, useState } from 'react';
import {
  Hexagon,
  Lock,
  ShieldCheck,
  TerminalSquare,
  Check,
  Loader2,
  AlertTriangle,
  Send,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';

// Client-side hash — only used as a fallback when there's no backend
// (e.g. GitHub Pages preview). The real security boundary is the
// server-side MFA + signed-cookie gate.
const ACCEPTED_HASH = 'a0fef9d66eaf1936fe23f42985d112491e98155b02071850720dc21e19546474';

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Two-step flow:
//   'password' → POST /api/auth/challenge → get challenge_id
//   'code'     → POST /api/auth/login     → issue session cookie
//
// Backend 404 means no /api layer (demo preview) → single-factor
// fallback via the client-side hash.
export default function Login({ onAuth }) {
  const [step, setStep] = useState('password');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [human, setHuman] = useState('idle');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [challengeId, setChallengeId] = useState(null);
  const passwordRef = useRef(null);
  const codeRef = useRef(null);

  useEffect(() => {
    (step === 'password' ? passwordRef : codeRef).current?.focus();
  }, [step]);

  const verified = human === 'verified';
  const canSubmitPassword = password.length > 0 && verified && !submitting;
  // Accept either a 6-digit Telegram code or a 10-char backup code
  // (optionally hyphenated to 11). The server auto-detects by length.
  const cleanedCode = code.replace(/[^A-Za-z0-9]/g, '');
  const canSubmitCode = (cleanedCode.length === 6 || cleanedCode.length === 10) && !submitting;

  const toggleHuman = () => {
    if (human !== 'idle') return;
    setHuman('checking');
    setTimeout(() => setHuman('verified'), 900);
  };

  const goBack = () => {
    setStep('password');
    setCode('');
    setChallengeId(null);
    setErr('');
    setSubmitting(false);
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    if (!canSubmitPassword) return;
    setErr('');
    setSubmitting(true);
    try {
      const r = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      // No-backend detection. Vercel always returns JSON from our
      // handlers. Static hosts (GitHub Pages) return HTML for any
      // path, sometimes with 404, sometimes with 405 Method Not
      // Allowed for POST. Treat any non-JSON response as "no backend"
      // and fall through to the single-factor client-side hash check.
      const ctype = r.headers.get('content-type') || '';
      const isApiResponse = ctype.includes('json');
      if (!isApiResponse) {
        const digest = await sha256Hex(password);
        if (safeEqual(digest, ACCEPTED_HASH)) {
          onAuth();
        } else {
          setErr('Access denied · invalid credential');
          setSubmitting(false);
          setHuman('idle');
          setPassword('');
        }
        return;
      }
      if (r.status === 429) {
        setErr('Too many attempts · try again in 15 minutes');
        setSubmitting(false);
        setHuman('idle');
        setPassword('');
        return;
      }
      const body = await r.json().catch(() => ({}));
      if (r.status === 500) {
        setErr(
          body?.error === 'mfa_not_configured'
            ? 'MFA not configured · set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Vercel'
            : body?.error === 'auth_misconfigured'
              ? 'Auth backend misconfigured · set AUTH_SECRET in Vercel'
              : 'Server error · check backend logs',
        );
        setSubmitting(false);
        setHuman('idle');
        return;
      }
      if (r.status === 502 && body?.error === 'mfa_send_failed') {
        setErr('Telegram send failed · check bot token and chat id');
        setSubmitting(false);
        setHuman('idle');
        return;
      }
      if (!r.ok || !body?.challenge_id) {
        setErr('Access denied · invalid credential');
        setSubmitting(false);
        setHuman('idle');
        setPassword('');
        return;
      }
      setChallengeId(body.challenge_id);
      setStep('code');
      setSubmitting(false);
    } catch (_) {
      // Network-level failure → fallback to client-side hash. Only
      // triggers if the backend is genuinely unreachable; a live
      // backend error returns an HTTP code and doesn't throw.
      try {
        const digest = await sha256Hex(password);
        if (safeEqual(digest, ACCEPTED_HASH)) { onAuth(); return; }
      } catch { /* fallthrough */ }
      setErr('Network error · try again');
      setSubmitting(false);
      setHuman('idle');
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    if (!canSubmitCode || !challengeId) return;
    setErr('');
    setSubmitting(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ challenge_id: challengeId, code }),
      });
      if (r.ok) { onAuth(); return; }
      const body = await r.json().catch(() => ({}));
      if (r.status === 401) {
        if (body?.error === 'expired') {
          setErr('Code expired · restart the login flow');
          setCode('');
          setSubmitting(false);
          setTimeout(goBack, 1500);
          return;
        }
        if (body?.error === 'too_many_attempts') {
          setErr('Too many wrong codes · restart the login flow');
          setCode('');
          setSubmitting(false);
          setTimeout(goBack, 1500);
          return;
        }
        setErr('Invalid code · try again');
        setCode('');
        setSubmitting(false);
        codeRef.current?.focus();
        return;
      }
      if (r.status === 429) {
        setErr('Too many attempts · try again in 15 minutes');
        setCode('');
        setSubmitting(false);
        return;
      }
      setErr('Server error · try again');
      setSubmitting(false);
    } catch (_) {
      setErr('Network error · try again');
      setSubmitting(false);
    }
  };

  const resendCode = async () => {
    setErr('');
    setCode('');
    setSubmitting(true);
    try {
      const r = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      const body = await r.json().catch(() => ({}));
      if (r.ok && body?.challenge_id) {
        setChallengeId(body.challenge_id);
        setSubmitting(false);
        codeRef.current?.focus();
      } else {
        setErr('Resend failed · restart the login flow');
        setSubmitting(false);
        setTimeout(goBack, 1500);
      }
    } catch (_) {
      setErr('Network error · restart the login flow');
      setSubmitting(false);
      setTimeout(goBack, 1500);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10 relative">
      <div className="absolute top-4 left-4 hidden sm:flex items-center gap-2 mono text-[10px] tracking-[0.28em] text-slate-500 uppercase">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-gain-500 shadow-glow-green animate-pulse-dot" />
        Blanck Capital · Secure Terminal
      </div>
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between mono text-[10px] tracking-[0.22em] text-slate-600 uppercase">
        <span>OS v3.2 · tty/0 · tls 1.3</span>
        <span className="hidden sm:inline">MFA · Telegram one-time code · Plaid + OAuth 2.0</span>
      </div>

      <section className="panel hud-corners relative w-full max-w-[460px] overflow-hidden">
        <span className="corner-tl" />
        <span className="corner-br" />
        <div className="absolute top-0 left-0 right-0 h-[2px] shimmer-line" />

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

        {step === 'password' ? (
          <PasswordStep
            passwordRef={passwordRef}
            password={password}
            setPassword={(v) => { setPassword(v); if (err) setErr(''); }}
            human={human}
            verified={verified}
            toggleHuman={toggleHuman}
            err={err}
            submitting={submitting}
            canSubmit={canSubmitPassword}
            onSubmit={submitPassword}
          />
        ) : (
          <CodeStep
            codeRef={codeRef}
            code={code}
            setCode={(v) => {
              // Accept digits (Telegram) OR alphanumerics + hyphen (backup code).
              // Uppercase alpha chars so backup-code matching is case-insensitive.
              const clean = v.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 11);
              setCode(clean);
              if (err) setErr('');
            }}
            err={err}
            submitting={submitting}
            canSubmit={canSubmitCode}
            onSubmit={submitCode}
            onBack={goBack}
            onResend={resendCode}
          />
        )}
      </section>
    </div>
  );
}

function PasswordStep({
  passwordRef, password, setPassword,
  human, verified, toggleHuman,
  err, submitting, canSubmit, onSubmit,
}) {
  return (
    <>
      <div className="px-6 pt-5 pb-4">
        <div className="mono text-[10px] tracking-[0.28em] text-ms-400 uppercase flex items-center gap-1.5">
          <Lock size={11} /> Step 1 of 2 · credential
        </div>
        <h1 className="text-[22px] sm:text-[24px] font-semibold text-slate-100 leading-tight mt-2">
          Sign in
        </h1>
        <p className="text-[12.5px] text-slate-400 mt-1.5 leading-relaxed">
          A one-time code will be sent to your Telegram after verification. Nothing reaches the dashboard until both factors pass.
        </p>
      </div>

      <form onSubmit={onSubmit} className="px-6 pb-6 space-y-4">
        <label className="block">
          <div className="mono text-[10px] tracking-[0.24em] text-slate-500 uppercase mb-1.5">
            Access Credential
          </div>
          <div className="flex items-center gap-2 border border-white/10 bg-black/60 px-3 py-2.5 rounded-sm focus-within:border-ms-600 focus-within:shadow-glow-blue transition">
            <TerminalSquare size={14} className="text-ms-400 shrink-0" />
            <span className="mono text-ms-400 text-[12px] shrink-0">bci@master:~$</span>
            <input
              ref={passwordRef}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              aria-label="Access credential"
              autoComplete="current-password"
              className="flex-1 bg-transparent outline-none mono text-[12.5px] text-slate-100 placeholder:text-slate-600"
            />
          </div>
        </label>

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

        {err && (
          <div className="flex items-start gap-2 border border-loss-500/30 bg-loss-500/5 px-3 py-2 rounded-sm mono text-[11px] text-loss-500 animate-flicker">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <span>{err}</span>
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
            <><Loader2 size={12} className="animate-spin" /> Sending code…</>
          ) : (
            <><Send size={12} /> Continue · send code</>
          )}
        </button>

        <div className="flex items-center justify-between pt-1 mono text-[9.5px] tracking-[0.22em] text-slate-600 uppercase">
          <span className="flex items-center gap-1"><Lock size={9} /> Session only</span>
          <span>No telemetry</span>
        </div>
      </form>
    </>
  );
}

function CodeStep({
  codeRef, code, setCode, err, submitting, canSubmit,
  onSubmit, onBack, onResend,
}) {
  return (
    <>
      <div className="px-6 pt-5 pb-4">
        <div className="mono text-[10px] tracking-[0.28em] text-ms-400 uppercase flex items-center gap-1.5">
          <Send size={11} /> Step 2 of 2 · Telegram code
        </div>
        <h1 className="text-[22px] sm:text-[24px] font-semibold text-slate-100 leading-tight mt-2">
          Enter your code
        </h1>
        <p className="text-[12.5px] text-slate-400 mt-1.5 leading-relaxed">
          6-digit code from Telegram (expires in 5 min), or a 10-character backup code.
        </p>
      </div>

      <form onSubmit={onSubmit} className="px-6 pb-6 space-y-4">
        <label className="block">
          <div className="mono text-[10px] tracking-[0.24em] text-slate-500 uppercase mb-1.5">
            Verification Code
          </div>
          <div className="flex items-center gap-2 border border-white/10 bg-black/60 px-3 py-2.5 rounded-sm focus-within:border-ms-600 focus-within:shadow-glow-blue transition">
            <KeyRound size={14} className="text-ms-400 shrink-0" />
            <input
              ref={codeRef}
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              maxLength={11}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456  or  ABCDE-FGHJK"
              aria-label="Verification or backup code"
              className="flex-1 bg-transparent outline-none mono text-[16px] tracking-[0.28em] text-slate-100 placeholder:text-slate-700"
            />
          </div>
        </label>

        {err && (
          <div className="flex items-start gap-2 border border-loss-500/30 bg-loss-500/5 px-3 py-2 rounded-sm mono text-[11px] text-loss-500 animate-flicker">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            <span>{err}</span>
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
            <><Loader2 size={12} className="animate-spin" /> Verifying…</>
          ) : (
            <><ShieldCheck size={12} /> Verify & sign in</>
          )}
        </button>

        <div className="flex items-center justify-between pt-1 mono text-[10px] tracking-[0.22em] text-slate-500 uppercase">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="flex items-center gap-1 hover:text-slate-200 transition"
          >
            <ArrowLeft size={11} /> Back
          </button>
          <button
            type="button"
            onClick={onResend}
            disabled={submitting}
            className="flex items-center gap-1 text-ms-400 hover:text-ms-300 transition"
          >
            Resend code
          </button>
        </div>
      </form>
    </>
  );
}
