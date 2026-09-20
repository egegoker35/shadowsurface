'use client';
import { useState } from 'react';
import ScanDetailModal from './ScanDetailModal';

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
};

const PLAN_STYLES: Record<string, string> = {
  free: 'bg-slate-800/80 text-slate-400 border-slate-700',
  starter: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
  professional: 'bg-violet-500/10 text-violet-400 border-violet-500/25',
  enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
};

export default function ScansTable({ scans, onRefresh }: { scans: any[]; onRefresh?: () => void }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_admin_token') : null;
  const [selectedScan, setSelectedScan] = useState<any>(null);

  const del = async (scanId: string) => {
    try {
      const res = await fetch(`/api/admin/delete-scan?id=${scanId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok && onRefresh) onRefresh();
    } catch { /* silent */ }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
      <div className="px-7 py-5 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Scans</h3>
          <p className="text-xs text-slate-500 mt-0.5">{scans.length} most recent scans</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-800/80 text-slate-300 border border-slate-700">{scans.length} total</span>
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
              <tr><td colSpan={7} className="px-7 py-16 text-center text-slate-500">
                <div className="text-3xl mb-3 opacity-40">📡</div>
                <p className="text-sm">No scans yet</p>
              </td></tr>
            )}
            {scans.map((s: any) => {
              const risk = s.executiveSummary?.overallRisk || 'LOW';
              return (
                <tr key={s.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-7 py-4">
                    <button onClick={() => setSelectedScan(s)} className="flex items-center gap-2.5 font-semibold text-emerald-400 hover:text-emerald-300 hover:underline transition-colors text-left">
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                      {s.target}
                    </button>
                  </td>
                  <td className="px-7 py-4 text-slate-400 text-xs">{s.createdBy?.email || '—'}</td>
                  <td className="px-7 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border ${PLAN_STYLES[s.org?.plan] || PLAN_STYLES.starter}`}>{s.org?.plan || 'starter'}</span>
                  </td>
                  <td className="px-7 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_STYLES[s.status] || STATUS_STYLES.pending}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'completed' ? 'bg-emerald-400' : s.status === 'failed' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
                      {s.status}
                    </span>
                  </td>
                  <td className="px-7 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${RISK_STYLES[risk] || RISK_STYLES.LOW}`}>{risk}</span>
                  </td>
                  <td className="px-7 py-4 text-slate-500 text-xs">{new Date(s.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-7 py-4">
                    <div className="flex gap-1.5 justify-end">
                      <button onClick={() => setSelectedScan(s)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-slate-600/60 text-slate-300 hover:bg-slate-700/60 transition-colors">View</button>
                      <button onClick={() => del(s.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold border border-red-700/50 text-red-400 hover:bg-red-600/20 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {selectedScan && <ScanDetailModal scan={selectedScan} onClose={() => setSelectedScan(null)} />}
    </div>
  );
}
