// localStorage-backed CRUD for manual accounts. Designed as the
// future swap point for the Plaid backend — components consume via
// `useManualAccounts`, the store API stays the same.
//
// Storage shape (key 'bci-manual-accounts'):
//   { v: 1, rev: <seed-rev>, items: [{ id, name, category, opened, value, archived?, ... }] }
//
// Seed migration: the `rev` field is bumped whenever portfolio.js
// adds / removes / renames entries. On load, if stored rev < SEED_REV,
// we auto-merge: new seed items get added, user-edited existing items
// are preserved, user-deleted items stay deleted (tombstoned). This
// prevents stale localStorage from masking seed updates after a deploy.

import { manualAccounts as seedAccounts } from './portfolio';

const KEY = 'bci-manual-accounts';
const VERSION = 1;
// Bump whenever the seed (manualAccounts in portfolio.js) adds or
// removes entries. Existing localStorage with an older rev will
// auto-migrate on next load.
const SEED_REV = 2;

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
    return {
      items: parsed.items,
      rev: typeof parsed.rev === 'number' ? parsed.rev : 0,
      tombstones: Array.isArray(parsed.tombstones) ? parsed.tombstones : [],
    };
  } catch (_) {
    return null;
  }
}

function write(items, tombstones = []) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify({
      v: VERSION,
      rev: SEED_REV,
      items,
      tombstones,
    }));
  } catch (_) { /* quota exceeded / private mode — silent no-op */ }
}

// Merge the current seed into stored items. Rules:
//   - Stored ids win over seed (preserves user edits).
//   - Seed ids not in stored AND not in tombstones get added (handles
//     new entries we ship in portfolio.js).
//   - Tombstones stay — user-deleted seed items don't come back.
// Returns the merged list.
function mergeSeed(stored, tombstones) {
  const storedIds = new Set(stored.map((s) => s.id));
  const dead = new Set(tombstones);
  const missing = seedAccounts.filter(
    (s) => !storedIds.has(s.id) && !dead.has(s.id),
  );
  return [...stored, ...missing.map((s) => ({ ...s }))];
}

// Track tombstones across the session so deleted seed ids don't
// reappear on the next migration. Initialized from storage.
let tombstoneCache = [];

function ensureCache() {
  if (cache !== null) return cache;
  const stored = read();
  if (!stored) {
    cache = seedAccounts.map((a) => ({ ...a }));
    tombstoneCache = [];
    return cache;
  }
  tombstoneCache = stored.tombstones || [];
  if (stored.rev === SEED_REV) {
    cache = stored.items;
    return cache;
  }
  // Rev mismatch: merge + persist with new rev so the user doesn't
  // pay the merge cost on every load.
  const merged = mergeSeed(stored.items, tombstoneCache);
  cache = merged;
  write(cache, tombstoneCache);
  return cache;
}

// Cross-tab + same-tab sync. The 'storage' event only fires in *other*
// tabs, so for same-tab updates we rely on direct notify() in mutators.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    const next = read();
    if (next) {
      cache = next.items;
      tombstoneCache = next.tombstones || [];
    } else {
      cache = seedAccounts.map((a) => ({ ...a }));
      tombstoneCache = [];
    }
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
    // If this id was previously tombstoned (user deleted then re-added),
    // clear it from the tombstone list so it doesn't get pruned later.
    tombstoneCache = tombstoneCache.filter((x) => x !== entry.id);
  }
  write(cache, tombstoneCache);
  notify();
  return cache;
}

export function remove(id) {
  const list = ensureCache();
  cache = list.filter((a) => a.id !== id);
  // Tombstone any deletion whose id matches a current seed entry —
  // that way a future migration won't auto-resurrect it.
  const isSeedId = seedAccounts.some((s) => s.id === id);
  if (isSeedId && !tombstoneCache.includes(id)) {
    tombstoneCache = [...tombstoneCache, id];
  }
  write(cache, tombstoneCache);
  notify();
  return cache;
}

export function setArchived(id, archived) {
  return upsert({ id, archived: !!archived });
}

// Hard reset — wipe localStorage (including tombstones), reseed from
// portfolio.js.
export function resetToSeed() {
  if (typeof localStorage !== 'undefined') {
    try { localStorage.removeItem(KEY); } catch (_) {}
  }
  cache = seedAccounts.map((a) => ({ ...a }));
  tombstoneCache = [];
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
  tombstoneCache = Array.isArray(parsed.tombstones) ? parsed.tombstones : [];
  write(cache, tombstoneCache);
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
