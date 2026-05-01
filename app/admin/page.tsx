'use client';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  useEffect(() => {
    if (!token) return;
    fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } }).then(async (res) => {
      if (res.ok) setData(await res.json());
    });
  }, [token]);

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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Scans</h2>
        <div className="overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase border-b border-slate-800"><tr><th className="py-2">Target</th><th className="py-2">User</th><th className="py-2">Status</th><th className="py-2">Date</th></tr></thead>
            <tbody>
              {data.recentScans.map((s: any) => (
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
    </div>
  );
}
