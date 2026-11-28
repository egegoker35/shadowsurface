'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

type State = 'loading' | 'ready' | 'invalid' | 'submitting';

export default function InviteAcceptPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token || '';
  const [state, setState] = useState<State>('loading');
  const [info, setInfo] = useState<{ email: string; organization: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invites/accept?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.valid) {
          setError(data.error || 'This invitation cannot be used.');
          setState('invalid');
          return;
        }
        setInfo({ email: data.email, organization: data.organization });
        setState('ready');
      })
      .catch(() => {
        setError('Could not verify the invitation. Check your connection and try again.');
        setState('invalid');
      });
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setState('submitting');
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not accept the invitation.');
        setState('ready');
        return;
      }
      localStorage.setItem('ss_token', data.token);
      window.location.href = '/dashboard';
    } catch {
      setError('Network error. Please try again.');
      setState('ready');
    }
  };

  return (
    <div className="min-h-screen bg-ink text-cream/85">
      <Navbar />
      <div className="max-w-md mx-auto px-6 pt-28 pb-20">
        <div className="rounded-lg border border-cream/12 bg-ink2 p-7">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-jadeLight/80 mb-3">
            Team invitation
          </p>

          {state === 'loading' && (
            <p className="text-sm text-dim">Checking the invitation…</p>
          )}

          {state === 'invalid' && (
            <>
              <h1 className="text-xl font-semibold text-cream">Invitation unavailable</h1>
              <p className="mt-3 text-sm text-dim leading-relaxed">{error}</p>
              <p className="mt-4 text-sm text-faint">
                Ask the workspace owner for a new link, or{' '}
                <Link href="/login" className="text-jade hover:text-jadeLight">sign in</Link>.
              </p>
            </>
          )}

          {(state === 'ready' || state === 'submitting') && info && (
            <>
              <h1 className="text-xl font-semibold text-cream">Join {info.organization}</h1>
              <p className="mt-2 text-sm text-dim">
                Set a password for <span className="font-mono text-cream/80">{info.email}</span>. This creates your
                account in the workspace.
              </p>

              <form onSubmit={submit} className="mt-6 space-y-3">
                <div>
                  <label htmlFor="invite-password" className="block text-xs font-medium text-dim mb-1.5">
                    Password
                  </label>
                  <input
                    id="invite-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full px-3.5 py-2.5 rounded-md bg-ink border border-cream/15 text-sm text-cream focus:outline-none focus:border-jade/60 focus:ring-1 focus:ring-jade/40"
                  />
                </div>
                <div>
                  <label htmlFor="invite-confirm" className="block text-xs font-medium text-dim mb-1.5">
                    Confirm password
                  </label>
                  <input
                    id="invite-confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    className="w-full px-3.5 py-2.5 rounded-md bg-ink border border-cream/15 text-sm text-cream focus:outline-none focus:border-jade/60 focus:ring-1 focus:ring-jade/40"
                  />
                </div>

                {error && <p className="text-sm text-[#E28B7B]">{error}</p>}

                <button
                  type="submit"
                  disabled={state === 'submitting'}
                  className="w-full px-5 py-2.5 rounded-md bg-jade hover:bg-[#6FC7A5] text-ink text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {state === 'submitting' ? 'Creating account…' : 'Accept invitation'}
                </button>
              </form>

              <p className="mt-4 text-xs text-faint">
                Minimum 8 characters. You will be signed in and taken to the dashboard.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
