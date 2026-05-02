'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const SCAN_TYPES = [
  { id: 'subdomain', label: 'Subdomain Only', desc: 'Discover subdomains' },
  { id: 'port', label: 'Port Scan', desc: 'Find open services' },
  { id: 'cve', label: 'CVE Check', desc: 'Known vulnerabilities' },
  { id: 'cloud', label: 'Cloud Scan', desc: 'S3/GCS/Azure checks' },
  { id: 'full', label: 'Full Scan', desc: 'Everything combined' },
];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [scans, setScans] = useState<any[]>([]);
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('full');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentMsg, setPaymentMsg] = useState('');
  const [csvName, setCsvName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState<string | null>(null);
  const prevScansRef = useRef<any[]>([]);
  const [toasts, setToasts] = useState<{id:string;type:string;message:string}[]>([]);
  const searchParams = useSearchParams();

  const fetchDashboard = useCallback(async () => {
    const res = await fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setData(await res.json());
  }, [token]);

  const fetchScans = useCallback(async () => {
    const res = await fetch('/api/scans', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setScans(d.scans || []); }
  }, [token]);

  useEffect(() => {
    setToken(localStorage.getItem('ss_token'));
  }, []);

  useEffect(() => {
    if (token) { fetchDashboard(); fetchScans(); }
    const p = searchParams.get('payment');
    if (p === 'success') setPaymentMsg('Payment successful! Your plan has been upgraded.');
    if (p === 'failed') setPaymentMsg('Payment failed. Please try again or contact support.');
  }, [token, searchParams, fetchDashboard, fetchScans]);

  useEffect(() => {
    const hasRunning = scans.some((s: any) => s.status === 'running' || s.status === 'pending');
    if (!hasRunning) return;
    const interval = setInterval(() => { fetchScans(); fetchDashboard(); }, 3000);
    return () => clearInterval(interval);
  }, [scans, fetchScans, fetchDashboard]);

  // Detect scan completion and show toast
  useEffect(() => {
    if (prevScansRef.current.length === 0) { prevScansRef.current = scans; return; }
    const prevRunning = new Set(prevScansRef.current.filter((s:any)=>s.status==='running'||s.status==='pending').map((s:any)=>s.id));
    const newlyCompleted = scans.filter((s:any)=>prevRunning.has(s.id) && (s.status==='completed'||s.status==='failed'));
    for (const s of newlyCompleted) {
      const id = Math.random().toString(36).substring(2,8);
      const msg = s.status === 'completed' ? `${s.target} scan completed!` : `${s.target} scan failed.`;
      setToasts((t)=>[...t,{id,type:s.status,message:msg}]);
      setTimeout(()=>setToasts((t)=>t.filter((x)=>x.id!==id)),5000);
    }
    prevScansRef.current = scans;
  }, [scans]);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = String(ev.target?.result || '');
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const domains: string[] = [];
      for (const line of lines) {
        const cols = line.split(',').map((c) => c.trim());
        const first = cols[0];
        if (first && /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]{2,}$/.test(first)) domains.push(first);
      }
      if (domains.length > 0) setTarget(domains.join(', '));
      else setError('No valid domains found in CSV. First column must contain domains.');
    };
    reader.readAsText(file);
  };

  const startScan = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    const res = await fetch('/api/scans', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ target, scanType }) });
    const d = await res.json();
    if (!res.ok) setError(d.error || 'Failed');
    else { setTarget(''); setCsvName(''); if (fileInputRef.current) fileInputRef.current.value = ''; fetchScans(); }
    setLoading(false);
  };

  const runningScans = scans.filter((s: any) => s.status === 'running');
  const failedScans = scans.filter((s: any) => s.status === 'failed');

  const plan = data?.plan || 'free';
  const isFree = plan === 'free';
  const allowedTypes = plan === 'enterprise' ? ['subdomain','port','cve','cloud','full'] : plan === 'professional' ? ['subdomain','port','cve','cloud','full'] : ['subdomain','port','cve'];
  const canBulk = plan === 'enterprise';

  return (
    <div>
      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-3">
        {toasts.map((t)=> (
          <div key={t.id} className={`px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium animate-[slideIn_0.3s_ease-out] ${t.type==='completed'?'bg-emerald-900/90 border-emerald-700 text-emerald-100':'bg-red-900/90 border-red-700 text-red-100'}`}>
            {t.message}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">Dashboard</h1><span className="px-3 py-1 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 text-xs font-bold uppercase">{plan} Plan</span></div>
      {paymentMsg && (
        <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${paymentMsg.includes('successful') ? 'bg-emerald-900/20 border border-emerald-800 text-emerald-400' : 'bg-red-900/20 border border-red-800 text-red-400'}`}>
          {paymentMsg}
        </div>
      )}
      {runningScans.length > 0 && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-amber-900/20 border border-amber-800 text-amber-300 text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          {runningScans.length} scan in progress. This may take 1-30 minutes. Auto-refreshing every 3 seconds...
        </div>
      )}
      {failedScans.length > 0 && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-900/20 border border-red-800 text-red-300 text-sm">
          <strong>Failed scans:</strong> {failedScans.map((s: any) => s.target).join(', ')}. Target unreachable or scan timed out after 30 minutes. Try again.
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
        {isFree ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Upgrade to Start Scanning</h3>
            <p className="text-sm text-slate-400 mb-4 max-w-md mx-auto">Your account is on the Free plan. Upgrade to a paid plan to unlock automated attack surface scanning.</p>
            <a href="/pricing" className="inline-block px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors">View Pricing</a>
          </div>
        ) : (
          <form onSubmit={startScan} className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="example.com or 192.168.1.1 (comma-separated for bulk)" required className="flex-1 px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <select value={scanType} onChange={(e) => setScanType(e.target.value)} className="px-4 py-2.5 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                {SCAN_TYPES.map((t) => (
                  <option key={t.id} value={t.id} disabled={!allowedTypes.includes(t.id)}>
                    {t.label}{!allowedTypes.includes(t.id) ? ' (Upgrade)' : ''}
                  </option>
                ))}
              </select>
              <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 whitespace-nowrap">{loading ? 'Starting...' : 'Start Scan'}</button>
            </div>
            <div className="flex items-center gap-3">
              {canBulk && (
                <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer hover:text-slate-300 transition-colors">
                  <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                  <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    {csvName || 'Upload CSV'}
                  </span>
                  <span className="text-slate-500">First column = domains</span>
                </label>
              )}
              <p className="text-xs text-slate-500">{SCAN_TYPES.find((t) => t.id === scanType)?.desc}. {plan === 'starter' ? 'Starter: 20 ports, no cloud/bulk.' : plan === 'professional' ? 'Pro: 50 ports, no bulk.' : 'Enterprise: 100 ports, bulk up to 50 domains.'}</p>
            </div>
          </form>
        )}
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Scans</h2>
        {scans.length === 0 ? <p className="text-slate-400 text-sm">No scans yet.</p> : (
          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase border-b border-slate-800">
                <tr><th className="py-2">Target</th><th className="py-2">Type</th><th className="py-2">Status</th><th className="py-2">Risk</th><th className="py-2">Date</th></tr>
              </thead>
              <tbody>
                {scans.map((s: any) => (
                  <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer" onClick={() => window.location.href = `/dashboard/scans/${s.id}`}>
                    <td className="py-2 font-medium text-emerald-400 hover:underline">{s.target}</td>
                    <td className="py-2"><span className="px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-300 capitalize">{s.scanType || 'full'}</span></td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${s.status === 'completed' ? 'bg-emerald-900 text-emerald-300' : s.status === 'failed' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{s.status}</span>
                    </td>
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
