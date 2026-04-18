// Exchange Plaid Link `public_token` for a long-lived `access_token`.
// Store the access_token server-side in your vault (not here — this is
// a scaffold). The browser only needs to know success/failure.
//
// Call:
//   fetch('/api/plaid/exchange', {
//     method: 'POST',
//     headers: { 'content-type': 'application/json' },
//     body: JSON.stringify({ public_token, institution_id })
//   })

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
  // Defensive typing — Plaid public tokens are short ASCII strings.
  // Reject anything else outright to prevent garbage being forwarded
  // to upstream and to keep the response shape predictable.
  if (typeof publicToken !== 'string' || publicToken.length < 10 || publicToken.length > 512) {
    res.status(400).json({ error: 'missing_public_token' });
    return;
  }
  try {
    const r = await fetch(`${PLAID_HOST[env]}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, public_token: publicToken }),
    });
    const j = await r.json();
    if (!r.ok) {
      console.error('plaid exchange error', { status: r.status, body: j });
      res.status(502).json({ error: 'plaid_error' });
      return;
    }
    // TODO: persist j.access_token + j.item_id into your vault keyed by
    // body.institution_id. That persistence is deliberately omitted from
    // this scaffold — wire it to KV / Postgres / Durable Objects / etc.
    res.status(200).json({ item_id: j.item_id, stored: false });
  } catch (e) {
    console.error('plaid exchange exception', e);
    res.status(500).json({ error: 'server_error' });
  }
}
