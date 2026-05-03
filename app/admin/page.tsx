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
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('ss_admin_token');
    if (!t) {
      window.location.replace('/admin-login');
      return;
    }
    setToken(t);
  }, []);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin', { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('ss_admin_token');
          window.location.replace('/admin-login');
          return;
        }
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || `API returned ${res.status}`);
        }
        setData(await res.json());
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-8 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 rounded-lg px-4 py-3 text-red-400">
            {error}
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && <DashboardStats data={data} />}
            {activeTab === 'payments' && <PaymentRequests payments={data?.recentPayments || []} />}
            {activeTab === 'users' && <UsersTable users={data?.recentUsers || []} />}
            {activeTab === 'scans' && <ScansTable scans={data?.recentScans || []} />}
            {activeTab === 'revenue' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4">Revenue</h2>
                <div className="text-3xl font-bold text-emerald-400">${data?.totalRevenue?.toFixed?.(2) || data?.totalRevenue || 0}</div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
