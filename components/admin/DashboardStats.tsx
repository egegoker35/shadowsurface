'use client';

export default function DashboardStats({ data }: { data: any }) {
  const stats = data?.stats || {};
  const cards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue?.toLocaleString() || 0}`, color: 'text-emerald-400' },
    { label: 'Monthly Recurring', value: `$${stats.mrr?.toLocaleString() || 0}`, color: 'text-blue-400' },
    { label: 'Total Users', value: stats.userCount?.toLocaleString() || 0, color: 'text-violet-400' },
    { label: 'Total Scans', value: stats.scanCount?.toLocaleString() || 0, color: 'text-orange-400' },
    { label: 'Paid Customers', value: stats.paidCustomers?.toLocaleString() || 0, color: 'text-pink-400' },
    { label: 'Cloud Issues', value: stats.cloudCount?.toLocaleString() || 0, color: 'text-red-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {cards.map((card) => (
        <div key={card.label} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
          <div className="text-sm text-slate-500 font-medium">{card.label}</div>
          <div className={`text-3xl font-extrabold mt-3 tracking-tight ${card.color}`}>{card.value}</div>
          <div className="text-xs text-slate-600 mt-2">Updated now</div>
        </div>
      ))}
    </div>
  );
}
