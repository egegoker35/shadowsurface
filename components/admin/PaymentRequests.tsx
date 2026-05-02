'use client';

export default function PaymentRequests({ leads, onRefresh }: { leads: any[]; onRefresh: () => void }) {
  const approve = async (lead: any) => {
    if (!confirm(`Approve ${lead.plan} plan for ${lead.email}?`)) return;
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lead.email, plan: lead.plan }),
    });
    if (res.ok) { alert('Approved! User upgraded.'); onRefresh(); }
    else alert('Failed');
  };

  const del = async (id: string) => {
    if (!confirm('Delete this lead permanently?')) return;
    const token = localStorage.getItem('ss_token');
    const res = await fetch(`/api/leads?id=${id}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) { onRefresh(); }
    else alert('Failed to delete');
  };

  const statusColors: Record<string, string> = {
    new: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Payment Requests</h3>
          <p className="text-sm text-slate-500 mt-1">{leads.length} total requests</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-950/60 border-b border-slate-800">
            <tr>
              <th className="px-8 py-4 font-semibold">Customer</th>
              <th className="px-8 py-4 font-semibold">Plan</th>
              <th className="px-8 py-4 font-semibold">Status</th>
              <th className="px-8 py-4 font-semibold">Date</th>
              <th className="px-8 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500">
                <div className="text-4xl mb-3">📭</div>
                <p>No payment requests yet</p>
              </td></tr>
            )}
            {leads.map((l: any) => (
              <tr key={l.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                <td className="px-8 py-5">
                  <div className="font-semibold text-white">{l.name}</div>
                  <div className="text-emerald-400 text-xs mt-0.5">{l.email}</div>
                </td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium capitalize">{l.plan}</span>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[l.status || 'new'] || statusColors.new}`}>{(l.status || 'new').toUpperCase()}</span>
                </td>
                <td className="px-8 py-5 text-slate-500">{new Date(l.createdAt).toLocaleDateString()}</td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => approve(l)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-xs font-bold transition-colors mr-2">
                    ✓ Approve
                  </button>
                  <button onClick={() => del(l.id)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 text-xs font-bold transition-colors">
                    ✕ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
