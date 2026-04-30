'use client';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function MonitoringPage() {
  const [scans, setScans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  useEffect(() => {
    fetch('/api/monitoring', { headers: { Authorization: `Bearer ${token}` } }).then(async (res) => {
      if (res.ok) { const d = await res.json(); setScans(d.scans || []); }
      setLoading(false);
    });
  }, [token]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-10 px-4 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Continuous Monitoring</h1>
        {loading ? <p className="text-slate-400">Loading...</p> : (
          <div className="space-y-6">
            {scans.map((scan) => (
              <div key={scan.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold">{scan.target}</h2>
                    <p className="text-xs text-slate-400">{new Date(scan.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${scan.status === 'completed' ? 'bg-emerald-900 text-emerald-300' : 'bg-yellow-900 text-yellow-300'}`}>{scan.status}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-slate-950 rounded-lg p-3"><div className="text-lg font-bold">{scan.assets?.length || 0}</div><div className="text-[10px] text-slate-400">Assets</div></div>
                  <div className="bg-slate-950 rounded-lg p-3"><div className="text-lg font-bold">{scan.cloudAssets?.length || 0}</div><div className="text-[10px] text-slate-400">Cloud</div></div>
                  <div className="bg-slate-950 rounded-lg p-3"><div className="text-lg font-bold text-red-400">{scan.assets?.filter((a:any)=>a.riskScore>=70).length || 0}</div><div className="text-[10px] text-slate-400">High Risk</div></div>
                  <div className="bg-slate-950 rounded-lg p-3"><div className="text-lg font-bold">{scan.durationSeconds ? `${scan.durationSeconds.toFixed(1)}s` : '-'}</div><div className="text-[10px] text-slate-400">Duration</div></div>
                </div>
                {scan.executiveSummary && (
                  <div className="text-sm text-slate-300">
                    <p>Risk: <span className="font-semibold">{(scan.executiveSummary as any).overallRisk}</span></p>
                    <p className="mt-1">Recommendations: {(scan.executiveSummary as any).recommendations?.join(', ')}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
