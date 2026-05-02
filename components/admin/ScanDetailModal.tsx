'use client';

export default function ScanDetailModal({ scan, onClose }: { scan: any; onClose: () => void }) {
  if (!scan) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">{scan.target}</h2>
            <p className="text-sm text-slate-400">{scan.createdBy?.email} — {new Date(scan.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${scan.status === 'completed' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/20' : scan.status === 'failed' ? 'bg-red-900/40 text-red-400 border border-red-500/20' : 'bg-amber-900/40 text-amber-400 border border-amber-500/20'}`}>{scan.status}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${(scan.executiveSummary?.overallRisk || 'LOW') === 'CRITICAL' ? 'bg-red-900/40 text-red-400' : (scan.executiveSummary?.overallRisk || 'LOW') === 'HIGH' ? 'bg-orange-900/40 text-orange-400' : (scan.executiveSummary?.overallRisk || 'LOW') === 'MEDIUM' ? 'bg-amber-900/40 text-amber-400' : 'bg-emerald-900/40 text-emerald-400'}`}>{scan.executiveSummary?.overallRisk || 'LOW'}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Subdomains</div>
              <div className="text-2xl font-bold">{scan.statistics?.totalSubdomains || 0}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Assets</div>
              <div className="text-2xl font-bold">{scan.statistics?.totalAssets || 0}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Cloud Issues</div>
              <div className="text-2xl font-bold">{scan.statistics?.totalCloudAssets || 0}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-500">Duration</div>
              <div className="text-2xl font-bold">{Math.round((scan.statistics?.durationSeconds || 0))}s</div>
            </div>
          </div>
          {scan.resultJson && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Recommendations</h3>
              <ul className="space-y-1">
                {(scan.executiveSummary?.recommendations || []).slice(0, 5).map((r: string, i: number) => (
                  <li key={i} className="text-sm text-slate-400 flex items-start gap-2"><span className="text-emerald-400 mt-0.5">&bull;</span>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
