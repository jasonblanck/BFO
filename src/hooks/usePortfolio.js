// Runtime overlay of real portfolio data on top of the sanitized seed
// that ships in the bundle. On mount, fetches GET /api/portfolio. If
// the response is 200, the returned institutions / manualAccounts /
// liabilities replace the seed values throughout the app. Everything
// is stored in a module-level cache + useSyncExternalStore so any
// component can subscribe.
//
// If the API is unavailable (404 on GH Pages, 401 before auth), the
// seed stays in place — the UI renders demo values.

import { useSyncExternalStore } from 'react';
import {
  institutions as seedInstitutions,
  manualAccounts as seedManual,
  liabilities as seedLiabilities,
} from '../data/portfolio';
import { applyRemoteSeed } from '../data/accountsStore';

let snapshot = {
  institutions: seedInstitutions,
  manualAccounts: seedManual,
  liabilities: seedLiabilities,
  status: 'seed',  // 'seed' | 'live' | 'error'
};

const listeners = new Set();
function notify() { listeners.forEach((cb) => { try { cb(); } catch (_) {} }); }

function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot() { return snapshot; }
function getServerSnapshot() {
  return { institutions: seedInstitutions, manualAccounts: seedManual, liabilities: seedLiabilities, status: 'seed' };
}

let inflight = null;
export async function refreshPortfolio() {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const r = await fetch('/api/portfolio', { cache: 'no-store', credentials: 'include' });
      if (r.status === 404 || r.status === 401) {
        // No backend or not authed → keep seed.
        return;
      }
      if (!r.ok) { snapshot = { ...snapshot, status: 'error' }; notify(); return; }
      const j = await r.json();
      const nextManual = Array.isArray(j?.manualAccounts) ? j.manualAccounts : seedManual;
      snapshot = {
        institutions:   Array.isArray(j?.institutions)   ? j.institutions   : seedInstitutions,
        manualAccounts: nextManual,
        liabilities:    Array.isArray(j?.liabilities)    ? j.liabilities    : seedLiabilities,
        status: 'live',
      };
      // Seed the local manual-accounts store on fresh browsers so
      // first-time authenticated visits don't see demo values in
      // Connected Accounts / Mission Control / etc. A no-op if the
      // user already has their own localStorage.
      applyRemoteSeed(nextManual);
      notify();
    } catch (_) {
      // offline / demo mode → silently keep seed
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

// Convenience hook used by components — returns the current snapshot.
// Components read `institutions`, `manualAccounts`, or `liabilities`
// off this and re-render automatically when the overlay lands.
export default function usePortfolio() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
