'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function ScanReportPage() {
  const { id } = useParams();
  const [scan, setScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  useEffect(() => {
    if (!id || !token) return;
    fetch(`/api/scans/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => { if (res.ok) setScan((await res.json()).scan); })
      .finally(() => setLoading(false));
  }, [id, token]);

  const printPDF = () => window.print();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading report...</div>;
  if (!scan) return <div className="min-h-screen flex items-center justify-center text-slate-400">Report not found</div>;

  const summary = scan.executiveSummary || {};
  const stats = scan.statistics || {};
  const assets = scan.assets || [];
  const cloudAssets = scan.cloudAssets || [];

  const severityCount = (severity: string) => {
    let count = assets.reduce((acc: number, a: any) => acc + (a.findings || []).filter((f: any) => f.severity === severity).length, 0);
    count += cloudAssets.filter((c: any) => c.severity === severity).length;
    return count;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={printPDF} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm shadow-lg transition-colors">
          Download PDF
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-8 md:p-12">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">ShadowSurface</h1>
              <p className="text-sm text-slate-500 mt-1">Attack Surface Intelligence Report</p>
            </div>
            <div className="text-right text-sm text-slate-500">
              <p>Report ID: <span className="font-mono text-slate-900">{scan.id}</span></p>
              <p>Generated: {new Date(scan.completedAt || scan.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Target & Risk */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Target</h2>
            <p className="text-2xl font-bold text-slate-900">{scan.target}</p>
            <p className="text-sm text-slate-500 mt-1">Scan type: {scan.type || 'Full'} • Duration: {Math.round(scan.durationSeconds || 0)}s</p>
          </div>
          <div className={`rounded-xl p-6 text-center border-2 ${
            summary.overallRisk === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-900' :
            summary.overallRisk === 'HIGH' ? 'bg-orange-50 border-orange-200 text-orange-900' :
            summary.overallRisk === 'MEDIUM' ? 'bg-yellow-50 border-yellow-200 text-yellow-900' :
            'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <h2 className="text-sm font-bold uppercase tracking-wider opacity-70 mb-2">Overall Risk</h2>
            <p className="text-3xl font-extrabold">{summary.overallRisk || 'LOW'}</p>
            <p className="text-sm opacity-70 mt-1">{summary.criticalFindings || 0} critical findings</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Subdomains', value: stats.totalSubdomains || 0, color: 'text-emerald-700' },
            { label: 'Assets', value: stats.totalAssets || 0, color: 'text-blue-700' },
            { label: 'Cloud Issues', value: stats.totalCloudAssets || 0, color: 'text-purple-700' },
            { label: 'Attack Surface', value: summary.attackSurfaceSize || 0, color: 'text-slate-900' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 uppercase font-semibold mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Severity Distribution */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Severity Distribution</h2>
          <div className="flex items-end gap-2 h-32">
            {[
              { label: 'Critical', count: severityCount('critical'), color: 'bg-red-500' },
              { label: 'High', count: severityCount('high'), color: 'bg-orange-500' },
              { label: 'Medium', count: severityCount('medium'), color: 'bg-yellow-500' },
              { label: 'Low', count: severityCount('low'), color: 'bg-blue-500' },
            ].map((bar) => {
              const max = Math.max(severityCount('critical'), severityCount('high'), severityCount('medium'), severityCount('low'), 1);
              const height = `${Math.max((bar.count / max) * 100, 5)}%`;
              return (
                <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs font-bold text-slate-700">{bar.count}</div>
                  <div className={`w-full rounded-t ${bar.color}`} style={{ height }} />
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">{bar.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Assets Table */}
        {assets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Discovered Assets ({assets.length})</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                    <th className="px-4 py-3 font-bold">Subdomain</th>
                    <th className="px-4 py-3 font-bold">IP</th>
                    <th className="px-4 py-3 font-bold">Port</th>
                    <th className="px-4 py-3 font-bold">Technology</th>
                    <th className="px-4 py-3 font-bold">CVEs</th>
                    <th className="px-4 py-3 font-bold text-right">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{a.subdomain}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{a.ip}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-xs font-bold">{a.port}</span></td>
                      <td className="px-4 py-3">{a.technology ? `${a.technology} ${a.version || ''}` : '-'}</td>
                      <td className="px-4 py-3">
                        {a.cves?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {a.cves.map((cve: string) => (
                              <span key={cve} className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">{cve}</span>
                            ))}
                          </div>
                        ) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          a.riskScore >= 70 ? 'bg-red-100 text-red-700' :
                          a.riskScore >= 40 ? 'bg-orange-100 text-orange-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>{a.riskScore}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cloud Assets */}
        {cloudAssets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Cloud Misconfigurations ({cloudAssets.length})</h2>
            <div className="space-y-2">
              {cloudAssets.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-500">{c.provider}</span>
                    <p className="text-sm font-medium">{c.resourceId}</p>
                    <p className="text-xs text-slate-500">{c.description}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                    c.severity === 'critical' ? 'bg-red-100 text-red-700' :
                    c.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{c.severity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SSL Certificates */}
        {assets.some((a: any) => a.sslInfo) && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">SSL Certificates</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                    <th className="px-4 py-3 font-bold">Subdomain</th>
                    <th className="px-4 py-3 font-bold">Issuer</th>
                    <th className="px-4 py-3 font-bold">Valid To</th>
                    <th className="px-4 py-3 font-bold">Days Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.filter((a: any) => a.sslInfo).map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{a.subdomain}</td>
                      <td className="px-4 py-3 text-slate-600">{a.sslInfo.issuer || '-'}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{a.sslInfo.validTo ? new Date(a.sslInfo.validTo).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3">
                        {a.sslInfo.daysRemaining !== undefined ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            a.sslInfo.daysRemaining < 7 ? 'bg-red-100 text-red-700' :
                            a.sslInfo.daysRemaining < 30 ? 'bg-orange-100 text-orange-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>{a.sslInfo.daysRemaining} days</span>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {summary.recommendations && summary.recommendations.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-4">Recommendations</h2>
            <ol className="list-decimal list-inside space-y-2">
              {summary.recommendations.map((r: string, i: number) => (
                <li key={i} className="text-sm text-slate-700">{r}</li>
              ))}
            </ol>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          <p>Generated by ShadowSurface — Attack Surface Intelligence Platform</p>
          <p className="mt-1">© {new Date().getFullYear()} ShadowSurface. Confidential.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
}
