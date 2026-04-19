// POST /api/auth/passkey/register-start
// Authenticated — the owner must already be signed in (by password
// + Telegram / backup code) to add a new passkey. Returns the
// registration options and a challenge id that the browser sends
// back with the attestation.

import { generateRegistrationOptions } from '@simplewebauthn/server';
import { requireAuth } from '../../_auth.js';
import {
  rpInfo, newChallengeId, storeChallenge, listCredentials,
} from '../../_passkey.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
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
