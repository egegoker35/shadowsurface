'use client';

export default function ScansTable({ scans, onRefresh }: { scans: any[]; onRefresh?: () => void }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  const del = async (scanId: string) => {
    if (!confirm('Delete this scan?')) return;
    try {
      const res = await fetch(`/api/admin/delete-scan?id=${scanId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { if (onRefresh) onRefresh(); }
      else alert('Failed to delete');
    } catch { alert('Error'); }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-800"><h3 className="text-xl font-bold">Recent Scans ({scans.length})</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-950/60 border-b border-slate-800">
            <tr><th className="px-8 py-4 font-semibold">Target</th><th className="px-8 py-4 font-semibold">User</th><th className="px-8 py-4 font-semibold">Status</th><th className="px-8 py-4 font-semibold">Risk</th><th className="px-8 py-4 font-semibold">Date</th><th className="px-8 py-4 font-semibold text-right"></th></tr>
          </thead>
          <tbody>
            {scans.map((s: any) => (
              <tr key={s.id} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                <td className="px-8 py-5 font-medium text-emerald-400 cursor-pointer" onClick={() => window.open(`/dashboard/scans/${s.id}`, '_blank')}>{s.target}</td>
                <td className="px-8 py-5 text-slate-400">{s.createdBy?.email}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : s.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{s.status}</span>
                </td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${(s.executiveSummary?.overallRisk || 'LOW') === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : (s.executiveSummary?.overallRisk || 'LOW') === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : (s.executiveSummary?.overallRisk || 'LOW') === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>{s.executiveSummary?.overallRisk || 'LOW'}</span>
                </td>
                <td className="px-8 py-5 text-slate-500">{new Date(s.createdAt).toLocaleString()}</td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => del(s.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-red-700/50 text-red-400 hover:bg-red-600/20 transition-colors">Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
