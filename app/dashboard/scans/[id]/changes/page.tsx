'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

/**
 * Change report: what appeared, what disappeared and what was fixed between two scans.
 * Printable, because it is the monthly deliverable for a monitoring engagement.
 */

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
  info: 'bg-slate-100 text-slate-700 border-slate-300',
};

function Severity({ value }: { value: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${SEVERITY_STYLE[value] || SEVERITY_STYLE.info}`}>
      {value}
    </span>
  );
}

function Card({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`text-3xl font-extrabold mt-1 ${tone || 'text-slate-900'}`}>{value}</div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  if (count === 0) return null;
  return (
    <section className="mb-8 break-inside-avoid">
      <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
        {title} <span className="text-slate-400 font-semibold">({count})</span>
      </h2>
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">{children}</div>
    </section>
  );
}

export default function ChangesPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const token = typeof window !== 'undefined' ? localStorage.getItem('ss_token') : null;

  useEffect(() => {
    if (!id || !token) return;
    (async () => {
      try {
        const res = await fetch(`/api/scans/${id}/diff`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) setError(d.error || 'Could not load the comparison.');
        else setData(d);
      } catch {
        setError('Could not load the comparison.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading comparison...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-400">{error}</div>;
  if (!data) return null;

  const s = data.summary || {};
  const riskDelta = (s.riskAfter ?? 0) - (s.riskBefore ?? 0);

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button onClick={() => window.history.back()} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold text-sm">
          Back
        </button>
        <button onClick={() => window.print()} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-sm shadow-lg">
          Download PDF
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-8 md:p-12">
        <div className="border-b-2 border-slate-900 pb-6 mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Change Report</h1>
          <p className="text-sm text-slate-500 mt-1">
            {data.current?.target} &bull; what changed between two scans
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Prepared by {process.env.NEXT_PUBLIC_OPERATOR_NAME || 'ShadowSurface Security'}
          </p>
        </div>

        {!data.baseline ? (
          <div className="border border-slate-200 rounded-xl p-8 text-center">
            <p className="text-slate-700 font-semibold">No earlier scan to compare against.</p>
            <p className="text-sm text-slate-500 mt-2">{data.message}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="border border-slate-200 rounded-xl p-5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Baseline scan</div>
                <div className="text-sm font-semibold mt-1">{new Date(data.previous.createdAt).toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">Average asset risk {data.previous.risk}</div>
              </div>
              <div className="border border-slate-200 rounded-xl p-5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Current scan</div>
                <div className="text-sm font-semibold mt-1">{new Date(data.current.createdAt).toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">Average asset risk {data.current.risk}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card label="New assets" value={s.newAssets} tone={s.newAssets > 0 ? 'text-orange-700' : 'text-emerald-700'} />
              <Card label="New findings" value={s.newFindings} tone={s.newFindings > 0 ? 'text-red-700' : 'text-emerald-700'} />
              <Card label="Resolved findings" value={s.resolvedFindings} tone="text-emerald-700" />
              <Card label="New CVEs" value={s.newCves} tone={s.newCves > 0 ? 'text-orange-700' : 'text-emerald-700'} />
            </div>

            <div className="border border-slate-200 rounded-xl p-5 mb-8">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Asset risk change</div>
              <div className={`text-2xl font-extrabold mt-1 ${riskDelta > 0 ? 'text-red-700' : riskDelta < 0 ? 'text-emerald-700' : 'text-slate-900'}`}>
                {riskDelta > 0 ? `+${riskDelta}` : riskDelta} <span className="text-sm font-semibold text-slate-500">points on average</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {s.removedAssets} asset(s) disappeared since the baseline, {s.resolvedCves} CVE association(s) cleared.
                {s.newCloud > 0 ? ` ${s.newCloud} new cloud resource(s) appeared.` : ''}
              </p>
            </div>

            <Section title="New findings" count={s.newFindings}>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold">Severity</th>
                    <th className="text-left px-4 py-2 font-semibold">Asset</th>
                    <th className="text-left px-4 py-2 font-semibold">Finding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.newFindings.map((f: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2 align-top"><Severity value={f.severity} /></td>
                      <td className="px-4 py-2 align-top font-mono text-xs">{f.asset}:{f.port}</td>
                      <td className="px-4 py-2 align-top text-slate-700">{f.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Resolved findings" count={s.resolvedFindings}>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {data.resolvedFindings.map((f: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2 align-top"><Severity value={f.severity} /></td>
                      <td className="px-4 py-2 align-top font-mono text-xs">{f.asset}:{f.port}</td>
                      <td className="px-4 py-2 align-top text-slate-700">{f.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="New assets" count={s.newAssets}>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {data.newAssets.map((a: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-mono text-xs">{a.subdomain}:{a.port}</td>
                      <td className="px-4 py-2 text-slate-600">risk {a.riskScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="New CVEs" count={s.newCves}>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {data.newCves.map((c: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-mono text-xs">{c.cve}</td>
                      <td className="px-4 py-2 text-slate-600">{c.asset}:{c.port}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="Removed assets" count={s.removedAssets}>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {data.removedAssets.map((a: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2 font-mono text-xs">{a.subdomain}:{a.port}</td>
                      <td className="px-4 py-2 text-slate-600">was risk {a.riskScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="New cloud resources" count={s.newCloud}>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {data.newCloud.map((c: any, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2"><Severity value={c.severity} /></td>
                      <td className="px-4 py-2 font-mono text-xs">{c.resourceId}</td>
                      <td className="px-4 py-2 text-slate-600">{c.serviceType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <p className="text-xs text-slate-500 border-t border-slate-200 pt-4 mt-4">
              This report lists only differences between the two scans shown above. Findings that
              were present in both scans are unchanged and are listed in the full report.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
