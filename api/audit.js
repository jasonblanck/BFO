// GET /api/audit?limit=N  →  recent audit events (newest first).
// Must be authenticated.
//
// Events logged: login.success, login.failed, login.ratelimited,
// login.error, logout, plaid.link, plaid.unlink.

import { requireAuth } from './_auth.js';
import { readAudit } from './_audit.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  const limit = Number(req.query?.limit) || 100;
  try {
    const events = await readAudit({ limit });
    res.status(200).json({ events });
  } catch (e) {
    console.error('audit read failed', e?.message || e);
    res.status(500).json({ error: 'audit_read_failed' });
  }
}
