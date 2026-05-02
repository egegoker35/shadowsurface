'use client';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'payments', label: 'Payment Requests', icon: '💰' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'scans', label: 'Scans', icon: '🔍' },
  { id: 'revenue', label: 'Revenue', icon: '📈' },
];

export default function Sidebar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">ShadowSurface</h1>
        <p className="text-xs text-slate-500 mt-1">Admin Panel</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              active === tab.id
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <a href="/dashboard" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
          <span>←</span> Back to Site
        </a>
      </div>
    </div>
  );
}
