// Vercel / Netlify serverless function — mint a Plaid Link token.
//
// Deploy this alongside the Vite build. Never put PLAID_CLIENT_ID /
// PLAID_SECRET in VITE_* env vars; these live server-side only.
//
// Required env:
//   PLAID_CLIENT_ID
//   PLAID_SECRET
//   PLAID_ENV         sandbox | development | production
//
// Call from the browser:
//   fetch('/api/plaid/link-token', { method: 'POST' }).then(r => r.json())

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
  const clientId = process.env.PLAID_CLIENT_ID;
  const secret   = process.env.PLAID_SECRET;
  const env      = process.env.PLAID_ENV || 'sandbox';
  // Strict allowlist — prevents a misconfigured PLAID_ENV from
  // collapsing the host URL to `undefined/...` and any future
  // extension of this code from accidentally pointing at an attacker
  // controlled host.
  if (!Object.prototype.hasOwnProperty.call(PLAID_HOST, env)) {
    res.status(500).json({ error: 'plaid_invalid_env' });
    return;
  }
  if (!clientId || !secret) {
    res.status(500).json({ error: 'plaid_not_configured' });
    return;
  }
  try {
    const r = await fetch(`${PLAID_HOST[env]}/link/token/create`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        client_id:       clientId,
        secret,
        user:            { client_user_id: 'bci-principal' },
        client_name:     'Blanck Capital OS',
        products:        ['investments', 'transactions', 'auth'],
        country_codes:   ['US'],
        language:        'en',
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      // Log the raw Plaid body server-side but don't return it to the
      // browser — upstream error payloads can include request IDs and
      // internal state we shouldn't be echoing back.
      console.error('plaid link-token error', { status: r.status, body: j });
      res.status(502).json({ error: 'plaid_error' });
      return;
    }
    res.status(200).json({ link_token: j.link_token, expiration: j.expiration });
  } catch (e) {
    console.error('plaid link-token exception', e);
    res.status(500).json({ error: 'server_error' });
  }
}
