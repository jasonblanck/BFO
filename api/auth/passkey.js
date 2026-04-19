// Unified passkey endpoint — consolidates what used to be five
// separate files under api/auth/passkey/. Vercel's Hobby plan caps
// deployments at 12 serverless functions, so each WebAuthn subroute
// now shares one handler dispatched by req.query.action (populated
// from the URL by vercel.json rewrites).
//
// Actions:
//   GET  /api/auth/passkey                    → list credentials (auth)
//   POST /api/auth/passkey           { id }    → delete a credential (auth)
//   POST /api/auth/passkey/register-start      → begin registration (auth)
//   POST /api/auth/passkey/register-finish     → complete registration (auth)
//   POST /api/auth/passkey/login-start         → begin authentication (public)
//   POST /api/auth/passkey/login-finish        → complete authentication (public)
//
// Frontend URLs are unchanged; the rewrite layer maps the trailing
// path segment into ?action=<segment>.

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import {
  rpInfo, newChallengeId, storeChallenge, consumeChallenge,
  listCredentials, saveCredential, getCredentialById, deleteCredential,
} from '../_passkey.js';
import {
  requireAuth, issueSessionCookie, rateLimit, resetRateLimit, clientIp,
} from '../_auth.js';
import { audit } from '../_audit.js';
import { sendMessage, escapeHtml } from '../_telegram.js';

function parseBody(req) {
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  return body || {};
}

async function handleList(req, res) {
  if (!requireAuth(req, res)) return;
  const list = await listCredentials();
  res.status(200).json({
    credentials: list.map((c) => ({
      id: c.id, label: c.label, linked_at: c.linked_at, last_used_at: c.last_used_at,
    })),
  });
}

async function handleDelete(req, res) {
  if (!requireAuth(req, res)) return;
  const { id } = parseBody(req);
  if (typeof id !== 'string' || !id) {
    res.status(400).json({ error: 'missing_id' });
    return;
  }
  await deleteCredential(id);
  await audit(req, 'passkey.revoked', { id });
  res.status(200).json({ ok: true });
}

async function handleRegisterStart(req, res) {
  if (!requireAuth(req, res)) return;
  const { rpID, rpName } = rpInfo(req);
  const existing = await listCredentials();
  const opts = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode('bci-principal'),
    userName: 'principal',
    userDisplayName: 'Principal',
    attestationType: 'none',
    excludeCredentials: existing.map((c) => ({ id: c.id, transports: c.transports || [] })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });
  const challengeId = newChallengeId();
  await storeChallenge(challengeId, opts.challenge, 'register');
  res.status(200).json({ challengeId, options: opts });
}

async function handleRegisterFinish(req, res) {
  if (!requireAuth(req, res)) return;
  const { challengeId, attestation, label } = parseBody(req);
  if (!challengeId || !attestation) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }
  const expectedChallenge = await consumeChallenge(challengeId, 'register');
  if (!expectedChallenge) {
    res.status(401).json({ error: 'challenge_expired' });
    return;
  }
  const { rpID, origin } = rpInfo(req);
  try {
    const verification = await verifyRegistrationResponse({
      response: attestation,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
    if (!verification.verified || !verification.registrationInfo) {
      res.status(400).json({ error: 'verification_failed' });
      return;
    }
    const info = verification.registrationInfo;
    const credId = info.credential?.id ?? info.credentialID;
    const pubKey = info.credential?.publicKey ?? info.credentialPublicKey;
    const counter = info.credential?.counter ?? info.counter ?? 0;
    const cred = {
      id: typeof credId === 'string' ? credId : Buffer.from(credId).toString('base64url'),
      publicKey: Buffer.from(pubKey).toString('base64url'),
      counter,
      transports: attestation?.response?.transports || [],
      label: (typeof label === 'string' && label.trim()) || `Device · ${new Date().toISOString().slice(0, 10)}`,
      linked_at: new Date().toISOString(),
    };
    await saveCredential(cred);
    await audit(req, 'passkey.registered', { label: cred.label });
    res.status(200).json({ ok: true, id: cred.id, label: cred.label });
  } catch (e) {
    console.error('passkey/register-finish', e?.message || e);
    res.status(400).json({ error: 'verification_failed' });
  }
}

async function handleLoginStart(req, res) {
  const { rpID } = rpInfo(req);
  const creds = await listCredentials();
  const opts = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: creds.map((c) => ({ id: c.id, transports: c.transports || [] })),
  });
  const challengeId = newChallengeId();
  await storeChallenge(challengeId, opts.challenge, 'login');
  res.status(200).json({ challengeId, options: opts });
}

async function handleLoginFinish(req, res) {
  const ip = clientIp(req);
  const key = `bci:auth:fail:${ip}`;
  const rl = await rateLimit({ key, limit: 5, windowSec: 15 * 60 });
  if (!rl.allowed) {
    await audit(req, 'login.ratelimited');
    res.status(429).json({ error: 'too_many_attempts' });
    return;
  }

  const { challengeId, assertion } = parseBody(req);
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

export default async function handler(req, res) {
  const action = req.query?.action;

  if (req.method === 'GET' && !action) {
    await handleList(req, res);
    return;
  }
  if (req.method === 'POST' && !action) {
    await handleDelete(req, res);
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  switch (action) {
    case 'register-start':  return handleRegisterStart(req, res);
    case 'register-finish': return handleRegisterFinish(req, res);
    case 'login-start':     return handleLoginStart(req, res);
    case 'login-finish':    return handleLoginFinish(req, res);
    default:
      res.status(404).json({ error: 'unknown_action' });
  }
}
