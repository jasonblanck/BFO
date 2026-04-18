// Minimal institution list / unlink endpoint. The Connected Accounts
// page lists what's in the vault (without leaking access tokens) and
// lets the user drop a link.
//
//   GET  /api/plaid/institutions        → { institutions: [{ institution_id, institution_name, linked_at }] }
//   POST /api/plaid/institutions/unlink { institution_id }
//     → revoke at Plaid, then remove from the vault

import { listItems, getItem, removeItem } from '../_vault.js';

const PLAID_HOST = {
  sandbox:     'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production:  'https://production.plaid.com',
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const items = await listItems();
      res.status(200).json({
        institutions: items.map(({ institution_id, institution_name, linked_at }) => ({
          institution_id, institution_name, linked_at,
        })),
      });
    } catch (e) {
      console.error('plaid institutions · vault read failed', e?.message || e);
      res.status(500).json({ error: 'vault_read_failed' });
    }
    return;
  }

  if (req.method === 'POST') {
    const clientId = process.env.PLAID_CLIENT_ID;
    const secret   = process.env.PLAID_SECRET;
    const env      = process.env.PLAID_ENV || 'sandbox';
    if (!Object.prototype.hasOwnProperty.call(PLAID_HOST, env)) {
      res.status(500).json({ error: 'plaid_invalid_env' });
      return;
    }
    if (!clientId || !secret) {
      res.status(500).json({ error: 'plaid_not_configured' });
      return;
    }
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const institution_id = body?.institution_id;
    if (typeof institution_id !== 'string' || !institution_id) {
      res.status(400).json({ error: 'missing_institution_id' });
      return;
    }
    const item = await getItem(institution_id);
    if (!item) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    try {
      // Best-effort revocation — log but don't fail the unlink if Plaid
      // rejects (e.g. token already invalid).
      const r = await fetch(`${PLAID_HOST[env]}/item/remove`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, secret, access_token: item.access_token }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        console.warn('plaid item/remove non-200', { status: r.status, body: j });
      }
    } catch (e) {
      console.warn('plaid item/remove failed', e?.message || e);
    }
    await removeItem(institution_id);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
}
