'use client';
import { useEffect, useState } from 'react';

export default function TeamPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  const fetchInvites = async () => {
    const res = await fetch('/api/invites', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setInvites((await res.json()).invites || []);
  };

  useEffect(() => { if (token) fetchInvites(); }, [token]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const res = await fetch('/api/invites', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email }) });
    if (res.ok) { setEmail(''); fetchInvites(); }
    else alert('Failed to send invite');
    setSending(false);
  };

  const del = async (id: string) => {
    if (!confirm('Revoke this invite?')) return;
    await fetch(`/api/invites?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchInvites();
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(window.location.origin + link);
    setCopied(link);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Team Management</h1>
        <p className="text-slate-400 text-sm mt-1">Invite colleagues and manage access to your organization.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-1">Invite Member</h2>
            <p className="text-xs text-slate-500 mb-4">Send an invitation link via email.</p>
            <form onSubmit={invite} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email Address</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="colleague@company.com" required className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <button type="submit" disabled={sending} className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                {sending ? 'Sending...' : 'Send Invite'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Pending Invites</h2>
              <span className="text-xs text-slate-500">{invites.filter(i => !i.accepted).length} pending</span>
            </div>
            {invites.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <p className="text-sm text-slate-400">No invites sent yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {invites.map((i) => (
                  <div key={i.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300">{i.email[0].toUpperCase()}</div>
                      <div>
                        <div className="text-sm font-medium text-white">{i.email}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${i.role === 'admin' ? 'bg-purple-900/30 text-purple-300 border border-purple-800' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>{i.role}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${i.accepted ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-amber-900/30 text-amber-400 border border-amber-800'}`}>{i.accepted ? 'Accepted' : 'Pending'}</span>
                          <span className="text-[10px] text-slate-500">Expires {new Date(i.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!i.accepted && (
                        <button onClick={() => copyLink(`/invite/${i.token}`)} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 transition-colors">
                          {copied === `/invite/${i.token}` ? 'Copied!' : 'Copy Link'}
                        </button>
                      )}
                      <button onClick={() => del(i.id)} className="px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-800 text-xs text-red-400 transition-colors">Revoke</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
