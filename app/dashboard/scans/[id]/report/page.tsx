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
  const dns = scan.dnsAnalysis || null;

  const severityCount = (severity: string) => {
    let count = assets.reduce((acc: number, a: any) => acc + (a.findings || []).filter((f: any) => f.severity === severity).length, 0);
    count += cloudAssets.filter((c: any) => c.severity === severity).length;
    return count;
  };

  const allWebVulns = assets.flatMap((a: any) => a.webVulns || []);
  const allFindings = assets.flatMap((a: any) => a.findings || []);

  const gradeColor = (grade?: string) => {
    if (!grade) return 'bg-slate-100 text-slate-600';
    if (['A+','A'].includes(grade)) return 'bg-emerald-100 text-emerald-700';
    if (grade === 'B') return 'bg-blue-100 text-blue-700';
    if (grade === 'C') return 'bg-yellow-100 text-yellow-700';
    if (grade === 'D') return 'bg-orange-100 text-orange-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={printPDF} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm shadow-lg transition-colors">Download PDF</button>
      </div>
      <div className="max-w-5xl mx-auto p-8 md:p-12">
        <div className="border-b-2 border-slate-900 pb-6 mb-8">
          <div className="flex items-center justify-between">
            <div><h1 className="text-3xl font-extrabold tracking-tight">ShadowSurface</h1><p className="text-sm text-slate-500 mt-1">Attack Surface Intelligence Report</p></div>
            <div className="text-right text-sm text-slate-500">
              <p>Report ID: <span className="font-mono text-slate-900">{scan.id}</span></p>
              <p>Generated: {new Date(scan.completedAt || scan.createdAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Target</h2>
            <p className="text-2xl font-bold text-slate-900">{scan.target}</p>
            <p className="text-sm text-slate-500 mt-1">Scan type: {scan.type || 'Full'} &bull; Duration: {Math.round(scan.durationSeconds || 0)}s</p>
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
            <p className="text-xs opacity-60 mt-1">Risk Score: {summary.riskScore || 0}/100</p>
          </div>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Subdomains', value: stats.totalSubdomains || 0, color: 'text-emerald-700' },
            { label: 'Assets', value: stats.totalAssets || 0, color: 'text-blue-700' },
            { label: 'Cloud', value: stats.totalCloudAssets || 0, color: 'text-purple-700' },
            { label: 'CVEs', value: stats.totalCVEs || 0, color: 'text-red-700' },
            { label: 'Web Vulns', value: stats.totalWebVulns || 0, color: 'text-orange-700' },
            { label: 'SSL Issues', value: stats.sslIssues || 0, color: 'text-indigo-700' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className={`text-xl font-extrabold ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold mt-1">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold mb-4">Severity Distribution</h2>
          <div className="flex items-end gap-2 h-32">
            {[
              { label: 'Critical', count: severityCount('critical'), color: 'bg-red-500' },
              { label: 'High', count: severityCount('high'), color: 'bg-orange-500' },
              { label: 'Medium', count: severityCount('medium'), color: 'bg-yellow-500' },
              { label: 'Low', count: severityCount('low'), color: 'bg-blue-500' },
              { label: 'Info', count: severityCount('info'), color: 'bg-slate-400' },
            ].map((bar) => {
              const max = Math.max(severityCount('critical'), severityCount('high'), severityCount('medium'), severityCount('low'), severityCount('info'), 1);
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
        {summary.threatActors && summary.threatActors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-bold mb-3 text-red-900">Threat Actors Likely to Target This Surface</h2>
            <div className="flex flex-wrap gap-2">
              {summary.threatActors.map((actor: string, i: number) => (
                <span key={i} className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-semibold border border-red-200">{actor}</span>
              ))}
            </div>
          </div>
        )}
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
                    <th className="px-4 py-3 font-bold">WAF</th>
                    <th className="px-4 py-3 font-bold">SSL</th>
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
                      <td className="px-4 py-3">{a.waf ? <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">{a.waf}</span> : '-'}</td>
                      <td className="px-4 py-3">{a.sslGrade ? <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeColor(a.sslGrade)}`}>{a.sslGrade}</span> : '-'}</td>
                      <td className="px-4 py-3">
                        {a.cves?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {a.cves.slice(0, 3).map((cve: string) => (
                              <span key={cve} className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">{cve}</span>
                            ))}
                            {a.cves.length > 3 && <span className="text-[10px] text-slate-500">+{a.cves.length - 3}</span>}
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
        {allWebVulns.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Web Vulnerabilities ({allWebVulns.length})</h2>
            <div className="space-y-2">
              {allWebVulns.map((v: any, i: number) => (
                <div key={i} className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      v.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      v.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      v.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{v.severity}</span>
                    <span className="text-xs font-bold text-slate-700 uppercase">{v.type}</span>
                    <span className="text-[10px] text-slate-500">({v.confidence})</span>
                  </div>
                  <p className="text-sm text-slate-800">{v.description}</p>
                  {v.url && <p className="text-xs text-slate-500 font-mono mt-1">{v.url}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        {allFindings.filter((f: any) => f.severity !== 'info').length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Security Findings ({allFindings.filter((f: any) => f.severity !== 'info').length})</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                    <th className="px-4 py-3 font-bold">Type</th>
                    <th className="px-4 py-3 font-bold">Severity</th>
                    <th className="px-4 py-3 font-bold">Description</th>
                    <th className="px-4 py-3 font-bold">Asset</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allFindings.filter((f: any) => f.severity !== 'info').map((f: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">{f.type.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          f.severity === 'critical' ? 'bg-red-100 text-red-700' :
                          f.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                          f.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{f.severity}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{f.description}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 font-mono">{f.port ? `Port ${f.port}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {cloudAssets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Cloud Misconfigurations ({cloudAssets.length})</h2>
            <div className="space-y-2">
              {cloudAssets.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                  <div>
                    <span className="text-xs font-bold uppercase text-slate-500">{c.provider}</span>
                    <p className="text-sm font-medium">{c.resourceId}</p>
                    <p className="text-xs text-slate-500">{c.misconfigurations?.[0]?.description || ''}</p>
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
        {assets.some((a: any) => a.sslInfo) && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">SSL Certificates</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-600">
                    <th className="px-4 py-3 font-bold">Subdomain</th>
                    <th className="px-4 py-3 font-bold">Grade</th>
                    <th className="px-4 py-3 font-bold">Issuer</th>
                    <th className="px-4 py-3 font-bold">TLS Version</th>
                    <th className="px-4 py-3 font-bold">Valid To</th>
                    <th className="px-4 py-3 font-bold">Days Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.filter((a: any) => a.sslInfo).map((a: any) => (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium">{a.subdomain}</td>
                      <td className="px-4 py-3">{a.sslGrade ? <span className={`px-2 py-0.5 rounded text-xs font-bold ${gradeColor(a.sslGrade)}`}>{a.sslGrade}</span> : '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{a.sslInfo.issuer || '-'}</td>
                      <td className="px-4 py-3 text-xs font-mono">{a.sslInfo.tlsVersion || '-'}</td>
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
        {dns && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">DNS Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Email Security</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-slate-600">SPF Policy</span><span className={`font-bold ${dns.spfPolicy === 'strict' ? 'text-emerald-700' : dns.spfPolicy === 'softfail' ? 'text-yellow-700' : 'text-red-700'}`}>{dns.spfPolicy || 'None'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">DMARC Policy</span><span className={`font-bold ${dns.dmarcPolicy === 'reject' ? 'text-emerald-700' : dns.dmarcPolicy === 'quarantine' ? 'text-yellow-700' : 'text-red-700'}`}>{dns.dmarcPolicy || 'None'}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-slate-600">DKIM Present</span><span className={`font-bold ${dns.dkimPresent ? 'text-emerald-700' : 'text-red-700'}`}>{dns.dkimPresent ? 'Yes' : 'No'}</span></div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">DNS Records</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {(dns.records || []).slice(0, 10).map((r: any, i: number) => (
                    <div key={i} className="flex gap-2 text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">{r.type}</span>
                      <span className="text-slate-600 truncate">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
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
        <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          <p>Generated by ShadowSurface — Attack Surface Intelligence Platform</p>
          <p className="mt-1">&copy; {new Date().getFullYear()} ShadowSurface. Confidential.</p>
        </div>
      </div>
      <style jsx global>{`@media print { .no-print { display: none !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
    </div>
  );
}
