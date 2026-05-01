'use client';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [leadsError, setLeadsError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  useEffect(() => {
    if (!token) { setError('Not logged in'); return; }
    fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } }).then(async (res) => {
      if (res.status === 403) { setError('Forbidden. Admin access only.'); return; }
      if (!res.ok) { setError('Failed to load admin data'); return; }
      setData(await res.json());
    }).catch(() => setError('Network error'));

    const adminSecret = new URLSearchParams(window.location.search).get('secret') || '';
    fetch(`/api/leads?token=${adminSecret}`).then(async (res) => {
      if (res.ok) { const d = await res.json(); setLeads(d.leads || []); }
      else setLeadsError('Leads: Unauthorized (add ?secret=ADMIN_SECRET to URL)');
    }).catch(() => setLeadsError('Leads: Failed to load'));
  }, [token]);

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
        <p className="text-slate-400">{error}</p>
        <a href="/login" className="mt-4 inline-block px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white">Login</a>
      </div>
    </div>
  );

  if (!data) return <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5"><div className="text-3xl font-bold">{data.userCount}</div><div className="text-xs text-slate-400 mt-1">Users</div></div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5"><div className="text-3xl font-bold">{data.scanCount}</div><div className="text-xs text-slate-400 mt-1">Scans</div></div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5"><div className="text-3xl font-bold">{data.assetCount}</div><div className="text-xs text-slate-400 mt-1">Assets</div></div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5"><div className="text-3xl font-bold">{data.cloudCount}</div><div className="text-xs text-slate-400 mt-1">Cloud Issues</div></div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Scans</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase border-b border-slate-800"><tr><th className="py-2">Target</th><th className="py-2">User</th><th className="py-2">Status</th><th className="py-2">Date</th></tr></thead>
            <tbody>
              {data.recentScans?.map((s: any) => (
                <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="py-2">{s.target}</td>
                  <td className="py-2 text-slate-400">{s.createdBy?.email}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs ${s.status === 'completed' ? 'bg-emerald-900 text-emerald-300' : s.status === 'failed' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'}`}>{s.status}</span></td>
                  <td className="py-2 text-slate-400">{new Date(s.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Payment Requests ({leads.length})
        </h2>
        {leadsError && <div className="text-yellow-400 text-sm mb-3">{leadsError}</div>}
        {leads.length === 0 ? (
          <p className="text-slate-400 text-sm">No payment requests yet.</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase border-b border-slate-800"><tr><th className="py-2">Name</th><th className="py-2">Email</th><th className="py-2">Plan</th><th className="py-2">Message</th><th className="py-2">Status</th><th className="py-2">Date</th></tr></thead>
              <tbody>
                {leads.map((l: any) => (
                  <tr key={l.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                    <td className="py-2 font-medium">{l.name}</td>
                    <td className="py-2 text-emerald-400">{l.email}</td>
                    <td className="py-2"><span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs capitalize">{l.plan}</span></td>
                    <td className="py-2 text-slate-400 text-xs max-w-[200px] truncate">{l.message || '-'}</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded text-xs ${l.status === 'new' ? 'bg-yellow-900 text-yellow-300' : l.status === 'contacted' ? 'bg-blue-900 text-blue-300' : 'bg-emerald-900 text-emerald-300'}`}>{l.status}</span></td>
                    <td className="py-2 text-slate-400 text-xs">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
