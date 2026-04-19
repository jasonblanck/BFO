// POST /api/auth/passkey/login-start
// Public — no auth needed (this IS the auth). Returns an
// authentication challenge scoped to any previously-registered
// credential. The browser runs navigator.credentials.get() with
// this and sends the assertion back to /login-finish.

import { generateAuthenticationOptions } from '@simplewebauthn/server';
import {
  rpInfo, newChallengeId, storeChallenge, listCredentials,
} from '../../_passkey.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const { rpID } = rpInfo(req);
  const creds = await listCredentials();
  const opts = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    allowCredentials: creds.map((c) => ({
      id: c.id,
      transports: c.transports || [],
    })),
  });
  const challengeId = newChallengeId();
  await storeChallenge(challengeId, opts.challenge, 'login');
  res.status(200).json({ challengeId, options: opts });
}
