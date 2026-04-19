// Unified session/admin endpoint — consolidates what used to be three
// separate functions (auth/status, auth/logout, audit). Vercel Hobby
// caps deployments at 12 serverless functions, so these session-
// adjacent reads/writes now share one handler dispatched by
// req.query.action (populated from the URL by vercel.json rewrites).
//
// Actions:
//   GET  /api/auth/status              → session status (auth)
//   POST /api/auth/logout              → clear session cookie
//   GET  /api/audit?limit=N            → recent audit events (auth)

import { requireAuth, clearSessionCookie } from '../_auth.js';
import { audit, readAudit } from '../_audit.js';

async function handleStatus(req, res) {
  const payload = requireAuth(req, res);
  if (!payload) return;
  res.status(200).json({ ok: true, exp: payload.exp });
}

async function handleLogout(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  res.setHeader('Set-Cookie', clearSessionCookie());
  await audit(req, 'logout');
  res.status(200).json({ ok: true });
}

async function handleAudit(req, res) {
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

export default async function handler(req, res) {
  const action = req.query?.action;

  switch (action) {
    case 'status': return handleStatus(req, res);
    case 'logout': return handleLogout(req, res);
    case 'audit':  return handleAudit(req, res);
    default:
      res.status(404).json({ error: 'unknown_action' });
  }
}
