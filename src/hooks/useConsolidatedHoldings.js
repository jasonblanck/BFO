import { useMemo } from 'react';
import { institutions } from '../data/portfolio';
import usePlaidHoldings from './usePlaidHoldings';

// Consolidates every per-account position into a single symbol-keyed
// rollup: sums qty + value + today's change, weighted-averages cost
// basis, and tracks which accounts contribute to each row.
//
// Sources (in priority order):
//   1. institutions[].accounts[].holdings[] — seed data + Fidelity etc.
//   2. Plaid /holdings response (flattened via securities dictionary)
//
// Manual accounts (the 35 private deals) are deliberately excluded —
// they don't represent fungible, symbol-denominated positions.

function classify(security, fallback = 'Equity') {
  // Plaid gives us security.type — map to our asset classes.
  const t = (security?.type || '').toLowerCase();
  if (t === 'cash')       return 'Cash';
  if (t === 'etf')        return 'ETF';
  if (t === 'mutual fund')return 'Mutual Fund';
  if (t === 'fixed income' || t === 'bond') return 'Fixed Income';
  if (t === 'cryptocurrency') return 'Crypto';
  if (t === 'derivative') return 'Other';
  if (t === 'equity')     return 'Equity';
  return fallback;
}

function keyFor(h) {
  // Prefer ticker symbol; fall back to security_id or name to keep
  // distinct positions separate even without a symbol.
  return (h.symbol || h.security_id || h.name || 'UNKNOWN').toUpperCase();
}

export default function useConsolidatedHoldings() {
  const { data: plaidData } = usePlaidHoldings();

  return useMemo(() => {
    const bySymbol = new Map();

    const add = (row) => {
      const k = keyFor(row);
      const prev = bySymbol.get(k);
      if (!prev) {
        bySymbol.set(k, {
          ...row,
          sources: row.source ? [row.source] : [],
        });
        return;
      }
      const qtyA = Number(prev.qty) || 0;
      const qtyB = Number(row.qty) || 0;
      const valA = Number(prev.value) || 0;
      const valB = Number(row.value) || 0;
      const costA = Number(prev.avgCost) || 0;
      const costB = Number(row.avgCost) || 0;
      const totalQty = qtyA + qtyB;
      // Cost-basis weighted avg by qty so sums stay consistent even if
      // one source didn't report cost basis.
      const avgCost = totalQty > 0
        ? (costA * qtyA + costB * qtyB) / totalQty
        : (prev.avgCost ?? row.avgCost);
      bySymbol.set(k, {
        ...prev,
        // Prefer the richer (non-null) price from any source.
        price: prev.price ?? row.price,
        qty: row.qty == null && prev.qty == null ? null : totalQty,
        avgCost,
        value: valA + valB,
        change: (Number(prev.change) || 0) + (Number(row.change) || 0),
        // Weighted today's %: recomputed downstream if both sides reported it.
        changePct: null,
        gainPct: null,
        sources: row.source ? [...prev.sources, row.source] : prev.sources,
      });
    };

    // 1. Seed holdings from institutions.
    institutions.forEach((inst) => {
      inst.accounts.forEach((acct) => {
        if (!Array.isArray(acct.holdings)) return;
        acct.holdings.forEach((h) => {
          add({
            ...h,
            assetClass: h.assetClass || classify(h),
            source: { institution: inst.name, account: acct.name },
          });
        });
      });
    });

    // 2. Plaid holdings — securities dictionary keyed by security_id.
    const plaidList = Array.isArray(plaidData) ? plaidData : [];
    plaidList.forEach((inst) => {
      const secMap = new Map((inst.securities ?? []).map((s) => [s.security_id, s]));
      (inst.holdings ?? []).forEach((h) => {
        const sec = secMap.get(h.security_id) || {};
        const value = Number(h.institution_value) || 0;
        const qty = Number(h.quantity) || 0;
        const price = Number(h.institution_price) || (qty > 0 ? value / qty : null);
        const costBasis = Number(h.cost_basis) || null;
        const avgCost = costBasis != null && qty > 0 ? costBasis / qty : (price ?? 0);
        add({
          symbol: sec.ticker_symbol || sec.security_id,
          name: sec.name || sec.ticker_symbol || 'Unknown',
          assetClass: classify(sec),
          qty,
          avgCost,
          price,
          value,
          change: 0,        // Plaid doesn't expose daily delta cleanly
          changePct: null,
          gainPct: costBasis != null && costBasis > 0 ? ((value - costBasis) / costBasis) * 100 : null,
          source: { institution: inst.institution_name || 'Linked Institution', account: 'Plaid · Live' },
        });
      });
    });

    // Post-process: derive weighted % fields from final totals.
    const rows = [...bySymbol.values()].map((r) => {
      const priorValue = (Number(r.value) || 0) - (Number(r.change) || 0);
      const changePct = priorValue > 0 ? ((Number(r.change) || 0) / priorValue) * 100 : null;
      return { ...r, changePct };
    });

    return rows;
  }, [plaidData]);
}
