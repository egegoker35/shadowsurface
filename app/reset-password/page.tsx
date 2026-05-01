'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetForm() {
  const token = useSearchParams().get('token');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    const res = await fetch('/api/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
    if (res.ok) setDone(true);
    setLoading(false);
  };

  if (!token) return <p className="text-red-400">Invalid link.</p>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8">
        <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
        {done ? (
          <p className="text-emerald-400">Password updated. <a href="/login" className="underline">Login</a></p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (min 8 chars)" required minLength={8} className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700" />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50">{loading ? 'Updating...' : 'Reset Password'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading...</div>}>
      <ResetForm />
    </Suspense>
  );
}
