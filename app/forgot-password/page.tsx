'use client';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    if (res.ok) setSent(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-2">Forgot Password</h1>
        {sent ? (
          <p className="text-emerald-400">If an account exists, a reset link has been sent to your email.</p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700" />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50">{loading ? 'Sending...' : 'Send Reset Link'}</button>
          </form>
        )}
        <p className="mt-4 text-sm text-slate-400"><a href="/login" className="text-emerald-400 hover:underline">Back to login</a></p>
      </div>
    </div>
  );
}
