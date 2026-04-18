// GET /api/auth/status — 200 if the session cookie is valid, 401 otherwise.
// Used by the SPA on mount to decide whether to render the dashboard
// or the login screen without flashing protected UI.

import { requireAuth } from '../_auth.js';

export default async function handler(req, res) {
  const payload = requireAuth(req, res);
  if (!payload) return; // requireAuth already wrote 401
  res.status(200).json({ ok: true, exp: payload.exp });
}
