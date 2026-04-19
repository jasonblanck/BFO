// POST /api/auth/passkey/register-finish
// body: { challengeId, attestation, label? }
//
// Consumes the stored challenge, verifies the attestation matches,
// and persists the new credential. Label defaults to a generic
// "Device · <timestamp>" so the user can tell multiple passkeys
// apart later.

import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { requireAuth } from '../../_auth.js';
import { rpInfo, consumeChallenge, saveCredential } from '../../_passkey.js';
import { audit } from '../../_audit.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const { challengeId, attestation, label } = body || {};
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
    // @simplewebauthn/server v11+ returns bytes under info.credential.
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
