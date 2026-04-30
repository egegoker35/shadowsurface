'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ScanDetailPage() {
  const { id } = useParams();
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  useEffect(() => {
    fetch(`/api/scans/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(async (res) => {
      if (res.ok) { const d = await res.json(); setScan(d.scan); }
      setLoading(false);
    });
  }, [id, token]);

  if (loading) return <p className="text-slate-400">Loading...</p>;
  if (!scan) return <p className="text-red-400">Scan not found.</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Scan: {scan.target}</h1>
      <p className="text-sm text-slate-400 mb-6">{new Date(scan.createdAt).toLocaleString()} · {scan.status}</p>
      {scan.statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xl font-bold">{scan.statistics.totalSubdomains}</div><div className="text-xs text-slate-400">Subdomains</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xl font-bold">{scan.statistics.totalAssets}</div><div className="text-xs text-slate-400">Assets</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xl font-bold">{scan.statistics.totalCloudAssets}</div><div className="text-xs text-slate-400">Cloud</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xl font-bold text-red-400">{scan.statistics.highRiskCount}</div><div className="text-xs text-slate-400">High Risk</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-xl font-bold">{scan.durationSeconds?.toFixed(1) || '-'}s</div><div className="text-xs text-slate-400">Duration</div></div>
        </div>
      )}
      {scan.assets?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Assets ({scan.assets.length})</h2>
          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase border-b border-slate-800"><tr><th className="py-2">Subdomain</th><th className="py-2">IP</th><th className="py-2">Port</th><th className="py-2">Tech</th><th className="py-2">Risk</th></tr></thead>
              <tbody>
                {scan.assets.map((a: any) => (
                  <tr key={a.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2">{a.subdomain}</td>
                    <td className="py-2 text-slate-400">{a.ip}</td>
                    <td className="py-2">{a.port}</td>
                    <td className="py-2">{a.technology || '-'} {a.version || ''}</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs ${a.riskScore >= 70 ? 'bg-red-900 text-red-300' : a.riskScore >= 40 ? 'bg-orange-900 text-orange-300' : 'bg-emerald-900 text-emerald-300'}`}>{a.riskScore}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}
