'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMsg, setPaymentMsg] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;
  const searchParams = useSearchParams();

  const fetchDashboard = async () => {
    const res = await fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setData(await res.json());
  };

  const fetchScans = async () => {
    const res = await fetch('/api/scans', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setScans(d.scans || []); }
  };

  useEffect(() => {
    if (token) { fetchDashboard(); fetchScans(); }
    const p = searchParams.get('payment');
    if (p === 'success') setPaymentMsg('Payment successful! Your plan has been upgraded.');
    if (p === 'failed') setPaymentMsg('Payment failed. Please try again or contact support.');
  }, [token, searchParams]);

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const res = await fetch('/api/scans', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ target }) });
    const d = await res.json();
    if (!res.ok) setError(d.error || 'Failed');
    else { setTarget(''); fetchScans(); }
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">Dashboard</h1><span className="px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-xs font-bold uppercase">{data?.plan || "starter"} Plan</span></div>
      {paymentMsg && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${paymentMsg.includes('successful') ? 'bg-emerald-900/20 border border-emerald-800 text-emerald-400' : 'bg-red-900/20 border border-red-800 text-red-400'}`}>
          {paymentMsg}
        </div>
      )}
      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5"><div className="text-3xl font-bold text-white">{data.scanCount}</div><div className="text-xs text-slate-400 mt-1">Total Scans</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5"><div className="text-3xl font-bold text-white">{data.assetCount}</div><div className="text-xs text-slate-400 mt-1">Assets</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5"><div className="text-3xl font-bold text-white">{data.cloudCount}</div><div className="text-xs text-slate-400 mt-1">Cloud Issues</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5"><div className="text-3xl font-bold text-red-400">{data.highRiskAssets?.length || 0}</div><div className="text-xs text-slate-400 mt-1">High Risk</div></div>
        </div>
      )}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">New Scan</h2>
        {error && <div className="mb-3 text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2 text-sm">{error}</div>}
        <form onSubmit={startScan} className="flex gap-3">
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="example.com or 192.168.1.1" required className="flex-1 px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50">{loading ? 'Starting...' : 'Start Scan'}</button>
        </form>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Scans</h2>
        {scans.length === 0 ? <p className="text-slate-400 text-sm">No scans yet.</p> : (
          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase border-b border-slate-800">
                <tr><th className="py-2">Target</th><th className="py-2">Status</th><th className="py-2">Risk</th><th className="py-2">Date</th></tr>
              </thead>
              <tbody>
                {scans.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer" onClick={() => window.location.href = `/dashboard/scans/${s.id}`}>
                    <td className="py-2 font-medium text-emerald-400 hover:underline">{s.target}</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs ${s.status === 'completed' ? 'bg-emerald-900 text-emerald-300' : s.status === 'failed' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{s.status}</span></td>
                    <td className="py-2">{(s.executiveSummary as any)?.overallRisk || '-'}</td>
                    <td className="py-2 text-slate-400">{new Date(s.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
