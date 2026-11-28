'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      let data: any = {};
      try { data = await res.json(); } catch { data = { error: `Server returned ${res.status}. Please try again.` }; }
      if (!res.ok) setError(data.error || `Login failed (${res.status})`);
      else { localStorage.setItem('ss_token', data.token); window.location.href = '/dashboard'; }
    } catch { setError('Network error. Server may be down.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink text-cream/85">
      <Navbar />
      <div className="flex justify-center px-4 pb-20 pt-24 sm:pt-28">
        <div className="w-full max-w-[400px]">
          <div className="relative overflow-hidden border border-cream/12 bg-ink2 p-8">
            <span aria-hidden className="absolute inset-x-0 top-0 h-[2px] bg-jade" />
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
              <span className="h-1.5 w-1.5 bg-jade" />
              <span>Account</span>
            </div>
            <h1 className="mt-3 font-serif text-[1.9rem] font-normal leading-tight tracking-[-0.015em] text-cream">
              Sign in
            </h1>
            <p className="mt-2 text-[12.5px] leading-relaxed text-dim">
              Access the workspaces you own. Scans run only against domains verified on your account.
            </p>

            {error && (
              <div className="mt-5 border border-[#E28B7B]/30 bg-[#E28B7B]/10 px-3 py-2 text-[12.5px] text-[#E28B7B]">{error}</div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Email</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full border border-cream/15 bg-ink px-3 py-2.5 text-sm text-cream placeholder:text-faint focus:border-jade/60 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-faint">Password</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full border border-cream/15 bg-ink px-3 py-2.5 text-sm text-cream placeholder:text-faint focus:border-jade/60 focus:outline-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-jade py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-[#6FC7A5] disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between border-t border-cream/10 pt-4 text-[12.5px]">
              <Link href="/forgot-password" className="text-dim transition-colors hover:text-jade">
                Forgot password?
              </Link>
              <span className="text-faint">
                No account?{' '}
                <Link href="/register" className="text-jade transition-colors hover:text-jadeLight">
                  Create one
                </Link>
              </span>
            </div>
          </div>
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-faint">
            External surface only · no agent installed
          </p>
        </div>
      </div>
    </div>
  );
}
