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

  let institution_id;
  let institution_name;
  let access_token;
  let item_id;

  // Step 1 — exchange the public_token. Any failure here is a Plaid-
  // side problem (wrong secret / env mismatch / expired token).
  try {
    const exchRes = await fetch(`${PLAID_HOST[env]}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, public_token: publicToken }),
    });
    const exch = await exchRes.json().catch(() => ({}));
    if (!exchRes.ok) {
      // Log code + request_id only. Full Plaid error bodies include
      // extended state that doesn't belong in Vercel logs.
      console.error('plaid exchange error', {
        status: exchRes.status,
        code: exch?.error_code,
        req_id: exch?.request_id,
      });
      res.status(502).json({ error: 'plaid_error', stage: 'exchange', detail: exch?.error_code || String(exchRes.status) });
      return;
    }
    access_token = exch.access_token;
    item_id      = exch.item_id;
  } catch (e) {
    console.error('plaid exchange threw', e);
    res.status(502).json({ error: 'plaid_error', stage: 'exchange', detail: String(e?.message || e).slice(0, 120) });
    return;
  }

  // Step 2 — institution metadata lookup. Best-effort — we fall back
  // to the browser-supplied metadata if this fails.
  institution_id   = metadata?.institution?.institution_id || null;
  institution_name = metadata?.institution?.name || 'Linked Institution';
  try {
    const itemRes = await fetch(`${PLAID_HOST[env]}/item/get`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, access_token }),
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
    console.error('plaid exchange missing institution_id');
    res.status(502).json({ error: 'plaid_error', stage: 'metadata', detail: 'missing_institution_id' });
    return;
  }

  // Step 3 — persist to the encrypted vault. Most common failure mode
  // is VAULT_KEY being present but malformed (wrong length / not
  // base64-decodable). Surfacing the stage tells the owner exactly
  // which env var to fix.
  try {
    await putItem({ institution_id, institution_name, access_token, item_id });
  } catch (e) {
    console.error('plaid exchange · vault write failed', e);
    const msg = String(e?.message || e);
    res.status(500).json({
      error: 'vault_write_failed',
      stage: 'vault',
      detail: msg.slice(0, 120),
    });
    return;
  }

  try {
    await audit(req, 'plaid.link', { institution_id, institution_name });
  } catch (e) {
    // Audit failure should never block a successful link.
    console.warn('plaid exchange · audit write failed', e?.message || e);
  }

  res.status(200).json({ ok: true, institution_id, institution_name });
}
