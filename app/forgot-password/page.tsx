'use client';
import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    if (res.ok) {
      setSent(true);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to send reset link');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="max-w-md mx-auto pt-32 px-4">
        <div className="bg-ink2 border border-cream/12 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-jade" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
            </div>
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <p className="text-dim text-sm mt-1">Enter your email and we'll send you a reset link.</p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="w-12 h-12 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-jade" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-jade font-medium">Check your email!</p>
              <p className="text-dim text-sm mt-1">If an account exists, we sent a reset link.</p>
              <Link href="/login" className="mt-4 inline-block text-jade hover:text-jadeLight text-sm">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && <div className="text-[#E28B7B] bg-[#E28B7B]/10 border border-[#E28B7B]/30 rounded-lg px-3 py-2 text-sm">{error}</div>}
              <div>
                <label className="block text-sm text-dim mb-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required className="w-full px-4 py-3 rounded-lg bg-ink border border-cream/15 focus:outline-none focus:ring-2 focus:ring-jade/40 text-cream" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-jade hover:bg-[#6FC7A5] text-ink font-semibold disabled:opacity-50 transition-colors">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <p className="text-center text-sm text-dim">
                Remember your password? <Link href="/login" className="text-jade hover:text-jadeLight">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
