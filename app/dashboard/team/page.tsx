'use client';
import { useEffect, useState } from 'react';

export default function TeamPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  const fetchInvites = async () => {
    const res = await fetch('/api/invites', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setInvites((await res.json()).invites || []);
  };

  useEffect(() => { if (token) fetchInvites(); }, [token]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/invites', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ email, role }) });
    if (res.ok) { setEmail(''); fetchInvites(); }
    else alert('Failed to send invite');
  };

  const del = async (id: string) => {
    await fetch(`/api/invites?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchInvites();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Team</h1>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Invite Member</h2>
        <form onSubmit={invite} className="flex gap-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="colleague@company.com" required className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">Invite</button>
        </form>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase border-b border-slate-800"><tr><th className="px-6 py-3">Email</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Expires</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
          <tbody>
            {invites.map((i) => (
              <tr key={i.id} className="border-b border-slate-800">
                <td className="px-6 py-3">{i.email}</td>
                <td className="px-6 py-3 capitalize">{i.role}</td>
                <td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs ${i.accepted ? 'bg-emerald-900 text-emerald-400' : 'bg-amber-900 text-amber-400'}`}>{i.accepted ? 'Accepted' : 'Pending'}</span></td>
                <td className="px-6 py-3 text-slate-400">{new Date(i.expiresAt).toLocaleDateString()}</td>
                <td className="px-6 py-3 text-right"><button onClick={() => del(i.id)} className="text-red-400 text-xs hover:underline">Revoke</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
