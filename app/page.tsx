'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SchemaOrg from '@/components/SchemaOrg';
import FAQSchema from '@/components/FAQSchema';
import DemoResult from '@/components/DemoResult';
import ReportPreview from '@/components/landing/ReportPreview';

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
  { label: 'LOW', range: '0–39', tone: 'bg-emerald-500/70', text: 'text-emerald-400', width: 'w-[40%]' },
  { label: 'MEDIUM', range: '40–69', tone: 'bg-amber-500/70', text: 'text-amber-400', width: 'w-[30%]' },
  { label: 'HIGH', range: '70–84', tone: 'bg-orange-500/70', text: 'text-orange-400', width: 'w-[15%]' },
  { label: 'CRITICAL', range: '85–100', tone: 'bg-red-500/70', text: 'text-red-400', width: 'w-[15%]' },
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
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30">
      <SchemaOrg />
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-16 px-6">
        {/* depth: blueprint grid + soft glow, no imagery */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgb(148 163 184 / 0.25) 1px, transparent 1px), linear-gradient(to bottom, rgb(148 163 184 / 0.25) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 0%, black 20%, transparent 75%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[52rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[110px]"
        />

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-14 items-start">
          <div className="lg:col-span-7">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400/80 mb-5">
              External attack surface management
            </p>
            <h1 className="text-[1.95rem] sm:text-[2.5rem] font-semibold tracking-tight leading-[1.12] text-white">
              Find what you have exposed, before someone else does.
            </h1>
            <p className="mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-xl">
              ShadowSurface enumerates your subdomains, fingerprints every open service and maps
              CVEs to the exact version it detected. Every finding in the report is backed by the
              request and response that produced it.
            </p>

            <div className="mt-8 max-w-xl">
              <label htmlFor="scan-target" className="block text-xs font-medium text-slate-400 mb-2">
                Domain
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="scan-target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="example.com"
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 px-3.5 py-2.5 rounded-md bg-slate-900 border border-slate-700 font-mono text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  onKeyDown={(e) => e.key === 'Enter' && runDemo()}
                />
                <button
                  onClick={runDemo}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Scanning…' : 'Run scan'}
                </button>
              </div>
              <p className="mt-2.5 text-xs text-slate-500">
                Three free scans per 30 minutes. The demo checks the first 800 hostnames over HTTP(S).
              </p>
              {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
              {result && <DemoResult result={result} />}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Create an account
              </Link>
              <span className="text-slate-700">·</span>
              <Link href="/pricing" className="text-slate-400 hover:text-slate-200">
                Plans and limits
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 w-full lg:pt-2">
            <ReportPreview />
            <div className="mt-3 rounded-md border border-slate-800 bg-slate-900/30 px-3.5 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500 mb-1.5">How that risk is built</p>
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                {BANDS.map((b) => (
                  <span key={b.label} className={`${b.tone} ${b.width}`} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {BANDS.map((b) => (
                  <span key={b.label} className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${b.tone}`} />
                    <span className={b.text}>{b.label}</span>
                    <span className="text-slate-600">{b.range}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── REAL CAPABILITY NUMBERS ──────────────────────────── */}
      <section className="border-y border-slate-800/70 bg-slate-900/20">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-8">
            {[
              { v: '456', l: 'CVE records checked against MITRE' },
              { v: '2,292', l: 'subdomain dictionary entries' },
              { v: '407', l: 'TCP ports in the engine' },
              { v: '0', l: 'CVEs reported without a detected version' },
            ].map((s) => (
              <div key={s.l} className="group">
                <dt className="font-mono text-xl text-white group-hover:text-emerald-400 transition-colors">{s.v}</dt>
                <dd className="mt-0.5 text-xs text-slate-500 leading-snug">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── METHOD ───────────────────────────────────────────── */}
      <section id="method" className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-4">Method</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
              How a scan runs
            </h2>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Four stages. Each one produces the evidence the next stage depends on, and nothing
              leaves the last stage without it.
            </p>
            <div className="mt-6 hidden lg:block">
              <div className="font-mono text-[11px] text-slate-600">engine.ts</div>
              <div className="mt-1 space-y-1 border-l border-slate-800 pl-3">
                <p className="font-mono text-[11px] text-slate-500">enumerate() → hosts[]</p>
                <p className="font-mono text-[11px] text-slate-500">probe() → services[]</p>
                <p className="font-mono text-[11px] text-slate-500">match() → cves[]</p>
                <p className="font-mono text-[11px] text-emerald-500/70">gate() → findings[]</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 divide-y divide-slate-800/80 border-t border-slate-800/80">
            {METHOD.map((m) => (
              <div key={m.step} className="py-6 grid sm:grid-cols-[44px_1fr] gap-x-5 gap-y-2 group">
                <span className="font-mono text-xs text-slate-600 pt-1 group-hover:text-emerald-500/70 transition-colors">
                  {m.step}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{m.name}</h3>
                  <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{m.runs}</p>
                  <p className="mt-2 text-[13px] text-slate-500 leading-relaxed border-l border-slate-800 pl-3">
                    {m.proof}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COVERAGE EXPLORER ────────────────────────────────── */}
      <section id="coverage" className="py-20 px-6 border-t border-slate-800/70 bg-slate-900/20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-4">Coverage</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
              What gets checked
            </h2>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Five groups of checks, all from the internet side. Pick one to see the technique
              behind it.
            </p>
          </div>

          <div className="mt-9 rounded-lg border border-slate-800 bg-slate-950/60 overflow-hidden">
            <div className="flex flex-wrap gap-px bg-slate-800/60">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-selected={tab === t.id}
                  className={`flex-1 min-w-[110px] px-4 py-3 text-xs font-medium transition-colors ${
                    tab === t.id
                      ? 'bg-slate-900 text-emerald-400'
                      : 'bg-slate-950 text-slate-500 hover:text-slate-300 hover:bg-slate-900/60'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="p-5 sm:p-6">
              <p className="text-sm text-slate-300">{activeTab.blurb}</p>
              <dl className="mt-4 divide-y divide-slate-800/70">
                {activeTab.items.map((i) => (
                  <div key={i.name} className="py-3 grid sm:grid-cols-[190px_1fr] gap-x-6 gap-y-1">
                    <dt className="text-[13px] font-medium text-slate-200">{i.name}</dt>
                    <dd className="text-[13px] text-slate-500 leading-relaxed">{i.how}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <p className="mt-5 text-xs text-slate-500">
            Full technical detail on <Link href="/features" className="text-slate-400 underline decoration-slate-700 underline-offset-2 hover:text-slate-200">the features page</Link>.
          </p>
        </div>
      </section>

      {/* ─── LEDGER: WHAT WE STOPPED REPORTING ────────────────── */}
      <section className="py-20 px-6 border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-4">Restraint</p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
                What we stopped reporting
              </h2>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed">
                A scanner is only useful if its findings survive scrutiny. Every row below is a
                class of false positive this engine used to produce, and the rule that replaced it.
              </p>
            </div>

            <div className="lg:col-span-8">
              <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 pb-2">
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Before</span>
                <span />
                <span className="text-[10px] uppercase tracking-[0.14em] text-emerald-500/70">Rule now</span>
              </div>
              <ul className="border-t border-slate-800/80">
                {LEDGER.map((l) => (
                  <li key={l.now} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-x-3 gap-y-1.5 py-4 border-b border-slate-800/80">
                    <span className="text-[13px] text-slate-500 line-through decoration-slate-700 leading-relaxed">
                      {l.was}
                    </span>
                    <span aria-hidden className="hidden sm:block text-slate-700 pt-0.5">→</span>
                    <span className="text-[13px] text-slate-300 leading-relaxed border-l-2 border-emerald-500/30 pl-3 sm:border-l-0 sm:pl-0">
                      {l.now}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── AUDIENCE ─────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-4">Users</p>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
            Where it fits
          </h2>
          <div className="mt-10 grid sm:grid-cols-3 gap-x-10 gap-y-8">
            {AUDIENCE.map((a) => (
              <div key={a.role} className="border-t border-slate-800 pt-5 hover:border-emerald-500/40 transition-colors">
                <h3 className="text-sm font-semibold text-white">{a.role}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-4">Questions</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
              Technical FAQ
            </h2>
          </div>
          <div className="lg:col-span-8 border-t border-slate-800/80">
            {FAQS.map((faq, i) => (
              <div key={faq.q} className="border-b border-slate-800/80">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left py-4 flex items-start justify-between gap-6 group"
                  aria-expanded={openFaq === i}
                >
                  <span className="text-sm font-medium text-slate-200 group-hover:text-white">{faq.q}</span>
                  <span className="text-slate-500 text-base leading-none pt-0.5 shrink-0">
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <div className="pb-5 pr-10 text-sm text-slate-400 leading-relaxed">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQSchema faqs={FAQS.map((f) => ({ q: f.q, a: f.a }))} />

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="relative py-16 px-6 border-t border-slate-800/70 overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[100px]"
        />
        <div className="relative max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Run the first scan on your own domain.
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Free plan covers subdomain discovery and the top 10 ports. No card required.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
            >
              Create account
            </Link>
            <Link
              href="/pricing"
              className="px-5 py-2.5 rounded-md border border-slate-700 hover:border-slate-600 text-slate-300 text-sm font-medium transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className="border-t border-slate-800/70 py-12 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="col-span-2 sm:col-span-1">
            <div className="text-sm font-semibold text-white">ShadowSurface</div>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              External attack surface management with an evidence trail behind every finding.
            </p>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 mb-3">Product</div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features" className="text-slate-400 hover:text-slate-200">Features</Link></li>
              <li><Link href="/pricing" className="text-slate-400 hover:text-slate-200">Pricing</Link></li>
              <li><Link href="/register" className="text-slate-400 hover:text-slate-200">Get started</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 mb-3">Company</div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/blog" className="text-slate-400 hover:text-slate-200">Blog</Link></li>
              <li><Link href="/contact" className="text-slate-400 hover:text-slate-200">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 mb-3">Legal</div>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacy" className="text-slate-400 hover:text-slate-200">Privacy</Link></li>
              <li><Link href="/terms" className="text-slate-400 hover:text-slate-200">Terms</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-slate-900 text-xs text-slate-600">
          © {new Date().getFullYear()} ShadowSurface
        </div>
      </footer>
    </div>
  );
}
