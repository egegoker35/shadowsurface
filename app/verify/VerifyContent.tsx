'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyContent() {
  const token = useSearchParams().get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('Missing token'); return; }
    fetch(`/api/verify?token=${encodeURIComponent(token)}`).then(async (res) => {
      const data = await res.json();
      if (res.ok) { setStatus('success'); setMessage(data.message); }
      else { setStatus('error'); setMessage(data.error || 'Verification failed'); }
    }).catch(() => { setStatus('error'); setMessage('Network error'); });
  }, [token]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-xl">
      {status === 'loading' && <p className="text-slate-400">Verifying your email...</p>}
      {status === 'success' && (
        <>
          <h1 className="text-2xl font-bold text-emerald-400 mb-2">Verified!</h1>
          <p className="text-slate-300 mb-6">{message}</p>
          <Link href="/dashboard" className="inline-block px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">Go to Dashboard</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Failed</h1>
          <p className="text-slate-300">{message}</p>
        </>
      )}
    </div>
  );
}
