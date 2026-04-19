// POST /api/auth/passkey/login-finish
// body: { challengeId, assertion }
//
// Verifies the assertion, bumps the credential's signature counter
// (replay defense — counter must strictly increase), and issues the
// normal session cookie. This path bypasses Telegram MFA entirely
// because passkeys ARE the second factor (hardware-backed, phishing-
// proof, user-verified at the device).

import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { rpInfo, consumeChallenge, getCredentialById, saveCredential } from '../../_passkey.js';
import { issueSessionCookie, rateLimit, resetRateLimit, clientIp } from '../../_auth.js';
import { audit } from '../../_audit.js';
import { sendMessage, escapeHtml } from '../../_telegram.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const ip = clientIp(req);
  const key = `bci:auth:fail:${ip}`;
  const rl = await rateLimit({ key, limit: 5, windowSec: 15 * 60 });
  if (!rl.allowed) {
    await audit(req, 'login.ratelimited');
    res.status(429).json({ error: 'too_many_attempts' });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { challengeId, assertion } = body || {};
  if (!challengeId || !assertion) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }
  const expectedChallenge = await consumeChallenge(challengeId, 'login');
  if (!expectedChallenge) {
    res.status(401).json({ error: 'challenge_expired' });
    return;
  }
  const credId = assertion?.id;
  const cred = credId ? await getCredentialById(credId) : null;
  if (!cred) {
    await audit(req, 'passkey.login.failed', { reason: 'unknown_credential' });
    res.status(401).json({ error: 'unknown_credential' });
    return;
  }
  const { rpID, origin } = rpInfo(req);
  try {
    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.id,
        publicKey: Buffer.from(cred.publicKey, 'base64url'),
        counter: cred.counter || 0,
        transports: cred.transports || [],
      },
    });
    if (!verification.verified) {
      await audit(req, 'passkey.login.failed', { reason: 'sig_verify_failed' });
      res.status(401).json({ error: 'verification_failed' });
      return;
    }
    // Counter strict-increase defense — a cloned authenticator would
    // replay an older counter.
    const newCounter = verification.authenticationInfo?.newCounter ?? cred.counter;
    if (newCounter <= cred.counter && cred.counter > 0) {
      await audit(req, 'passkey.login.failed', { reason: 'counter_regression' });
      res.status(401).json({ error: 'counter_regression' });
      return;
    }
    cred.counter = newCounter;
    cred.last_used_at = new Date().toISOString();
    await saveCredential(cred);

    res.setHeader('Set-Cookie', issueSessionCookie());
    await resetRateLimit(key);
    await audit(req, 'login.success', { via: 'passkey', label: cred.label });
    res.status(200).json({ ok: true });

    // Fire-and-forget Telegram notification matching the password
    // path — every successful sign-in reaches the owner.
    const ua = req.headers?.['user-agent'] || 'unknown';
    sendMessage([
      '✅ <b>Blanck Capital · passkey sign-in</b>',
      '',
      `Passkey: <code>${escapeHtml(cred.label)}</code>`,
      `IP: <code>${escapeHtml(ip)}</code>`,
      `Browser: <code>${escapeHtml(ua.slice(0, 200))}</code>`,
      '',
      '<i>If this wasn\'t you, revoke the passkey in Connected Accounts.</i>',
    ].join('\n')).catch(() => {});
  } catch (e) {
    console.error('passkey/login-finish', e?.message || e);
    await audit(req, 'passkey.login.failed', { reason: 'verify_threw' });
    res.status(401).json({ error: 'verification_failed' });
  }
}
