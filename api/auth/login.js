// POST /api/auth/login  { challenge_id, code }
//   → second factor · verifies the 6-digit code against the challenge
//   → sets the HttpOnly + Secure + SameSite=Lax session cookie on match
//
// Precondition: /api/auth/challenge was previously called with a valid
// password, which minted the challenge_id and dispatched the code via
// Telegram.
//
// Rate limiting: per-challenge attempt counter is handled inside
// verifyChallenge; this endpoint additionally shares the per-IP
// failure counter with the challenge endpoint so brute forcing
// codes costs the same IP budget as brute forcing passwords.

import { issueSessionCookie, rateLimit, resetRateLimit, clientIp } from '../_auth.js';
import { verifyChallenge, peekChallenge, deleteChallenge } from '../_mfa.js';
import { consume as consumeBackupCode } from '../_backup_codes.js';
import { audit } from '../_audit.js';
import { sendMessage, escapeHtml } from '../_telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const ip  = clientIp(req);
  const key = `bci:auth:fail:${ip}`;
  const rl  = await rateLimit({ key, limit: 5, windowSec: 15 * 60 });
  if (!rl.allowed) {
    await audit(req, 'login.ratelimited');
    res.status(429).json({ error: 'too_many_attempts' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const challenge_id = body?.challenge_id;
  const code         = body?.code;
  if (typeof challenge_id !== 'string' || typeof code !== 'string') {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  // Code length / content heuristic: Telegram MFA codes are exactly 6
  // digits. Anything longer is treated as a backup code. Backup codes
  // are 10 chars base32 (optionally hyphenated to 11).
  const isBackup = code.replace(/[^A-Za-z0-9]/g, '').length === 10;

  let result;
  try {
    if (isBackup) {
      // Backup-code path: the challenge_id still has to be alive so
      // the password proof from the last 5 minutes is required.
      const alive = await peekChallenge(challenge_id);
      if (!alive) {
        await audit(req, 'mfa.verify.failed', { reason: 'expired' });
        res.status(401).json({ error: 'expired' });
        return;
      }
      const ok = await consumeBackupCode(code);
      if (!ok) {
        await audit(req, 'mfa.verify.failed', { reason: 'invalid_backup_code' });
        res.status(401).json({ error: 'invalid_code' });
        return;
      }
      // Success — delete the challenge so it can't be reused.
      await deleteChallenge(challenge_id);
      await audit(req, 'mfa.verify.backup_used');
      result = { ok: true };
    } else {
      result = await verifyChallenge(challenge_id, code);
    }
  } catch (e) {
    console.error('login · verify failed', e?.message || e);
    await audit(req, 'mfa.error', { reason: 'verify_threw' });
    res.status(500).json({ error: 'server_error' });
    return;
  }

  if (!result.ok) {
    await audit(req, 'mfa.verify.failed', { reason: result.error });
    res.status(401).json({ error: result.error });
    return;
  }

  try {
    const cookie = issueSessionCookie();
    res.setHeader('Set-Cookie', cookie);
    await resetRateLimit(key);
    await audit(req, 'login.success');
    res.status(200).json({ ok: true });

    // Fire-and-forget post-success notification. Distinct from the
    // MFA challenge message (which says "here's your code") — this
    // says "someone completed 2FA and is now in". If you see one you
    // didn't initiate, someone has both your password AND your
    // Telegram. Rotate immediately.
    const ua = req.headers?.['user-agent'] || 'unknown';
    const text = [
      '✅ <b>Blanck Capital · sign-in successful</b>',
      '',
      `IP: <code>${escapeHtml(ip || 'unknown')}</code>`,
      `Browser: <code>${escapeHtml(ua.slice(0, 200))}</code>`,
      '',
      '<i>If this wasn\'t you, rotate your password + AUTH_SECRET immediately.</i>',
    ].join('\n');
    sendMessage(text).catch(() => { /* never block a successful login */ });
  } catch (e) {
    console.error('login · sign failed', e?.message || e);
    await audit(req, 'login.error', { reason: 'sign_failed' });
    res.status(500).json({ error: 'auth_misconfigured' });
  }
}
