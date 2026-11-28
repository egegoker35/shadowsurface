const REQUEST = [
  'GET / HTTP/2',
  'Host: acme-corp.com',
  'Accept: text/html,*/*',
];

const RESPONSE = [
  { line: 'HTTP/2 200', note: '' },
  { line: 'server: nginx', note: '' },
  { line: 'content-type: text/html; charset=utf-8', note: '' },
  { line: 'cache-control: no-store', note: '' },
  { line: 'strict-transport-security: absent', note: 'missing', highlight: true },
];

export default function EvidencePanel() {
  return (
    <div className="grid gap-px bg-cream/10 lg:grid-cols-[minmax(0,320px)_1fr]">
      {/* the finding */}
      <div className="bg-ink px-5 py-5">
        <div className="flex items-center gap-2">
          <span className="border border-[#C4A16B]/35 px-1.5 py-px font-mono text-[8.5px] uppercase tracking-[0.1em] text-[#C4A16B]">
            medium
          </span>
          <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-faint">
            confidence: high
          </span>
        </div>
        <h3 className="mt-3 text-[14px] font-semibold leading-snug text-cream">
          HSTS not sent on the apex host
        </h3>
        <p className="mt-2 text-[12px] leading-relaxed text-dim">
          The 200 response for <span className="font-mono text-[11px] text-cream/80">/</span> carries
          no <span className="font-mono text-[11px] text-cream/80">Strict-Transport-Security</span>.
          The same header set appears on the control request, so this is not a per-route behaviour.
        </p>
        <dl className="mt-4 space-y-1.5 border-t border-cream/10 pt-3 font-mono text-[9.5px]">
          <div className="flex justify-between gap-3">
            <dt className="text-faint">asset</dt>
            <dd className="text-cream/80">acme-corp.com:443</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-faint">category</dt>
            <dd className="text-cream/80">transport_security</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-faint">observed</dt>
            <dd className="text-cream/80">header absent</dd>
          </div>
        </dl>
      </div>

      {/* the observation */}
      <div className="bg-[#0E0E0D]">
        <div className="flex items-center justify-between border-b border-cream/10 px-4 py-2">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-faint">
            Observation
          </span>
          <span className="font-mono text-[8.5px] text-faint">2026-11-28 09:14:07Z</span>
        </div>

        <div className="px-4 py-3">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-cream/30">request</div>
          <div className="mt-1.5 space-y-0.5">
            {REQUEST.map((l) => (
              <div key={l} className="font-mono text-[10px] leading-[1.6] text-dim">
                {l}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-cream/10 px-4 py-3">
          <div className="font-mono text-[8px] uppercase tracking-[0.14em] text-cream/30">response</div>
          <div className="mt-1.5">
            {RESPONSE.map((r) => (
              <div
                key={r.line}
                className={
                  r.highlight
                    ? 'relative bg-[#C4A16B]/10 py-0.5 pl-2.5 font-mono text-[10px] leading-[1.6] text-[#D6B47C]'
                    : 'py-0.5 font-mono text-[10px] leading-[1.6] text-dim'
                }
              >
                {r.highlight && (
                  <span aria-hidden className="absolute left-0 top-0 h-full w-[2px] bg-[#C4A16B]" />
                )}
                {r.line}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-cream/10 px-4 py-2.5 font-mono text-[8.5px] leading-relaxed text-faint">
          control request → identical header set · finding kept
        </div>
      </div>
    </div>
  );
}
