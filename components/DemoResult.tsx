'use client';

const SEVERITY: Record<string, string> = {
  critical: 'text-[#C9726A] border-[#C9726A]/30',
  high: 'text-[#CF8A67] border-[#CF8A67]/30',
  medium: 'text-[#C4A16B] border-[#C4A16B]/30',
  low: 'text-[#8FA6C0] border-[#8FA6C0]/30',
  info: 'text-faint border-cream/20',
};

function Badge({ severity }: { severity: string }) {
  const tone = SEVERITY[severity] || SEVERITY.info;
  return (
    <span
      className={`shrink-0 border px-1.5 py-px font-mono text-[9px] uppercase tracking-[0.1em] ${tone}`}
    >
      {severity}
    </span>
  );
}

export default function DemoResult({ result }: { result: any }) {
  if (!result) return null;
  const subdomains = result.subdomains || [];
  const assets = result.assets || [];
  // Tag every finding with the host it came from. The flat list showed the same header
  // finding twice with no indication that two different assets produced it.
  const findings = assets.length
    ? assets.flatMap((a: any) => (a.findings || []).map((f: any) => ({ ...f, host: a.subdomain })))
    : (result.findings || []);
  // The demo never returns a separate port list; it returns one entry per responding
  // service. Reading result.ports left the "Open Ports" count stuck at 0 on every scan.
  const ports = assets.length
    ? Array.from(new Map(assets.map((a: any) => [a.port, { port: a.port, service: a.service }])).values())
    : (result.ports || []);

  // Risk comes from the scanner that produced the result, using the same weights as the
  // full report. Recomputing it here with a second formula made the demo and the report
  // disagree about the same host.
  const riskScore = Number(result.executiveSummary?.riskScore)
    || Math.max(0, ...(result.assets || []).map((a: any) => Number(a.riskScore) || 0));

  // One accent per metric so the numbers read as a set: discovery is neutral, exposure and
  // risk carry the warning colours.
  const metrics = [
    { value: subdomains.length, label: 'Subdomains', tone: 'border-t-jade' },
    { value: ports.length, label: 'Open ports', tone: 'border-t-jade/60' },
    { value: findings.length, label: 'Findings', tone: 'border-t-[#DDB271]' },
    { value: riskScore, label: 'Risk score', tone: 'border-t-[#E5A87C]' },
  ];

  return (
    <div className="mt-6 border border-cream/12">
      <dl className="grid grid-cols-2 gap-px bg-cream/10 sm:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className={`border-t-2 bg-ink2 px-4 py-3 ${m.tone}`}>
            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">{m.label}</dt>
            <dd className="mt-1 font-mono text-[19px] leading-none text-cream">{m.value}</dd>
          </div>
        ))}
      </dl>

      {subdomains.length > 0 && (
        <div className="border-t border-cream/10 px-4 py-3.5">
          <h4 className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
            Subdomains discovered
          </h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {subdomains.slice(0, 24).map((s: string, i: number) => (
              <span
                key={i}
                className="border border-cream/12 px-1.5 py-0.5 font-mono text-[10.5px] text-dim"
              >
                {s}
              </span>
            ))}
            {subdomains.length > 24 && (
              <span className="px-1 py-0.5 font-mono text-[10.5px] text-faint">
                +{subdomains.length - 24}
              </span>
            )}
          </div>
        </div>
      )}

      {ports.length > 0 && (
        <div className="border-t border-cream/10 px-4 py-3.5">
          <h4 className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">Open ports</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ports.slice(0, 24).map((p: any, i: number) => (
              <span
                key={i}
                className="border border-cream/12 px-1.5 py-0.5 font-mono text-[10.5px] text-dim"
              >
                {p.port} <span className="text-faint">{p.service || 'unknown'}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {findings.length > 0 && (
        <div className="border-t border-cream/10 px-4 py-3.5">
          <h4 className="font-mono text-[9px] uppercase tracking-[0.14em] text-faint">
            Security findings
          </h4>
          <ul className="mt-1">
            {findings.slice(0, 6).map((f: any, i: number) => (
              <li key={i} className="border-b border-cream/10 py-2.5 last:border-b-0">
                {f.host && (
                  <div className="mb-1 font-mono text-[10px] text-faint">{f.host}</div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[12px] leading-snug text-cream/90">{f.description}</span>
                  <Badge severity={f.severity} />
                </div>
              </li>
            ))}
          </ul>
          {findings.length > 6 && (
            <p className="mt-2 font-mono text-[10px] text-faint">
              +{findings.length - 6} more in the full report
            </p>
          )}
        </div>
      )}

      <p className="border-t border-cream/10 px-4 py-3 text-[10.5px] leading-relaxed text-faint">
        Limited preview. Full scans add CVE mapping, cloud misconfiguration checks, TLS analysis and
        a downloadable PDF report.
      </p>
    </div>
  );
}
