// Exchange Plaid Link `public_token` for a long-lived `access_token`,
// then persist it in the vault keyed by institution_id. The browser
// only sees {ok: true, institution_id}.

import { putItem } from '../_vault.js';
import { requireAuth } from '../_auth.js';
import { audit } from '../_audit.js';

const PLAID_HOST = {
  sandbox:     'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production:  'https://production.plaid.com',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!requireAuth(req, res)) return;
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
  const publicToken = body?.public_token;
  const metadata    = body?.metadata ?? {};
  if (typeof publicToken !== 'string' || publicToken.length < 10 || publicToken.length > 512) {
    res.status(400).json({ error: 'missing_public_token' });
    return;
  }

  try {
    // 1. Exchange public_token → access_token + item_id
    const exchRes = await fetch(`${PLAID_HOST[env]}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, public_token: publicToken }),
    });
    const exch = await exchRes.json();
    if (!exchRes.ok) {
      console.error('plaid exchange error', { status: exchRes.status, body: exch });
      res.status(502).json({ error: 'plaid_error' });
      return;
    }

    // 2. Fetch the institution metadata so we can display a real name.
    //    Prefer Plaid's definitive institution_id + name; fall back to
    //    the metadata payload Plaid Link gives the browser.
    let institution_id = metadata?.institution?.institution_id || null;
    let institution_name = metadata?.institution?.name || 'Linked Institution';
    try {
      const itemRes = await fetch(`${PLAID_HOST[env]}/item/get`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, secret, access_token: exch.access_token }),
      });
      const itemJ = await itemRes.json();
      if (itemRes.ok && itemJ?.item?.institution_id) {
        institution_id = itemJ.item.institution_id;
        const instRes = await fetch(`${PLAID_HOST[env]}/institutions/get_by_id`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            client_id: clientId,
            secret,
            institution_id,
            country_codes: ['US'],
          }),
        });
        const instJ = await instRes.json();
        if (instRes.ok && instJ?.institution?.name) {
          institution_name = instJ.institution.name;
        }
      }
    } catch (e) {
      console.warn('plaid institution metadata lookup failed', e?.message || e);
    }

    if (!institution_id) {
      // Without an institution_id we can't de-duplicate future links.
      console.error('plaid exchange missing institution_id');
      res.status(502).json({ error: 'plaid_error' });
      return;
    }

    // 3. Persist (vault encrypts access_token at rest).
    await putItem({
      institution_id,
      institution_name,
      access_token: exch.access_token,
      item_id: exch.item_id,
    });

    audit(req, 'plaid.link', { institution_id, institution_name });
    res.status(200).json({ ok: true, institution_id, institution_name });
  } catch (e) {
    console.error('plaid exchange exception', e);
    res.status(500).json({ error: 'server_error' });
  }
}
