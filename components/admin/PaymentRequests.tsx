'use client';

export default function PaymentRequests({ leads, onRefresh }: { leads: any[]; onRefresh: () => void }) {
  const approve = async (lead: any) => {
    if (!confirm(`Approve ${lead.plan} plan for ${lead.email}?`)) return;
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: lead.email, plan: lead.plan }),
    });
    if (res.ok) { alert('Approved!'); onRefresh(); }
    else alert('Failed');
  };

  const del = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    const res = await fetch(`/api/leads?id=${id}`, { method: 'DELETE' });
    if (res.ok) onRefresh();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Requests ({leads.length})</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Plan</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No payment requests yet</td></tr>
            )}
            {leads.map((l: any) => (
              <tr key={l.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium">{l.name}</td>
                <td className="px-6 py-4 text-emerald-400">{l.email}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs capitalize">{l.plan}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs ${l.status === 'new' ? 'bg-yellow-900/40 text-yellow-300' : l.status === 'approved' ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>{l.status}</span>
                </td>
                <td className="px-6 py-4 text-slate-500">{new Date(l.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => approve(l)} className="text-emerald-400 hover:text-emerald-300 text-xs font-bold mr-3">APPROVE</button>
                  <button onClick={() => del(l.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">DELETE</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
