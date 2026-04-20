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

import { requireAuth } from '../_auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  if (!requireAuth(req, res)) return;
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
  // Resolve the webhook URL. Prefer PUBLIC_HOSTNAME env var so an
  // attacker who can forge x-forwarded-host (bypassing the Vercel
  // edge, misconfigured proxy) can't redirect the webhook Plaid fires
  // at us. Header fallback retained for local dev.
  const pinned = (process.env.PUBLIC_HOSTNAME || '').trim();
  const proto = pinned ? 'https' : (req.headers?.['x-forwarded-proto'] || 'https');
  const host  = pinned || req.headers?.['x-forwarded-host'] || req.headers?.host;
  const webhookUrl = host ? `${proto}://${host}/api/plaid/webhook` : undefined;

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
        ...(webhookUrl ? { webhook: webhookUrl } : {}),
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      // Log the Plaid error code + request id only. Echoing the full
      // body into Vercel logs surfaces extended state that isn't
      // needed for debugging and might be sensitive on future error
      // types (verbatim product URLs, customer-visible strings, etc).
      console.error('plaid link-token error', {
        status: r.status,
        code: j?.error_code,
        req_id: j?.request_id,
      });
      res.status(502).json({ error: 'plaid_error' });
      return;
    }
    res.status(200).json({ link_token: j.link_token, expiration: j.expiration });
  } catch (e) {
    console.error('plaid link-token exception', e);
    res.status(500).json({ error: 'server_error' });
  }
}
