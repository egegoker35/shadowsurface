'use client';
import { useState } from 'react';

export default function DemoScanner() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const scan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/demo-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target }) });
      const data = await res.json();
      if (!res.ok) setError(data.error || 'Scan failed');
      else setResult(data.result);
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={scan} className="flex gap-3 mb-8">
        <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="example.com" required className="flex-1 px-5 py-4 rounded-xl bg-slate-900/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg" />
        <button type="submit" disabled={loading} className="px-8 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Scanning...
            </span>
          ) : 'Scan Now'}
        </button>
      </form>

      {error && <div className="text-red-400 bg-red-900/20 border border-red-800 rounded-xl px-4 py-3 mb-6">{error}</div>}

      {result && (
        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Scan Results for {result.target}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${result.executiveSummary?.overallRisk === 'CRITICAL' ? 'bg-red-900/50 text-red-300' : result.executiveSummary?.overallRisk === 'HIGH' ? 'bg-orange-900/50 text-orange-300' : result.executiveSummary?.overallRisk === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300' : 'bg-emerald-900/50 text-emerald-300'}`}>
              {result.executiveSummary?.overallRisk || 'LOW'} RISK
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-slate-950/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{result.statistics?.totalSubdomains || 0}</div>
              <div className="text-xs text-slate-400">Subdomains</div>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{result.statistics?.totalAssets || 0}</div>
              <div className="text-xs text-slate-400">Open Ports</div>
            </div>
            <div className="bg-slate-950/50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-white">{result.statistics?.totalCloudAssets || 0}</div>
              <div className="text-xs text-slate-400">Cloud Issues</div>
            </div>
          </div>

          {result.assets && result.assets.length > 0 && (
            <div className="space-y-2 mb-6">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Discovered Assets</h4>
              {result.assets.slice(0, 5).map((a: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-slate-950/50 rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">{a.port}</span>
                    <span className="text-white font-medium">{a.subdomain}</span>
                    <span className="text-slate-500 text-xs">{a.service || a.technology || 'Unknown'}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.riskScore >= 70 ? 'bg-red-900/40 text-red-300' : a.riskScore >= 40 ? 'bg-orange-900/40 text-orange-300' : 'bg-emerald-900/40 text-emerald-300'}`}>{a.riskScore}</span>
                </div>
              ))}
              {result.assets.length > 5 && <div className="text-center text-xs text-slate-500">+{result.assets.length - 5} more assets</div>}
            </div>
          )}

          {result.cloudAssets && result.cloudAssets.length > 0 && (
            <div className="space-y-2 mb-6">
              <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Cloud Misconfigurations</h4>
              {result.cloudAssets.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-slate-950/50 rounded-lg px-3 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs uppercase">{c.provider}</span>
                    <span className="text-white">{c.resourceId}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${c.severity === 'critical' ? 'bg-red-900/40 text-red-300' : 'bg-orange-900/40 text-orange-300'}`}>{c.severity}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <a href="/register" className="flex-1 text-center py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors">
              Get Full Report — Sign Up Free
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
