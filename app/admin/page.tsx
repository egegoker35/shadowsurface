'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Sidebar from '@/components/admin/Sidebar';
import DashboardStats from '@/components/admin/DashboardStats';
import UsersTable from '@/components/admin/UsersTable';
import ScansTable from '@/components/admin/ScansTable';
import LeadsTable from '@/components/admin/LeadsTable';
import PaymentsTable from '@/components/admin/PaymentsTable';
import RevenuePanel from '@/components/admin/RevenuePanel';

const TAB_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'Platform overview from live counts' },
  scans: { title: 'Scans', subtitle: 'Every scan, searchable and paginated' },
  users: { title: 'Users', subtitle: 'Accounts, roles, plans and billing period' },
  leads: { title: 'Leads', subtitle: 'Pricing enquiries awaiting review' },
  payments: { title: 'Payments', subtitle: 'On-chain USDT transfers, linked to TronScan' },
  revenue: { title: 'Revenue', subtitle: 'Monthly and per-plan totals' },
};

const SEARCHABLE = new Set(['users', 'scans', 'leads', 'payments']);

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState('dashboard');
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = localStorage.getItem('ss_admin_token');
    if (!t) {
      window.location.replace('/admin-login');
      return;
    }
    setToken(t);
  }, []);

  // Typing should not fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // A new tab starts from a clean filter state.
  useEffect(() => {
    setPage(1);
    setStatus('');
    setSearch('');
    setQuery('');
  }, [tab]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const section = tab === 'dashboard' ? 'overview' : tab;
      const params = new URLSearchParams({ section, page: String(page) });
      if (query) params.set('q', query);
      if (status) params.set('status', status);
      const res = await fetch(`/api/admin?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json().catch(() => ({}));
      if (res.status === 401 || res.status === 403) {
        setError(d.reason || d.error || 'Access denied');
        return;
      }
      if (!res.ok) throw new Error(d.error || `API returned ${res.status}`);
      setData(d);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token, tab, page, query, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const logout = () => {
    localStorage.removeItem('ss_admin_token');
    window.location.replace('/admin-login');
  };

  const meta = useMemo(() => TAB_META[tab] || TAB_META.dashboard, [tab]);

  if (!token) {
    return <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-slate-400">Loading…</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-white px-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-400 mb-2">Admin access error</h1>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={fetchData} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors">
              Retry
            </button>
            <button onClick={logout} className="px-6 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold hover:bg-slate-700 transition-colors">
              Back to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex">
      <Sidebar active={tab} onChange={setTab} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-7">
            <div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1.5">
                <span>Admin</span>
                <span className="text-slate-700">/</span>
                <span className="text-emerald-400">{meta.title}</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{meta.title}</h1>
              <p className="text-sm text-slate-500 mt-1">{meta.subtitle}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm font-semibold text-slate-200 hover:bg-slate-700/80 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              <button
                onClick={logout}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>

          {SEARCHABLE.has(tab) && (
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={tab === 'scans' ? 'Search target…' : tab === 'payments' ? 'Search email or tx hash…' : 'Search…'}
                className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
              />
              {tab === 'scans' && (
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-slate-300 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">All statuses</option>
                  <option value="completed">Completed</option>
                  <option value="running">Running</option>
                  <option value="failed">Failed</option>
                </select>
              )}
              {query && (
                <button onClick={() => setSearch('')} className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2">
                  clear
                </button>
              )}
            </div>
          )}

          {loading && !data && <p className="text-sm text-slate-500">Loading data…</p>}

          {tab === 'dashboard' && data?.totals && (
            <div className="space-y-5">
              <DashboardStats data={data} />
              <ScansTable
                scans={data.recentScans || []}
                total={data.totals.scans}
                page={1}
                pages={1}
                pageSize={data.recentScans?.length || 0}
                onPage={() => {}}
                onRefresh={fetchData}
                compact
              />
            </div>
          )}

          {tab === 'scans' && data?.scans && (
            <ScansTable
              scans={data.scans}
              total={data.total}
              page={data.page}
              pages={data.pages}
              pageSize={data.pageSize}
              onPage={setPage}
              onRefresh={fetchData}
            />
          )}

          {tab === 'users' && data?.users && (
            <UsersTable
              users={data.users}
              total={data.total}
              page={data.page}
              pages={data.pages}
              pageSize={data.pageSize}
              onPage={setPage}
              onRefresh={fetchData}
            />
          )}

          {tab === 'leads' && data?.leads && (
            <LeadsTable
              leads={data.leads}
              total={data.total}
              page={data.page}
              pages={data.pages}
              pageSize={data.pageSize}
              onPage={setPage}
              onRefresh={fetchData}
            />
          )}

          {tab === 'payments' && data?.payments && (
            <PaymentsTable
              payments={data.payments}
              total={data.total}
              page={data.page}
              pages={data.pages}
              pageSize={data.pageSize}
              onPage={setPage}
            />
          )}

          {tab === 'revenue' && data?.lifetime && <RevenuePanel revenue={data} />}
        </div>
      </main>
    </div>
  );
}
