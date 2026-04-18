# Security model

Snapshot as of the full audit. Threat model is a single-tenant family-office dashboard that aggregates real banking / brokerage data through Plaid. Risk concentration is the Plaid access tokens in the vault and the live balances served through `/api/plaid/*`.

## Authentication

| Layer | Mechanism | Notes |
|---|---|---|
| Client UI | SHA-256 password hash + visual gate | UX only — stops casual shoulder-surfers. Falls back to this when no backend is deployed (GitHub Pages preview). |
| Backend · Factor 1 | `POST /api/auth/challenge` → password verified → 6-digit code sent via Telegram | Code is `crypto.randomInt(0, 1_000_000)` zero-padded. Stored in Redis with 5-min TTL. Telegram delivery includes IP + truncated UA so the recipient can sanity-check. Fails *closed* if `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` are unset (`mfa_not_configured`). |
| Backend · Factor 2 | `POST /api/auth/login` → `{challenge_id, code}` → HMAC-SHA256 signed session cookie | HttpOnly, Secure, SameSite=Lax, **1 h TTL with sliding refresh**. Code checked with constant-time compare. Per-challenge attempt counter caps at 5 tries; 6th wipes the challenge — attacker must restart from the password step. Signed with `AUTH_SECRET`. |
| API routes | `requireAuth(req, res)` middleware on every `/api/plaid/*` handler | Rejects with 401 if the cookie is missing, expired, or tampered with. |
| Rate limit | 5 failed IP-scoped attempts per 15 min | Shared counter across `/challenge` + `/login`, so brute forcing either factor costs the same IP budget. Backed by Redis, falls back to in-memory. Resets on successful login. Fails *open* on Redis errors. |
| Logout | `POST /api/auth/logout` | Clears the cookie. Invoked by the Log Out button in the top chrome. |

## Data at rest

| Store | Contents | Protection |
|---|---|---|
| Upstash / Vercel Redis | `{institution_id → {institution_name, item_id, linked_at, access_token_encrypted}}` | **Envelope encryption**: access tokens are wrapped with AES-256-GCM using `VAULT_KEY` before they ever reach Redis. Even a full Redis compromise yields only ciphertext. Plus TLS in transit and Upstash's own at-rest encryption underneath. Access tokens are *never* returned to the browser. |
| Redis `bci:audit` | Capped list (≤500) of auth + Plaid lifecycle events | Structured audit log queryable from the Connected Accounts page. Events: `login.success / failed / ratelimited / error`, `logout`, `plaid.link`, `plaid.unlink`. Each entry includes truncated UA and client IP for anomaly detection. |
| Browser `localStorage` | Theme, view, `bci-manual-accounts` (the owner's own manual portfolio seed) | Local to the device. Not transmitted. Clearing browser data re-seeds from `portfolio.js`. |
| Browser `sessionStorage` | `bci-auth=1` — a UX flag only | Reconciled against the server cookie on every page load. |
| Build artifacts | `dist/` | Grepped against actual credential values (Plaid client_id, Plaid secret, plaintext password) on every release — **no secrets in the bundle**. `VITE_*` env names intentionally kept limited to read-only market-data keys. |

## Data in transit

- TLS 1.3 enforced by Vercel on every request.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` header pinned via `vercel.json`.
- All external API calls (Plaid, FRED, Polygon, Finnhub) go over HTTPS.

## Response headers (set by `vercel.json`)

- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` (mobile-preview iframe is same-origin)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), magnetometer=(), gyroscope=()`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups` (needed for Plaid Link popup)
- `Content-Security-Policy` — strict allowlist: `script-src` permits only `'self'` + `cdn.plaid.com`; `connect-src` limited to self + Plaid + our three market-data providers; `frame-src` Plaid only; `object-src 'none'`; `frame-ancestors 'self'`. Any compromised transitive npm dep that tries to exfiltrate to an arbitrary host is blocked by the browser.
- `/api/*` routes additionally get `Cache-Control: no-store`

## Input / output hygiene

- No `dangerouslySetInnerHTML`, `eval`, `new Function`, or `document.write` anywhere. Verified.
- All rendered data flows through React JSX → auto-escaped.
- External news links carry `rel="noopener noreferrer"`.
- Plaid API error bodies are logged server-side but **never** relayed to the browser — generic error codes only.
- Exception messages from API handlers are logged, not returned.
- `PLAID_ENV` is strict-allowlisted against `sandbox / development / production` — prevents an env misconfiguration from redirecting host URLs.
- `public_token` on `/api/plaid/exchange` is typed + length-bounded before forwarding.
- `institution_id` on `/api/plaid/institutions` POST is typed before being used as a vault key.

## Dependency risk

- `npm audit` runs clean for production code. The two moderate advisories flagged (`esbuild`/`vite`) affect the **dev server only** — not reachable in deployed builds.
- `react-plaid-link`, `ioredis` are the only runtime deps beyond React itself. No unknown-provenance supply chain.

## Tier 2 (recommended follow-ups)

- **Passkey / WebAuthn** — Telegram MFA raises the bar significantly, but a compromised Telegram session would still let an attacker receive codes. Passkeys (hardware-backed) remove the shared secret entirely. Worth adding on top of Telegram, not instead of.
- **Dependabot + secret scanning** — one-click enable in GitHub repo settings.
- **Server-side seed data** — the hardcoded portfolio in `src/data/portfolio.js` currently ships with the bundle. Moving it behind an authenticated API call is a bigger refactor but eliminates it from any cached copy of the site JS.

## Known tradeoffs

- **Client-side password fallback** (when no backend is present) isn't a security boundary — treat GitHub Pages preview as "demo mode" with nothing sensitive behind it.
- **In-memory rate limiting** on cold-start lambdas won't survive instance churn. Upgrading to sliding-window counters in Redis would tighten this, but for single-tenant use the current setup is sufficient.
- **`bci-manual-accounts` localStorage** is unencrypted. Physical device access = readable. Acceptable because the data is the owner's own seed and the OS-level account security is already the user's frontline.
- **Audit log in Redis** shares fate with the vault. If Redis is wiped, audit history is lost. Acceptable — the log's purpose is anomaly detection over recent use, not long-term forensics.

## Rotation playbook

- **Password**: hash the new value (`printf "NewPassword" | shasum -a 256`), paste hex into `AUTH_PASSWORD_HASH`, redeploy. Old sessions remain valid until TTL expires — bump `AUTH_SECRET` too if you need to invalidate all sessions immediately.
- **Session signing key** (`AUTH_SECRET`): regenerate (`openssl rand -base64 48`), update in Vercel, redeploy. Every active session gets logged out.
- **Plaid secret**: rotate in the Plaid dashboard, update `PLAID_SECRET` in Vercel, redeploy. Existing `access_token`s in the vault remain valid because they're per-item, not per-secret.
- **Vault key** (`VAULT_KEY`): rotating invalidates every encrypted `access_token` in the vault. Each linked institution has to be re-linked from scratch. Keep the original key in a password manager until you're ready to accept that cost.
- **Redis**: rotate the Upstash / Vercel Redis instance; `REDIS_URL` auto-updates. Linked Plaid items will need re-link because their access tokens were only stored there.
