'use client';
import { useEffect, useState } from 'react';

const CRON_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const SCAN_TYPES = ['subdomain','port','cve','cloud','full'];

export default function ScheduledScansPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [scanType, setScanType] = useState('full');
  const [cron, setCron] = useState('daily');
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  const fetchItems = async () => {
    const res = await fetch('/api/scheduled-scans', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setItems(d.scheduledScans || []); }
    setLoading(false);
  };

  useEffect(() => { if (token) fetchItems(); }, [token]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/scheduled-scans', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, target, scanType, cron }),
    });
    if (res.ok) { setName(''); setTarget(''); fetchItems(); }
  };

  const del = async (id: string) => {
    if (!confirm('Delete scheduled scan?')) return;
    await fetch(`/api/scheduled-scans?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Scheduled Scans</h1>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">New Scheduled Scan</h2>
        <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white" />
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="example.com" required className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white" />
          <select value={scanType} onChange={(e) => setScanType(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white">
            {SCAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={cron} onChange={(e) => setCron(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white">
            {CRON_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">Create</button>
        </form>
      </div>
      {loading ? <p className="text-slate-400">Loading...</p> : items.length === 0 ? <p className="text-slate-400">No scheduled scans.</p> : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase border-b border-slate-800"><tr><th className="px-6 py-3">Name</th><th className="px-6 py-3">Target</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Frequency</th><th className="px-6 py-3">Next Run</th><th className="px-6 py-3 text-right">Actions</th></tr></thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-slate-800">
                  <td className="px-6 py-3 font-medium">{s.name}</td>
                  <td className="px-6 py-3 text-emerald-400">{s.target}</td>
                  <td className="px-6 py-3 capitalize">{s.scanType}</td>
                  <td className="px-6 py-3 capitalize">{s.cron}</td>
                  <td className="px-6 py-3 text-slate-400">{s.nextRun ? new Date(s.nextRun).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-3 text-right"><button onClick={() => del(s.id)} className="text-red-400 text-xs hover:underline">Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
