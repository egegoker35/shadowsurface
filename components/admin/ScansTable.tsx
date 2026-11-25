'use client';
import { useState } from 'react';
import ScanDetailModal from './ScanDetailModal';
import Pagination from './Pagination';

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  running: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  failed: 'bg-red-500/10 text-red-400 border-red-500/25',
};

const RISK_STYLES: Record<string, string> = {
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/25',
  HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
  MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  LOW: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  INCONCLUSIVE: 'bg-slate-500/10 text-slate-400 border-slate-500/25',
};

const PLAN_STYLES: Record<string, string> = {
  free: 'bg-slate-800/80 text-slate-400 border-slate-700',
  starter: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
  professional: 'bg-violet-500/10 text-violet-400 border-violet-500/25',
  enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
};

export default function ScansTable({
  scans,
  total,
  page,
  pages,
  pageSize,
  onPage,
  onRefresh,
  compact = false,
}: {
  scans: any[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  onPage: (p: number) => void;
  onRefresh: () => void;
  compact?: boolean;
}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_admin_token') : null;
  const [selectedScan, setSelectedScan] = useState<any>(null);

  const del = async (scanId: string) => {
    if (!confirm('Delete this scan and its assets?')) return;
    const res = await fetch(`/api/admin/delete-scan?id=${scanId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) onRefresh();
    else alert('Delete failed.');
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
      <div className="px-7 py-5 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">{compact ? 'Recent scans' : 'Scans'}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {compact ? 'Newest first' : `${total} scan(s) match this view`}
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700">
          {total} total
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-slate-950/60 border-b border-slate-800">
            <tr>
              <th className="px-7 py-3.5 font-semibold">Target</th>
              <th className="px-7 py-3.5 font-semibold">User</th>
              <th className="px-7 py-3.5 font-semibold">Plan</th>
              <th className="px-7 py-3.5 font-semibold">Status</th>
              <th className="px-7 py-3.5 font-semibold">Risk</th>
              <th className="px-7 py-3.5 font-semibold">Date</th>
              <th className="px-7 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {scans.length === 0 && (
              <tr>
                <td colSpan={7} className="px-7 py-16 text-center text-slate-500 text-sm">
                  No scans match this view.
                </td>
              </tr>
            )}
            {scans.map((s: any) => {
              const risk = s.executiveSummary?.overallRisk;
              return (
                <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-7 py-4">
                    <button onClick={() => setSelectedScan(s)} className="font-semibold text-white hover:text-emerald-400 transition-colors text-left">
                      {s.target}
                    </button>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {s.scanType}
                      {s.durationSeconds ? ` · ${Math.round(s.durationSeconds)}s` : ''}
                    </div>
                  </td>
                  <td className="px-7 py-4 text-slate-400 text-xs">{s.createdBy?.email || '—'}</td>
                  <td className="px-7 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border ${PLAN_STYLES[s.org?.plan] || PLAN_STYLES.free}`}>
                      {s.org?.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-7 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border ${STATUS_STYLES[s.status] || STATUS_STYLES.pending}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-7 py-4">
                    {risk ? (
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${RISK_STYLES[risk] || RISK_STYLES.INCONCLUSIVE}`}>
                        {risk}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-7 py-4 text-slate-500 text-xs">
                    {new Date(s.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-7 py-4">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => setSelectedScan(s)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-slate-700 text-slate-300 hover:bg-slate-700/60 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => del(s.id)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-red-700/50 text-red-400 hover:bg-red-600/20 transition-colors"
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
      {!compact && <Pagination page={page} pages={pages} total={total} shown={pageSize} onPage={onPage} />}
      {selectedScan && <ScanDetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />}
    </div>
  );
}
