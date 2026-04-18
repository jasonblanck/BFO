// Tiny abstraction over Redis for Plaid access-token storage.
// Every Plaid Item = { institution_id, access_token, item_id, linked_at }.
// Stored as JSON strings in a Redis hash keyed by institution_id so we
// can list / add / remove in O(1) without a second index.
//
// Required env (Vercel auto-injects from the Redis integration):
//   REDIS_URL — full connection string, e.g. rediss://default:pw@host:port
//
// Falls back to an in-memory Map when REDIS_URL is unset so local
// `vercel dev` works without provisioning a store — but nothing
// persists across cold starts.

import Redis from 'ioredis';

const HASH_KEY = 'bci:plaid:items';

// Module-scope so warm serverless invocations reuse the connection.
let client = null;
let memoryFallback = null;

function getClient() {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.KV_URL;
  if (!url) {
    if (!memoryFallback) {
      memoryFallback = new Map();
      console.warn('Vault · REDIS_URL missing — using ephemeral in-memory store');
    }
    return null;
  }
  client = new Redis(url, {
    maxRetriesPerRequest: 3,
    connectTimeout: 5000,
    // Don't crash the function on a transient connection blip.
    lazyConnect: false,
  });
  client.on('error', (e) => console.error('Redis · client error', e?.message || e));
  return client;
}

function memList() {
  return Array.from(memoryFallback.values());
}

export async function listItems() {
  const c = getClient();
  if (!c) return memList();
  const raw = await c.hgetall(HASH_KEY);
  if (!raw || typeof raw !== 'object') return [];
  return Object.values(raw).map((v) => safeParse(v)).filter(Boolean);
}

export async function getItem(institution_id) {
  if (!institution_id) return null;
  const c = getClient();
  if (!c) return memoryFallback.get(institution_id) ?? null;
  const raw = await c.hget(HASH_KEY, institution_id);
  return raw ? safeParse(raw) : null;
}

export async function putItem(item) {
  if (!item?.institution_id) throw new Error('institution_id_required');
  const stored = { ...item, linked_at: item.linked_at ?? new Date().toISOString() };
  const c = getClient();
  if (!c) {
    memoryFallback.set(stored.institution_id, stored);
    return stored;
  }
  await c.hset(HASH_KEY, stored.institution_id, JSON.stringify(stored));
  return stored;
}

export async function removeItem(institution_id) {
  if (!institution_id) return false;
  const c = getClient();
  if (!c) return memoryFallback.delete(institution_id);
  await c.hdel(HASH_KEY, institution_id);
  return true;
}

function safeParse(s) {
  if (typeof s !== 'string') return s;
  try { return JSON.parse(s); } catch { return null; }
}
