'use client';

const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors: Record<string, string> = {
    critical: 'bg-red-950/60 text-red-300 border-red-800',
    high: 'bg-orange-950/60 text-orange-300 border-orange-800',
    medium: 'bg-yellow-950/60 text-yellow-300 border-yellow-800',
    low: 'bg-blue-950/60 text-blue-300 border-blue-800',
    info: 'bg-slate-800 text-slate-300 border-slate-700',
  };
  return <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wide border ${colors[severity] || colors.info}`}>{severity}</span>;
};

const RiskBadge = ({ score }: { score: number }) => {
  if (score >= 70) return <span className="px-2 py-1 rounded-md text-xs font-bold bg-red-900/40 text-red-300 border border-red-800">{score}</span>;
  if (score >= 40) return <span className="px-2 py-1 rounded-md text-xs font-bold bg-orange-900/40 text-orange-300 border border-orange-800">{score}</span>;
  return <span className="px-2 py-1 rounded-md text-xs font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-800">{score}</span>;
};

export default function ScanDetailModal({ scan, onClose }: { scan: any; onClose: () => void }) {
  if (!scan) return null;

  const exec = scan.executiveSummary || {};
  const stats = scan.statistics || {};
  const assets = scan.assets || [];
  const cloudAssets = scan.cloudAssets || [];
  const allFindings = assets.flatMap((a: any) => (a.findings || []).map((f: any) => ({ ...f, asset: a.subdomain || a.ip, port: a.port })));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-950 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold">{scan.target}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${exec.overallRisk === 'CRITICAL' ? 'bg-red-900/50 text-red-300 border border-red-700' : exec.overallRisk === 'HIGH' ? 'bg-orange-900/50 text-orange-300 border border-orange-700' : exec.overallRisk === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'}`}>
                {exec.overallRisk || 'LOW'} RISK
              </span>
            </div>
            <p className="text-sm text-slate-400">{scan.createdBy?.email} — {new Date(scan.createdAt).toLocaleString()}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: 'Subdomains', value: stats.totalSubdomains || 0 },
              { label: 'Assets', value: stats.totalAssets || 0 },
              { label: 'Cloud Issues', value: stats.totalCloudAssets || 0 },
              { label: 'Critical/High', value: stats.highRiskCount || 0, color: 'text-red-400' },
              { label: 'Duration', value: `${Math.round(scan.durationSeconds || 0)}s` },
            ].map((s) => (
              <div key={s.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-xs text-slate-500 uppercase tracking-wider">{s.label}</div>
                <div className={`text-xl font-bold mt-1 ${s.color || 'text-white'}`}>{s.value}</div>
              </div>
            ))}
          </div>

          {allFindings.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 text-red-400">Findings ({allFindings.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {allFindings.map((f: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800/50">
                    <SeverityBadge severity={f.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{f.type?.replace(/_/g, ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase())}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{f.description}</div>
                    </div>
                    <div className="text-xs text-slate-500 shrink-0">{f.asset}:{f.port}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exec.recommendations?.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 text-emerald-400">Recommendations</h3>
              <div className="space-y-2">
                {exec.recommendations.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-slate-950/50">
                    <div className="w-5 h-5 rounded-full bg-emerald-900/30 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                    <p className="text-sm text-slate-300">{r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {assets.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3">Assets ({assets.length})</h3>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 uppercase border-b border-slate-800">
                      <th className="pb-2">Subdomain</th><th className="pb-2">IP</th><th className="pb-2">Port</th><th className="pb-2">Service</th><th className="pb-2">Tech</th><th className="pb-2">WAF</th><th className="pb-2">CVEs</th><th className="pb-2 text-right">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {assets.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-800/30">
                        <td className="py-2 font-medium text-white">{a.subdomain || '-'}</td>
                        <td className="py-2 text-slate-400 font-mono">{a.ip}</td>
                        <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{a.port}</span></td>
                        <td className="py-2 text-slate-300">{a.service || '-'}</td>
                        <td className="py-2 text-slate-300">{a.technology ? `${a.technology} ${a.version || ''}` : '-'}</td>
                        <td className="py-2">{a.waf ? <span className="px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-300 text-xs border border-blue-800">{a.waf}</span> : '-'}</td>
                        <td className="py-2">
                          {a.cves?.length > 0 ? a.cves.map((cve: string) => <span key={cve} className="inline-block px-1.5 py-0.5 rounded bg-red-900/30 text-red-300 text-xs border border-red-800/50 mr-1">{cve}</span>) : '-'}
                        </td>
                        <td className="py-2 text-right"><RiskBadge score={a.riskScore || 0} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {cloudAssets.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold mb-3 text-amber-400">Cloud Misconfigurations ({cloudAssets.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 uppercase border-b border-slate-800">
                      <th className="pb-2">Provider</th><th className="pb-2">Resource</th><th className="pb-2">Type</th><th className="pb-2">Severity</th><th className="pb-2">Permissions</th><th className="pb-2">URL</th><th className="pb-2 text-right">Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {cloudAssets.map((c: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/30">
                        <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{c.provider}</span></td>
                        <td className="py-2 font-medium text-white">{c.resourceId}</td>
                        <td className="py-2 text-slate-300">{c.serviceType}</td>
                        <td className="py-2"><SeverityBadge severity={c.severity} /></td>
                        <td className="py-2 text-slate-400">{Array.isArray(c.permissions) ? c.permissions.join(', ') : c.permissions || '-'}</td>
                        <td className="py-2">
                          {c.url ? <a href={c.url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline truncate max-w-[200px] inline-block">{c.url}</a> : '-'}
                        </td>
                        <td className="py-2 text-right"><RiskBadge score={c.riskScore || 0} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
