'use client';
import { useEffect, useState } from 'react';

export default function IntegrationsPage() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [whName, setWhName] = useState('');
  const [whUrl, setWhUrl] = useState('');
  const [whEvents, setWhEvents] = useState('scan.completed');
  const [whSecret, setWhSecret] = useState('');
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
    await fetch('/api/webhooks', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: whName, url: whUrl, events: whEvents.split(',').map((e) => e.trim()).filter(Boolean), secret: whSecret || undefined }) });
    setWhName(''); setWhUrl(''); setWhSecret(''); fetchData();
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
            <input value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="https://example.com/hooks/shadowsurface" required className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white" />
            <input value={whEvents} onChange={(e) => setWhEvents(e.target.value)} placeholder="scan.completed,scan.failed" className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white" />
            <input value={whSecret} onChange={(e) => setWhSecret(e.target.value)} placeholder="Signing secret (optional)" className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white" />
            <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">Add Webhook</button>
          </form>
          {webhooks.map((w) => (
            <div key={w.id} className="flex items-start justify-between gap-3 py-2 border-b border-slate-800">
              <div className="min-w-0">
                <div className="font-medium">{w.name}</div>
                <div className="text-xs text-slate-400 break-all">{w.url}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Events: {(Array.isArray(w.events) ? w.events : []).join(', ') || 'scan.completed'}
                  {' · '}
                  {w.lastStatus == null
                    ? 'Not called yet'
                    : w.lastStatus >= 200 && w.lastStatus < 300
                      ? `Last delivery ${w.lastStatus}`
                      : w.lastStatus === 0
                        ? 'Last delivery failed (no response)'
                        : `Last delivery ${w.lastStatus}`}
                </div>
              </div>
              <button onClick={() => delWebhook(w.id)} className="text-red-400 text-xs shrink-0">Remove</button>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] leading-relaxed text-slate-500">
            <p className="text-slate-400 mb-1">POST payload</p>
            <code className="block bg-slate-950 rounded p-2 font-mono text-[10px] text-slate-300 break-all">
              {'{"event":"scan.completed","scanId":"…","target":"…","overallRisk":"LOW","riskScore":31,"totalAssets":4,"totalCVEs":0,"durationSeconds":68}'}
            </code>
            <p className="mt-2">With a signing secret set, each request carries <span className="font-mono text-slate-300">X-ShadowSurface-Signature: sha256=&lt;hmac&gt;</span> over the raw body. Timeout 5s, one attempt, no retries.</p>
          </div>
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
              <div>
                <div className="font-medium">{k.name}</div>
                <div className="text-xs text-slate-400 font-mono">{k.prefix}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {k.lastUsed ? `Last used ${new Date(k.lastUsed).toLocaleString()}` : 'Never used'}
                </div>
              </div>
              <button onClick={() => delKey(k.id)} className="text-red-400 text-xs shrink-0">Revoke</button>
            </div>
          ))}
          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] leading-relaxed text-slate-500">
            <p>Send the key as <span className="font-mono text-slate-300">Authorization: Bearer ss_…</span> or <span className="font-mono text-slate-300">X-API-Key: ss_…</span>. Keys act on behalf of the organization and count against the same plan limits as the dashboard.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
