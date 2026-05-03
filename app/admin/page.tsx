'use client';
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import DashboardStats from '@/components/admin/DashboardStats';
import PaymentRequests from '@/components/admin/PaymentRequests';
import UsersTable from '@/components/admin/UsersTable';
import ScansTable from '@/components/admin/ScansTable';

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('ss_admin_token');
    if (!t) { window.location.replace('/admin-login'); return; }
    setToken(t);
  }, []);

  const fetchData = useCallback(async (currentToken: string) => {
    try {
      setLoading(true); setError('');
      const res = await fetch('/api/admin', { headers: { Authorization: `Bearer ${currentToken}` } });
      const d = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) { setError(`Access denied: ${d.reason || d.error || 'Unknown'}`); setLoading(false); return; }
      if (!res.ok) throw new Error(d.error || `API returned ${res.status}`);
      setData(d); setLoading(false);
    } catch (e: any) { setError(e.message || 'Failed to load'); setLoading(false); }
  }, []);

  useEffect(() => { if (token) fetchData(token); }, [token, fetchData]);

  const logout = () => { localStorage.removeItem('ss_admin_token'); window.location.replace('/admin-login'); };

  if (!token) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;
  if (loading && !data) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;
  if (error) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold text-red-400 mb-2">Error</h1>
        <p className="text-slate-400 mb-4">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => fetchData(token)} className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white">Retry</button>
          <button onClick={logout} className="px-6 py-2.5 rounded-lg bg-slate-700 text-white">Back to Login</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar active={activeTab} onChange={setActiveTab} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div><h1 className="text-2xl font-bold capitalize">{activeTab}</h1><p className="text-sm text-slate-400">ShadowSurface Admin</p></div>
            <div className="flex gap-3">
              <button onClick={() => fetchData(token)} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">Refresh</button>
              <button onClick={logout} className="px-4 py-2 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">Logout</button>
            </div>
          </div>
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <DashboardStats data={data} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PaymentRequests leads={data?.recentPayments?.slice(0,5)||[]} onRefresh={() => fetchData(token)} />
                <ScansTable scans={data?.recentScans?.slice(0,5)||[]} onRefresh={() => fetchData(token)} />
              </div>
            </div>
          )}
          {activeTab === 'payments' && <PaymentRequests leads={data?.recentPayments||[]} onRefresh={() => fetchData(token)} />}
          {activeTab === 'users' && <UsersTable users={data?.recentUsers||[]} onRefresh={() => fetchData(token)} />}
          {activeTab === 'scans' && <ScansTable scans={data?.recentScans||[]} onRefresh={() => fetchData(token)} />}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6"><div className="text-sm text-slate-400">Total Revenue</div><div className="text-3xl font-bold text-emerald-400 mt-1">${data?.totalRevenue?.toLocaleString?.() || 0}</div></div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6"><div className="text-sm text-slate-400">Total Users</div><div className="text-3xl font-bold text-blue-400 mt-1">{data?.totalUsers || 0}</div></div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6"><div className="text-sm text-slate-400">Total Scans</div><div className="text-3xl font-bold text-pink-400 mt-1">{data?.totalScans || 0}</div></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
