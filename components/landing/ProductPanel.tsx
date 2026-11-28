const NAV = ['Overview', 'Scans', 'Assets', 'Findings', 'Reports', 'Domains'];

const ASSETS = [
  { host: 'acme-corp.com', port: 443, svc: 'HTTPS', risk: 58 },
  { host: 'api.acme-corp.com', port: 443, svc: 'HTTPS', risk: 61 },
  { host: 'dev.acme-corp.com', port: 8080, svc: 'Jenkins', risk: 78 },
  { host: 'mail.acme-corp.com', port: 443, svc: 'SMTP', risk: 44 },
  { host: 'vpn.acme-corp.com', port: 10443, svc: 'SSL-VPN', risk: 82 },
];

const FINDINGS = [
  { sev: 'critical', text: 'Jenkins panel reachable without authentication', host: 'dev.acme-corp.com' },
  { sev: 'high', text: 'CVE-2023-44487 · HTTP/2 rapid reset', host: 'api.acme-corp.com' },
  { sev: 'medium', text: '6 baseline security headers absent', host: 'acme-corp.com' },
];

const SEV: Record<string, string> = {
  critical: 'text-[#E28B7B] border-[#E28B7B]/40',
  high: 'text-[#E5A87C] border-[#E5A87C]/40',
  medium: 'text-[#DDC286] border-[#DDC286]/40',
};

function riskTone(score: number) {
  if (score >= 70) return 'text-[#E5A87C] border-[#E5A87C]/40';
  if (score >= 40) return 'text-[#DDC286] border-[#DDC286]/40';
  return 'text-[#6FBF9B] border-[#6FBF9B]/40';
}

export default function ProductPanel() {
  return (
    <div className="border border-jade/20 bg-[#0E0E0D] shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
      <div aria-hidden className="h-[2px] bg-gradient-to-r from-jade via-jade/50 to-transparent" />
      {/* window chrome */}
      <div className="flex items-center justify-between border-b border-cream/10 px-3.5 py-2.5">
        <div className="flex items-center gap-2 font-mono text-[9.5px] text-faint">
          <span aria-hidden className="grid h-2.5 w-2.5 grid-cols-2 gap-px">
            <span className="bg-cream/70" />
            <span className="bg-cream/25" />
            <span className="bg-cream/25" />
            <span className="bg-cream/70" />
          </span>
          <span className="text-dim">shadowsurface.app</span>
          <span className="text-cream/20">/</span>
          <span>scans / 4f2a</span>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-jade">
          <span className="h-1 w-1 rounded-full bg-jade" />
          complete
        </span>
      </div>

      <div className="grid grid-cols-[1fr] sm:grid-cols-[112px_1fr]">
        {/* rail */}
        <div className="hidden border-r border-cream/10 py-3 sm:block">
          {NAV.map((n) => (
            <div
              key={n}
              className={`px-3 py-1.5 text-[10.5px] ${
                n === 'Scans'
                  ? 'border-l border-jade bg-jade/10 text-jadeLight'
                  : 'border-l border-transparent text-faint'
              }`}
            >
              {n}
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-baseline justify-between px-4 pt-3.5">
            <div>
              <div className="text-[12.5px] font-semibold text-cream">acme-corp.com</div>
              <div className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-faint">
                full scan · 34 ports · 61s
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-[8px] uppercase tracking-[0.12em] text-faint">Risk</div>
              <div className="font-mono text-[17px] leading-none text-[#E5A87C]">61</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-px border-y border-cream/10 bg-cream/10">
            {[
              { v: '12', l: 'assets' },
              { v: '34', l: 'ports' },
              { v: '3', l: 'cves' },
              { v: '9', l: 'findings' },
            ].map((s) => (
              <div key={s.l} className="bg-[#0E0E0D] px-2.5 py-2">
                <div className="font-mono text-[13px] leading-none text-cream">{s.v}</div>
                <div className="mt-1 font-mono text-[7.5px] uppercase tracking-[0.12em] text-faint">
                  {s.l}
                </div>
              </div>
            ))}
          </div>

          <div className="grid items-start sm:grid-cols-[minmax(0,1fr)_266px]">
          <div>
          <div className="grid grid-cols-[minmax(0,1fr)_66px_42px_38px] gap-2 px-4 pb-1 pt-2.5">
            <span className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-faint">asset</span>
            <span className="text-right font-mono text-[7.5px] uppercase tracking-[0.12em] text-faint">service</span>
            <span className="text-right font-mono text-[7.5px] uppercase tracking-[0.12em] text-faint">
              risk
            </span>
            <span className="text-right font-mono text-[7.5px] uppercase tracking-[0.12em] text-faint">
              port
            </span>
          </div>

          <ul>
            {ASSETS.map((a) => (
              <li
                key={a.host}
                className="grid grid-cols-[minmax(0,1fr)_66px_42px_38px] items-center gap-2 border-b border-cream/[0.07] px-4 py-1.5 last:border-b-0"
              >
                <span className="min-w-0 truncate font-mono text-[10px] text-cream/85">{a.host}</span>
                <span className="truncate text-right font-mono text-[9px] text-faint">{a.svc}</span>
                <span
                  className={`justify-self-end border px-1 py-px font-mono text-[8.5px] leading-tight ${riskTone(
                    a.risk
                  )}`}
                >
                  {a.risk}
                </span>
                <span className="justify-self-end font-mono text-[8.5px] text-faint">{a.port}</span>
              </li>
            ))}
          </ul>

          </div>

          <div className="border-t border-cream/10 px-4 py-2.5 sm:border-l sm:border-t-0">
            <div className="font-mono text-[7.5px] uppercase tracking-[0.12em] text-faint">
              latest findings
            </div>
            <ul className="mt-2 space-y-2">
              {FINDINGS.map((f) => (
                <li key={f.text} className="border-l border-cream/10 pl-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`shrink-0 border px-1 font-mono text-[7.5px] uppercase leading-[13px] tracking-[0.08em] ${SEV[f.sev]}`}
                    >
                      {f.sev}
                    </span>
                    <span className="truncate font-mono text-[8px] text-faint">{f.host}</span>
                  </div>
                  <p className="mt-1 text-[10px] leading-snug text-cream/80">{f.text}</p>
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>
      </div>

      <div className="border-t border-cream/10 px-3.5 py-2 font-mono text-[8px] uppercase tracking-[0.1em] text-faint">
        Sample workspace · every row opens its request and response
      </div>
    </div>
  );
}
