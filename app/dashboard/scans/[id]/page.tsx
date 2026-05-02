'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors: Record<string, string> = {
    critical: 'bg-red-950/60 text-red-300 border-red-800',
    high: 'bg-orange-950/60 text-orange-300 border-orange-800',
    medium: 'bg-yellow-950/60 text-yellow-300 border-yellow-800',
    low: 'bg-blue-950/60 text-blue-300 border-blue-800',
    info: 'bg-slate-800 text-slate-300 border-slate-700',
  };
  return <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide border ${colors[severity] || colors.info}`}>{severity}</span>;
};

const RiskBadge = ({ score }: { score: number }) => {
  if (score >= 70) return <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-900/40 text-red-300 border border-red-800">{score}</span>;
  if (score >= 40) return <span className="px-2 py-1 rounded-md text-xs font-bold bg-orange-900/40 text-orange-300 border border-orange-800">{score}</span>;
  return <span className="px-2 py-1 rounded-md text-xs font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-800">{score}</span>;
};

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
    a.download = `shadowsurface-report-${scan.target}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportMarkdown = async () => {
    if (!scan) return;
    const res = await fetch(`/api/reports/export-pdf?scanId=${scan.id}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shadowsurface-report-${scan.target}-${new Date().toISOString().split('T')[0]}.md`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading report...</div>;
  if (!scan) return <div className="min-h-screen flex items-center justify-center text-red-400">Report not found.</div>;

  const exec = scan.executiveSummary || {};
  const stats = scan.statistics || {};
  const allFindings = (scan.assets || []).flatMap((a: any) => (a.findings || []).map((f: any) => ({ ...f, asset: a.subdomain, port: a.port })));
  const criticalFindings = allFindings.filter((f: any) => f.severity === 'critical');
  const highFindings = allFindings.filter((f: any) => f.severity === 'high');
  const mediumFindings = allFindings.filter((f: any) => f.severity === 'medium');
  const lowFindings = allFindings.filter((f: any) => f.severity === 'low');

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">Security Assessment Report</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${exec.overallRisk === 'CRITICAL' ? 'bg-red-900/50 text-red-300 border border-red-700' : exec.overallRisk === 'HIGH' ? 'bg-orange-900/50 text-orange-300 border border-orange-700' : exec.overallRisk === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'}`}>
              {exec.overallRisk || 'UNKNOWN'} RISK
            </span>
          </div>
          <p className="text-slate-400">Target: <span className="text-white font-semibold">{scan.target}</span> · {new Date(scan.createdAt).toLocaleString()} · {scan.durationSeconds?.toFixed(1)}s</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportJSON} className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Export JSON
          </button>
          <button onClick={exportMarkdown} className="px-4 py-2 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800 text-emerald-400 text-sm font-medium transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Export Report
          </button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Subdomains</div>
          <div className="text-2xl font-bold">{stats.totalSubdomains || 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Assets</div>
          <div className="text-2xl font-bold">{stats.totalAssets || 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Cloud Issues</div>
          <div className="text-2xl font-bold">{stats.totalCloudAssets || 0}</div>
        </div>
        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-5">
          <div className="text-red-400 text-xs uppercase tracking-wider mb-1">Critical/High</div>
          <div className="text-2xl font-bold text-red-400">{stats.highRiskCount || 0}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Duration</div>
          <div className="text-2xl font-bold">{scan.durationSeconds?.toFixed(1) || '-'}s</div>
        </div>
      </div>

      {/* Risk Distribution Bar */}
      {(criticalFindings.length > 0 || highFindings.length > 0 || mediumFindings.length > 0 || lowFindings.length > 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Findings Distribution</h2>
          <div className="flex h-8 rounded-lg overflow-hidden">
            {criticalFindings.length > 0 && <div style={{ width: `${(criticalFindings.length / allFindings.length) * 100}%` }} className="bg-red-600" title={`Critical: ${criticalFindings.length}`}></div>}
            {highFindings.length > 0 && <div style={{ width: `${(highFindings.length / allFindings.length) * 100}%` }} className="bg-orange-500" title={`High: ${highFindings.length}`}></div>}
            {mediumFindings.length > 0 && <div style={{ width: `${(mediumFindings.length / allFindings.length) * 100}%` }} className="bg-yellow-500" title={`Medium: ${mediumFindings.length}`}></div>}
            {lowFindings.length > 0 && <div style={{ width: `${(lowFindings.length / allFindings.length) * 100}%` }} className="bg-blue-500" title={`Low: ${lowFindings.length}`}></div>}
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            {criticalFindings.length > 0 && <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-600 rounded"></div><span className="text-slate-300">Critical ({criticalFindings.length})</span></div>}
            {highFindings.length > 0 && <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-500 rounded"></div><span className="text-slate-300">High ({highFindings.length})</span></div>}
            {mediumFindings.length > 0 && <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded"></div><span className="text-slate-300">Medium ({mediumFindings.length})</span></div>}
            {lowFindings.length > 0 && <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded"></div><span className="text-slate-300">Low ({lowFindings.length})</span></div>}
          </div>
        </div>
      )}

      {/* Findings */}
      {allFindings.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Security Findings ({allFindings.length})
          </h2>
          <div className="space-y-2">
            {allFindings.map((f: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors">
                <SeverityBadge severity={f.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{f.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
                  <div className="text-sm text-slate-400 mt-0.5">{f.description}</div>
                </div>
                <div className="text-xs text-slate-500 shrink-0">{f.asset}:{f.port}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {exec.recommendations?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Recommendations
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {exec.recommendations.map((r: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                <div className="w-6 h-6 rounded-full bg-emerald-900/30 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</div>
                <p className="text-sm text-slate-300">{r}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assets Table */}
      {scan.assets?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Discovered Assets ({scan.assets.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="pb-3 font-medium">Subdomain</th>
                  <th className="pb-3 font-medium">IP</th>
                  <th className="pb-3 font-medium">Port</th>
                  <th className="pb-3 font-medium">Service</th>
                  <th className="pb-3 font-medium">Technology</th>
                  <th className="pb-3 font-medium">WAF/CDN</th>
                  <th className="pb-3 font-medium">CVEs</th>
                  <th className="pb-3 font-medium text-right">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {scan.assets.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-medium text-white">{a.subdomain}</td>
                    <td className="py-3 text-slate-400 font-mono text-xs">{a.ip}</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs">{a.port}</span></td>
                    <td className="py-3 text-slate-300">{a.service || '-'}</td>
                    <td className="py-3">
                      {a.technology ? (
                        <span className="text-slate-300">{a.technology} <span className="text-slate-500">{a.version}</span></span>
                      ) : '-'}
                    </td>
                    <td className="py-3">{a.waf ? <span className="px-2 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs border border-blue-800">{a.waf}</span> : '-'}</td>
                    <td className="py-3">
                      {a.cves?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {a.cves.map((cve: string) => (
                            <a key={cve} href={`https://nvd.nist.gov/vuln/detail/${cve}`} target="_blank" rel="noreferrer" className="px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 text-xs border border-red-800/50 hover:bg-red-900/50 transition-colors">{cve}</a>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="py-3 text-right"><RiskBadge score={a.riskScore} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SSL Certificates */}
      {scan.assets?.some((a: any) => a.sslInfo) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            SSL Certificates
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="pb-3 font-medium">Subdomain</th>
                  <th className="pb-3 font-medium">Subject</th>
                  <th className="pb-3 font-medium">Issuer</th>
                  <th className="pb-3 font-medium">Valid From</th>
                  <th className="pb-3 font-medium">Valid To</th>
                  <th className="pb-3 font-medium">Days Left</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {scan.assets.filter((a: any) => a.sslInfo).map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-medium text-white">{a.subdomain}</td>
                    <td className="py-3 text-slate-300">{a.sslInfo.subject || '-'}</td>
                    <td className="py-3 text-slate-400">{a.sslInfo.issuer || '-'}</td>
                    <td className="py-3 text-slate-400 text-xs">{a.sslInfo.validFrom ? new Date(a.sslInfo.validFrom).toLocaleDateString() : '-'}</td>
                    <td className="py-3 text-slate-400 text-xs">{a.sslInfo.validTo ? new Date(a.sslInfo.validTo).toLocaleDateString() : '-'}</td>
                    <td className="py-3">
                      {a.sslInfo.daysRemaining !== undefined ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${a.sslInfo.daysRemaining < 7 ? 'bg-red-900/40 text-red-300' : a.sslInfo.daysRemaining < 30 ? 'bg-orange-900/40 text-orange-300' : 'bg-emerald-900/40 text-emerald-300'}`}>
                          {a.sslInfo.daysRemaining} days
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cloud Assets */}
      {scan.cloudAssets?.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
            Cloud Misconfigurations ({scan.cloudAssets.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="pb-3 font-medium">Provider</th>
                  <th className="pb-3 font-medium">Resource</th>
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium">Permissions</th>
                  <th className="pb-3 font-medium">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {scan.cloudAssets.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="py-3"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs uppercase font-bold">{c.provider}</span></td>
                    <td className="py-3 font-medium text-white">{c.resourceId}</td>
                    <td className="py-3"><SeverityBadge severity={c.severity} /></td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {c.permissions?.map((p: string) => <span key={p} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-xs">{p}</span>)}
                      </div>
                    </td>
                    <td className="py-3"><a href={c.url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:text-emerald-300 text-xs truncate max-w-[200px] inline-block">{c.url}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(!scan.assets || scan.assets.length === 0) && (!scan.cloudAssets || scan.cloudAssets.length === 0) && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-300">No Assets Found</h3>
          <p className="text-slate-500 mt-1">This scan did not discover any exposed assets or misconfigurations.</p>
        </div>
      )}
    </div>
  );
}
