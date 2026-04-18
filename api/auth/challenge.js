// POST /api/auth/challenge  { password }
//   → verifies password + human-verification gate
//   → mints a 6-digit code, stores it in Redis keyed by a random challenge_id
//   → sends the code to the owner's Telegram
//   → responds 200 { challenge_id } on success
//
// Rate limited: 5 password attempts per IP per 15 min (same counter as
// the login step used to share). MFA is enforced — if TELEGRAM env
// vars are missing we fail CLOSED rather than fall back to single-
// factor auth.

import { verifyPassword, rateLimit, clientIp } from '../_auth.js';
import { newChallengeId, newCode, storeChallenge } from '../_mfa.js';
import { sendMessage, isConfigured, escapeHtml } from '../_telegram.js';
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

  if (!isConfigured()) {
    // Fail closed. The owner explicitly opted into MFA; silently
    // degrading to password-only would defeat the point.
    audit(req, 'mfa.misconfigured', { reason: 'telegram_env_missing' });
    res.status(500).json({ error: 'mfa_not_configured' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const password = body?.password;

  let ok = false;
  try { ok = await verifyPassword(password); }
  catch (e) {
    console.error('challenge · verifyPassword failed', e?.message || e);
    audit(req, 'login.error', { reason: 'verify_password_threw' });
    res.status(500).json({ error: 'auth_misconfigured' });
    return;
  }

  if (!ok) {
    audit(req, 'login.failed');
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }

  const challenge_id = newChallengeId();
  const code = newCode();

  try {
    await storeChallenge(challenge_id, code);
  } catch (e) {
    console.error('challenge · store failed', e?.message || e);
    audit(req, 'mfa.error', { reason: 'store_failed' });
    res.status(500).json({ error: 'mfa_store_failed' });
    return;
  }

  const ip4ua = `IP: <code>${escapeHtml(ip || 'unknown')}</code>\nBrowser: <code>${escapeHtml((req.headers?.['user-agent'] || 'unknown').slice(0, 200))}</code>`;
  const text = [
    '🔐 <b>Blanck Capital · login request</b>',
    '',
    `Code: <b><code>${code}</code></b>`,
    '',
    ip4ua,
    '',
    '<i>Expires in 5 min · ignore if this wasn\'t you.</i>',
  ].join('\n');

  const send = await sendMessage(text);
  if (!send.ok) {
    audit(req, 'mfa.send_failed', { reason: send.error });
    res.status(502).json({ error: 'mfa_send_failed' });
    return;
  }

  audit(req, 'mfa.challenge.sent');
  res.status(200).json({ ok: true, challenge_id });
}
