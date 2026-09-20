'use client';
import { useEffect, useState, useCallback } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import DashboardStats from '@/components/admin/DashboardStats';
import PaymentRequests from '@/components/admin/PaymentRequests';
import UsersTable from '@/components/admin/UsersTable';
import ScansTable from '@/components/admin/ScansTable';

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Platform overview and key metrics' },
  scans: { title: 'Scans', subtitle: 'Monitor and manage all security scans' },
  users: { title: 'Users', subtitle: 'Manage accounts, roles and plans' },
  payments: { title: 'Payments', subtitle: 'Approve and review payment requests' },
  revenue: { title: 'Revenue', subtitle: 'Financial performance summary' },
};

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [token, setToken] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      setData(d); setLastUpdated(new Date()); setLoading(false);
    } catch (e: any) { setError(e.message || 'Failed to load'); setLoading(false); }
  }, []);

  useEffect(() => { if (token) fetchData(token); }, [token, fetchData]);

  const logout = () => { localStorage.removeItem('ss_admin_token'); window.location.replace('/admin-login'); };

  if (!token) return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-slate-400">Loading...</div>;
  if (loading && !data) return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-slate-400">Loading...</div>;
  if (error) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-white">
      <div className="text-center max-w-md">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-400 mb-2">Access Error</h1>
        <p className="text-slate-400 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => fetchData(token)} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors">Retry</button>
          <button onClick={logout} className="px-6 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold hover:bg-slate-700 transition-colors">Back to Login</button>
        </div>
      </div>
    </div>
  );

  const meta = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex">
      <Sidebar active={activeTab} onChange={setActiveTab} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">
                <span>Admin</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                <span className="text-emerald-400">{meta.title}</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{meta.title}</h1>
              <p className="text-sm text-slate-500 mt-1">{meta.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="hidden lg:flex items-center gap-2 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Updated {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <button
                onClick={() => fetchData(token)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-semibold text-slate-200 hover:bg-slate-700/80 transition-colors disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Refresh
              </button>
              <button onClick={logout} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Logout
              </button>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <DashboardStats data={data} />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PaymentRequests leads={data?.recentPayments?.slice(0, 5) || []} onRefresh={() => fetchData(token)} />
                <ScansTable scans={data?.recentScans?.slice(0, 5) || []} onRefresh={() => fetchData(token)} />
              </div>
            </div>
          )}
          {activeTab === 'payments' && <PaymentRequests leads={data?.recentPayments || []} onRefresh={() => fetchData(token)} />}
          {activeTab === 'users' && <UsersTable users={data?.recentUsers || []} onRefresh={() => fetchData(token)} />}
          {activeTab === 'scans' && <ScansTable scans={data?.recentScans || []} onRefresh={() => fetchData(token)} />}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-emerald-500/0 bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-6">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Total Revenue</div>
                  <div className="text-3xl font-extrabold text-emerald-400 mt-2.5 tracking-tight">${(data?.totalRevenue || 0).toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-2">Lifetime payments</div>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-500/0 bg-slate-900/80 border border-blue-500/20 rounded-2xl p-6">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Total Users</div>
                  <div className="text-3xl font-extrabold text-blue-400 mt-2.5 tracking-tight">{(data?.totalUsers || 0).toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-2">Registered accounts</div>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/20 to-violet-500/0 bg-slate-900/80 border border-violet-500/20 rounded-2xl p-6">
                  <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Total Scans</div>
                  <div className="text-3xl font-extrabold text-violet-400 mt-2.5 tracking-tight">{(data?.totalScans || 0).toLocaleString()}</div>
                  <div className="text-xs text-slate-500 mt-2">Scans executed</div>
                </div>
              </div>
              <PaymentRequests leads={data?.recentPayments || []} onRefresh={() => fetchData(token)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
