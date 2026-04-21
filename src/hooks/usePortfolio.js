// Runtime overlay of real portfolio data on top of the sanitized seed
// that ships in the bundle. On mount, fetches GET /api/portfolio. If
// the response is 200, the returned institutions / manualAccounts /
// liabilities replace the seed values throughout the app. Everything
// is stored in a module-level cache + useSyncExternalStore so any
// component can subscribe.
//
// The live institutions + liabilities are also persisted to
// localStorage so reloads don't fall back to the sanitized seed while
// the API fetch is in flight (or if the session cookie has rolled).
// Without that, manualAccounts (already persisted via accountsStore)
// stayed on live values while institutions/liabilities reverted to
// seed, producing totals that mixed the two worlds.
//
// If the API is unavailable (404 on GH Pages, 401 before auth), and
// no persisted snapshot exists, the seed stays in place — the UI
// renders demo values.

import { useSyncExternalStore } from 'react';
import {
  institutions as seedInstitutions,
  manualAccounts as seedManual,
  liabilities as seedLiabilities,
} from '../data/portfolio';
import { applyRemoteSeed } from '../data/accountsStore';

const STORAGE_KEY = 'bci-portfolio-overlay';
const SCHEMA_V = 1;

function readPersisted() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== SCHEMA_V) return null;
    if (!Array.isArray(parsed.institutions) || !Array.isArray(parsed.liabilities)) return null;
    return { institutions: parsed.institutions, liabilities: parsed.liabilities };
  } catch (_) { return null; }
}

function writePersisted(snap) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      v: SCHEMA_V,
      institutions: snap.institutions,
      liabilities: snap.liabilities,
    }));
  } catch (_) { /* quota / private mode — silent no-op */ }
}

function clearPersisted() {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

const persisted = readPersisted();
let snapshot = {
  institutions:   persisted?.institutions ?? seedInstitutions,
  manualAccounts: seedManual,
  liabilities:    persisted?.liabilities  ?? seedLiabilities,
  status: persisted ? 'live' : 'seed',
};

const listeners = new Set();
function notify() { listeners.forEach((cb) => { try { cb(); } catch (_) {} }); }

function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot() { return snapshot; }
function getServerSnapshot() {
  return { institutions: seedInstitutions, manualAccounts: seedManual, liabilities: seedLiabilities, status: 'seed' };
}

// Cross-tab sync: if another tab mutates the overlay cache, mirror it
// here so the dashboard stays consistent across tabs.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    const next = readPersisted();
    if (next) {
      snapshot = {
        ...snapshot,
        institutions: next.institutions,
        liabilities: next.liabilities,
        status: 'live',
      };
    } else {
      snapshot = {
        institutions: seedInstitutions,
        manualAccounts: snapshot.manualAccounts,
        liabilities: seedLiabilities,
        status: 'seed',
      };
    }
    notify();
  });
}

// Clear the persisted overlay on logout so the next visitor (or the
// same user re-authing as someone else) starts on seed values, not
// stale private data. Called from AppShell on logout.
export function clearPortfolioOverlay() {
  clearPersisted();
  snapshot = {
    institutions: seedInstitutions,
    manualAccounts: seedManual,
    liabilities: seedLiabilities,
    status: 'seed',
  };
  notify();
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
      // Persist institutions + liabilities so a reload doesn't revert
      // them to the sanitized seed while we wait for the next fetch.
      // (manualAccounts already persist via accountsStore.)
      writePersisted(snapshot);
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
