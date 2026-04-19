// GET  /api/auth/backup-codes → { remaining: number }
// POST /api/auth/backup-codes → { codes: [string x10] }   one-shot plaintext
//
// Both require an active session. Regenerating wipes any remaining
// old codes — by design, only one set is valid at a time.

import { requireAuth } from '../_auth.js';
import { regenerate, remainingCount } from '../_backup_codes.js';
import { audit } from '../_audit.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const remaining = await remainingCount();
      res.status(200).json({ remaining });
    } catch (e) {
      console.error('backup-codes · read failed', e?.message || e);
      res.status(500).json({ error: 'read_failed' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const codes = await regenerate();
      await audit(req, 'backup_codes.regenerated');
      // Plaintext codes returned once. Caller must display + ask the
      // user to store them safely; we don't keep them server-side
      // after this response goes out.
      res.status(200).json({ codes });
    } catch (e) {
      console.error('backup-codes · regenerate failed', e?.message || e);
      res.status(500).json({ error: 'regenerate_failed' });
    }
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
