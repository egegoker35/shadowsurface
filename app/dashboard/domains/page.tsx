'use client';
import { useCallback, useEffect, useState } from 'react';

/**
 * Domain ownership page. Every row carries the exact TXT record the customer has to
 * publish; the verify button re-checks DNS on demand.
 */
export default function DomainsPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [enforced, setEnforced] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  const load = useCallback(async () => {
    if (!token) return;
    const res = await fetch('/api/domains', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const d = await res.json();
      setDomains(d.domains || []);
      setEnforced(!!d.requireDomainVerification);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setNotice('');
    setBusy('add');
    const res = await fetch('/api/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ domain: input }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) { setError(d.error || 'Could not add the domain.'); return; }
    setInput('');
    setNotice(`${d.domain?.domain} added. Publish the TXT record below, then press Verify.`);
    load();
  };

  const verify = async (id: string) => {
    setError(''); setNotice('');
    setBusy(id);
    const res = await fetch('/api/domains/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy('');
    if (!res.ok) {
      const found = Array.isArray(d.found) && d.found.length ? ` Found: ${d.found.join(', ')}` : ' No TXT record found yet.';
      setError(`${d.error || 'Verification failed.'}${found}`);
      return;
    }
    setNotice('Ownership verified.');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this domain from the list?')) return;
    await fetch(`/api/domains?id=${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    load();
  };

  const copy = (value: string) => navigator.clipboard?.writeText(value);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Domain Ownership</h1>
        <p className="text-slate-400 text-sm mt-1">
          Prove you control a domain by publishing a DNS TXT record. Verified domains can be scanned.
        </p>
      </div>

      {enforced && (
        <div className="mb-6 rounded-xl border border-amber-700/50 bg-amber-900/20 px-4 py-3 text-sm text-amber-200">
          This workspace only scans verified domains. A scan target that is not on this list will be rejected.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-1">Add Domain</h2>
            <p className="text-xs text-slate-500 mb-4">example.com or app.example.com</p>
            <form onSubmit={add} className="space-y-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="example.com"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button type="submit" disabled={busy === 'add'}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-colors">
                {busy === 'add' ? 'Adding...' : 'Add Domain'}
              </button>
            </form>
            {error && <p className="mt-3 text-xs text-red-400 leading-relaxed">{error}</p>}
            {notice && <p className="mt-3 text-xs text-emerald-400 leading-relaxed">{notice}</p>}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Domains</h2>
              <span className="text-xs text-slate-500">{domains.filter((d) => d.verified).length} verified</span>
            </div>
            {domains.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-400">No domains yet.</div>
            ) : (
              <div className="divide-y divide-slate-800">
                {domains.map((d) => (
                  <div key={d.id} className="px-6 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white">{d.domain}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                          d.verified
                            ? 'bg-emerald-900/30 text-emerald-400 border-emerald-800'
                            : 'bg-amber-900/30 text-amber-400 border-amber-800'
                        }`}>
                          {d.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!d.verified && (
                          <button onClick={() => verify(d.id)} disabled={busy === d.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-800 text-xs text-emerald-300 transition-colors disabled:opacity-50">
                            {busy === d.id ? 'Checking DNS...' : 'Verify'}
                          </button>
                        )}
                        <button onClick={() => remove(d.id)}
                          className="px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/40 border border-red-800 text-xs text-red-400 transition-colors">
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 rounded-lg bg-slate-950 border border-slate-800 p-3 text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-slate-400">TXT record name</span>
                        <code className="text-slate-200 font-mono break-all">{d.recordName || `_shadowsurface-verify.${d.domain}`}</code>
                      </div>
                      <div className="flex items-center justify-between gap-3 mt-1.5">
                        <span className="text-slate-400">TXT value</span>
                        <span className="flex items-center gap-2 min-w-0">
                          <code className="text-emerald-300 font-mono break-all">{d.token}</code>
                          <button onClick={() => copy(d.token)} className="text-emerald-400 hover:text-emerald-300 shrink-0">Copy</button>
                        </span>
                      </div>
                      {d.verifiedAt && (
                        <div className="mt-1.5 text-slate-500">Verified {new Date(d.verifiedAt).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
