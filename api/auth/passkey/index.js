// GET  /api/auth/passkey        → list registered credentials (redacted)
// POST /api/auth/passkey/delete → { id } remove a credential

import { requireAuth } from '../../_auth.js';
import { listCredentials, deleteCredential } from '../../_passkey.js';
import { audit } from '../../_audit.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    const list = await listCredentials();
    res.status(200).json({
      credentials: list.map((c) => ({
        id: c.id, label: c.label, linked_at: c.linked_at, last_used_at: c.last_used_at,
      })),
    });
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    const id = body?.id;
    if (typeof id !== 'string' || !id) {
      res.status(400).json({ error: 'missing_id' });
      return;
    }
    await deleteCredential(id);
    await audit(req, 'passkey.revoked', { id });
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
