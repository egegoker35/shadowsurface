'use client';

function Badge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    info: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${colors[severity] || colors.info}`}>
      {severity}
    </span>
  );
}

function ScoreRing({ score, label, invert = false }: { score: number; label: string; invert?: boolean }) {
  // For risk: higher = worse (red). For discovered: higher = better (emerald)
  const color = invert
    ? score >= 70 ? 'text-red-400' : score >= 40 ? 'text-yellow-400' : 'text-emerald-400'
    : score >= 50 ? 'text-emerald-400' : 'text-slate-400';
  return (
    <div className="flex flex-col items-center">
      <div className={`text-2xl font-bold ${color}`}>{score}</div>
      <div className="text-[10px] text-slate-500 uppercase">{label}</div>
    </div>
  );
}

export default function DemoResult({ result }: { result: any }) {
  if (!result) return null;
  const subdomains = result.subdomains || [];
  const findings = result.findings || [];
  const ports = result.ports || [];
  
  // Risk score: 0 = safe, 100 = critical (based on findings severity)
  const crit = findings.filter((f: any) => f.severity === 'critical').length;
  const high = findings.filter((f: any) => f.severity === 'high').length;
  const med = findings.filter((f: any) => f.severity === 'medium').length;
  const low = findings.filter((f: any) => f.severity === 'low').length;
  const riskScore = Math.min(100, (crit * 25) + (high * 15) + (med * 5) + (low * 1));

  return (
    <div className="mt-4 text-left space-y-4">
      {/* Executive Summary */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5">
        <h4 className="text-sm font-semibold text-white mb-3">Scan Summary</h4>
        <div className="flex justify-around">
          <ScoreRing score={subdomains.length} label="Subdomains" />
          <ScoreRing score={ports.length} label="Open Ports" />
          <ScoreRing score={findings.length} label="Findings" />
          <ScoreRing score={riskScore} label="Risk Score" invert />
        </div>
      </div>

      {subdomains.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Subdomains Discovered</h4>
          <div className="flex flex-wrap gap-2">
            {subdomains.map((s: string, i: number) => (
              <span key={i} className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300">{s}</span>
            ))}
          </div>
        </div>
      )}

      {ports.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Open Ports</h4>
          <div className="flex flex-wrap gap-2">
            {ports.map((p: any, i: number) => (
              <span key={i} className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300">{p.port} ({p.service || 'unknown'})</span>
            ))}
          </div>
        </div>
      )}

      {findings.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-white mb-2">Security Findings</h4>
          <div className="space-y-2">
            {findings.slice(0, 6).map((f: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-slate-900/50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-300">{f.description}</span>
                <Badge severity={f.severity} />
              </div>
            ))}
            {findings.length > 6 && (
              <p className="text-xs text-slate-500 text-center">+ {findings.length - 6} more in full report</p>
            )}
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-600 text-center">
        This is a limited preview. Full scans include CVE mapping, cloud misconfiguration checks, SSL analysis, and downloadable PDF reports.
      </p>
    </div>
  );
}
