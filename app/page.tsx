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
    a: 'Certificate transparency logs provide the passive half. The active half is a DNS dictionary of 2,292 hostname entries, resolved with bounded concurrency. Before either runs, a random label is resolved to detect wildcard DNS — if the catch-all answers, dictionary hits cannot be distinguished from the wildcard, so only the apex is kept instead of inventing hundreds of hostnames.',
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
    q: 'What happens on the free plan?',
    a: 'The free plan runs subdomain discovery and a top-10 port scan, one scan per hour and two per month, without a card. Paid plans add CVE mapping, cloud checks, SSL analysis and bulk scanning.',
  },
];

const METHOD = [
  {
    step: '01',
    name: 'Discovery',
    runs: 'Certificate transparency (crt.sh) plus a 2,292-entry DNS dictionary',
    proof: 'A random label is resolved first. If wildcard DNS answers, dictionary hits are discarded rather than reported as hostnames.',
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

const COVERAGE = [
  {
    group: 'Discovery',
    items: 'Subdomains (CT logs + DNS), wildcard detection, A / MX / TXT / NS / SOA / CNAME records, CAA, DNSKEY',
  },
  {
    group: 'Service',
    items: 'TCP ports, service banners, TLS version and cipher, certificate validity and expiry, WAF and CDN response headers',
  },
  {
    group: 'Vulnerability',
    items: 'CVE by affected version range, CVSS, CWE, exploit availability, active probes for injection, traversal, redirect and CORS',
  },
  {
    group: 'Cloud',
    items: 'Public S3, Google Cloud Storage, Azure Blob, Firebase and Spaces buckets, verified by reading the bucket listing',
  },
  {
    group: 'Hygiene',
    items: 'Security headers, cookie flags, SPF and DMARC enforcement, DNSSEC, exposed admin paths, directory listing, server version leakage',
  },
];

const NOT_REPORTED = [
  'A CVE for a service whose version we could not read. A product name alone is not a vulnerable build.',
  'A missing DKIM record. Selectors are chosen by the mail provider, so we report a positive hit and stay silent otherwise.',
  'Missing headers on a host that returned no headers. Without a response there is nothing to measure.',
  'A WAF brand found in page text. Only headers issued by the provider count as evidence.',
  'A clean verdict for a target that never answered. That scan is marked INCONCLUSIVE and says so in the report.',
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
        if (res.status === 429) setError(data.error || 'Rate limit: 1 demo scan per 30 minutes.');
        else setError(data.error || 'Scan failed');
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
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <SchemaOrg />
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="pt-24 pb-14 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-emerald-400/80 mb-5">
              External attack surface management
            </p>
            <h1 className="text-[2rem] sm:text-[2.75rem] font-semibold tracking-tight leading-[1.1] text-white">
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
                No account required. One free scan per 30 minutes.
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

          <div className="lg:col-span-6 w-full">
            <ReportPreview />
          </div>
        </div>
      </section>

      {/* ─── REAL CAPABILITY NUMBERS ──────────────────────────── */}
      <section className="border-y border-slate-800/70">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-8">
            {[
              { v: '456', l: 'CVE records checked against MITRE' },
              { v: '2,292', l: 'subdomain dictionary entries' },
              { v: '407', l: 'TCP ports in the engine' },
              { v: '1', l: 'evidence trail per finding' },
            ].map((s) => (
              <div key={s.l}>
                <dt className="font-mono text-xl text-white">{s.v}</dt>
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
          </div>

          <div className="lg:col-span-8 divide-y divide-slate-800/80 border-t border-slate-800/80">
            {METHOD.map((m) => (
              <div key={m.step} className="py-6 grid sm:grid-cols-[44px_1fr] gap-x-5 gap-y-2">
                <span className="font-mono text-xs text-slate-600 pt-1">{m.step}</span>
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

      {/* ─── COVERAGE ─────────────────────────────────────────── */}
      <section id="coverage" className="py-20 px-6 border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-4">Coverage</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
              What gets checked
            </h2>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Five groups of checks, all from the internet side. Plan limits decide how many ports
              are probed and which scan types are available, not what the engine is capable of.
            </p>
          </div>

          <div className="mt-10 border-t border-slate-800/80">
            {COVERAGE.map((c) => (
              <div key={c.group} className="py-5 grid sm:grid-cols-[140px_1fr] gap-x-6 gap-y-1 border-b border-slate-800/80">
                <span className="text-sm font-medium text-slate-300">{c.group}</span>
                <span className="text-sm text-slate-400 leading-relaxed">{c.items}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-xs text-slate-500">
            Full technical detail on <Link href="/features" className="text-slate-400 underline decoration-slate-700 underline-offset-2 hover:text-slate-200">the features page</Link>.
          </p>
        </div>
      </section>

      {/* ─── WHAT WE DO NOT REPORT ────────────────────────────── */}
      <section className="py-20 px-6 border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-16">
          <div className="lg:col-span-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-4">Restraint</p>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white leading-snug">
              What we do not report
            </h2>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              A scanner is only useful if its findings survive scrutiny. These are the rules the
              engine enforces before anything reaches a report.
            </p>
          </div>
          <ul className="lg:col-span-8 space-y-4">
            {NOT_REPORTED.map((n) => (
              <li key={n} className="flex gap-3">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-600" />
                <span className="text-sm text-slate-400 leading-relaxed">{n}</span>
              </li>
            ))}
          </ul>
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
              <div key={a.role} className="border-t border-slate-800 pt-5">
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

      <FAQSchema />

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="py-16 px-6 border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
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
