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
import { verifyChallenge } from '../_mfa.js';
import { audit } from '../_audit.js';

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

  let result;
  try {
    result = await verifyChallenge(challenge_id, code);
  } catch (e) {
    console.error('login · verifyChallenge failed', e?.message || e);
    await audit(req, 'mfa.error', { reason: 'verify_threw' });
    res.status(500).json({ error: 'server_error' });
    return;
  }

  if (!result.ok) {
    await audit(req, 'mfa.verify.failed', { reason: result.error });
    // 401 for wrong / expired / too-many — no need to enumerate which
    // to the client beyond the generic reason.
    res.status(401).json({ error: result.error });
    return;
  }

  try {
    const cookie = issueSessionCookie();
    res.setHeader('Set-Cookie', cookie);
    await resetRateLimit(key);
    await audit(req, 'login.success');
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('login · sign failed', e?.message || e);
    await audit(req, 'login.error', { reason: 'sign_failed' });
    res.status(500).json({ error: 'auth_misconfigured' });
  }
}
