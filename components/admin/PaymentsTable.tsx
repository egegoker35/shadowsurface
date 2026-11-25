'use client';
import Pagination from './Pagination';

const PLAN_STYLES: Record<string, string> = {
  free: 'bg-slate-800/80 text-slate-400 border-slate-700',
  starter: 'bg-sky-500/10 text-sky-400 border-sky-500/25',
  professional: 'bg-violet-500/10 text-violet-400 border-violet-500/25',
  enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
};

/**
 * On-chain payments are financial records: they are shown, not edited. Each row links to
 * the transaction on TronScan so the amount and recipient can be checked independently
 * of this dashboard.
 */
export default function PaymentsTable({
  payments,
  total,
  page,
  pages,
  pageSize,
  onPage,
}: {
  payments: any[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
      <div className="px-7 py-5 border-b border-slate-800 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">Payments</h3>
          <p className="text-xs text-slate-500 mt-0.5">Verified USDT (TRC20) transfers</p>
        </div>
        <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          {total} total
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] text-slate-500 uppercase tracking-wider bg-slate-950/60 border-b border-slate-800">
            <tr>
              <th className="px-7 py-3.5 font-semibold">Customer</th>
              <th className="px-7 py-3.5 font-semibold">Plan</th>
              <th className="px-7 py-3.5 font-semibold">Amount</th>
              <th className="px-7 py-3.5 font-semibold">Transaction</th>
              <th className="px-7 py-3.5 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-7 py-16 text-center text-slate-500 text-sm">
                  No payments recorded.
                </td>
              </tr>
            )}
            {payments.map((p: any) => (
              <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-7 py-4 text-slate-200">{p.email}</td>
                <td className="px-7 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize border ${PLAN_STYLES[p.plan] || PLAN_STYLES.starter}`}>
                    {p.plan}
                  </span>
                </td>
                <td className="px-7 py-4 font-mono text-emerald-400">${Number(p.amount || 0).toLocaleString()}</td>
                <td className="px-7 py-4">
                  <a
                    href={`https://tronscan.org/#/transaction/${p.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[11px] text-sky-400 hover:text-sky-300 underline decoration-sky-800 underline-offset-2"
                    title={p.txHash}
                  >
                    {String(p.txHash).slice(0, 10)}…{String(p.txHash).slice(-6)}
                  </a>
                </td>
                <td className="px-7 py-4 text-slate-500 text-xs">
                  {new Date(p.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
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
