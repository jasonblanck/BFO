// Tiny abstraction over Upstash Redis for Plaid access-token storage.
// Every Plaid Item = { institution_id, access_token, item_id, linked_at }.
// Stored as JSON strings in a Redis hash keyed by institution_id so we
// can list / add / remove in O(1) without a second index.
//
// Required env (set in Vercel project settings):
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
//
// Falls back to an in-memory Map when Redis env isn't configured so
// local `vercel dev` works without provisioning a store — but nothing
// persists across cold starts.

import { Redis } from '@upstash/redis';

const HASH_KEY = 'bci:plaid:items';

let client = null;
let memoryFallback = null;

function getClient() {
  if (client) return client;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!memoryFallback) {
      memoryFallback = new Map();
      console.warn('Vault · Upstash Redis env missing — using ephemeral in-memory store');
    }
    return null;
  }
  client = new Redis({ url, token });
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
  return Object.values(raw).map((v) => (typeof v === 'string' ? safeParse(v) : v)).filter(Boolean);
}

export async function getItem(institution_id) {
  if (!institution_id) return null;
  const c = getClient();
  if (!c) return memoryFallback.get(institution_id) ?? null;
  const raw = await c.hget(HASH_KEY, institution_id);
  if (!raw) return null;
  return typeof raw === 'string' ? safeParse(raw) : raw;
}

export async function putItem(item) {
  if (!item?.institution_id) throw new Error('institution_id_required');
  const stored = { ...item, linked_at: item.linked_at ?? new Date().toISOString() };
  const c = getClient();
  if (!c) {
    memoryFallback.set(stored.institution_id, stored);
    return stored;
  }
  await c.hset(HASH_KEY, { [stored.institution_id]: JSON.stringify(stored) });
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
  try { return JSON.parse(s); } catch { return null; }
}
