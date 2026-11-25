'use client';

const PLAN_ORDER = ['free', 'starter', 'professional', 'enterprise'];

const PLAN_TONE: Record<string, string> = {
  free: 'bg-slate-500',
  starter: 'bg-sky-500',
  professional: 'bg-violet-500',
  enterprise: 'bg-amber-500',
};

function money(n: number) {
  return `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/**
 * Overview cards. Every value comes from the API's count/aggregate queries; nothing here
 * is derived from the length of a paginated list, which is what made the old dashboard
 * report "total leads" as the number of rows it happened to receive.
 */
export default function DashboardStats({ data }: { data: any }) {
  const t = data?.totals || {};
  const plans: Array<{ plan: string; count: number }> = data?.usersByPlan || [];
  const planTotal = plans.reduce((sum, p) => sum + p.count, 0) || 1;
  const risk = data?.risk30d || {};

  const cards = [
    { label: 'Revenue', value: money(t.revenue), sub: `${money(t.revenue30d)} in the last 30 days`, tone: 'text-emerald-400' },
    { label: 'Organizations', value: (t.users ?? 0).toLocaleString(), sub: `${t.expiredPaid ?? 0} paid plan(s) expired`, tone: 'text-blue-400' },
    { label: 'Scans', value: (t.scans ?? 0).toLocaleString(), sub: `${t.scans30d ?? 0} in the last 30 days`, tone: 'text-violet-400' },
    { label: 'Leads', value: (t.leads ?? 0).toLocaleString(), sub: `${t.pendingLeads ?? 0} awaiting review`, tone: 'text-amber-400' },
    { label: 'Payments', value: (t.payments ?? 0).toLocaleString(), sub: `${t.payments30d ?? 0} in the last 30 days`, tone: 'text-teal-400' },
    { label: 'Schedules', value: (t.activeScheduled ?? 0).toLocaleString(), sub: 'Active recurring scans', tone: 'text-pink-400' },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((c) => (
          <div key={c.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg shadow-black/20">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{c.label}</div>
            <div className={`text-3xl font-extrabold mt-2.5 tracking-tight ${c.tone}`}>{c.value}</div>
            <div className="text-xs text-slate-500 mt-2">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Organizations by plan</h3>
            <span className="text-[11px] text-slate-500">{planTotal} total</span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-800 mb-4">
            {PLAN_ORDER.map((plan) => {
              const count = plans.find((p) => p.plan === plan)?.count || 0;
              return count > 0 ? (
                <span key={plan} className={PLAN_TONE[plan]} style={{ width: `${(count / planTotal) * 100}%` }} />
              ) : null;
            })}
          </div>
          <ul className="space-y-2">
            {PLAN_ORDER.map((plan) => {
              const count = plans.find((p) => p.plan === plan)?.count || 0;
              return (
                <li key={plan} className="flex items-center gap-2.5 text-xs">
                  <span className={`h-2 w-2 rounded-full ${PLAN_TONE[plan]}`} />
                  <span className="text-slate-400 capitalize w-24">{plan}</span>
                  <span className="text-slate-200 font-semibold">{count}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Scan verdicts, last 30 days</h3>
            <span className="text-[11px] text-slate-500">completed only</span>
          </div>
          <ul className="space-y-2.5">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INCONCLUSIVE'].map((label) => (
              <li key={label} className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{label}</span>
                <span className="font-mono text-slate-200">{risk[label] ?? 0}</span>
              </li>
            ))}
            {risk.UNKNOWN ? (
              <li className="flex items-center justify-between text-xs">
                <span className="text-slate-500">no verdict recorded</span>
                <span className="font-mono text-slate-500">{risk.UNKNOWN}</span>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </div>
  );
}
