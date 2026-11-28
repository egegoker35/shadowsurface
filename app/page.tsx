'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SchemaOrg from '@/components/SchemaOrg';
import FAQSchema from '@/components/FAQSchema';
import DemoResult from '@/components/DemoResult';
import ReportPreview from '@/components/landing/ReportPreview';
import ProductPanel from '@/components/landing/ProductPanel';
import EvidencePanel from '@/components/landing/EvidencePanel';
import MarketingFooter from '@/components/landing/MarketingFooter';

const FAQS = [
  {
    q: 'What does an external attack surface scan cover?',
    a: 'It starts from a single domain and works outward: subdomains from certificate transparency logs and DNS, the services listening on each host, the software and version behind each service, the CVEs that affect those versions, and the cloud storage or admin interface that was left reachable. Everything is derived from the internet side, the same view an attacker has.',
  },
  {
    q: 'How are subdomains discovered?',
    a: 'Certificate transparency logs provide the passive half. The active half is a DNS dictionary of 2,292 hostname entries, resolved with bounded concurrency. Before either runs, a random label is resolved to detect wildcard DNS — if the catch-all answers, dictionary hits cannot be distinguished from the wildcard, so only the apex is kept instead of inventing hundreds of hostnames. Every name from the CT feed is validated on a label boundary, because a plain suffix test would accept m.testexample.com as part of example.com.',
  },
  {
    q: 'Which ports are scanned?',
    a: 'The engine carries 407 TCP ports covering web, database, remote access, mail, container and orchestration services. Plan limits decide how many are probed per asset: 10 on Free, 20 on Starter, 50 on Professional, 100 on Enterprise. Every open port is followed by a banner grab and a service fingerprint.',
  },
  {
    q: 'How do you avoid false CVE matches?',
    a: 'A CVE is only reported when the version we actually detected falls inside the affected range for that record, and we hold 456 CVE records that have been checked against MITRE. If a service exposes no version, no CVE is reported — a bare product name is not evidence of a vulnerable build.',
  },
  {
    q: 'What is different about the free demo?',
    a: 'The demo runs the same detection logic over HTTP(S) only, using the first 800 dictionary entries so it can finish inside a normal page request. It reports headers, certificates, exposed panels and cloud buckets. The full scan in the dashboard adds TCP port sweeping, CVE mapping and active probes.',
  },
];

const METHOD = [
  {
    step: '01',
    name: 'Discovery',
    runs: 'Certificate transparency (crt.sh) plus a 2,292-entry DNS dictionary',
    proof: 'Wildcard DNS is probed first with a random label. Every CT name is parsed and matched on a label boundary, so an email address or an unrelated domain in the feed is discarded.',
  },
  {
    step: '02',
    name: 'Fingerprint',
    runs: 'TCP connect across 407 ports, HTTP banner, TLS handshake',
    proof: 'The service name, version, TLS protocol and cipher come from the response itself. Nothing is inferred from a page title.',
  },
  {
    step: '03',
    name: 'Vulnerability mapping',
    runs: 'Detected version compared against 456 CVE records',
    proof: 'A CVE is matched only when the version sits inside the affected range, and the finding names the component and version it applies to.',
  },
  {
    step: '04',
    name: 'Evidence gate',
    runs: 'Every finding carries a confidence level and its observation',
    proof: 'When the observation is missing the finding is removed, not softened. A host that never answered produces an INCONCLUSIVE scan, never a clean one.',
  },
];

const TABS = [
  {
    id: 'discovery',
    label: 'Discovery',
    blurb: 'From one domain to the full list of names that actually exist.',
    items: [
      { name: 'Certificate transparency', how: 'crt.sh feed, every name label-validated before use' },
      { name: 'DNS dictionary', how: '2,292 entries, 10 workers, 3s per lookup, 45s cap' },
      { name: 'Wildcard detection', how: 'random label probed first; catch-all discards dictionary hits' },
      { name: 'Record set', how: 'A, MX, TXT, NS, SOA, CNAME, CAA, DNSKEY' },
    ],
  },
  {
    id: 'service',
    label: 'Service',
    blurb: 'What is listening on each host, and what exactly answers.',
    items: [
      { name: 'Port sweep', how: '407 TCP ports in the engine; 10 / 20 / 50 / 100 per plan' },
      { name: 'Banner', how: 'HTTP request per open port; Server and X-Powered-By parsed' },
      { name: 'TLS', how: 'certificate, protocol and cipher read from the socket that served the response' },
      { name: 'WAF / CDN', how: 'provider headers only (CF-RAY, X-Amz-Cf-Id, X-Sucuri-ID)' },
    ],
  },
  {
    id: 'vuln',
    label: 'Vulnerability',
    blurb: 'Version-accurate mapping, with the range written into the record.',
    items: [
      { name: 'CVE matching', how: '456 records checked against MITRE; version must fall in range' },
      { name: 'No-version guard', how: 'a product name without a version produces no CVE' },
      { name: 'Context', how: 'CVSS, CWE and public exploit availability per record' },
      { name: 'Active probes', how: 'injection, traversal, redirect, CORS — baseline compared' },
    ],
  },
  {
    id: 'cloud',
    label: 'Cloud',
    blurb: 'Bucket names derived from the domain, then actually read.',
    items: [
      { name: 'Object storage', how: 'S3, GCS, Azure Blob, Firebase, Spaces' },
      { name: 'Verification', how: 'a bucket counts only when its listing can be read' },
      { name: 'Access denied', how: '403 is private, not exposed — reported as nothing' },
      { name: 'Cloud findings', how: 'public read/write, missing encryption, object counts' },
    ],
  },
  {
    id: 'hygiene',
    label: 'Hygiene',
    blurb: 'Cheap to fix, expensive to ignore.',
    items: [
      { name: 'Headers', how: 'CSP, HSTS, XFO, XCTO, Referrer, Permissions — one finding per host' },
      { name: 'Email auth', how: 'SPF from apex TXT, DMARC from _dmarc, DNSSEC from DNSKEY' },
      { name: 'Exposed interfaces', how: 'admin paths, autoindex signatures, fetched sensitive files' },
      { name: 'Cookies', how: 'HttpOnly, Secure, SameSite per cookie' },
    ],
  },
];

const LEDGER = [
  {
    was: 'Any page containing the string ".env" reported as critical exposure',
    now: 'Credential material is reported only when real key formats or non-placeholder KEY=value pairs are present',
  },
  {
    was: 'WAF detected from page text: "Wix", "Imperva", "F5" on sites that ran none',
    now: 'Only response headers issued by the provider count as evidence',
  },
  {
    was: 'A CVE for every product name, whether or not a version was exposed',
    now: 'No version means no CVE — a name is not a vulnerable build',
  },
  {
    was: '"8 security headers missing" on hosts that returned no headers at all',
    now: 'A header finding cannot outlive the header map that produced it',
  },
  {
    was: 'DMARC reported missing on every domain, including ones enforcing quarantine',
    now: '_dmarc.<domain> is queried and the policy value is recorded',
  },
  {
    was: 'example.com produced 36 web vulnerabilities',
    now: 'The same host produces 0 — every one of them was a pattern match with no observation behind it',
  },
];

const BANDS = [
  { label: 'Low', range: '0–39', tone: 'bg-[#3F9D74]', text: 'text-[#6FBF9B]', width: 'w-[40%]' },
  { label: 'Medium', range: '40–69', tone: 'bg-[#C99540]', text: 'text-[#DDB271]', width: 'w-[30%]' },
  { label: 'High', range: '70–84', tone: 'bg-[#D0724A]', text: 'text-[#E08F67]', width: 'w-[15%]' },
  { label: 'Critical', range: '85–100', tone: 'bg-[#C0453A]', text: 'text-[#DE8B80]', width: 'w-[15%]' },
];

const AUDIENCE = [
  {
    role: 'Security teams',
    body: 'A continuous view of what is actually reachable from the internet, with the evidence needed to hand each finding to the team that owns the asset.',
  },
  {
    role: 'DevOps and cloud',
    body: 'Catch a public bucket or a forgotten staging host before it becomes an incident. Scans can be driven from CI through the REST API.',
  },
  {
    role: 'Consultants',
    body: 'Reconnaissance and a client-ready report in one pass, with the request and response behind every finding so the client can reproduce it.',
  },
];

const DELIVERABLES = [
  {
    name: 'The scan report',
    body: 'Every asset, port, service, version and finding in one PDF, with the observation attached to each row.',
  },
  {
    name: 'The change report',
    body: 'What appeared and what was closed since the previous run, so a fixed issue stays fixed.',
  },
  {
    name: 'The asset inventory',
    body: 'Names, addresses, certificates and exposed services — the list your own records usually miss.',
  },
  {
    name: 'The walkthrough',
    body: 'A call over the findings, in the order they should be fixed, if the report needs explaining.',
  },
];

const SPECS = [
  { v: '407', l: 'TCP ports in the engine' },
  { v: '2,292', l: 'hostnames in the DNS dictionary' },
  { v: '456', l: 'CVE records checked against MITRE' },
  { v: '0', l: 'CVEs reported without a version' },
];

const LABEL_TONE = {
  jade: { n: 'text-jade', rule: 'bg-jade/40' },
  steel: { n: 'text-steel', rule: 'bg-steel/40' },
  clay: { n: 'text-clay', rule: 'bg-clay/40' },
} as const;

function Label({ n, children, tone = 'jade' }: { n: string; children: ReactNode; tone?: keyof typeof LABEL_TONE }) {
  const t = LABEL_TONE[tone];
  return (
    <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">
      <span className={t.n}>{n}</span>
      <span aria-hidden className={`h-px w-5 ${t.rule}`} />
      <span>{children}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-5 font-serif text-[2rem] leading-[1.12] tracking-[-0.015em] text-cream sm:text-[2.35rem]">
      {children}
    </h2>
  );
}

export default function LandingPage() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [tab, setTab] = useState(TABS[0].id);
  const activeTab = TABS.find((t) => t.id === tab) || TABS[0];

  const runDemo = async () => {
    if (!target) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Scan failed');
        setLoading(false);
        return;
      }
      setResult(data.result);
      setLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-cream selection:bg-cream/20 selection:text-ink">
      <SchemaOrg />
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="px-6 pt-32 sm:pt-36">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-[52rem]">
            <div className="flex items-center gap-3">
              <span aria-hidden className="h-px w-8 bg-jade/60" />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-jade">
                External attack surface management
              </span>
            </div>

            <h1 className="mt-6 font-serif text-[2.6rem] leading-[1.04] tracking-[-0.022em] text-cream sm:text-[3.35rem] lg:text-[3.65rem]">
              Find what you have exposed,
              <span className="block italic text-jadeLight">before someone else does.</span>
            </h1>

            <p className="mt-6 max-w-[40rem] text-[15.5px] leading-[1.75] text-dim">
              ShadowSurface enumerates your subdomains, fingerprints every open service and maps CVEs
              to the exact version it detected. Every finding in the report is backed by the request
              and response that produced it.
            </p>

            <div className="mt-8 max-w-[30rem]">
              <label
                htmlFor="scan-target"
                className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-faint"
              >
                Domain
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id="scan-target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="yourcompany.com"
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 rounded-[3px] border border-cream/15 bg-ink2 px-3.5 py-3 font-mono text-[13px] text-cream placeholder:text-faint focus:border-jade/60 focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && runDemo()}
                />
                <button
                  onClick={runDemo}
                  disabled={loading}
                  className="rounded-[3px] bg-jade px-5 py-3 text-[13px] font-semibold text-ink transition-colors hover:bg-[#6FC7A5] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Scanning…' : 'Run scan'}
                </button>
              </div>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-faint">
                Three free scans per 30 minutes. The demo covers HTTP(S) and the first 800 dictionary
                entries — no account needed.
              </p>
              {error && <p className="mt-3 text-[13px] text-[#C9726A]">{error}</p>}
              {result && <DemoResult result={result} />}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
              <Link
                href="/register"
                className="text-cream underline decoration-jade/45 underline-offset-4 transition-colors hover:decoration-jade"
              >
                Create an account
              </Link>
              <Link href="/pricing" className="text-dim transition-colors hover:text-cream">
                Plans and limits
              </Link>
            </div>
          </div>

          <div className="mt-14">
            <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              <span>Product view — sample workspace</span>
              <span className="hidden sm:block">Everything below is generated by the scan itself</span>
            </div>
            <ProductPanel />
          </div>
        </div>
      </section>

      {/* ─── REAL CAPABILITY NUMBERS ──────────────────────────── */}
      <section className="mt-16 border-y border-jade/20 bg-jadeDeep">
        <dl className="mx-auto grid max-w-[1180px] grid-cols-2 gap-px bg-jade/15 sm:grid-cols-4">
          {SPECS.map((s, i) => (
            <div key={s.l} className="bg-jadeDeep px-6 py-6">
              <dt
                className={`font-mono text-[1.6rem] leading-none ${
                  ['text-jadeLight', 'text-steel', 'text-clay', 'text-cream'][i % 4]
                }`}
              >
                {s.v}
              </dt>
              <dd className="mt-2 text-[11.5px] leading-snug text-jadeLight/75">{s.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ─── 02 EVIDENCE ──────────────────────────────────────── */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Label n="02">Evidence</Label>
            <SectionTitle>Every finding carries its proof</SectionTitle>
            <p className="mt-4 max-w-sm text-[14px] leading-[1.75] text-dim">
              A finding is not a pattern that fired. It is a response we received, compared against a
              control request, with the part that proves it marked.
            </p>
            <ul className="mt-6 space-y-2.5 border-t border-cream/12 pt-5">
              {[
                'Request and response stored with the finding',
                'Control request compared before a finding is kept',
                'Confidence level recorded on every row',
              ].map((l) => (
                <li key={l} className="flex gap-2.5 text-[12.5px] leading-relaxed text-dim">
                  <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 bg-cream/40" />
                  {l}
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-8">
            <EvidencePanel />
          </div>
        </div>
      </section>

      {/* ─── 03 METHOD ────────────────────────────────────────── */}
      <section id="method" className="border-t border-cream/10 px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <Label n="03" tone="steel">Method</Label>
              <SectionTitle>How a scan runs</SectionTitle>
              <p className="mt-4 max-w-sm text-[14px] leading-[1.75] text-dim">
                Four stages. Each one produces the evidence the next stage depends on, and nothing
                leaves the last stage without it.
              </p>
              <div className="mt-7 hidden border-l border-cream/15 pl-4 lg:block">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">engine.ts</p>
                <div className="mt-2 space-y-1.5">
                  <p className="font-mono text-[11px] text-dim">enumerate() → hosts[]</p>
                  <p className="font-mono text-[11px] text-dim">probe() → services[]</p>
                  <p className="font-mono text-[11px] text-dim">match() → cves[]</p>
                  <p className="font-mono text-[11px] text-cream/80">gate() → findings[]</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <ol className="border-t border-cream/12">
              {METHOD.map((m, i) => (
                <li
                  key={m.step}
                  className="group grid gap-x-6 gap-y-2 border-b border-cream/12 py-6 sm:grid-cols-[3rem_1fr]"
                >
                  <span
                    className={`font-mono text-[11px] transition-colors ${
                      [
                        'text-jade/80 group-hover:text-jade',
                        'text-steel/80 group-hover:text-steel',
                        'text-clay/80 group-hover:text-clay',
                        'text-jadeLight/80 group-hover:text-jadeLight',
                      ][i % 4]
                    }`}
                  >
                    {m.step}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-cream">{m.name}</h3>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-dim">{m.runs}</p>
                    <p
                      className={`mt-2.5 border-l pl-3 text-[12.5px] leading-relaxed text-faint ${
                        ['border-jade/35', 'border-steel/35', 'border-clay/35', 'border-jadeLight/35'][i % 4]
                      }`}
                    >
                      {m.proof}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─── 04 DELIVERABLE ───────────────────────────────────── */}
      <section className="border-t border-cream/10 px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <Label n="04" tone="clay">Deliverable</Label>
            <SectionTitle>What lands on your desk</SectionTitle>
            <p className="mt-4 max-w-lg text-[14px] leading-[1.75] text-dim">
              A scan is only worth running if the output survives a meeting. Four artefacts come out
              of every cycle, and each one is generated from the same evidence store.
            </p>
            <dl className="mt-8 border-t border-cream/12">
              {DELIVERABLES.map((d) => (
                <div key={d.name} className="grid gap-x-6 gap-y-1 border-b border-cream/12 py-4 sm:grid-cols-[180px_1fr]">
                  <dt className="text-[13.5px] font-medium text-cream">{d.name}</dt>
                  <dd className="text-[12.5px] leading-relaxed text-dim">{d.body}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="lg:col-span-5">
            <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
              <span>Report preview</span>
              <span>PDF</span>
            </div>
            <ReportPreview />
            <div className="mt-5 border-t border-cream/10 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
                How the risk score is built
              </p>
              <div className="mt-2.5 flex h-1 w-full overflow-hidden bg-cream/10">
                {BANDS.map((b) => (
                  <span key={b.label} className={`${b.tone} ${b.width}`} />
                ))}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                {BANDS.map((b) => (
                  <span key={b.label} className="flex items-center gap-1.5 text-[10.5px] text-faint">
                    <span className={`h-1.5 w-1.5 ${b.tone}`} />
                    <span className={b.text}>{b.label}</span>
                    <span className="font-mono text-cream/25">{b.range}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 05 COVERAGE ──────────────────────────────────────── */}
      <section id="coverage" className="border-t border-cream/10 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-[34rem]">
              <Label n="05">Coverage</Label>
              <SectionTitle>What gets checked</SectionTitle>
              <p className="mt-4 text-[14px] leading-[1.75] text-dim">
                Five groups of checks, all from the internet side. Pick one to see the technique
                behind it.
              </p>
            </div>
            <Link
              href="/features"
              className="shrink-0 border-b border-cream/25 pb-0.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-dim transition-colors hover:border-cream hover:text-cream"
            >
              Full feature list
            </Link>
          </div>

          <div className="mt-9">
            <div className="flex flex-wrap gap-px border border-cream/12 bg-cream/12">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-selected={tab === t.id}
                  className={`flex-1 px-4 py-3 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors ${
                    tab === t.id
                      ? 'bg-jade text-ink'
                      : 'bg-ink text-faint hover:bg-ink2 hover:text-jadeLight'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="border-x border-b border-cream/12 bg-jade/[0.04] px-5 py-6 sm:px-6">
              <p className="text-[13.5px] text-cream">{activeTab.blurb}</p>
              <dl className="mt-4 border-t border-cream/10">
                {activeTab.items.map((i) => (
                  <div
                    key={i.name}
                    className="grid gap-x-6 gap-y-0.5 border-b border-cream/10 py-3 sm:grid-cols-[210px_1fr]"
                  >
                    <dt className="text-[13px] font-medium text-cream/90">{i.name}</dt>
                    <dd className="font-mono text-[11.5px] leading-relaxed text-faint">{i.how}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 06 RESTRAINT (paper) ─────────────────────────────── */}
      <section className="bg-paper px-6 py-16 text-ink sm:py-20">
        <div className="mx-auto max-w-[1180px]">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-4">
              <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-[#1B4B3C]">
                <span>06</span>
                <span aria-hidden className="h-px w-5 bg-[#1B4B3C]/40" />
                <span>Restraint</span>
              </div>
              <h2 className="mt-5 font-serif text-[2rem] leading-[1.12] tracking-[-0.015em] text-ink sm:text-[2.35rem]">
                What we stopped reporting
              </h2>
              <p className="mt-4 max-w-sm text-[14px] leading-[1.75] text-ink/70">
                A scanner is only useful if its findings survive scrutiny. Every row below is a class
                of false positive this engine used to produce, and the rule that replaced it.
              </p>
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-[1fr_1fr] gap-x-8 border-b border-ink/25 pb-2">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink/45">
                  Was reported
                </span>
                <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink/45">
                  Is reported now
                </span>
              </div>
              <ul>
                {LEDGER.map((l) => (
                  <li
                    key={l.now}
                    className="grid gap-x-8 gap-y-1.5 border-b border-ink/15 py-4 sm:grid-cols-[1fr_1fr]"
                  >
                    <span className="text-[12.5px] leading-relaxed text-ink/40 line-through decoration-[#B0453C]/50">
                      {l.was}
                    </span>
                    <span className="text-[12.5px] leading-relaxed text-[#173F32]">{l.now}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 07 AUDIENCE ──────────────────────────────────────── */}
      <section className="px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-[1180px]">
          <Label n="07" tone="steel">Where it fits</Label>
          <SectionTitle>Built for the people who own the surface</SectionTitle>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-3">
            {AUDIENCE.map((a, i) => (
              <div
                key={a.role}
                className={`border-t pt-5 ${['border-jade/25', 'border-steel/25', 'border-clay/25'][i % 3]}`}
              >
                <span className={`font-mono text-[10px] ${['text-jade/80', 'text-steel/80', 'text-clay/80'][i % 3]}`}>
                  0{i + 1}
                </span>
                <h3 className="mt-2 text-[14px] font-semibold text-cream">{a.role}</h3>
                <p className="mt-2 text-[13px] leading-[1.7] text-dim">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 08 FAQ ───────────────────────────────────────────── */}
      <section className="border-t border-cream/10 px-6 py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <Label n="08" tone="clay">Questions</Label>
              <SectionTitle>Technical FAQ</SectionTitle>
              <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-dim">
                The answers are the same rules the engine runs on.
              </p>
            </div>
          </div>
          <div className="lg:col-span-8">
            <div className="border-t border-cream/12">
              {FAQS.map((faq, i) => (
                <div key={faq.q} className="border-b border-cream/12">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="group flex w-full items-start justify-between gap-6 py-4 text-left"
                    aria-expanded={openFaq === i}
                  >
                    <span className="text-[14px] font-medium text-cream/90 transition-colors group-hover:text-cream">
                      {faq.q}
                    </span>
                    <span className="shrink-0 pt-0.5 font-mono text-[13px] leading-none text-jade/80">
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="max-w-[46rem] pb-5 pr-8 text-[13px] leading-[1.75] text-dim">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <FAQSchema faqs={FAQS.map((f) => ({ q: f.q, a: f.a }))} />

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="border-t border-jade/20 bg-jadeDeep px-6 py-14">
        <div className="mx-auto flex max-w-[1180px] flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-[1.8rem] leading-[1.15] tracking-[-0.015em] text-cream sm:text-[2.1rem]">
              Run the first scan on your own domain.
            </h2>
            <p className="mt-3 text-[13.5px] text-jadeLight/80">
              Free plan covers subdomain discovery and the top 10 ports. No card required.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link
              href="/register"
              className="rounded-[3px] bg-jade px-5 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-[#6FC7A5]"
            >
              Create account
            </Link>
            <Link
              href="/pricing"
              className="rounded-[3px] border border-jade/40 px-5 py-2.5 text-[13px] font-medium text-cream transition-colors hover:border-jade"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
