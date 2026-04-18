import { useEffect, useState } from 'react';

// Polls /api/plaid/holdings. Returns `{ data, status }` where status is:
//   'seed'        — endpoint unreachable or still empty, caller should
//                    keep rendering the portfolio.js seed
//   'empty_vault' — endpoint reachable but no tokens yet (user hasn't
//                    linked any institutions via Plaid Link)
//   'live'        — real balances + holdings
//
// The dashboard's institutions array is derived from this result +
// the seed fallback inside App.jsx.

const REFRESH_MS = 60_000;

export default function usePlaidHoldings() {
  const [state, setState] = useState({ data: null, status: 'seed' });

  useEffect(() => {
    let alive = true;
    async function tick() {
      try {
        const r = await fetch('/api/plaid/holdings', { cache: 'no-store' });
        if (!r.ok) return; // 404 on dev / pages → stay seed
        const j = await r.json();
        if (!alive) return;
        setState({
          data: j.institutions ?? [],
          status: j.status ?? 'seed',
        });
      } catch (_) { /* offline / no backend / stay seed */ }
    }
    tick();
    const t = setInterval(tick, REFRESH_MS);
    return () => { alive = false; clearInterval(t); };
  }, []);

  return state;
}
