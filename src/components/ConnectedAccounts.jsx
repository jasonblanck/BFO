import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Plug,
  Plus,
  Pencil,
  Trash2,
  Archive,
  ArchiveRestore,
  Download,
  Upload,
  RotateCcw,
  Save,
  X,
  Link2,
  ShieldCheck,
  AlertTriangle,
  Search,
  Unlink,
  RefreshCw,
  History,
  LogIn,
  LogOut,
  CircleAlert,
  Send,
} from 'lucide-react';
import useManualAccounts from '../hooks/useManualAccounts';
import usePlaidInstitutions from '../hooks/usePlaidInstitutions';
import useAuditLog from '../hooks/useAuditLog';
import PlaidLinkButton from './PlaidLinkButton';
import BackupCodesPanel from './BackupCodesPanel';
import {
  upsert,
  remove,
  setArchived,
  resetToSeed,
  exportJSON,
  importJSON,
  makeId,
} from '../data/accountsStore';
import { categoryColor } from '../data/portfolio';

const CATEGORIES = [
  'Real Estate',
  'Private Equity',
  'Fixed Income',
  'Brokerage',
  'Digital Assets',
  'Collectibles',
];

function usd(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function blankRow() {
  return { id: '', name: '', category: 'Private Equity', opened: todayStr(), value: 0, archived: false };
}

function todayStr() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

export default function ConnectedAccounts({ onBack }) {
  const rows = useManualAccounts({ includeArchived: true });
  const { institutions: linkedInstitutions, status: plaidStatus, refresh: refreshPlaid } = usePlaidInstitutions();
  const { events: auditEvents, status: auditStatus, refresh: refreshAudit } = useAuditLog({ limit: 50 });
  const fileRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(blankRow());
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState('');
  const [importErr, setImportErr] = useState('');
  const [unlinkingId, setUnlinkingId] = useState(null);

  const handleLinked = () => { refreshPlaid(); };
  const handleUnlink = async (institution) => {
    if (!confirm(`Unlink ${institution.institution_name}? The dashboard will revert to seed data for this institution.`)) return;
    setUnlinkingId(institution.institution_id);
    try {
      await fetch('/api/plaid/institutions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ institution_id: institution.institution_id }),
      });
    } catch (_) { /* ignore — we'll refresh regardless */ }
    await refreshPlaid();
    setUnlinkingId(null);
  };

  const totals = useMemo(() => {
    const active   = rows.filter((r) => !r.archived);
    const archived = rows.filter((r) =>  r.archived);
    return {
      activeCount: active.length,
      archivedCount: archived.length,
      activeValue: active.reduce((s, r) => s + (Number(r.value) || 0), 0),
    };
  }, [rows]);

  const filtered = useMemo(() => {
    if (!filter.trim()) return rows;
    const q = filter.toLowerCase();
    return rows.filter((r) =>
      (r.name || '').toLowerCase().includes(q) ||
      (r.category || '').toLowerCase().includes(q),
    );
  }, [rows, filter]);

  const startEdit = (row) => {
    setAdding(false);
    setEditingId(row.id);
    setDraft({ ...row });
  };
  const startAdd = () => {
    setEditingId(null);
    setAdding(true);
    setDraft(blankRow());
  };
  const cancel = () => {
    setEditingId(null);
    setAdding(false);
    setDraft(blankRow());
  };
  const save = () => {
    const name = (draft.name || '').trim();
    if (!name) return;
    const value = Number(draft.value);
    const entry = {
      id: editingId || draft.id || makeId(name),
      name,
      category: draft.category,
      opened: draft.opened || todayStr(),
      value: Number.isFinite(value) ? value : 0,
      archived: !!draft.archived,
    };
    upsert(entry);
    cancel();
  };
  const handleRemove = (id) => {
    if (!confirm('Delete this entry permanently? Use Archive if you just want to hide it.')) return;
    remove(id);
  };

  const downloadExport = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bci-manual-accounts-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  const triggerImport = () => fileRef.current?.click();
  const handleImportFile = async (e) => {
    setImportErr('');
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    try {
      const text = await file.text();
      importJSON(text);
    } catch (err) {
      setImportErr(`Import failed · ${err?.message || 'invalid file'}`);
    }
  };
  const handleReset = () => {
    if (!confirm('Reset all manual accounts back to the seeded list? Your local edits will be lost.')) return;
    resetToSeed();
    cancel();
  };

  const editorOpenForId = (id) => editingId === id;

  return (
    <div className="min-h-screen pt-[40px] px-2 sm:px-4 pb-24">
      {/* Page header — matches the dashboard's panel header conventions */}
      <header className="panel hud-corners mt-3 sm:mt-4 px-4 sm:px-5 py-4 relative">
        <span className="corner-tl" /><span className="corner-br" />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="h-8 w-8 flex items-center justify-center border border-white/10 bg-black/40 text-slate-300 hover:text-white hover:border-ms-600/40 transition rounded-sm"
              aria-label="Back to dashboard"
              title="Back to dashboard"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="min-w-0">
              <div className="mono text-[10px] tracking-[0.32em] text-slate-400 uppercase">
                Blanck Capital · Settings
              </div>
              <h1 className="text-[18px] sm:text-[20px] font-semibold text-slate-100 leading-tight">
                Connected Accounts
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="chip">
              <Plug size={10} /> {totals.activeCount} active
            </span>
            {totals.archivedCount > 0 && (
              <span className="chip text-slate-400">{totals.archivedCount} archived</span>
            )}
            <span className="chip chip-ms">
              <ShieldCheck size={10} /> {usd(totals.activeValue)} total
            </span>
          </div>
        </div>
      </header>

      {/* Section · Linked Institutions (Plaid) */}
      <section className="panel mt-4">
        <div className="panel-header">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link2 size={14} className="text-ms-400 shrink-0" />
            <div className="min-w-0">
              <div className="panel-subtitle">Plaid · OAuth 2.0</div>
              <div className="panel-title truncate">Linked Institutions</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PlaidStatusChip status={plaidStatus} count={linkedInstitutions.length} />
            <button
              onClick={refreshPlaid}
              title="Refresh"
              aria-label="Refresh linked institutions"
              className="h-7 w-7 flex items-center justify-center border border-white/10 bg-black/40 text-slate-400 hover:text-white hover:border-ms-600/40 transition rounded-sm"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>

        {linkedInstitutions.length > 0 ? (
          <div className="divide-y divide-white/5">
            {linkedInstitutions.map((inst) => (
              <div key={inst.institution_id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-8 w-8 rounded-sm border border-white/10 bg-ms-600/10 flex items-center justify-center shrink-0">
                  <Link2 size={13} className="text-ms-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-slate-100 truncate">{inst.institution_name}</div>
                  <div className="mono text-[10.5px] text-slate-500">
                    linked {inst.linked_at ? new Date(inst.linked_at).toLocaleDateString() : '—'}
                    <span className="mx-1.5 text-slate-700">·</span>
                    ID {inst.institution_id}
                  </div>
                </div>
                <button
                  onClick={() => handleUnlink(inst)}
                  disabled={unlinkingId === inst.institution_id}
                  className="mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-1.5 px-2.5 h-7 border border-white/10 bg-black/40 text-slate-400 hover:text-loss-500 hover:border-loss-500/40 transition rounded-sm disabled:opacity-50"
                >
                  <Unlink size={11} /> {unlinkingId === inst.institution_id ? 'Unlinking…' : 'Unlink'}
                </button>
              </div>
            ))}
            <div className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="mono text-[10px] text-slate-500 tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={11} className="text-ms-400" />
                Additive only · seed data is preserved until you explicitly override
              </div>
              <PlaidLinkButton onLinked={handleLinked} />
            </div>
          </div>
        ) : (
          <div className="px-5 py-8 sm:py-10 flex flex-col items-center justify-center text-center gap-2">
            <div className="h-10 w-10 rounded-full border border-white/10 bg-black/40 flex items-center justify-center">
              <Plug size={16} className="text-slate-500" />
            </div>
            <div className="mono text-[11px] tracking-[0.22em] text-slate-400 uppercase">
              No institutions linked
            </div>
            <p className="text-[12.5px] text-slate-500 max-w-md leading-relaxed">
              {plaidStatus === 'unavailable'
                ? 'Plaid backend not reachable — once deployed, institutions you connect will appear here alongside the existing seed data.'
                : 'Connect a bank, brokerage, or 529 via Plaid. Linked accounts render additively — your current dashboard values stay as-is until you explicitly override a row.'}
            </p>
            <div className="mt-2">
              <PlaidLinkButton onLinked={handleLinked} />
            </div>
          </div>
        )}
      </section>

      {/* Section · Manual Entries */}
      <section className="panel mt-4">
        <div className="panel-header">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Pencil size={14} className="text-ms-400 shrink-0" />
            <div className="min-w-0">
              <div className="panel-subtitle">Direct holdings · SPVs · Real assets</div>
              <div className="panel-title truncate">Manual Entries</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 border border-white/10 bg-black/40 px-2.5 py-1.5 rounded-sm">
              <Search size={11} className="text-slate-500" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter…"
                className="bg-transparent outline-none mono text-[11px] text-slate-100 placeholder:text-slate-600 w-32"
                aria-label="Filter manual entries"
              />
            </div>
            <button
              onClick={startAdd}
              className="mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-1.5 px-3 h-8 bg-ms-600 text-white hover:bg-ms-500 transition rounded-sm shadow-glow-blue"
            >
              <Plus size={12} /> Add entry
            </button>
          </div>
        </div>

        {/* Add row sits at the top; edit rows render in place */}
        {adding && (
          <EditorRow
            draft={draft}
            setDraft={setDraft}
            onSave={save}
            onCancel={cancel}
            label="New entry"
          />
        )}

        <div className="overflow-x-auto">
          <table className="w-full mono text-[12px] min-w-[700px]">
            <thead>
              <tr className="text-left text-slate-500 uppercase tracking-[0.18em] text-[10px] border-b border-white/5">
                <th className="px-4 py-2.5 font-normal">Name</th>
                <th className="px-3 py-2.5 font-normal">Category</th>
                <th className="px-3 py-2.5 font-normal">Opened</th>
                <th className="px-3 py-2.5 font-normal text-right">Value</th>
                <th className="px-3 py-2.5 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500 text-[12px]">
                    {filter ? `No entries match "${filter}"` : 'No manual entries — click Add entry to get started.'}
                  </td>
                </tr>
              )}
              {filtered.map((row) => editorOpenForId(row.id) ? (
                <tr key={row.id}>
                  <td colSpan={5} className="p-0">
                    <EditorRow
                      draft={draft}
                      setDraft={setDraft}
                      onSave={save}
                      onCancel={cancel}
                      label={`Editing · ${row.name}`}
                    />
                  </td>
                </tr>
              ) : (
                <tr key={row.id} className={`hover:bg-white/[0.02] ${row.archived ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ background: categoryColor[row.category] ?? '#64748B' }}
                      />
                      <span className="text-slate-100 truncate">{row.name}</span>
                      {row.archived && (
                        <span className="chip text-slate-500 text-[9px]">archived</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-300">{row.category}</td>
                  <td className="px-3 py-2.5 text-slate-400">{row.opened}</td>
                  <td className="px-3 py-2.5 text-right text-slate-100">{usd(row.value)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn onClick={() => startEdit(row)} title="Edit"><Pencil size={12} /></IconBtn>
                      <IconBtn
                        onClick={() => setArchived(row.id, !row.archived)}
                        title={row.archived ? 'Unarchive' : 'Archive'}
                      >
                        {row.archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
                      </IconBtn>
                      <IconBtn onClick={() => handleRemove(row.id)} title="Delete" danger>
                        <Trash2 size={12} />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-t border-white/10 bg-white/[0.012]">
          <div className="mono text-[10px] text-slate-500 tracking-wider">
            Source · localStorage · synced across tabs · awaiting backend
          </div>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />
            <FooterBtn onClick={downloadExport} icon={Download} label="Export JSON" />
            <FooterBtn onClick={triggerImport} icon={Upload}   label="Import JSON" />
            <FooterBtn onClick={handleReset}   icon={RotateCcw} label="Reset to seed" danger />
          </div>
        </div>
        {importErr && (
          <div className="flex items-center gap-2 px-5 py-2 border-t border-loss-500/30 bg-loss-500/5 mono text-[11px] text-loss-500">
            <AlertTriangle size={12} /> {importErr}
          </div>
        )}
      </section>

      <BackupCodesPanel />

      {/* Section · Security Audit Log */}
      <section className="panel mt-4">
        <div className="panel-header">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <History size={14} className="text-ms-400 shrink-0" />
            <div className="min-w-0">
              <div className="panel-subtitle">Authentication · Plaid link events</div>
              <div className="panel-title truncate">Security Audit Log</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <AuditStatusChip status={auditStatus} count={auditEvents.length} />
            <button
              onClick={refreshAudit}
              title="Refresh"
              aria-label="Refresh audit log"
              className="h-7 w-7 flex items-center justify-center border border-white/10 bg-black/40 text-slate-400 hover:text-white hover:border-ms-600/40 transition rounded-sm"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
        {auditStatus === 'unavailable' ? (
          <div className="px-5 py-8 text-center text-[12.5px] text-slate-500">
            Audit log unavailable · requires the backend to be deployed and Redis to be provisioned.
          </div>
        ) : auditEvents.length === 0 ? (
          <div className="px-5 py-8 text-center text-[12.5px] text-slate-500">
            No events yet · login / link / unlink actions will appear here.
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[320px] overflow-y-auto">
            {auditEvents.map((e, i) => (
              <AuditRow key={`${e.ts}-${i}`} event={e} />
            ))}
          </div>
        )}
        <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/10 bg-white/[0.012] mono text-[10px] text-slate-500 tracking-wider">
          <span>Retention · last 500 events · Redis-backed</span>
          <span>Auto-refresh 30s</span>
        </div>
      </section>
    </div>
  );
}

function AuditStatusChip({ status, count }) {
  if (status === 'ok') return <span className="chip chip-ms">{count} events</span>;
  if (status === 'loading' || status === 'idle') return <span className="chip text-slate-400">Loading…</span>;
  if (status === 'unavailable') return <span className="chip text-slate-500">Backend pending</span>;
  if (status === 'error') return <span className="chip text-loss-500">Fetch error</span>;
  return <span className="chip text-slate-400">0 events</span>;
}

const EVENT_META = {
  'login.success':       { icon: LogIn,       color: '#10B981', label: 'Login · success' },
  'login.failed':        { icon: CircleAlert, color: '#FF3B58', label: 'Login · wrong password' },
  'login.ratelimited':   { icon: CircleAlert, color: '#F59E0B', label: 'Login · rate-limited' },
  'login.error':         { icon: CircleAlert, color: '#FF3B58', label: 'Login · server error' },
  'mfa.challenge.sent':  { icon: Send,        color: '#3DA9FC', label: 'MFA · code sent' },
  'mfa.verify.failed':   { icon: CircleAlert, color: '#FF3B58', label: 'MFA · bad code' },
  'mfa.send_failed':     { icon: CircleAlert, color: '#FF3B58', label: 'MFA · Telegram send failed' },
  'mfa.misconfigured':   { icon: CircleAlert, color: '#F59E0B', label: 'MFA · misconfigured' },
  'mfa.error':           { icon: CircleAlert, color: '#FF3B58', label: 'MFA · server error' },
  'logout':              { icon: LogOut,      color: '#64748B', label: 'Logout' },
  'plaid.link':          { icon: Link2,       color: '#3DA9FC', label: 'Plaid · institution linked' },
  'plaid.unlink':        { icon: Unlink,      color: '#8B5CF6', label: 'Plaid · institution unlinked' },
};

function AuditRow({ event }) {
  const meta = EVENT_META[event.event] || { icon: History, color: '#94A3B8', label: event.event };
  const Icon = meta.icon;
  const ts = new Date(event.ts);
  const detail = event.institution_name || event.reason || null;
  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <div
        className="h-7 w-7 shrink-0 flex items-center justify-center rounded-sm"
        style={{ background: `${meta.color}14`, boxShadow: `inset 0 0 0 1px ${meta.color}33` }}
      >
        <Icon size={12} style={{ color: meta.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] text-slate-100 flex items-center gap-2 flex-wrap">
          <span>{meta.label}</span>
          {detail && <span className="text-slate-400">· {detail}</span>}
        </div>
        <div className="mono text-[10px] text-slate-500 truncate">
          {ts.toLocaleString('en-US', { hour12: false })}
          {event.ip && <> · {event.ip}</>}
          {event.ua && <> · {event.ua.slice(0, 60)}{event.ua.length > 60 ? '…' : ''}</>}
        </div>
      </div>
    </div>
  );
}

function IconBtn({ onClick, children, title, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`h-7 w-7 flex items-center justify-center border border-white/10 rounded-sm transition ${
        danger
          ? 'bg-black/40 text-slate-400 hover:text-loss-500 hover:border-loss-500/40'
          : 'bg-black/40 text-slate-400 hover:text-white hover:border-ms-600/40'
      }`}
    >
      {children}
    </button>
  );
}

function FooterBtn({ onClick, icon: Icon, label, danger }) {
  return (
    <button
      onClick={onClick}
      className={`mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-1.5 px-3 h-8 border rounded-sm transition ${
        danger
          ? 'border-white/10 bg-black/40 text-slate-400 hover:text-loss-500 hover:border-loss-500/40'
          : 'border-white/10 bg-black/40 text-slate-300 hover:text-white hover:border-ms-600/40'
      }`}
    >
      <Icon size={11} /> {label}
    </button>
  );
}

function EditorRow({ draft, setDraft, onSave, onCancel, label }) {
  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  return (
    <div className="border-y border-ms-600/30 bg-ms-600/[0.04] px-4 py-3">
      <div className="mono text-[10px] tracking-[0.22em] text-ms-400 uppercase mb-2">
        {label}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <Field className="sm:col-span-5" label="Name">
          <input
            value={draft.name}
            onChange={set('name')}
            placeholder="e.g. New SPV · Series A"
            autoFocus
            className="w-full bg-black/60 border border-white/10 px-2.5 py-2 rounded-sm mono text-[12px] text-slate-100 outline-none focus:border-ms-600 focus:shadow-glow-blue transition placeholder:text-slate-600"
          />
        </Field>
        <Field className="sm:col-span-3" label="Category">
          <select
            value={draft.category}
            onChange={set('category')}
            className="w-full bg-black/60 border border-white/10 px-2.5 py-2 rounded-sm mono text-[12px] text-slate-100 outline-none focus:border-ms-600 focus:shadow-glow-blue transition"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field className="sm:col-span-2" label="Opened (MM/DD/YYYY)">
          <input
            value={draft.opened}
            onChange={set('opened')}
            placeholder="04/18/2026"
            className="w-full bg-black/60 border border-white/10 px-2.5 py-2 rounded-sm mono text-[12px] text-slate-100 outline-none focus:border-ms-600 focus:shadow-glow-blue transition placeholder:text-slate-600"
          />
        </Field>
        <Field className="sm:col-span-2" label="Value (USD)">
          <input
            type="number"
            inputMode="decimal"
            value={draft.value}
            onChange={set('value')}
            placeholder="0"
            className="w-full bg-black/60 border border-white/10 px-2.5 py-2 rounded-sm mono text-[12px] text-slate-100 outline-none focus:border-ms-600 focus:shadow-glow-blue transition text-right placeholder:text-slate-600"
          />
        </Field>
      </div>
      <div className="flex items-center justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          className="mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-1.5 px-3 h-8 border border-white/10 bg-black/40 text-slate-400 hover:text-white hover:border-white/25 transition rounded-sm"
        >
          <X size={11} /> Cancel
        </button>
        <button
          onClick={onSave}
          disabled={!draft.name?.trim()}
          className={`mono text-[10px] tracking-[0.22em] uppercase flex items-center gap-1.5 px-3 h-8 transition rounded-sm ${
            draft.name?.trim()
              ? 'bg-ms-600 text-white hover:bg-ms-500 shadow-glow-blue'
              : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed'
          }`}
        >
          <Save size={11} /> Save
        </button>
      </div>
    </div>
  );
}

function PlaidStatusChip({ status, count }) {
  if (status === 'ok') return <span className="chip chip-ms">{count} linked</span>;
  if (status === 'loading' || status === 'idle') return <span className="chip text-slate-400">Syncing…</span>;
  if (status === 'unavailable') return <span className="chip text-slate-500">Backend pending</span>;
  if (status === 'error') return <span className="chip text-loss-500">Sync error</span>;
  return <span className="chip text-slate-400">0 linked</span>;
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <div className="mono text-[9.5px] tracking-[0.22em] text-slate-500 uppercase mb-1">
        {label}
      </div>
      {children}
    </label>
  );
}
