import Link from 'next/link';
import Navbar from '@/components/Navbar';
import MarketingFooter from '@/components/landing/MarketingFooter';

// Each group gets one accent, rotated down the page. The hue carries structure only —
// the section marker and its hairline — so the list stays readable.
const ACCENTS = [
  { dot: 'bg-jade', rule: 'bg-jade', note: 'text-jadeLight/85' },
  { dot: 'bg-steel', rule: 'bg-steel', note: 'text-steel/85' },
  { dot: 'bg-clay', rule: 'bg-clay', note: 'text-clay/85' },
] as const;

const GROUPS: { title: string; note: string; rows: { check: string; how: string }[] }[] = [
  {
    title: 'Discovery',
    note: 'Everything starts from one domain name.',
    rows: [
      {
        check: 'Subdomain enumeration',
        how: 'Certificate transparency logs from crt.sh, combined with a DNS dictionary of 2,292 hostname entries resolved with bounded concurrency and a per-lookup timeout.',
      },
      {
        check: 'Wildcard DNS detection',
        how: 'A random label is resolved before the dictionary runs. If the catch-all answers, dictionary results are discarded and only the apex is kept, so a wildcard cannot fabricate hostnames.',
      },
      {
        check: 'DNS records',
        how: 'A, MX, TXT, NS, SOA and CNAME, plus CAA and DNSKEY resolved over DNS-over-HTTPS.',
      },
      {
        check: 'Subdomain takeover signals',
        how: 'CNAME targets that no longer resolve are reported as a dangling record, not as a confirmed takeover.',
      },
    ],
  },
  {
    title: 'Service fingerprinting',
    note: 'What is listening, and what exactly is behind it.',
    rows: [
      {
        check: 'Port scanning',
        how: 'TCP connect against 407 ports in the engine. Port budget per asset follows the plan: 10, 20, 50 or 100.',
      },
      {
        check: 'Banner and version',
        how: 'An HTTP request is sent to each open port. The Server, X-Powered-By, generator and response body are used to identify the product, and the version is only recorded when it is present in the response.',
      },
      {
        check: 'TLS analysis',
        how: 'The peer certificate, negotiated protocol and cipher are read from the TLS socket that served the response. No handshake means no TLS verdict — the grade is left empty rather than guessed.',
      },
      {
        check: 'WAF and CDN',
        how: 'Only response headers issued by the provider are accepted (CF-RAY, X-Amz-Cf-Id, X-Sucuri-ID and similar). A brand name in page text is not evidence of protection.',
      },
    ],
  },
  {
    title: 'Vulnerability mapping',
    note: 'Version-based, with the range written into the record.',
    rows: [
      {
        check: 'CVE matching',
        how: '456 CVE records checked against MITRE. A record matches only when the detected version falls inside its affected range, and the finding names the component and version it was matched against.',
      },
      {
        check: 'No-version guard',
        how: 'If a service exposes no version, no CVE is produced. A bare product name is never treated as a vulnerable build.',
      },
      {
        check: 'Severity context',
        how: 'Each record carries CVSS, CWE and whether public exploit code exists, so prioritisation is based on the matched record rather than the asset alone.',
      },
      {
        check: 'Active web probes',
        how: 'Targeted checks for injection, path traversal, open redirect, CORS misconfiguration and exposed configuration files. A probe result is reported only when the response differs from the baseline in a way the payload explains.',
      },
    ],
  },
  {
    title: 'Cloud exposure',
    note: 'Bucket names derived from the domain, then verified.',
    rows: [
      {
        check: 'Object storage',
        how: 'Public S3, Google Cloud Storage, Azure Blob, Firebase and DigitalOcean Spaces buckets. A bucket is only reported when its listing can actually be read.',
      },
      {
        check: 'Cloud findings',
        how: 'Public read or write access, missing encryption, and object counts where the listing exposes them. An access-denied response is treated as a negative result, never as exposure.',
      },
    ],
  },
  {
    title: 'Hygiene and configuration',
    note: 'The issues that are cheap to fix and expensive to ignore.',
    rows: [
      {
        check: 'Security headers',
        how: 'CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy and Permissions-Policy, consolidated into one finding per host that lists exactly which headers are absent.',
      },
      {
        check: 'Email authentication',
        how: 'SPF is read from the apex TXT set, DMARC from _dmarc.<domain> with its policy value. DNSSEC is proven by DNSKEY. DKIM is reported only on a positive selector match.',
      },
      {
        check: 'Exposed interfaces',
        how: 'Admin and management paths, directory listing with a genuine autoindex signature, and sensitive files confirmed by fetching the referenced path and checking it returns downloadable non-HTML content.',
      },
      {
        check: 'Cookie flags',
        how: 'Session cookies are checked for HttpOnly, Secure and SameSite, with SameSite absence rated low because browsers default to Lax.',
      },
    ],
  },
  {
    title: 'Reporting and API',
    note: 'What you get at the end, and how to automate it.',
    rows: [
      {
        check: 'Risk scale',
        how: 'One scale across every scan type: 85+ CRITICAL, 70–84 HIGH, 40–69 MEDIUM, below 40 LOW. Statistics use the same bands, so the counts and the label always agree.',
      },
      {
        check: 'Inconclusive scans',
        how: 'If subdomains resolve but nothing responds, the scan is marked INCONCLUSIVE with the reason. It is never presented as a clean result.',
      },
      {
        check: 'Report contents',
        how: 'Per-asset risk, findings with severity and evidence, CVE attribution, DNS posture, compliance view and remediation steps.',
      },
      {
        check: 'REST API',
        how: 'Start a scan, poll its status and retrieve the full result. Rate limits follow the plan tier.',
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-ink text-cream/85">
      <Navbar />

      <section className="pt-24 pb-12 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-jadeLight/80 mb-5">
            Technical reference
          </p>
          <h1 className="max-w-3xl font-serif text-[2.1rem] font-normal leading-[1.1] tracking-[-0.015em] text-cream sm:text-[2.7rem]">
            What the scanner checks, and how each result is verified
          </h1>
          <p className="mt-5 text-base text-dim leading-relaxed max-w-2xl">
            Every row below describes a check the engine performs and the evidence required before
            it becomes a finding. Numbers reflect the current build: 456 CVE records, a 2,292-entry
            DNS dictionary and 407 TCP ports.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <Link href="/register" className="text-jade hover:text-jadeLight font-medium">
              Run a free scan
            </Link>
            <span className="text-faint">·</span>
            <Link href="/pricing" className="text-dim hover:text-cream/85">
              Plan limits
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        {GROUPS.map((g, gi) => {
          const a = ACCENTS[gi % ACCENTS.length];
          return (
          <section key={g.title} className="pt-12 first:pt-4">
            <div className="relative flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 border-b border-cream/12 pb-3">
              <h2 className="flex items-center gap-2.5 text-lg font-semibold text-cream">
                <span aria-hidden className={`h-2 w-2 ${a.dot}`} />
                {g.title}
              </h2>
              <p className={`text-xs ${a.note}`}>{g.note}</p>
              <span aria-hidden className={`absolute -bottom-px left-0 h-px w-10 ${a.rule}`} />
            </div>
            <dl className="divide-y divide-cream/10">
              {g.rows.map((r) => (
                <div key={r.check} className="py-4 grid sm:grid-cols-[210px_1fr] gap-x-8 gap-y-1.5">
                  <dt className="text-sm font-medium text-cream/80">{r.check}</dt>
                  <dd className="text-sm text-dim leading-relaxed">{r.how}</dd>
                </div>
              ))}
            </dl>
          </section>
          );
        })}

        <section className="pt-12">
          <div className="relative border-b border-cream/12 pb-3">
            <h2 className="flex items-center gap-2.5 text-lg font-semibold text-cream">
              <span aria-hidden className="h-2 w-2 bg-[#DDB271]" />
              Limits
            </h2>
            <span aria-hidden className="absolute -bottom-px left-0 h-px w-10 bg-[#DDB271]" />
          </div>
          <div className="pt-4 space-y-3 text-sm text-dim leading-relaxed">
            <p>
              Scanning runs from a single vantage point on the public internet. A CDN, geo-block or
              rate limiter can therefore change what a scan sees compared with your own network.
              When a target stops answering, the scan reports that state instead of a clean result.
            </p>
            <p>
              Version detection depends on what a service is willing to disclose. Hardened servers
              that suppress their version cannot be matched to CVEs, which is the correct outcome:
              the vulnerability may exist, but there is no evidence to report.
            </p>
            <p>
              Only assets reachable from the internet are in scope. Internal networks, authenticated
              application logic and business-logic flaws are outside the engine.
            </p>
          </div>
        </section>
      </div>

      <MarketingFooter />
    </div>
  );
}
