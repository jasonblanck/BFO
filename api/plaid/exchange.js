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
  if (!clientId || !secret) {
    res.status(500).json({ error: 'plaid_not_configured' });
    return;
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const publicToken = body?.public_token;
  if (!publicToken) {
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
    if (!r.ok) { res.status(502).json({ error: 'plaid_error', detail: j }); return; }
    // TODO: persist j.access_token + j.item_id into your vault keyed by
    // body.institution_id. That persistence is deliberately omitted from
    // this scaffold — wire it to KV / Postgres / Durable Objects / etc.
    res.status(200).json({ item_id: j.item_id, stored: false });
  } catch (e) {
    res.status(500).json({ error: 'server_error', message: String(e?.message || e) });
  }
}
