'use client';

export default function ScansTable({ scans }: { scans: any[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800"><h3 className="text-lg font-semibold">Recent Scans ({scans.length})</h3></div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
            <tr><th className="px-6 py-3">Target</th><th className="px-6 py-3">User</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Risk</th><th className="px-6 py-3">Date</th></tr>
          </thead>
          <tbody>
            {scans.map((s: any) => (
              <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer" onClick={() => window.open(`/dashboard/scans/${s.id}`, '_blank')}>
                <td className="px-6 py-4 font-medium text-emerald-400">{s.target}</td>
                <td className="px-6 py-4 text-slate-400">{s.createdBy?.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs ${s.status === 'completed' ? 'bg-emerald-900/40 text-emerald-300' : s.status === 'failed' ? 'bg-red-900/40 text-red-300' : 'bg-yellow-900/40 text-yellow-300'}`}>{s.status}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${(s.executiveSummary?.overallRisk || 'LOW') === 'CRITICAL' ? 'bg-red-900/40 text-red-300' : (s.executiveSummary?.overallRisk || 'LOW') === 'HIGH' ? 'bg-orange-900/40 text-orange-300' : (s.executiveSummary?.overallRisk || 'LOW') === 'MEDIUM' ? 'bg-yellow-900/40 text-yellow-300' : 'bg-emerald-900/40 text-emerald-300'}`}>{s.executiveSummary?.overallRisk || 'LOW'}</span>
                </td>
                <td className="px-6 py-4 text-slate-500">{new Date(s.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
