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
  if (score >= 70) return 'text-[#A8431F] border-[#A8431F]/35';
  if (score >= 40) return 'text-[#8A5A12] border-[#8A5A12]/35';
  return 'text-[#2F6B4A] border-[#2F6B4A]/35';
}

export default function ReportPreview() {
  return (
    <div className="relative">
      {/* second sheet, so the artifact reads as a printed stack rather than a UI card */}
      <div
        aria-hidden
        className="absolute inset-x-2 -bottom-2 top-3 bg-paper/25"
      />
      <div className="relative bg-paper text-[#141310]">
        <div className="flex items-start justify-between border-b border-black/15 px-5 py-4">
          <div>
            <div className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-black/45">
              External attack surface report
            </div>
            <div className="mt-1.5 font-serif text-[19px] leading-none">example-corp.com</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-black/45">
              Risk
            </div>
            <div className="mt-1 font-mono text-[15px] leading-none text-[#8A5A12]">61 / 100</div>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-black/10 px-5 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-black/45">
          <span>4 assets · 12 hosts</span>
          <span>run 04 · 61s</span>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_38px_34px] gap-2 border-b border-black/15 px-5 py-1.5">
          <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-black/40">Asset</span>
          <span className="text-right font-mono text-[8px] uppercase tracking-[0.14em] text-black/40">
            Risk
          </span>
          <span className="text-right font-mono text-[8px] uppercase tracking-[0.14em] text-black/40">
            Port
          </span>
        </div>

        <ul>
          {ROWS.map((r) => (
            <li key={r.host + r.port} className="border-b border-black/10 px-5 py-2.5 last:border-b-0">
              <div className="grid grid-cols-[minmax(0,1fr)_38px_34px] items-baseline gap-2">
                <span className="min-w-0 truncate font-mono text-[11px]">{r.host}</span>
                <span
                  className={`justify-self-end border px-1 py-px font-mono text-[9.5px] leading-tight ${riskTone(
                    r.risk
                  )}`}
                >
                  {r.risk}
                </span>
                <span className="justify-self-end font-mono text-[9.5px] text-black/45">{r.port}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 font-mono text-[8.5px] text-black/40">
                <span>{r.service}</span>
                <span aria-hidden>·</span>
                <span>{r.tech}</span>
              </div>
              <div className="mt-1 space-y-px">
                {r.findings.map((f) => (
                  <div key={f} className="flex items-start gap-1.5">
                    <span aria-hidden className="mt-[6px] h-0.5 w-1.5 shrink-0 bg-black/30" />
                    <span className="text-[10px] leading-snug text-black/75">{f}</span>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-black/15 px-5 py-2.5">
          <span className="text-[9.5px] leading-snug text-black/50">
            Sample output. Each finding links to its request and response.
          </span>
          <span className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.12em] text-[#8A5A12]">
            Medium
          </span>
        </div>
      </div>
    </div>
  );
}
