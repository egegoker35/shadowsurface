'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [plan, setPlan] = useState<string>('free');
  const [planExpiresAt, setPlanExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  useEffect(() => {
    if (!token) { router.replace('/login'); return; }
    fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        setOrg(d.organization);
        setPlan(d.plan || 'free');
        setPlanExpiresAt(d.planExpiresAt || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, router]);

  const endedOn = planExpiresAt ? new Date(planExpiresAt) : null;
  const lapsed = !!endedOn && endedOn.getTime() <= Date.now() && (org?.plan || 'free') !== 'free';

  if (loading) return <div className="min-h-screen bg-slate-950 pt-20 px-4 max-w-3xl mx-auto"><p className="text-slate-400">Loading...</p></div>;
  if (!user) return <div className="min-h-screen bg-slate-950 pt-20 px-4 max-w-3xl mx-auto"><p className="text-slate-400">Not authenticated</p></div>;

  return (
    <div className="max-w-3xl mx-auto pt-20 pb-20 px-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Email</span><span className="text-white">{user.email}</span></div>
          <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">User ID</span><span className="text-slate-300 font-mono">{user.id}</span></div>
          <div className="flex justify-between pt-1"><span className="text-slate-400">Role</span><span className="text-white capitalize">{user.role || 'user'}</span></div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Organization</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Name</span><span className="text-white">{org?.name || '-'}</span></div>
          <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Plan</span><span className="px-2 py-0.5 rounded text-xs bg-emerald-900 text-emerald-300 uppercase font-bold">{plan}</span></div>
          {endedOn && (
            <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Billing period ends</span><span className={lapsed ? 'text-red-400' : 'text-white'}>{endedOn.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span></div>
          )}
          <div className="flex justify-between pt-1"><span className="text-slate-400">Org ID</span><span className="text-slate-300 font-mono">{org?.id || '-'}</span></div>
        </div>
        {lapsed && (
          <div className="mt-4 rounded-lg border border-amber-700/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            Your {org?.plan} period ended on {endedOn!.toLocaleDateString('en-US')}. The workspace is on the free tier until it is renewed from the pricing page.
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-red-400">Danger Zone</h2>
        <p className="text-sm text-slate-400 mb-4">Contact support to delete your account or transfer ownership.</p>
        <a href="/contact" className="inline-block px-4 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-800 hover:bg-red-600/30 text-sm font-semibold transition-colors">Request Account Deletion</a>
      </div>
    </div>
  );
}
