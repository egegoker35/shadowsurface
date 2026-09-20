'use client';

export default function DashboardStats({ data }: { data: any }) {
  const pendingPayments = (data?.recentPayments || []).filter((p: any) => p.status === 'new' || p.status === 'pending').length;
  const completedScans = (data?.recentScans || []).filter((s: any) => s.status === 'completed').length;
  const criticalScans = (data?.recentScans || []).filter((s: any) => s.executiveSummary?.overallRisk === 'CRITICAL').length;

  const cards = [
    {
      label: 'Total Revenue',
      value: `$${(data?.totalRevenue || 0).toLocaleString()}`,
      sub: 'Lifetime payments',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'from-emerald-500/20 to-emerald-500/0',
      text: 'text-emerald-400',
      ring: 'border-emerald-500/20',
    },
    {
      label: 'Total Users',
      value: (data?.totalUsers || 0).toLocaleString(),
      sub: 'Registered accounts',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
      accent: 'from-blue-500/20 to-blue-500/0',
      text: 'text-blue-400',
      ring: 'border-blue-500/20',
    },
    {
      label: 'Total Scans',
      value: (data?.totalScans || 0).toLocaleString(),
      sub: `${completedScans} completed recently`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.348 14.652a3.75 3.75 0 010-5.304m5.304 0a3.75 3.75 0 010 5.304m-7.425 2.121a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M12 12h.008v.008H12V12z" />
        </svg>
      ),
      accent: 'from-violet-500/20 to-violet-500/0',
      text: 'text-violet-400',
      ring: 'border-violet-500/20',
    },
    {
      label: 'Pending Payments',
      value: pendingPayments,
      sub: 'Awaiting approval',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accent: 'from-amber-500/20 to-amber-500/0',
      text: 'text-amber-400',
      ring: 'border-amber-500/20',
    },
    {
      label: 'Critical Scans',
      value: criticalScans,
      sub: 'In recent activity',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      accent: 'from-red-500/20 to-red-500/0',
      text: 'text-red-400',
      ring: 'border-red-500/20',
    },
    {
      label: 'Payment Requests',
      value: (data?.recentPayments || []).length,
      sub: 'Total leads',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
        </svg>
      ),
      accent: 'from-pink-500/20 to-pink-500/0',
      text: 'text-pink-400',
      ring: 'border-pink-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`relative overflow-hidden bg-gradient-to-br ${card.accent} bg-slate-900/80 border ${card.ring} rounded-2xl p-6 hover:border-slate-600/60 transition-all duration-200 group`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">{card.label}</div>
              <div className={`text-3xl font-extrabold mt-2.5 tracking-tight ${card.text}`}>{card.value}</div>
              <div className="text-xs text-slate-500 mt-2">{card.sub}</div>
            </div>
            <div className={`w-11 h-11 rounded-xl bg-slate-950/60 border ${card.ring} flex items-center justify-center ${card.text} group-hover:scale-105 transition-transform`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
