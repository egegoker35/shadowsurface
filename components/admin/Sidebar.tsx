'use client';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '◈' },
  { id: 'payments', label: 'Payments', icon: '◈' },
  { id: 'users', label: 'Users', icon: '◈' },
  { id: 'scans', label: 'Scans', icon: '◈' },
  { id: 'revenue', label: 'Revenue', icon: '◈' },
];

export default function Sidebar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div className="w-72 bg-slate-950 border-r border-slate-800 min-h-screen flex flex-col">
      <div className="p-8">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">ShadowSurface</h1>
        <p className="text-xs text-slate-600 mt-1 uppercase tracking-widest font-semibold">Administration</p>
      </div>
      <nav className="flex-1 px-4 space-y-0.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
              active === tab.id
                ? 'bg-emerald-600/15 text-emerald-400 shadow-lg shadow-emerald-600/5'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            <span className={`text-xs ${active === tab.id ? 'text-emerald-400' : 'text-slate-600'}`}>{tab.icon}</span>
            {tab.label}
            {tab.id === 'payments' && active !== 'payments' && (
              <span className="ml-auto w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 mt-auto">
        <a href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm text-slate-600 hover:text-slate-400 transition-colors">
          ← Back to Dashboard
        </a>
      </div>
    </div>
  );
}
