'use client';
import { useEffect, useState } from 'react';

export default function IntegrationsPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [whName, setWhName] = useState('');
  const [whUrl, setWhUrl] = useState('');
  const [whEvents, setWhEvents] = useState('scan.completed');
  const [keyName, setKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  const fetchData = async () => {
    const [whRes, keyRes] = await Promise.all([
      fetch('/api/webhooks', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/api-keys', { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (whRes.ok) setWebhooks((await whRes.json()).webhooks || []);
    if (keyRes.ok) setApiKeys((await keyRes.json()).apiKeys || []);
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const createWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: whName, url: whUrl, events: whEvents.split(',') }) });
    setWhName(''); setWhUrl(''); fetchData();
  };

  const createApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/api-keys', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: keyName }) });
    const d = await res.json();
    if (d.apiKey) setCreatedKey(d.apiKey);
    setKeyName(''); fetchData();
  };

  const delWebhook = async (id: string) => { await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); fetchData(); };
  const delKey = async (id: string) => { await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); fetchData(); };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Integrations</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Webhooks</h2>
          <form onSubmit={createWebhook} className="flex flex-col gap-3 mb-4">
            <input value={whName} onChange={(e) => setWhName(e.target.value)} placeholder="Webhook name" required className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white" />
            <input value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="https://hooks.slack.com/..." required className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white" />
            <input value={whEvents} onChange={(e) => setWhEvents(e.target.value)} placeholder="scan.completed,scan.failed" className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white" />
            <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">Add Webhook</button>
          </form>
          {webhooks.map((w) => (
            <div key={w.id} className="flex items-center justify-between py-2 border-b border-slate-800">
              <div><div className="font-medium">{w.name}</div><div className="text-xs text-slate-400">{w.url}</div></div>
              <button onClick={() => delWebhook(w.id)} className="text-red-400 text-xs">Remove</button>
            </div>
          ))}
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">API Keys</h2>
          <form onSubmit={createApiKey} className="flex gap-3 mb-4">
            <input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name" required className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white" />
            <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">Generate</button>
          </form>
          {createdKey && <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-800 rounded-lg text-emerald-400 text-sm break-all">Key: <strong>{createdKey}</strong> (Copy now - shown once)</div>}
          {apiKeys.map((k) => (
            <div key={k.id} className="flex items-center justify-between py-2 border-b border-slate-800">
              <div><div className="font-medium">{k.name}</div><div className="text-xs text-slate-400">{k.prefix}</div></div>
              <button onClick={() => delKey(k.id)} className="text-red-400 text-xs">Revoke</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
