// localStorage-backed CRUD for manual accounts. Designed as the
// future swap point for the Plaid backend — components consume via
// `useManualAccounts`, the store API stays the same.
//
// Storage shape (key 'bci-manual-accounts'):
//   { v: 1, items: [{ id, name, category, opened, value, archived?, ... }] }
//
// On first read, if no localStorage entry exists, we seed from the
// hardcoded `manualAccounts` export in portfolio.js so the dashboard
// shows the same data it does today. From then on, localStorage is the
// source of truth — every mutation writes there.

import { manualAccounts as seedAccounts } from './portfolio';

const KEY = 'bci-manual-accounts';
const VERSION = 1;

const listeners = new Set();
let cache = null;        // full list (includes archived)
let activeCache = null;  // filtered to non-archived; rebuilt on mutate

function notify() {
  // Bust the filtered snapshot whenever the underlying cache mutates so
  // useSyncExternalStore consumers see a new ref on real changes only.
  activeCache = null;
  listeners.forEach((cb) => {
    try { cb(); } catch (_) { /* swallow listener errors */ }
  });
}

function read() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed.items;
  } catch (_) {
    return null;
  }
}

function write(items) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, items }));
  } catch (_) { /* quota exceeded / private mode — silent no-op */ }
}

function ensureCache() {
  if (cache !== null) return cache;
  const stored = read();
  cache = stored ?? seedAccounts.map((a) => ({ ...a }));
  return cache;
}

// Cross-tab + same-tab sync. The 'storage' event only fires in *other*
// tabs, so for same-tab updates we rely on direct notify() in mutators.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    cache = read() ?? seedAccounts.map((a) => ({ ...a }));
    notify();
  });
}

export function getAll({ includeArchived = false } = {}) {
  const all = ensureCache();
  if (includeArchived) return all;
  // Cache the filtered view so successive reads return the same ref —
  // critical for useSyncExternalStore to avoid an infinite re-render loop.
  if (activeCache === null) {
    activeCache = all.filter((a) => !a.archived);
  }
  return activeCache;
}

export function getById(id) {
  return ensureCache().find((a) => a.id === id) ?? null;
}

export function upsert(entry) {
  const list = ensureCache();
  const idx = list.findIndex((a) => a.id === entry.id);
  if (idx >= 0) {
    cache = list.map((a, i) => (i === idx ? { ...a, ...entry } : a));
  } else {
    cache = [...list, { ...entry }];
  }
  write(cache);
  notify();
  return cache;
}

export function remove(id) {
  const list = ensureCache();
  cache = list.filter((a) => a.id !== id);
  write(cache);
  notify();
  return cache;
}

export function setArchived(id, archived) {
  return upsert({ id, archived: !!archived });
}

// Hard reset — wipe localStorage, reseed from portfolio.js.
export function resetToSeed() {
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem(KEY); } catch (_) {}
  }
  cache = seedAccounts.map((a) => ({ ...a }));
  notify();
  return cache;
}

export function exportJSON() {
  return JSON.stringify({ v: VERSION, exportedAt: new Date().toISOString(), items: ensureCache() }, null, 2);
}

export function importJSON(jsonString) {
  const parsed = JSON.parse(jsonString);
  if (!parsed || !Array.isArray(parsed.items)) throw new Error('invalid_payload');
  cache = parsed.items.map((a) => ({ ...a }));
  write(cache);
  notify();
  return cache;
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

// Convenience aggregate — components that previously called
// `manualAccountsTotal()` from portfolio.js now read from the store.
export function manualAccountsTotal() {
  return getAll().reduce((s, a) => s + (Number(a.value) || 0), 0);
}

// Stable id generator for new entries. Format mirrors the seed
// (`m-<slug>`) so future Plaid sync logic can keep the namespace clean.
export function makeId(name) {
  const slug = String(name || 'untitled')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28) || 'entry';
  const stamp = Date.now().toString(36).slice(-4);
  return `m-${slug}-${stamp}`;
}
