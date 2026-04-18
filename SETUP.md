# Blanck Capital OS · Deployment Setup (Phase 2)

Quick reference for wiring up the Plaid backend on Vercel. Once these steps are done, the **Connected Accounts → Linked Institutions** section lights up and the dashboard starts rendering live Plaid balances **additively** on top of the existing seed + manual data.

---

## 1. Plaid credentials

1. Sign up at https://dashboard.plaid.com (free).
2. Grab `client_id` + `sandbox` secret from *Team Settings → Keys*.
3. Enable the **Investments**, **Transactions**, and **Auth** products (Sandbox is free, no approval needed).

---

## 2. Vercel project

1. `vercel login`
2. From the repo root: `vercel --prod` (or connect the GitHub repo in the Vercel dashboard).
3. The `vercel.json` in this repo already tells Vercel:
   - `buildCommand: npm run build`
   - `outputDirectory: dist`
   - `/api/*` → serverless functions
   - SPA fallback for everything else

---

## 3. Token vault · Redis

You can use either of Vercel's Redis options — the vault adapter reads `REDIS_URL` either way.

**Recommended:** *Storage* tab → **Marketplace Database Providers** → pick **Redis** (by Redis Inc.) or **Upstash → Redis**. Both inject `REDIS_URL` automatically. Free tier on either is plenty.

If `REDIS_URL` isn't set, the vault falls back to an in-memory `Map` so `vercel dev` still runs — but nothing persists across cold starts (local-only).

---

## 4. Environment variables

Set these in *Vercel → Project → Settings → Environment Variables*:

| Key | Value | Scope |
|---|---|---|
| `PLAID_CLIENT_ID` | from Plaid dashboard | Production, Preview, Development |
| `PLAID_SECRET` | sandbox / development / production secret | same |
| `PLAID_ENV` | `sandbox` \| `development` \| `production` | same |
| `REDIS_URL` | auto from the Redis / Upstash integration | same |
| `AUTH_SECRET` | random ≥32 chars — used to sign session cookies | same |
| `AUTH_PASSWORD_HASH` | *(optional)* SHA-256 hex of the dashboard password | same |

**Generate `AUTH_SECRET`** — any secure random string works. Quick options:
- macOS / Linux: `openssl rand -base64 48`
- Node: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`

**Rotate the password** — compute the hash (`printf "YourPasswordHere" | shasum -a 256`) and paste the hex into `AUTH_PASSWORD_HASH`. Leaving it unset falls back to the hash of `Harry`.

**Never** put Plaid credentials or `AUTH_SECRET` in `VITE_*` env vars — anything prefixed `VITE_` ships to the browser.

---

## 5. Redirect URIs (production only)

Plaid requires an allowlisted redirect URI for production OAuth institutions (Chase, etc.). Sandbox needs none.

- In the Plaid dashboard → **Team Settings → API** → **Allowed redirect URIs**, add:
  - `https://<your-vercel-project>.vercel.app/`
  - Any custom domain you attach to the Vercel project.

---

## 6. Verify

After deploy:

1. Visit the live URL → sign in (password is still `Harry`).
2. Footer → **Connected Accounts**.
3. **Linked Institutions** section should show a **Connect via Plaid** button. Click it; Plaid Link opens.
4. In Sandbox, any bank → `user_good` / `pass_good` / any 6-digit MFA code.
5. The institution appears in the Linked list within a few seconds. It also renders additively in the dashboard's **Institutional Overview** with a `Live · Plaid` chip.

If the button says *"backend pending"*, `/api/plaid/link-token` isn't reachable — check deploy logs and env vars.

---

## 7. What this build does vs. doesn't

| Capability | Status |
|---|---|
| Plaid Link → store access token in Upstash | ✅ |
| Additive render of live balances on the dashboard | ✅ |
| Unlink (revokes at Plaid + removes from vault) | ✅ |
| Seed data replaced by live data | ❌ — intentional, opt-in phase 3 |
| Institution-to-seed mapping UI (override seed with Plaid) | ❌ — phase 3 |
| Transactions tab | ❌ — wired but not surfaced yet |
| Proper auth endpoint (replaces client-side `Harry` gate) | ❌ — phase 2b |
| Webhooks (real-time refresh) | ❌ — phase 3 |

Everything shipped in Phase 2 respects the constraint: **current state stays as-is until you explicitly override it**. Linked Plaid accounts are purely additive.
