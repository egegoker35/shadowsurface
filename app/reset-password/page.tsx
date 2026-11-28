'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

function ResetForm() {
  const token = useSearchParams().get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!token) { setError('Invalid reset link'); return; }
    setLoading(true);
    const res = await fetch('/api/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    if (res.ok) setDone(true);
    else { const data = await res.json(); setError(data.error || 'Failed to reset password'); }
    setLoading(false);
  };

  if (!token) return (
    <div className="text-center">
      <div className="w-12 h-12 bg-[#E28B7B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-[#E28B7B]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </div>
      <h1 className="text-xl font-bold text-[#E28B7B]">Invalid Link</h1>
      <p className="text-dim text-sm mt-1">This password reset link is invalid or expired.</p>
      <Link href="/forgot-password" className="mt-4 inline-block text-jade hover:text-jadeLight text-sm">Request new link</Link>
    </div>
  );

  return (
    <>
      {done ? (
        <div className="text-center">
          <div className="w-12 h-12 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-jade" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-xl font-bold text-jade">Password Updated!</h1>
          <p className="text-dim text-sm mt-1">Your password has been successfully reset.</p>
          <Link href="/login" className="mt-4 inline-block px-5 py-2.5 rounded-lg bg-jade hover:bg-[#6FC7A5] text-ink font-semibold text-sm">Sign In</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-jade" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 className="text-2xl font-bold">New Password</h1>
            <p className="text-dim text-sm mt-1">Create a strong password for your account.</p>
          </div>
          {error && <div className="text-[#E28B7B] bg-[#E28B7B]/10 border border-[#E28B7B]/30 rounded-lg px-3 py-2 text-sm">{error}</div>}
          <div>
            <label className="block text-sm text-dim mb-1">New Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" required minLength={8} className="w-full px-4 py-3 rounded-lg bg-ink border border-cream/15 focus:outline-none focus:ring-2 focus:ring-jade/40 text-cream" />
          </div>
          <div>
            <label className="block text-sm text-dim mb-1">Confirm Password</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" required className="w-full px-4 py-3 rounded-lg bg-ink border border-cream/15 focus:outline-none focus:ring-2 focus:ring-jade/40 text-cream" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-jade hover:bg-[#6FC7A5] text-ink font-semibold disabled:opacity-50 transition-colors">
            {loading ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-ink">
      <Navbar />
      <div className="max-w-md mx-auto pt-32 px-4">
        <div className="bg-ink2 border border-cream/12 rounded-2xl p-8 shadow-2xl">
          <Suspense fallback={<div className="text-center text-dim py-8">Loading...</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
