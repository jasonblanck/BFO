// POST /api/auth/login  { password } → sets HttpOnly session cookie on success.
//
// Rate limited to 5 attempts per IP per 15 minutes to blunt brute force.
// On success, we clear the rate-limit counter so a legit owner who
// fat-fingers once doesn't get locked out after subsequent correct tries.

import { verifyPassword, issueSessionCookie, rateLimit, resetRateLimit, clientIp } from '../_auth.js';
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
    audit(req, 'login.ratelimited');
    res.status(429).json({ error: 'too_many_attempts' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const password = body?.password;

  let ok = false;
  try {
    ok = await verifyPassword(password);
  } catch (e) {
    // AUTH_SECRET missing on the server — surface a specific error so
    // the deploy-check is obvious in the dashboard Network tab.
    console.error('auth/login · misconfig', e?.message || e);
    res.status(500).json({ error: 'auth_misconfigured' });
    return;
  }

  if (!ok) {
    audit(req, 'login.failed');
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }

  try {
    const cookie = issueSessionCookie();
    res.setHeader('Set-Cookie', cookie);
    await resetRateLimit(key);
    audit(req, 'login.success');
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('auth/login · sign failed', e?.message || e);
    audit(req, 'login.error', { reason: 'sign_failed' });
    res.status(500).json({ error: 'auth_misconfigured' });
  }
}
