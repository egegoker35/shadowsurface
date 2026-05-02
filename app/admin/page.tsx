'use client';
import { useEffect, useState } from 'react';
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

  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_admin_token') : null;

  useEffect(() => {
    if (!token) {
      window.location.href = '/admin-login';
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('ss_admin_token');
        window.location.href = '/admin-login';
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `API returned ${res.status}`);
      }
      setData(await res.json());
      setLoading(false);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
      setLoading(false);
    }
  };

  if (!token) return null;
  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;
  if (error) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white"><div className="text-center"><h1 className="text-2xl font-bold text-red-400 mb-2">Error</h1><p className="text-slate-400">{error}</p><button onClick={fetchData} className="mt-4 px-6 py-2.5 rounded-lg bg-emerald-600 text-white">Retry</button></div></div>;

  const stats = data?.stats || {};

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar active={activeTab} onChange={setActiveTab} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div><h1 className="text-2xl font-bold capitalize">{activeTab}</h1><p className="text-sm text-slate-400">ShadowSurface Admin</p></div>
            <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">Refresh</button>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <DashboardStats data={data} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PaymentRequests leads={data?.leads?.slice(0,5)||[]} onRefresh={fetchData} />
                <ScansTable scans={data?.scans?.slice(0,5)||[]} onRefresh={fetchData} />
              </div>
            </div>
          )}

          {activeTab === 'payments' && <PaymentRequests leads={data?.leads||[]} onRefresh={fetchData} />}
          {activeTab === 'users' && <UsersTable users={data?.users||[]} onRefresh={fetchData} />}
          {activeTab === 'scans' && <ScansTable scans={data?.scans||[]} onRefresh={fetchData} />}

          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6"><div className="text-sm text-slate-400">Total Revenue</div><div className="text-3xl font-bold text-emerald-400 mt-1">${stats.totalRevenue?.toLocaleString()||0}</div></div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6"><div className="text-sm text-slate-400">MRR</div><div className="text-3xl font-bold text-blue-400 mt-1">${stats.mrr?.toLocaleString()||0}</div></div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6"><div className="text-sm text-slate-400">Paid Customers</div><div className="text-3xl font-bold text-pink-400 mt-1">{stats.paidCustomers||0}</div></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
