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
        <h1 className="text-2xl font-bold mb-2">Scan Activity</h1>
        <p className="text-sm text-dim mb-6">Every completed scan for your organization. For recurring coverage, create a <a href="/dashboard/scheduled-scans" className="text-jade hover:underline">scheduled scan</a>.</p>
        {loading ? <p className="text-dim">Loading...</p> : (
          <div className="space-y-6">
            {scans.map((scan) => (
              <div key={scan.id} className="bg-ink2 border border-cream/12 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold">{scan.target}</h2>
                    <p className="text-xs text-dim">{new Date(scan.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${scan.status === 'completed' ? 'bg-jadeDeep text-jadeLight' : 'bg-[#DDB271]/10 text-[#E5C48D]'}`}>{scan.status}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="bg-ink rounded-lg p-3"><div className="text-lg font-bold">{scan._count?.assets ?? 0}</div><div className="text-[10px] text-dim">Assets</div></div>
                  <div className="bg-ink rounded-lg p-3"><div className="text-lg font-bold">{scan._count?.cloudAssets ?? 0}</div><div className="text-[10px] text-dim">Cloud</div></div>
                  <div className="bg-ink rounded-lg p-3"><div className="text-lg font-bold text-[#E28B7B]">{scan.highRiskAssets ?? 0}</div><div className="text-[10px] text-dim">High Risk</div></div>
                  <div className="bg-ink rounded-lg p-3"><div className="text-lg font-bold">{scan.durationSeconds ? `${scan.durationSeconds.toFixed(1)}s` : '-'}</div><div className="text-[10px] text-dim">Duration</div></div>
                </div>
                {scan.executiveSummary && (
                  <div className="text-sm text-cream/80">
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
