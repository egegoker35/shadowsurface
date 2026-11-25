'use client';

const PLAN_TONE: Record<string, string> = {
  free: 'bg-slate-500',
  starter: 'bg-sky-500',
  professional: 'bg-violet-500',
  enterprise: 'bg-amber-500',
};

function money(n: number) {
  return `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-');
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function RevenuePanel({ revenue }: { revenue: any }) {
  const months: Array<{ month: string; amount: number; count: number }> = revenue?.byMonth || [];
  const byPlan: Array<{ plan: string; amount: number; count: number }> = revenue?.byPlan || [];
  const lifetime = revenue?.lifetime || { amount: 0, count: 0 };
  const peak = Math.max(1, ...months.map((m) => m.amount));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 border border-emerald-500/20 rounded-2xl p-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Lifetime revenue</div>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2.5">{money(lifetime.amount)}</div>
          <div className="text-xs text-slate-500 mt-2">{lifetime.count} payment(s)</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Average payment</div>
          <div className="text-3xl font-extrabold text-slate-200 mt-2.5">
            {money(lifetime.count ? lifetime.amount / lifetime.count : 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2">Across all plans</div>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Best month</div>
          <div className="text-3xl font-extrabold text-slate-200 mt-2.5">
            {months.length ? money(Math.max(...months.map((m) => m.amount))) : money(0)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {months.length ? monthLabel(months.reduce((a, b) => (a.amount >= b.amount ? a : b)).month) : 'No payments yet'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Monthly revenue</h3>
          {months.length === 0 ? (
            <p className="text-sm text-slate-500">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {months.map((m) => (
                <li key={m.month} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{monthLabel(m.month)}</span>
                    <span className="font-mono text-slate-200">
                      {money(m.amount)} <span className="text-slate-600">· {m.count}</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <span className="block h-full bg-emerald-500/70" style={{ width: `${(m.amount / peak) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">Revenue by plan</h3>
          {byPlan.length === 0 ? (
            <p className="text-sm text-slate-500">No payments recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {byPlan.map((p) => (
                <li key={p.plan} className="flex items-center gap-3 text-xs">
                  <span className={`h-2 w-2 rounded-full ${PLAN_TONE[p.plan] || 'bg-slate-500'}`} />
                  <span className="text-slate-400 capitalize w-24">{p.plan}</span>
                  <span className="text-slate-200 font-mono">{money(p.amount)}</span>
                  <span className="text-slate-600 ml-auto">{p.count} sale(s)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
