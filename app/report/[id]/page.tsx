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

export default function PublicReportPage() {
  const { id } = useParams();
  const [scan, setScan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/public/report/${id}`)
      .then(async (res) => {
        if (res.ok) setScan((await res.json()).scan);
        else setError('Report not found or not shared.');
      })
      .catch(() => setError('Could not load report.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Loading report...</div>;
  if (error || !scan) return <div className="min-h-screen bg-slate-950 text-red-400 flex flex-col items-center justify-center gap-3">{error || 'Report not found.'}<a href="/" className="text-emerald-400 hover:underline text-sm">← Back to ShadowSurface</a></div>;

  const exec = scan.executiveSummary || {};
  const stats = scan.statistics || {};
  // resultJson is the complete engine output (includes webVulns); DB rows are a denormalized copy
  const assets = scan.resultJson?.assets || scan.assets || [];
  const cloudAssets = scan.resultJson?.cloudAssets || scan.cloudAssets || [];
  const agentSurface = scan.resultJson?.agentSurface || null;
  const allFindings = assets.flatMap((a: any) => [
    ...(a.findings || []).map((f: any) => ({ ...f, asset: a.subdomain, port: a.port })),
    ...(a.webVulns || []).map((w: any) => ({ ...w, asset: a.subdomain, port: a.port, source: 'web' })),
  ]);
  const grouped = (sev: string) => allFindings.filter((f: any) => f.severity === sev);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="font-bold text-emerald-400">ShadowSurface</span>
              <span>·</span>
              <span>Attack Surface Intelligence</span>
              <span>·</span>
              <span className="text-slate-600">Shared Report</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Security Assessment Report</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${exec.overallRisk === 'CRITICAL' ? 'bg-red-900/50 text-red-300 border border-red-700' : exec.overallRisk === 'HIGH' ? 'bg-orange-900/50 text-orange-300 border border-orange-700' : exec.overallRisk === 'MEDIUM' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' : 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'}`}>
                {exec.overallRisk || 'UNKNOWN'} RISK
              </span>
            </div>
            <p className="text-slate-400 mt-1">Target: <span className="text-white font-semibold">{scan.target}</span> · {new Date(scan.createdAt).toLocaleString()} · Risk Score: <span className="text-white font-semibold">{exec.riskScore || 0}/100</span></p>
          </div>
          <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors self-start">
            Download PDF
          </button>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Subdomains</div><div className="text-2xl font-bold">{stats.totalSubdomains || 0}</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Assets</div><div className="text-2xl font-bold">{stats.totalAssets || 0}</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Cloud Issues</div><div className="text-2xl font-bold">{stats.totalCloudAssets || 0}</div></div>
          <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-4"><div className="text-red-400 text-xs uppercase tracking-wider mb-1">Critical</div><div className="text-2xl font-bold text-red-400">{grouped('critical').length}</div></div>
          <div className="bg-orange-950/20 border border-orange-900/50 rounded-xl p-4"><div className="text-orange-400 text-xs uppercase tracking-wider mb-1">High</div><div className="text-2xl font-bold text-orange-400">{grouped('high').length}</div></div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-slate-400 text-xs uppercase tracking-wider mb-1">CVEs</div><div className="text-2xl font-bold">{stats.totalCVEs || 0}</div></div>
        </div>

        {allFindings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-lg font-semibold">Findings</h2>
              <span className="text-xs text-slate-500">{(exec.recommendations?.length || 0) > 0 ? `${allFindings.length} total` : ''}</span>
            </div>
            <div className="space-y-3">
              {['critical', 'high', 'medium', 'low', 'info'].map((sev) => (
                grouped(sev).length > 0 && (
                  <div key={sev} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-4 py-2 bg-slate-800/50 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">{sev} ({grouped(sev).length})</div>
                    <div className="divide-y divide-slate-800/70">
                      {grouped(sev).slice(0, 25).map((f: any, i: number) => (
                        <div key={i} className="px-4 py-3 flex items-start gap-3">
                          <SeverityBadge severity={f.severity} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200">{f.description}</p>
                            <p className="text-xs text-slate-500 mt-0.5 truncate">{f.asset}{f.port ? `:${f.port}` : ''} — {f.evidence || ''}</p>
                          </div>
                          <RiskBadge score={f.riskScore ?? f.cvss ?? 0} />
                        </div>
                      ))}
                      {grouped(sev).length > 25 && <div className="px-4 py-2 text-xs text-slate-500">+{grouped(sev).length - 25} more {sev} findings</div>}
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Agent Attack Surface (if present) */}
        {agentSurface && (agentSurface.findings?.length > 0) && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-1">Agent Attack Surface</h2>
            <p className="text-xs text-slate-500 mb-3">MCP servers, AI-agent tokens and LLM endpoints exposed to the internet.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Exposed MCP Servers</div><div className="text-2xl font-bold">{agentSurface.summary?.exposedMcpCount || 0}</div></div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Leaked Agent Secrets</div><div className="text-2xl font-bold">{agentSurface.summary?.leakedSecretCount || 0}</div></div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Agent API Endpoints</div><div className="text-2xl font-bold">{agentSurface.summary?.agentEndpointCount || 0}</div></div>
            </div>
            <div className="mt-4 space-y-2">
              {agentSurface.exposedMcpServers?.slice(0, 10).map((m: any, i: number) => (
                <div key={i} className="bg-red-950/20 border border-red-900/40 rounded-lg px-4 py-2.5 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <p className="text-sm text-red-300 font-medium truncate">{m.url}</p>
                    <p className="text-xs text-slate-500">{m.transport} · Authentication: {m.authentication}</p>
                  </div>
                  <SeverityBadge severity={m.authentication === 'NONE (unauthenticated)' ? 'high' : 'medium'} />
                </div>
              ))}
              {agentSurface.leakedSecrets?.slice(0, 10).map((s: any, i: number) => (
                <div key={i} className="bg-orange-950/20 border border-orange-900/40 rounded-lg px-4 py-2.5 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <p className="text-sm text-orange-300 font-medium truncate">{s.pattern} on {s.host}</p>
                    <p className="text-xs text-slate-500 font-mono truncate">{s.snippet}</p>
                  </div>
                  <SeverityBadge severity="high" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assets */}
        {assets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Discovered Assets ({assets.length})</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800">
                  <th className="px-4 py-3">Host</th><th className="px-4 py-3">Port</th><th className="px-4 py-3">Service</th><th className="px-4 py-3">Technology</th><th className="px-4 py-3">CVEs</th><th className="px-4 py-3">Risk</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-800/70">
                  {assets.slice(0, 100).map((a: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-mono text-slate-300">{a.subdomain}</td>
                      <td className="px-4 py-2.5">{a.port || '-'}</td>
                      <td className="px-4 py-2.5 text-slate-400">{a.service || '-'}</td>
                      <td className="px-4 py-2.5 text-slate-400">{a.technology || '-'}{a.version ? ` ${a.version}` : ''}</td>
                      <td className="px-4 py-2.5">{a.cves?.length || 0}</td>
                      <td className="px-4 py-2.5"><RiskBadge score={a.riskScore || 0} /></td>
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
            <h2 className="text-lg font-semibold mb-3">Cloud Assets ({cloudAssets.length})</h2>
            <div className="space-y-2">
              {cloudAssets.slice(0, 25).map((c: any, i: number) => (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2.5 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <p className="text-sm font-mono text-slate-300 truncate">{c.url}</p>
                    <p className="text-xs text-slate-500">{c.provider} · {c.serviceType} · {c.resourceId}</p>
                  </div>
                  <SeverityBadge severity={c.severity} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {(exec.recommendations?.length || 0) > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Recommendations</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2.5">
              {exec.recommendations.slice(0, 12).map((r: string, i: number) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300"><span className="text-emerald-400 mt-0.5">→</span>{r}</div>
              ))}
            </div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="border-t border-slate-800 pt-6 pb-2 text-center">
          <p className="text-slate-500 text-sm">Generated by <a href="/" className="text-emerald-400 font-semibold hover:underline">ShadowSurface</a> — see your own organization's attack surface.</p>
        </div>
      </div>
    </div>
  );
}