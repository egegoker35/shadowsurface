'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import SchemaOrg from '@/components/SchemaOrg';
import FAQSchema from '@/components/FAQSchema';
import DemoResult from '@/components/DemoResult';
import LiveStats from '@/components/landing/LiveStats';
import TrustBanner from '@/components/landing/TrustBanner';
import TerminalTyping from '@/components/landing/TerminalTyping';
import RiskPulse from '@/components/landing/RiskPulse';

const FAQS = [
  {
    q: 'What is an attack surface scanner?',
    a: 'An attack surface scanner is a cybersecurity tool that automatically discovers and maps all externally facing digital assets — subdomains, open ports, cloud services, and web applications — to identify potential entry points for attackers. ShadowSurface is a leading external attack surface management (EASM) platform that combines subdomain enumeration, port scanning, CVE vulnerability mapping, and cloud misconfiguration detection into a single unified scanner.',
  },
  {
    q: 'How does subdomain enumeration work?',
    a: 'ShadowSurface uses both passive and active subdomain enumeration techniques. Passive discovery queries certificate transparency logs (crt.sh), DNS records, and historical datasets. Active techniques perform DNS brute-forcing against a curated wordlist of over 5,000 common subdomain names. This dual approach ensures comprehensive coverage of your external attack surface.',
  },
  {
    q: 'What ports does ShadowSurface scan?',
    a: 'Our port scanner checks 100+ ports including HTTP (80, 8080), HTTPS (443, 8443), SSH (22), FTP (21), SMTP (25), MySQL (3306), PostgreSQL (5432), Redis (6379), MongoDB (27017), Elasticsearch (9200), RDP (3389), VNC (5900), and many more. Each open port triggers banner grabbing and service fingerprinting to identify the exact technology and version running.',
  },
  {
    q: 'How accurate is the CVE mapping?',
    a: 'ShadowSurface matches discovered service versions against a curated CVE database. We only report CVEs when the exact or major.minor version is confirmed — no fuzzy guessing. For technologies like IIS, we require build numbers to prevent false positives. This ensures you only see vulnerabilities that actually affect your infrastructure.',
  },
  {
    q: 'Can I scan my cloud infrastructure?',
    a: 'Yes. ShadowSurface detects exposed cloud assets including Amazon S3 buckets, Google Cloud Storage blobs, Azure Blob Storage containers, and open Firebase databases. We check for public permissions, misconfigured ACLs, and leaked credentials in publicly accessible resources.',
  },
  {
    q: 'Is ShadowSurface free to try?',
    a: 'Absolutely. You can run a free demo scan on any domain without registration. For continuous monitoring, automated scheduling, and bulk scanning, upgrade to one of our paid plans starting at $99/month.',
  },
];

export default function LandingPage() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
    <div className="min-h-screen">
      <SchemaOrg />
      <Navbar />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="pt-28 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <div className="relative w-28 h-28 animate-pulse">
              <Image src="/logo.svg" alt="ShadowSurface Logo" width={112} height={112} priority />
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Attack Surface Scanner — Know Your <span className="text-emerald-400">External Attack Surface</span> Before Attackers Do
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
            ShadowSurface is a cloud-based <strong className="text-slate-200">attack surface management platform</strong> that automatically discovers subdomains, scans open ports, maps CVE vulnerabilities, and detects cloud misconfigurations. Run your first free external attack surface scan in seconds.
          </p>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto mb-12">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Try a Free Attack Surface Scan</h3>
            <div className="flex gap-2">
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="example.com"
                className="flex-1 px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                onKeyDown={(e) => e.key === 'Enter' && runDemo()}
              />
              <button
                onClick={runDemo}
                disabled={loading}
                className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 transition-colors"
              >
                {loading ? 'Scanning...' : 'Scan'}
              </button>
            </div>
            {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
            {result && <DemoResult result={result} />}
          </div>

          <div className="flex justify-center gap-4">
            <Link href="/register" className="px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors">Start Free</Link>
            <Link href="/pricing" className="px-8 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold transition-colors">View Pricing</Link>
          </div>
        </div>
      </section>

      <LiveStats />
      <TrustBanner />

      {/* ─── SEO: WHAT IS ASM ─────────────────────────────────── */}
      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6 text-center">What Is Attack Surface Management?</h2>
          <div className="space-y-5 text-slate-300 leading-relaxed">
            <p>
              <strong>Attack Surface Management (ASM)</strong> is the continuous process of discovering, analyzing, and securing all externally facing digital assets that could be exploited by threat actors. Your external attack surface includes everything an attacker can see from the internet — subdomains, IP addresses, open ports, web applications, cloud storage buckets, SSL certificates, and third-party integrations.
            </p>
            <p>
              Traditional vulnerability scanning focuses on known systems. In contrast, an <strong>external attack surface scanner</strong> like ShadowSurface starts with zero knowledge and discovers assets you may not even know exist — shadow IT, forgotten subdomains, development environments left exposed, or cloud resources misconfigured by other teams.
            </p>
            <p>
              ShadowSurface combines four core discovery engines: <strong>subdomain enumeration</strong> to find every hostname under your domain, <strong>port scanning</strong> to detect open services, <strong>CVE mapping</strong> to match discovered software versions against known vulnerabilities, and <strong>cloud misconfiguration scanning</strong> to identify publicly exposed storage and databases.
            </p>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">How ShadowSurface Works</h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">Complete external attack surface intelligence in three simple steps.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Discover Subdomains', desc: 'Enter your domain. Our subdomain scanner queries certificate transparency logs and actively brute-forces DNS to find every hostname — including forgotten dev and staging environments.' },
              { step: '02', title: 'Scan Ports & Services', desc: 'For each discovered asset, our port scanner checks 100+ ports, grabs service banners, fingerprints technologies, and detects WAF/CDN protection layers.' },
              { step: '03', title: 'Map CVEs & Cloud Risks', desc: 'Discovered software versions are matched against our CVE database. Cloud resources are checked for public permissions and misconfigurations. You get a risk-scored report.' },
            ].map((s) => (
              <div key={s.step} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
                <div className="text-4xl font-extrabold text-slate-700 mb-3">{s.step}</div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TerminalTyping />
      <RiskPulse />

      {/* ─── FEATURES ─────────────────────────────────────────── */}
      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Attack Surface Intelligence Features</h2>
          <p className="text-slate-400 text-center max-w-2xl mx-auto mb-12">Everything you need to discover, monitor, and secure your external digital footprint.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Subdomain Scanner', desc: 'Enumerate thousands of subdomains via passive CT log queries and active DNS brute-forcing with a 5,000+ wordlist.' },
              { title: 'Port Scanner', desc: 'Scan 100+ ports per asset with TCP connect scanning, banner grabbing, and service fingerprinting.' },
              { title: 'CVE Scanner', desc: 'Match discovered Apache, Nginx, OpenSSH, IIS, and Python versions against known CVEs with confidence scoring.' },
              { title: 'Cloud Security Scanner', desc: 'Detect publicly exposed S3 buckets, GCS blobs, Azure containers, and Firebase databases with misconfiguration details.' },
              { title: 'SSL Certificate Analysis', desc: 'Monitor certificate expiry, detect self-signed certificates, weak ciphers, and chain validation errors.' },
              { title: 'WAF & CDN Detection', desc: 'Identify Cloudflare, Akamai, AWS CloudFront, Sucuri, and generic WAF protection layers.' },
              { title: 'Executive Risk Reports', desc: 'Generate PDF-ready risk-scored reports with severity distribution, asset tables, and remediation recommendations.' },
              { title: 'API & Bulk Scanning', desc: 'Full REST API with API keys. Bulk scan up to 50 domains simultaneously on Enterprise plans.' },
            ].map((f) => (
              <div key={f.title} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── USE CASES ────────────────────────────────────────── */}
      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-6 text-center">Who Uses ShadowSurface?</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2 text-emerald-400">Security Teams</h3>
              <p className="text-slate-300 text-sm leading-relaxed">SOC and red teams use ShadowSurface to continuously monitor their organization's external attack surface, discover shadow IT, and prioritize remediation based on real risk scores rather than vulnerability counts alone.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2 text-emerald-400">DevOps & Cloud Engineers</h3>
              <p className="text-slate-300 text-sm leading-relaxed">Cloud engineers scan for publicly exposed storage buckets, misconfigured load balancers, and forgotten development environments before attackers find them. Integrate scans into CI/CD pipelines via our REST API.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2 text-emerald-400">Penetration Testers</h3>
              <p className="text-slate-300 text-sm leading-relaxed">Pentesters run ShadowSurface during reconnaissance to quickly map the target's attack surface, identify high-value entry points, and generate professional reports for client deliverables.</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-2 text-emerald-400">Compliance Officers</h3>
              <p className="text-slate-300 text-sm leading-relaxed">Meet regulatory requirements for continuous asset discovery and vulnerability management. Generate audit-ready reports showing your organization's security posture over time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── VISIBLE FAQ ──────────────────────────────────────── */}
      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-400 text-center mb-12">Everything you need to know about attack surface scanning with ShadowSurface.</p>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                >
                  <span className="font-semibold text-white">{faq.q}</span>
                  <span className="text-emerald-400 text-xl">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-slate-300 text-sm leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQSchema />

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="py-20 border-t border-slate-800/50 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Start Your Free Attack Surface Scan</h2>
          <p className="text-slate-400 mb-8">Discover subdomains, open ports, CVEs, and cloud misconfigurations in minutes. No credit card required.</p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors">Get Started Free</Link>
            <Link href="/pricing" className="px-8 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold transition-colors">View Pricing</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} ShadowSurface. All rights reserved.
      </footer>
    </div>
  );
}
