'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ScanDetailPage() {
  const { id } = useParams();
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  useEffect(() => {
    if (!id || !token) return;
    fetch(`/api/scans/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(async (res) => {
      if (res.ok) { const d = await res.json(); setScan(d.scan); }
      setLoading(false);
    });
  }, [id, token]);

  const exportJSON = () => {
    if (!scan) return;
    const blob = new Blob([JSON.stringify(scan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shadowsurface-scan-${scan.target}-${scan.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (!scan) return <p className="text-red-400">Scan not found.</p>;

  const exec = scan.executiveSummary || {};
  const stats = scan.statistics || {};

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Scan: {scan.target}</h1>
        <button onClick={exportJSON} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm">Export JSON</button>
      </div>
      <p className="text-sm text-slate-400 mb-6">{new Date(scan.createdAt).toLocaleString()} · {scan.status} · {scan.durationSeconds?.toFixed(1) || '-'}s</p>

      {exec.overallRisk && (
        <div className={`mb-6 p-4 rounded-xl border ${exec.overallRisk === 'CRITICAL' ? 'bg-red-950/30 border-red-800 text-red-300' : exec.overallRisk === 'HIGH' ? 'bg-orange-950/30 border-orange-800 text-orange-300' : exec.overallRisk === 'MEDIUM' ? 'bg-yellow-950/30 border-yellow-800 text-yellow-300' : 'bg-emerald-950/30 border-emerald-800 text-emerald-300'}`}>
          <div className="text-lg font-bold">Overall Risk: {exec.overallRisk}</div>
          <div className="text-sm mt-1">Critical Findings: {exec.criticalFindings || 0} · Attack Surface Size: {exec.attackSurfaceSize || 0}</div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xl font-bold">{stats.totalSubdomains || 0}</div><div className="text-xs text-slate-400">Subdomains</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xl font-bold">{stats.totalAssets || 0}</div><div className="text-xs text-slate-400">Assets</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xl font-bold">{stats.totalCloudAssets || 0}</div><div className="text-xs text-slate-400">Cloud</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xl font-bold text-red-400">{stats.highRiskCount || 0}</div><div className="text-xs text-slate-400">High Risk</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xl font-bold">{scan.durationSeconds?.toFixed(1) || '-'}s</div><div className="text-xs text-slate-400">Duration</div></div>
        </div>
      )}

      {exec.recommendations?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Recommendations</h2>
          <ul className="list-disc list-inside text-sm space-y-1 text-slate-300">
            {exec.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}

      {scan.assets?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Assets ({scan.assets.length})</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase border-b border-slate-800"><tr><th className="py-2">Subdomain</th><th className="py-2">IP</th><th className="py-2">Port</th><th className="py-2">Service</th><th className="py-2">Tech</th><th className="py-2">CVEs</th><th className="py-2">Risk</th></tr></thead>
              <tbody>
                {scan.assets.map((a: any) => (
                  <tr key={a.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 font-medium">{a.subdomain}</td>
                    <td className="py-2 text-slate-400">{a.ip}</td>
                    <td className="py-2">{a.port}</td>
                    <td className="py-2 text-slate-300">{a.service || '-'}</td>
                    <td className="py-2">{a.technology || '-'} {a.version || ''}</td>
                    <td className="py-2">
                      {a.cves?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {a.cves.map((cve: string) => (
                            <a key={cve} href={`https://nvd.nist.gov/vuln/detail/${cve}`} target="_blank" rel="noreferrer" className="px-1.5 py-0.5 rounded bg-red-900/40 text-red-300 text-xs hover:underline">{cve}</a>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs ${a.riskScore >= 70 ? 'bg-red-900 text-red-300' : a.riskScore >= 40 ? 'bg-orange-900 text-orange-300' : 'bg-emerald-900 text-emerald-300'}`}>{a.riskScore}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {scan.assets?.some((a: any) => a.findings?.length > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Findings</h2>
          <div className="space-y-2">
            {scan.assets.flatMap((a: any) => (a.findings || []).map((f: any) => ({ ...f, asset: a.subdomain + ':' + a.port }))).map((f: any, i: number) => (
              <div key={i} className={`p-3 rounded-lg border ${f.severity === 'critical' ? 'border-red-800 bg-red-950/20' : f.severity === 'high' ? 'border-orange-800 bg-orange-950/20' : f.severity === 'medium' ? 'border-yellow-800 bg-yellow-950/20' : 'border-slate-700 bg-slate-800/30'}`}>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs uppercase ${f.severity === 'critical' ? 'bg-red-900 text-red-300' : f.severity === 'high' ? 'bg-orange-900 text-orange-300' : f.severity === 'medium' ? 'bg-yellow-900 text-yellow-300' : 'bg-slate-700 text-slate-300'}`}>{f.severity}</span>
                  <span className="text-sm font-medium">{f.type}</span>
                  <span className="text-xs text-slate-400 ml-auto">{f.asset}</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {scan.cloudAssets?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Cloud Assets ({scan.cloudAssets.length})</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase border-b border-slate-800"><tr><th className="py-2">Provider</th><th className="py-2">Resource</th><th className="py-2">Severity</th><th className="py-2">URL</th></tr></thead>
              <tbody>
                {scan.cloudAssets.map((c: any) => (
                  <tr key={c.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 uppercase">{c.provider}</td>
                    <td className="py-2">{c.resourceId}</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs ${c.severity === 'critical' ? 'bg-red-900 text-red-300' : c.severity === 'high' ? 'bg-orange-900 text-orange-300' : 'bg-yellow-900 text-yellow-300'}`}>{c.severity}</span></td>
                    <td className="py-2 text-slate-400 truncate max-w-xs"><a href={c.url} target="_blank" rel="noreferrer" className="hover:text-emerald-400">{c.url}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!scan.assets || scan.assets.length === 0) && (!scan.cloudAssets || scan.cloudAssets.length === 0) && (
        <p className="text-slate-400">No assets found for this scan.</p>
      )}
    </div>
  );
}
