const ROWS = [
  {
    host: 'example-corp.com',
    port: 443,
    service: 'HTTPS',
    tech: 'nginx 1.24.0',
    risk: 58,
    findings: ['Missing security headers (6)', 'TLS 1.2 only'],
  },
  {
    host: 'api.example-corp.com',
    port: 443,
    service: 'HTTPS',
    tech: 'Node.js 18.17',
    risk: 61,
    findings: ['CVE-2023-44487 · HTTP/2', 'HSTS absent'],
  },
  {
    host: 'dev.example-corp.com',
    port: 8080,
    service: 'HTTP',
    tech: 'Jenkins 2.401',
    risk: 78,
    findings: ['Exposed admin panel /manage', 'No TLS'],
  },
  {
    host: 'mail.example-corp.com',
    port: 443,
    service: 'HTTPS',
    tech: 'Exchange 2019',
    risk: 44,
    findings: ['SPF softfail'],
  },
];

function riskTone(score: number) {
  if (score >= 70) return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
  if (score >= 40) return 'text-amber-400 border-amber-400/30 bg-amber-400/10';
  return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
}

export default function ReportPreview() {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-900/70">
        <span className="font-mono text-[11px] text-slate-400">report / example-corp.com</span>
        <span className="font-mono text-[11px] text-slate-500">4 assets · 61s</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_56px_44px] gap-2 px-4 py-2 border-b border-slate-800/70">
        <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Asset</span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500 text-right">Risk</span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500 text-right">Port</span>
      </div>

      <ul className="divide-y divide-slate-800/60">
        {ROWS.map((r) => (
          <li key={r.host + r.port} className="px-4 py-3">
            <div className="grid grid-cols-[minmax(0,1fr)_56px_44px] gap-2 items-baseline">
              <span className="min-w-0 font-mono text-[13px] text-slate-200 truncate">{r.host}</span>
              <span className={`justify-self-end rounded border px-1.5 py-0.5 font-mono text-[11px] ${riskTone(r.risk)}`}>
                {r.risk}
              </span>
              <span className="justify-self-end font-mono text-[11px] text-slate-500">{r.port}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-mono text-[10px] text-slate-500">{r.service}</span>
              <span className="font-mono text-[10px] text-slate-500">{r.tech}</span>
            </div>
            <div className="mt-1.5 space-y-0.5">
              {r.findings.map((f) => (
                <div key={f} className="flex items-start gap-1.5">
                  <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-slate-600" />
                  <span className="text-[11px] leading-snug text-slate-400">{f}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-slate-800 bg-slate-900/70">
        <span className="text-[10px] text-slate-500">
          Sample output. Every finding links to the request and response that produced it.
        </span>
        <span className="shrink-0 font-mono text-[10px] text-slate-500">MEDIUM · 61</span>
      </div>
    </div>
  );
}
