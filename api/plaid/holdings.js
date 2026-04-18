// Return current holdings + balances across every linked Plaid Item.
// The browser polls this; if the endpoint 404s or the response is empty
// the dashboard falls back to its seed data (current state stays as-is
// until a real Plaid link overrides specific entries).
//
// Response shape:
//   { institutions: [{ institution_id, institution_name, accounts, holdings, securities }], status }
// Where status is one of: 'live' | 'empty_vault' | 'partial'.

import { listItems } from '../_vault.js';

const PLAID_HOST = {
  sandbox:     'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production:  'https://production.plaid.com',
};

export default async function handler(req, res) {
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

  let items = [];
  try {
    items = await listItems();
  } catch (e) {
    console.error('plaid holdings · vault read failed', e?.message || e);
    res.status(500).json({ error: 'vault_read_failed' });
    return;
  }
  if (!items.length) {
    res.status(200).json({ institutions: [], status: 'empty_vault' });
    return;
  }

  const out = [];
  let anyFailure = false;

  await Promise.all(items.map(async ({ institution_id, institution_name, access_token }) => {
    try {
      const [balRes, holdRes] = await Promise.all([
        fetch(`${PLAID_HOST[env]}/accounts/balance/get`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, secret, access_token }),
        }),
        fetch(`${PLAID_HOST[env]}/investments/holdings/get`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, secret, access_token }),
        }),
      ]);
      const bal  = await balRes.json();
      // Investments endpoint returns 400 for non-investment institutions
      // (like a checking-only bank); swallow that specifically.
      const hold = holdRes.ok ? await holdRes.json() : { holdings: [], securities: [] };
      out.push({
        institution_id,
        institution_name: institution_name || 'Linked Institution',
        accounts:    bal?.accounts ?? [],
        holdings:    hold?.holdings ?? [],
        securities:  hold?.securities ?? [],
      });
    } catch (e) {
      anyFailure = true;
      console.error('plaid holdings · item fetch failed', institution_id, e?.message || e);
      // Include the institution in the response even on failure so the
      // UI can show a "sync error" state rather than silently dropping it.
      out.push({
        institution_id,
        institution_name: institution_name || 'Linked Institution',
        accounts: [],
        holdings: [],
        securities: [],
        error: 'fetch_failed',
      });
    }
  }));

  res.status(200).json({
    institutions: out,
    status: anyFailure ? 'partial' : 'live',
  });
}
