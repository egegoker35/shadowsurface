'use client';

const PLAN_PRICES: Record<string, number> = { starter: 99, professional: 499, enterprise: 1999 };

export default function UsersTable({ users, onRefresh }: { users: any[]; onRefresh: () => void }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  const upgrade = async (userId: string, plan: string) => {
    if (!confirm(`Upgrade to ${plan}?`)) return;
    try {
      const res = await fetch('/api/admin/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, plan }),
      });
      const data = await res.json();
      if (res.ok) { alert('Upgraded successfully!'); onRefresh(); }
      else alert(data.error || 'Failed to upgrade');
    } catch (e: any) {
      alert('Network error: ' + (e.message || 'Failed'));
    }
  };

  const del = async (userId: string) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      const res = await fetch(`/api/admin/delete-user?id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { alert('Deleted!'); onRefresh(); }
      else alert('Failed to delete');
    } catch (e: any) {
      alert('Error: ' + (e.message || 'Failed'));
    }
  };

  const makeAdmin = async (userId: string) => {
    if (!confirm('Make this user admin?')) return;
    try {
      const res = await fetch('/api/admin/make-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) { alert('User is now admin!'); onRefresh(); }
      else alert(data.error || 'Failed');
    } catch (e: any) {
      alert('Network error: ' + (e.message || 'Failed'));
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-800">
        <h3 className="text-xl font-bold">All Users</h3>
        <p className="text-sm text-slate-500 mt-1">{users.length} registered users</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-950/60 border-b border-slate-800">
            <tr><th className="px-8 py-4 font-semibold">Email</th><th className="px-8 py-4 font-semibold">Role</th><th className="px-8 py-4 font-semibold">Plan</th><th className="px-8 py-4 font-semibold">Verified</th><th className="px-8 py-4 font-semibold">Joined</th><th className="px-8 py-4 font-semibold text-right">Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                <td className="px-8 py-5 font-semibold text-white">{u.email}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{u.role?.toUpperCase()}</span>
                </td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium capitalize">{u.org?.plan || 'starter'}</span>
                </td>
                <td className="px-8 py-5">{u.verified ? <span className="text-emerald-400">●</span> : <span className="text-slate-600">○</span>}</td>
                <td className="px-8 py-5 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-8 py-5 text-right">
                  <div className="flex gap-1.5 justify-end items-center">
                    {Object.keys(PLAN_PRICES).map(p => (
                      <button key={p} onClick={() => upgrade(u.id, p)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors capitalize ${u.org?.plan === p ? 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}>{p.slice(0,3)}</button>
                    ))}
                    <button onClick={() => makeAdmin(u.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-violet-700/50 text-violet-400 hover:bg-violet-600/20 transition-colors" disabled={u.role === 'admin'}>{u.role === 'admin' ? 'Admin' : 'Make Admin'}</button>
                    <button onClick={() => del(u.id)} className="ml-2 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-700/50 text-red-400 hover:bg-red-600/20 transition-colors">Del</button>
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
