#!/usr/bin/env bash
# Set AUTH_PASSWORD_HASH, FINNHUB_API_KEY, PUBLIC_HOSTNAME in Vercel
# for Production + Preview, then trigger a no-cache prod redeploy.
#
# Prereqs (one-time):
#   npm i -g vercel
#   vercel login            # browser auth
#   vercel link             # run from repo root, pick the project
#
# Usage:
#   DASHBOARD_PASSWORD='pickOne' \
#   FINNHUB_API_KEY='paste-from-finnhub-dashboard' \
#   PUBLIC_HOSTNAME='bfo-ten.vercel.app' \
#   bash scripts/setup-vercel-env.sh

set -euo pipefail

: "${DASHBOARD_PASSWORD:?set DASHBOARD_PASSWORD}"
: "${FINNHUB_API_KEY:?set FINNHUB_API_KEY}"
: "${PUBLIC_HOSTNAME:=bfo-ten.vercel.app}"

command -v vercel >/dev/null || { echo "vercel CLI not found. Run: npm i -g vercel"; exit 1; }
command -v node   >/dev/null || { echo "node not found"; exit 1; }

echo "→ hashing password with scrypt"
AUTH_PASSWORD_HASH=$(node -e "
  const c=require('crypto'),u=require('util'),s=c.randomBytes(16);
  u.promisify(c.scrypt)(process.argv[1],s,32,{N:16384,r:8,p:1})
    .then(h=>console.log('scrypt\$16384\$8\$1\$'+s.toString('base64')+'\$'+h.toString('base64')));
" "$DASHBOARD_PASSWORD")

set_var() {
  local name=$1 value=$2
  for env in production preview; do
    # remove if already set (vercel env add refuses to overwrite)
    vercel env rm "$name" "$env" --yes >/dev/null 2>&1 || true
    printf '%s' "$value" | vercel env add "$name" "$env" >/dev/null
    echo "  ✓ $name ($env)"
  done
}

echo "→ writing env vars"
set_var AUTH_PASSWORD_HASH "$AUTH_PASSWORD_HASH"
set_var FINNHUB_API_KEY    "$FINNHUB_API_KEY"
set_var PUBLIC_HOSTNAME    "$PUBLIC_HOSTNAME"

echo "→ redeploying prod (no build cache)"
vercel deploy --prod --force --yes

echo "✅ done — hard-refresh https://$PUBLIC_HOSTNAME and log in"
