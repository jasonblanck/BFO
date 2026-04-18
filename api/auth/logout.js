// POST /api/auth/logout — clears the session cookie.
// Idempotent · always returns 200.

import { clearSessionCookie } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  res.setHeader('Set-Cookie', clearSessionCookie());
  res.status(200).json({ ok: true });
}
