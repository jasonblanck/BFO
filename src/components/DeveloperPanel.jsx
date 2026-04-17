import React, { useState } from 'react';
import {
  Code2,
  ChevronDown,
  ChevronRight,
  Link2,
  ShieldCheck,
  Key,
  Check,
  Copy,
  ArrowRight,
  Plug,
} from 'lucide-react';

const flow = [
  {
    step: '01',
    title: 'Mint Plaid Link Token',
    body: 'Backend exchanges BCI service credentials for a short-lived link_token with products=[investments, transactions, auth] and country_codes=[US]. Scope Link to the authenticated Blanck family member.',
    code: `POST /link/token/create
{
  "client_id":  process.env.PLAID_CLIENT_ID,
  "secret":     process.env.PLAID_SECRET,
  "user":       { "client_user_id": "j.blanck" },
  "client_name":"Blanck Capital OS",
  "products":   ["investments","transactions","auth"],
  "country_codes": ["US"],
  "language":   "en"
}`,
  },
  {
    step: '02',
    title: 'OAuth 2.0 Handoff · BofA / Chase / Morgan Stanley',
    body: 'Plaid Link renders and redirects into each institution\'s OAuth consent screen. Set redirect_uri to https://os.blanckcapital.com/oauth/plaid so the session returns with an oauth_state_id. Read-only scopes only.',
    code: `// Browser
const handler = Plaid.create({
  token: LINK_TOKEN,
  receivedRedirectUri: window.location.href,
  onSuccess: (public_token, meta) => exchange(public_token, meta),
});
handler.open();`,
  },
  {
    step: '03',
    title: 'Exchange · Persist access_token',
    body: 'Server swaps the public_token for a long-lived access_token and writes it to the BCI vault. Rotate quarterly; never expose to the client.',
    code: `POST /item/public_token/exchange
{ "public_token": "<from onSuccess>" }
→ { "access_token": "access-prod-...", "item_id": "..." }

vault.put("plaid:ms",   access_token);
vault.put("plaid:bofa", access_token);`,
  },
  {
    step: '04',
    title: 'Sync Balances & Holdings',
    body: 'Nightly cron pulls /investments/holdings/get and /accounts/balance/get; real-time updates subscribe to Plaid webhooks (HOLDINGS, TRANSACTIONS). Write into the same Single-Source table rendered above.',
    code: `cron("0 2 * * *", async () => {
  for (const inst of ["ms","bofa","chase","citi","fidelity","tiaa","ny529"]) {
    const { holdings, accounts, securities } =
      await plaid.investmentsHoldingsGet({ access_token: vault.get("plaid:"+inst) });
    await db.upsert("accounts", mapToCanonical(inst, accounts, holdings));
  }
});`,
  },
];

function Step({ s, open, onToggle }) {
  return (
    <div className="rounded-xl border border-white/5 bg-navy-900/50 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02]"
      >
        <span
          className="mono text-[11px] h-7 w-7 rounded-md flex items-center justify-center border border-ms-600/40 text-ms-400 bg-ms-600/5"
        >
          {s.step}
        </span>
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold text-slate-100">{s.title}</div>
          {!open && <div className="text-[11.5px] text-slate-500 mt-0.5 truncate">{s.body}</div>}
        </div>
        {open ? (
          <ChevronDown size={14} className="text-slate-400" />
        ) : (
          <ChevronRight size={14} className="text-slate-500" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-[12.5px] leading-relaxed text-slate-300">{s.body}</p>
          <pre className="mono text-[11.5px] text-slate-300 bg-navy-950/80 border border-white/5 rounded-lg p-3 overflow-x-auto">
{s.code}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function DeveloperPanel() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(0);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText('PLAID_CLIENT_ID=<redacted>\nPLAID_SECRET=<redacted>\nPLAID_ENV=production');
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <section className="glass rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 hover:bg-white/[0.02] transition"
      >
        <div className="flex items-center gap-2">
          <Code2 size={14} className="text-accent-blue" />
          <div className="text-left">
            <div className="text-[10px] tracking-[0.28em] text-slate-500 uppercase">Developer Panel</div>
            <div className="text-[14.5px] font-semibold text-slate-100">
              BofA / Chase / Morgan Stanley Bridge · Plaid + OAuth 2.0
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip chip-ms">
            <ShieldCheck size={10} /> Read-only
          </span>
          <span className="chip text-slate-300">{open ? 'Hide' : 'Show'}</span>
          {open ? (
            <ChevronDown size={14} className="text-slate-400" />
          ) : (
            <ChevronRight size={14} className="text-slate-500" />
          )}
        </div>
      </button>

      {open && (
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <InfoTile icon={Plug} label="Connector" value="Plaid Production" tone="green" />
            <InfoTile icon={Key} label="Auth Flow" value="OAuth 2.0 · PKCE" tone="blue" />
            <InfoTile icon={Link2} label="Webhook" value="ITEM · HOLDINGS · TXN" tone="violet" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-white/5 bg-navy-950/60 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="mono text-[11px] text-slate-500">.env</span>
              <span className="mono text-[12px] text-slate-200">PLAID_CLIENT_ID</span>
              <span className="mono text-[11px] text-slate-500">→</span>
              <span className="mono text-[12px] text-ms-400">••••••••</span>
            </div>
            <button
              onClick={copy}
              className="chip text-slate-300 hover:text-slate-100 hover:border-white/20"
            >
              {copied ? <Check size={10} className="text-ms-400" /> : <Copy size={10} />}
              {copied ? 'Copied' : 'Copy env'}
            </button>
          </div>

          <div className="space-y-3">
            {flow.map((s, i) => (
              <Step
                key={s.step}
                s={s}
                open={expanded === i}
                onToggle={() => setExpanded(expanded === i ? -1 : i)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-ms-600/25 bg-ms-600/[0.04] px-4 py-3">
            <div className="text-[12px] text-slate-200">
              Once tokens are vaulted, the Single-Source table above reconciles
              <span className="text-ms-400 font-semibold mx-1">every 60 seconds</span>
              against the institution of record.
            </div>
            <span className="chip chip-ms">
              Continue <ArrowRight size={10} />
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

function InfoTile({ icon: Icon, label, value, tone }) {
  const colors = {
    green: 'text-ms-400',
    blue: 'text-accent-blue',
    violet: 'text-accent-violet',
  };
  return (
    <div className="rounded-xl border border-white/5 bg-navy-900/50 p-4">
      <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] text-slate-500 uppercase">
        <Icon size={11} className={colors[tone]} /> {label}
      </div>
      <div className={`mono text-[13.5px] mt-1.5 ${colors[tone]}`}>{value}</div>
    </div>
  );
}
