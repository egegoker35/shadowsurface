'use client';

export default function DashboardStats({ data }: { data: any }) {
  const stats = data?.stats || {};
  const cards = [
    { label: 'Total Revenue', value: `$${stats.totalRevenue?.toLocaleString() || 0}`, change: '+0%', color: 'emerald' },
    { label: 'MRR', value: `$${stats.mrr?.toLocaleString() || 0}`, change: '+0%', color: 'blue' },
    { label: 'Total Users', value: stats.userCount?.toLocaleString() || 0, change: '+0%', color: 'violet' },
    { label: 'Total Scans', value: stats.scanCount?.toLocaleString() || 0, change: '+0%', color: 'orange' },
    { label: 'Paid Customers', value: stats.paidCustomers?.toLocaleString() || 0, change: '+0%', color: 'pink' },
    { label: 'Cloud Issues', value: stats.cloudCount?.toLocaleString() || 0, change: '+0%', color: 'red' },
  ];

  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-600/10 border-emerald-600/20 text-emerald-400',
    blue: 'bg-blue-600/10 border-blue-600/20 text-blue-400',
    violet: 'bg-violet-600/10 border-violet-600/20 text-violet-400',
    orange: 'bg-orange-600/10 border-orange-600/20 text-orange-400',
    pink: 'bg-pink-600/10 border-pink-600/20 text-pink-400',
    red: 'bg-red-600/10 border-red-600/20 text-red-400',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className={`rounded-xl border p-5 ${colorMap[card.color]}`}>
          <div className="text-sm text-slate-400 mb-1">{card.label}</div>
          <div className="text-2xl font-bold">{card.value}</div>
          <div className="text-xs mt-1 opacity-70">{card.change} this month</div>
        </div>
      ))}
    </div>
  );
}
