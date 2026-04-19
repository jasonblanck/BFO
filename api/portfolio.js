// GET /api/portfolio — authenticated.
// Returns the real institutions / manualAccounts / liabilities blocks.
// The frontend ships only sanitized demo values and overlays the
// response from this endpoint at runtime once the session cookie is
// accepted.

import { requireAuth } from './_auth.js';
import { institutions, manualAccounts, liabilities } from './_portfolio_private.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }
  // Cache off — live values always.
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ institutions, manualAccounts, liabilities });
}
