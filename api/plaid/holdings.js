// Return current holdings + balances across every linked Plaid Item.
// The browser polls this; if the endpoint 404s or the response is empty,
// the dashboard falls back to its seed data.
//
// This scaffold assumes you've implemented a `vault` that maps
// institution_id → access_token. Replace the placeholder stub.

const PLAID_HOST = {
  sandbox:     'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production:  'https://production.plaid.com',
};

// Stub — swap for your real storage. Returns [] for now so the
// endpoint responds successfully but the UI stays on seed.
async function readVault() {
  // e.g. return await kv.get('plaid:items') // → [{ institution_id, access_token }]
  return [];
}

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

  const items = await readVault();
  if (!items.length) {
    res.status(200).json({ institutions: [], status: 'empty_vault' });
    return;
  }

  try {
    const out = await Promise.all(items.map(async ({ institution_id, access_token }) => {
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
      const hold = await holdRes.json();
      return {
        institution_id,
        accounts: bal?.accounts ?? [],
        holdings: hold?.holdings ?? [],
        securities: hold?.securities ?? [],
      };
    }));
    res.status(200).json({ institutions: out, status: 'live' });
  } catch (e) {
    console.error('plaid holdings exception', e);
    res.status(500).json({ error: 'server_error' });
  }
}
