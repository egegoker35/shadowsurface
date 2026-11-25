'use client';
import { useState } from 'react';
import Pagination from './Pagination';

const PLAN_STYLES: Record<string, string> = {
  free: 'bg-slate-800/80 text-slate-400 border-slate-700',
  starter: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
  professional: 'bg-violet-500/10 text-violet-400 border-violet-500/25',
  enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
};

const AVATAR_COLORS = ['bg-emerald-600', 'bg-blue-600', 'bg-violet-600', 'bg-pink-600', 'bg-amber-600', 'bg-cyan-600'];

function initials(email: string) {
  const name = (email || '?').split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim().split(/\s+/);
  return ((name[0]?.[0] || '?') + (name[1]?.[0] || '')).toUpperCase() || '?';
}

function avatarColor(email: string) {
  let h = 0;
  for (let i = 0; i < (email || '').length; i++) h = (h * 31 + email.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function planState(org: any) {
  if (!org?.planExpiresAt || (org?.plan || 'free') === 'free') return null;
  const days = Math.ceil((new Date(org.planExpiresAt).getTime() - Date.now()) / 86400000);
  if (days < 0) return { text: `expired ${Math.abs(days)}d ago`, tone: 'text-red-400' };
  if (days <= 7) return { text: `${days}d left`, tone: 'text-amber-400' };
  return { text: `${days}d left`, tone: 'text-slate-500' };
}

export default function UsersTable({
  users,
  total,
  page,
  pages,
  pageSize,
  onPage,
  onRefresh,
}: {
  users: any[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  onPage: (p: number) => void;
  onRefresh: () => void;
}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_admin_token') : null;
  const [notice, setNotice] = useState('');
  const [tempCred, setTempCred] = useState<{ email: string; password: string } | null>(null);

  const call = async (url: string, init: RequestInit) => {
    setNotice('');
    const res = await fetch(url, init);
    if (res.ok) onRefresh();
    else {
      const d = await res.json().catch(() => ({}));
      setNotice(d.error || 'The action failed.');
    }
  };

  const resetPassword = async (u: any) => {
    if (!confirm(`Issue a temporary password for ${u.email}? Their current password stops working immediately.`)) return;
    setNotice('');
    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: u.id }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) {
      setNotice(d.error || 'Password reset failed.');
      return;
    }
    setTempCred({ email: d.email || u.email, password: d.tempPassword });
  };

  const upgrade = (userId: string, plan: string) =>
    call('/api/admin/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, plan }),
    });

  const del = (userId: string) => {
    if (!confirm('Delete this account? Their scans stay in the database for audit.')) return;
    call(`/api/admin/delete-user?id=${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  };

  const toggleOwnership = (orgId: string, enabled: boolean) =>
    call('/api/admin/toggle-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orgId, enabled }),
    });

  const setRole = (userId: string, role: string) =>
    call('/api/admin/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId, role }),
    });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
      <div className="px-7 py-5 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Users</h3>
          <p className="text-xs text-slate-500 mt-0.5">{total} account(s) match this view</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700">
          {total} total
        </span>
      </div>
      {tempCred && (
        <div className="mx-7 mt-5 rounded-xl border border-emerald-600/40 bg-emerald-500/10 px-4 py-3">
          <div className="text-sm font-semibold text-emerald-300">Temporary password for {tempCred.email}</div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <code className="font-mono text-white bg-slate-950/70 border border-slate-700 px-2.5 py-1 rounded text-sm">{tempCred.password}</code>
            <button
              onClick={() => navigator.clipboard?.writeText(tempCred.password)}
              className="text-[11px] font-bold text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
            >
              Copy
            </button>
            <button onClick={() => setTempCred(null)} className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2">
              Dismiss
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5">Shown once and stored only as a hash. Deliver it over a secure channel.</p>
        </div>
      )}
      {notice && (
        <div className="mx-7 mt-5 rounded-xl border border-red-600/40 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">{notice}</div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-slate-950/60 border-b border-slate-800">
            <tr>
              <th className="px-7 py-3.5 font-semibold">User</th>
              <th className="px-7 py-3.5 font-semibold">Role</th>
              <th className="px-7 py-3.5 font-semibold">Plan</th>
              <th className="px-7 py-3.5 font-semibold">Verified</th>
              <th className="px-7 py-3.5 font-semibold">Joined</th>
              <th className="px-7 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-7 py-16 text-center text-slate-500 text-sm">
                  No accounts match this search.
                </td>
              </tr>
            )}
            {users.map((u: any) => {
              const state = planState(u.org);
              return (
                <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-7 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${avatarColor(u.email)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>
                        {initials(u.email)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{u.email}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.id.slice(0, 8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-7 py-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                        u.role === 'admin'
                          ? 'bg-violet-500/10 text-violet-400 border-violet-500/25'
                          : u.role === 'client'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/25'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {u.role === 'admin' ? 'ADMIN' : u.role === 'client' ? 'READ-ONLY' : 'USER'}
                    </span>
                  </td>
                  <td className="px-7 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border ${PLAN_STYLES[u.org?.plan] || PLAN_STYLES.free}`}>
                      {u.org?.plan || 'free'}
                    </span>
                    {state && <div className={`text-[10px] mt-1 ${state.tone}`}>{state.text}</div>}
                  </td>
                  <td className="px-7 py-4">
                    <span className={`text-xs font-semibold ${u.verified ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {u.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-7 py-4 text-slate-500 text-xs">
                    {new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="px-7 py-4">
                    <div className="flex gap-1.5 justify-end items-center">
                      {['free', 'starter', 'professional', 'enterprise'].map((p) => (
                        <button
                          key={p}
                          onClick={() => upgrade(u.id, p)}
                          title={`Set plan: ${p} (one billing period)`}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors capitalize ${
                            u.org?.plan === p
                              ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30'
                              : 'bg-slate-800/80 text-slate-500 border-slate-700 hover:bg-slate-700 hover:text-slate-300'
                          }`}
                        >
                          {p.slice(0, 3)}
                        </button>
                      ))}
                      <button
                        onClick={() => resetPassword(u)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-sky-700/50 text-sky-400 hover:bg-sky-600/20 transition-colors"
                        title="Issue a temporary password"
                      >
                        Reset PW
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => setRole(u.id, u.role === 'client' ? 'user' : 'client')}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-orange-700/50 text-orange-400 hover:bg-orange-600/20 transition-colors"
                          title={u.role === 'client' ? 'Allow this account to start scans again' : 'Make read-only: can view reports, cannot start scans'}
                        >
                          {u.role === 'client' ? 'Editor' : 'Read-only'}
                        </button>
                      )}
                      {u.orgId && (
                        <button
                          onClick={() => toggleOwnership(u.orgId, !u.org?.requireDomainVerification)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors ${
                            u.org?.requireDomainVerification
                              ? 'border-emerald-700/50 text-emerald-400 bg-emerald-600/10'
                              : 'border-slate-700 text-slate-500 hover:text-slate-300'
                          }`}
                          title="Only allow scans of domains this organization has verified with a DNS TXT record"
                        >
                          {u.org?.requireDomainVerification ? 'Verified-only' : 'Any domain'}
                        </button>
                      )}
                      <button
                        onClick={() => del(u.id)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-red-700/50 text-red-400 hover:bg-red-600/20 transition-colors"
                        title="Delete account"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} total={total} shown={pageSize} onPage={onPage} />
    </div>
  );
}
