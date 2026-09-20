'use client';

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

export default function UsersTable({ users, onRefresh }: { users: any[]; onRefresh: () => void }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_admin_token') : null;

  const upgrade = async (userId: string, plan: string) => {
    try {
      const res = await fetch('/api/admin/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, plan }),
      });
      if (res.ok) onRefresh();
    } catch { /* silent */ }
  };

  const del = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/delete-user?id=${userId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) onRefresh();
    } catch { /* silent */ }
  };

  const setRole = async (userId: string, role: string) => {
    try {
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, role }),
      });
      if (res.ok) onRefresh();
    } catch { /* silent */ }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
      <div className="px-7 py-5 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">All Users</h3>
          <p className="text-xs text-slate-500 mt-0.5">{users.length} registered accounts</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700">{users.length} total</span>
      </div>
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
              <tr><td colSpan={6} className="px-7 py-16 text-center text-slate-500">
                <div className="text-3xl mb-3 opacity-40">👥</div>
                <p className="text-sm">No users yet</p>
              </td></tr>
            )}
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-7 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full ${avatarColor(u.email)} flex items-center justify-center text-xs font-bold text-white shrink-0`}>{initials(u.email)}</div>
                    <div>
                      <div className="font-semibold text-white">{u.email}</div>
                      <div className="text-[11px] text-slate-500">{u.id.slice(0, 8)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-7 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${u.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    {u.role === 'admin' ? '🛡 ADMIN' : 'USER'}
                  </span>
                </td>
                <td className="px-7 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border ${PLAN_STYLES[u.org?.plan] || PLAN_STYLES.free}`}>{u.org?.plan || 'free'}</span>
                </td>
                <td className="px-7 py-4">
                  {u.verified ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-slate-600 text-xs">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Unverified
                    </span>
                  )}
                </td>
                <td className="px-7 py-4 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td className="px-7 py-4">
                  <div className="flex gap-1.5 justify-end items-center">
                    {['free', 'starter', 'professional', 'enterprise'].map(p => (
                      <button
                        key={p}
                        onClick={() => upgrade(u.id, p)}
                        title={`Set plan: ${p}`}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-colors capitalize ${u.org?.plan === p ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30' : 'bg-slate-800/80 text-slate-500 border-slate-700 hover:bg-slate-700 hover:text-slate-300'}`}
                      >
                        {p.slice(0, 3)}
                      </button>
                    ))}
                    {u.role === 'admin' && u.email !== 'egegoker35@gmail.com' && (
                      <button onClick={() => setRole(u.id, 'user')} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-orange-700/50 text-orange-400 hover:bg-orange-600/20 transition-colors" title="Remove admin">Demote</button>
                    )}
                    <button onClick={() => del(u.id)} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-red-700/50 text-red-400 hover:bg-red-600/20 transition-colors" title="Delete user">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
