'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SchemaOrg from '@/components/SchemaOrg';
import FAQSchema from '@/components/FAQSchema';
import DemoResult from '@/components/DemoResult';
import LiveStats from '@/components/landing/LiveStats';
import TrustBanner from '@/components/landing/TrustBanner';
import TerminalTyping from '@/components/landing/TerminalTyping';
import RiskPulse from '@/components/landing/RiskPulse';

export default function LandingPage() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

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
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Know Your <span className="text-emerald-400">Attack Surface</span> Before Attackers Do
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            ShadowSurface discovers subdomains, open ports, cloud misconfigurations, and known CVEs — all in one platform.
          </p>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 max-w-xl mx-auto mb-12">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wider">Try a Free Demo Scan</h3>
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

      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Enter Target', desc: 'Input a domain or IP address to scan.' },
              { step: '02', title: 'Run Scan', desc: 'Our engine maps your attack surface in minutes.' },
              { step: '03', title: 'Get Intel', desc: 'View subdomains, open ports, CVEs, and cloud issues.' },
            ].map((s) => (
              <div key={s.step} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-center">
                <div className="text-4xl font-extrabold text-slate-700 mb-3">{s.step}</div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TerminalTyping />
      <RiskPulse />

      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Subdomain Discovery', desc: 'Enumerate subdomains via passive and active techniques.' },
              { title: 'Port Scanning', desc: 'Detect open services across 50+ ports with banner grabbing.' },
              { title: 'CVE Mapping', desc: 'Match discovered services to known vulnerabilities.' },
              { title: 'Cloud Misconfigs', desc: 'Find exposed S3 buckets, GCS blobs, and Azure blobs.' },
              { title: 'SSL Analysis', desc: 'Certificate expiry, weak ciphers, and chain issues.' },
              { title: 'WAF/CDN Detection', desc: 'Identify protection layers and cloud frontends.' },
              { title: 'Executive Reports', desc: 'Risk-scored summaries for stakeholder briefings.' },
              { title: 'API Access', desc: 'Full REST API for Enterprise integrations.' },
            ].map((f) => (
              <div key={f.title} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-slate-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQSchema />

      <section className="py-20 border-t border-slate-800/50 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Ready to See Your Surface?</h2>
          <p className="text-slate-400 mb-8">Start with a free scan or upgrade for continuous monitoring.</p>
          <div className="flex justify-center gap-4">
            <Link href="/register" className="px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors">Get Started</Link>
            <Link href="/pricing" className="px-8 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold transition-colors">Pricing</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} ShadowSurface. All rights reserved.
      </footer>
    </div>
  );
}
