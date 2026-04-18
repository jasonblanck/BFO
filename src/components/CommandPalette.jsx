import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDown,
  ArrowUp,
  Command as CmdIcon,
  CornerDownLeft,
  Building2,
  Rocket,
  Sparkles,
  Zap,
} from 'lucide-react';
import { institutions, ventures, venturesById } from '../data/portfolio';
import useManualAccounts from '../hooks/useManualAccounts';

// Tiny fuzzy score — subsequence match with contiguous-run bonus.
function fuzzyScore(item, query) {
  if (!query) return 0;
  const q = query.toLowerCase();
  const s = item.toLowerCase();
  if (!s.length) return -1;
  if (s.includes(q)) return 100 - s.indexOf(q);
  let si = 0, score = 0, streak = 0;
  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi];
    let found = false;
    while (si < s.length) {
      if (s[si] === ch) {
        score += 1 + streak;
        streak = Math.min(streak + 1, 4);
        si++;
        found = true;
        break;
      }
      si++;
      streak = 0;
    }
    if (!found) return -1;
  }
  return score;
}

const COMMANDS = [
  { kind: 'cmd', id: 'cmd-refresh',  label: 'Refresh market data',     hint: '⌘R',           run: () => window.location.reload() },
  { kind: 'cmd', id: 'cmd-toggle-theme', label: 'Toggle Day / Night theme', hint: 'Sun / Moon', run: 'theme' },
  { kind: 'cmd', id: 'cmd-toggle-view',  label: 'Toggle Desktop / Mobile preview', hint: '⌘D / ⌘M', run: 'view' },
  { kind: 'cmd', id: 'cmd-open-ms',  label: 'Open Morgan Stanley',     hint: 'Account',      run: 'focus:ms-brokerage' },
  { kind: 'cmd', id: 'cmd-dev',      label: 'Jump to Developer Panel', hint: 'Scroll',       run: 'scroll:#dev-panel' },
];

function buildIndex(manualAccounts) {
  const out = [];

  // Commands first
  COMMANDS.forEach((c) => out.push({ ...c, searchable: c.label + ' ' + c.hint }));

  // Institutional accounts
  institutions.forEach((inst) => {
    inst.accounts.forEach((acct) => {
      out.push({
        kind: 'account',
        id: acct.id,
        label: acct.name,
        sub: inst.name,
        hint: acct.assets.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
        institution: inst,
        account: acct,
        searchable: `${acct.name} ${inst.name} ${acct.owner || ''}`,
      });
    });
  });

  // Manual holdings — sourced from the live store
  manualAccounts.forEach((m) => {
    out.push({
      kind: 'holding',
      id: m.id,
      label: m.name,
      sub: m.category,
      hint: (Number(m.value) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      holding: m,
      searchable: `${m.name} ${m.category}`,
    });
  });

  // Ventures
  ventures.forEach((v) => {
    out.push({
      kind: 'venture',
      id: `venture-${v.id}`,
      label: v.name,
      sub: `${v.tag} · ${v.round}`,
      hint: v.mark,
      venture: v,
      searchable: `${v.name} ${v.tag} ${v.round}`,
    });
  });

  return out;
}

const KIND_META = {
  cmd:      { icon: Zap,       color: '#F59E0B', label: 'Command' },
  account:  { icon: Building2, color: '#005EB8', label: 'Account' },
  holding:  { icon: Sparkles,  color: '#8B5CF6', label: 'Holding' },
  venture:  { icon: Rocket,    color: '#10B981', label: 'Venture' },
};

export default function CommandPalette({
  open,
  onClose,
  onSelectAccount,
  onOpenDeepDive,
  onCommand,
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const manualAccounts = useManualAccounts();
  const items = useMemo(() => buildIndex(manualAccounts), [manualAccounts]);

  const results = useMemo(() => {
    if (!query.trim()) return items.slice(0, 20);
    return items
      .map((it) => ({ it, s: fuzzyScore(it.searchable, query) }))
      .filter((r) => r.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 20)
      .map((r) => r.it);
  }, [query, items]);

  // Reset state on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  // Keep active index in bounds
  useEffect(() => {
    setActive((a) => Math.max(0, Math.min(a, results.length - 1)));
  }, [results.length]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); return; }
      if (e.key === 'Enter')     { e.preventDefault(); pick(results[active]); return; }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, active]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[active];
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function pick(item) {
    if (!item) return;
    if (item.kind === 'account' && onSelectAccount) {
      onSelectAccount(item.account, item.institution);
    } else if (item.kind === 'venture' && onOpenDeepDive) {
      onOpenDeepDive(item.venture);
    } else if (item.kind === 'holding') {
      const vid = venturesById[item.holding.id];
      if (vid && onOpenDeepDive) {
        const v = ventures.find((x) => x.id === vid);
        if (v) onOpenDeepDive(v);
      }
    } else if (item.kind === 'cmd' && onCommand) {
      onCommand(item.run);
    }
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center pt-[10vh] px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl glass-strong overflow-hidden"
        style={{ borderRadius: 4 }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <Search size={14} className="text-ms-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search accounts, holdings, ventures, commands…"
            aria-label="Search"
            className="flex-1 bg-transparent outline-none text-[14px] text-slate-100 placeholder:text-slate-500"
          />
          <span className="chip">ESC</span>
        </div>

        {/* Results list */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
          {results.length === 0 && (
            <div className="px-5 py-8 text-center mono text-[11px] text-slate-500">
              No matches for "<span className="text-slate-300">{query}</span>"
            </div>
          )}
          {results.map((r, i) => {
            const Meta = KIND_META[r.kind] ?? KIND_META.cmd;
            const Icon = Meta.icon;
            const isActive = i === active;
            return (
              <button
                key={r.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                  isActive ? 'bg-ms-600/15' : 'hover:bg-white/[0.03]'
                }`}
              >
                <span
                  className="h-7 w-7 flex items-center justify-center rounded-sm shrink-0"
                  style={{
                    background: `${Meta.color}18`,
                    boxShadow: `inset 0 0 0 1px ${Meta.color}40`,
                  }}
                >
                  <Icon size={13} style={{ color: Meta.color }} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-white truncate">{r.label}</div>
                  {r.sub && (
                    <div className="mono text-[10.5px] text-slate-500 tracking-wider uppercase truncate">
                      {Meta.label} · {r.sub}
                    </div>
                  )}
                </div>
                {r.hint && (
                  <span className="mono text-[11px] text-slate-400 shrink-0">{r.hint}</span>
                )}
                {isActive && <ArrowUpRight size={12} className="text-ms-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 bg-white/[0.015]">
          <div className="flex items-center gap-3 mono text-[10px] text-slate-500 tracking-wider">
            <span className="flex items-center gap-1"><ArrowUp size={10} /><ArrowDown size={10} /> navigate</span>
            <span className="flex items-center gap-1"><CornerDownLeft size={10} /> select</span>
            <span className="flex items-center gap-1"><CmdIcon size={10} /> K toggles</span>
          </div>
          <span className="mono text-[10px] text-slate-500">{results.length} results</span>
        </div>
      </div>
    </div>
  );
}
