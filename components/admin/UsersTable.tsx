'use client';

const PLAN_PRICES: Record<string, number> = { starter: 99, professional: 499, enterprise: 1999 };

export default function UsersTable({ users, onRefresh }: { users: any[]; onRefresh: () => void }) {
  const upgrade = async (userId: string, plan: string) => {
    if (!confirm(`Upgrade to ${plan}?`)) return;
    const res = await fetch('/api/admin/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan }),
    });
    if (res.ok) { alert('Upgraded!'); onRefresh(); }
    else alert('Failed');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800"><h3 className="text-lg font-semibold">Users ({users.length})</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
            <tr><th className="px-6 py-3">Email</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Plan</th><th className="px-6 py-3">Verified</th><th className="px-6 py-3">Joined</th><th className="px-6 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="px-6 py-4 font-medium">{u.email}</td>
                <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-xs ${u.role === 'admin' ? 'bg-violet-900/40 text-violet-300' : 'bg-slate-800 text-slate-400'}`}>{u.role}</span></td>
                <td className="px-6 py-4"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs capitalize">{u.org?.plan || 'starter'}</span></td>
                <td className="px-6 py-4">{u.verified ? '✅' : '❌'}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  {Object.keys(PLAN_PRICES).map(p => (
                    <button key={p} onClick={() => upgrade(u.id, p)} className="text-xs text-emerald-400 hover:text-emerald-300 font-bold mr-2 capitalize">{p}</button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
