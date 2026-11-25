'use client';
import Pagination from './Pagination';

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/25',
};

const PLAN_STYLES: Record<string, string> = {
  free: 'bg-slate-800/80 text-slate-400 border-slate-700',
  starter: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
  professional: 'bg-violet-500/10 text-violet-400 border-violet-500/25',
  enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
};

/**
 * Leads are pricing-page enquiries, stored in their own table.
 *
 * The old Payments tab rendered Payment rows but wired its buttons to the leads
 * endpoints, so "Approve" created a lead upgrade for an address that had already paid
 * and "Delete" removed nothing. Leads and payments are now separate, and each table
 * talks to the endpoint that owns its rows.
 */
export default function LeadsTable({
  leads,
  total,
  page,
  pages,
  pageSize,
  onPage,
  onRefresh,
}: {
  leads: any[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  onPage: (p: number) => void;
  onRefresh: () => void;
}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_admin_token') : null;

  const approve = async (lead: any) => {
    if (!confirm(`Activate the ${lead.plan} plan for ${lead.email}?`)) return;
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ email: lead.email, plan: lead.plan }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) onRefresh();
    else alert(d.error || 'Approval failed.');
  };

  const del = async (id: string) => {
    if (!confirm('Delete this lead?')) return;
    const res = await fetch(`/api/admin/delete-lead?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) onRefresh();
    else alert('Delete failed.');
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
      <div className="px-7 py-5 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Leads</h3>
          <p className="text-xs text-slate-500 mt-0.5">Pricing enquiries, newest first</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
          {total} total
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-slate-950/60 border-b border-slate-800">
            <tr>
              <th className="px-7 py-3.5 font-semibold">Customer</th>
              <th className="px-7 py-3.5 font-semibold">Plan</th>
              <th className="px-7 py-3.5 font-semibold">Status</th>
              <th className="px-7 py-3.5 font-semibold">Date</th>
              <th className="px-7 py-3.5 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 && (
              <tr>
                <td colSpan={5} className="px-7 py-16 text-center text-slate-500 text-sm">
                  No leads yet.
                </td>
              </tr>
            )}
            {leads.map((l: any) => (
              <tr key={l.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-7 py-4">
                  <div className="font-semibold text-white">{l.name || l.email}</div>
                  <div className="text-emerald-400/90 text-xs mt-0.5">{l.email}</div>
                  {l.message && <div className="text-[11px] text-slate-500 mt-1 max-w-xs truncate">{l.message}</div>}
                </td>
                <td className="px-7 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border ${PLAN_STYLES[l.plan] || PLAN_STYLES.starter}`}>
                    {l.plan}
                  </span>
                </td>
                <td className="px-7 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${STATUS_STYLES[l.status || 'new'] || STATUS_STYLES.new}`}>
                    {(l.status || 'new').toUpperCase()}
                  </span>
                </td>
                <td className="px-7 py-4 text-slate-500 text-xs">
                  {new Date(l.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td className="px-7 py-4">
                  <div className="flex gap-1.5 justify-end">
                    <button
                      onClick={() => approve(l)}
                      disabled={l.status === 'approved'}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-600/30 text-emerald-400 text-[11px] font-bold transition-colors"
                    >
                      {l.status === 'approved' ? 'Approved' : 'Approve'}
                    </button>
                    <button
                      onClick={() => del(l.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 text-[11px] font-bold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} total={total} shown={pageSize} onPage={onPage} />
    </div>
  );
}
