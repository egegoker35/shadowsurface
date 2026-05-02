'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  useEffect(() => {
    if (!token) { router.replace('/login'); return; }
    fetch('/api/dashboard', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setUser(d.user); setOrg(d.organization); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token, router]);

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
          <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Role</span><span className="text-white capitalize">{user.role || 'user'}</span></div>
          <div className="flex justify-between pt-1"><span className="text-slate-400">Verified</span><span className={user.verified ? 'text-emerald-400' : 'text-amber-400'}>{user.verified ? 'Yes' : 'No'}</span></div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Organization</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Name</span><span className="text-white">{org?.name || '-'}</span></div>
          <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">Plan</span><span className="px-2 py-0.5 rounded text-xs bg-emerald-900 text-emerald-300 uppercase font-bold">{org?.plan || 'starter'}</span></div>
          <div className="flex justify-between pt-1"><span className="text-slate-400">Org ID</span><span className="text-slate-300 font-mono">{org?.id || '-'}</span></div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 text-red-400">Danger Zone</h2>
        <p className="text-sm text-slate-400 mb-4">Contact support to delete your account or transfer ownership.</p>
        <a href="mailto:egegoker35@gmail.com" className="inline-block px-4 py-2 rounded-lg bg-red-600/20 text-red-400 border border-red-800 hover:bg-red-600/30 text-sm font-semibold transition-colors">Request Account Deletion</a>
      </div>
    </div>
  );
}
