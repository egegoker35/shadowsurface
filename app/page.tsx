'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function LandingPage() {
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [scanId, setScanId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  const runDemo = async () => {
    if (!target) return;
    setLoading(true); setError(''); setResult(null); setScanId(null);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          setError(data.error || 'Rate limit: 1 demo scan per 30 minutes. Please wait.');
        } else if (res.status === 503) {
          setError(data.error || 'Scanner is busy. Please try again later.');
        } else {
          setError(data.error || 'Scan failed');
        }
        setLoading(false);
        return;
      }
      setScanId(data.scanId);
      setPolling(true);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!scanId || !polling) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/demo/status?scanId=${encodeURIComponent(scanId)}`);
        const data = await res.json();
        if (data.status === 'completed') {
          setResult(data.result);
          setPolling(false);
          setLoading(false);
          clearInterval(interval);
        }
      } catch {
        setPolling(false);
        setLoading(false);
      }
    }, 2000);

    const timeout = setTimeout(() => {
      setPolling(false);
      setLoading(false);
      setError('Scan timed out. Please try again later.');
      clearInterval(interval);
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [scanId, polling]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
            Know Your <span className="text-emerald-400">Attack Surface</span> Before Attackers Do
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            ShadowSurface continuously discovers subdomains, open ports, cloud misconfigurations, and known CVEs across your external infrastructure.
          </p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="example.com"
              className="px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={runDemo}
              disabled={loading}
              className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50"
            >
              {loading ? (polling ? 'Scanning...' : 'Starting...') : 'Run Free Scan'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-12">Limited to 1 demo scan per 30 minutes per IP</p>

          {error && (
            <div className="mb-8 text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-4 py-3 inline-block">
              {error}
            </div>
          )}
          {result && (
            <div className="text-left mx-auto max-w-3xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Demo Results: {result.target}</h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    result.executiveSummary.overallRisk === 'CRITICAL'
                      ? 'bg-red-900 text-red-300'
                      : result.executiveSummary.overallRisk === 'HIGH'
                      ? 'bg-orange-900 text-orange-300'
                      : 'bg-emerald-900 text-emerald-300'
                  }`}
                >
                  {result.executiveSummary.overallRisk}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{result.statistics.totalSubdomains}</div>
                  <div className="text-xs text-slate-400">Subdomains</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{result.statistics.totalAssets}</div>
                  <div className="text-xs text-slate-400">Technologies</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{result.statistics.highRiskCount}</div>
                  <div className="text-xs text-slate-400">High Risk</div>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-white">{result.durationSeconds?.toFixed(1) || '-'}s</div>
                  <div className="text-xs text-slate-400">Duration</div>
                </div>
              </div>
              {result.subdomains?.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">Discovered Subdomains ({result.subdomains.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.subdomains.slice(0, 15).map((s: string) => (
                      <span key={s} className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300">{s}</span>
                    ))}
                    {result.subdomains.length > 15 && (
                      <span className="text-xs text-slate-500">+{result.subdomains.length - 15} more</span>
                    )}
                  </div>
                </div>
              )}
              <pre className="text-xs bg-slate-950 rounded-lg p-4 overflow-auto max-h-64 border border-slate-800">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>
      <section className="py-16 border-t border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-6xl mx-auto px-4 grid sm:grid-cols-3 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 ">
            <h3 className="text-lg font-semibold mb-2">Continuous Monitoring</h3>
            <p className="text-slate-400 text-sm">Detect new subdomains, open ports, and cloud assets as they appear in real time.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 ">
            <h3 className="text-lg font-semibold mb-2">Cloud Misconfigurations</h3>
            <p className="text-slate-400 text-sm">Identify publicly accessible S3 buckets, GCS containers, and Azure Blobs before attackers do.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 ">
            <h3 className="text-lg font-semibold mb-2">CVE Mapping</h3>
            <p className="text-slate-400 text-sm">Automatically match discovered technologies against known vulnerabilities.</p>
          </div>
        </div>
      </section>
      <section className="py-16 border-t border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to See Your Attack Surface?</h2>
          <p className="text-slate-400 mb-8">Start with a free scan. No credit card required.</p>
          <Link href="/register" className="inline-block px-8 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
            Create Free Account
          </Link>
        </div>
      </section>
      <footer className="border-t border-slate-800 py-10 px-4">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-4 gap-8 text-sm">
          <div>
            <div className="font-bold text-emerald-400 mb-2">ShadowSurface</div>
            <p className="text-slate-500">Cloud Attack Surface Intelligence for modern security teams.</p>
          </div>
          <div>
            <div className="font-semibold mb-2">Product</div>
            <ul className="space-y-1 text-slate-400">
              <li><Link href="/features" className="hover:text-white">Features</Link></li>
              <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Resources</div>
            <ul className="space-y-1 text-slate-400">
              <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold mb-2">Legal</div>
            <ul className="space-y-1 text-slate-400">
              <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-slate-800 text-center text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} ShadowSurface. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
