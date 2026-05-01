'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

const plans = [
  { name: 'Starter', price: '$99', period: '/month', planId: 'starter', description: 'For small teams getting started with attack surface visibility.', features: ['1 user', '5 domains', 'Weekly scans', 'Basic cloud checks', 'Email alerts', 'Community support'] },
  { name: 'Professional', price: '$499', period: '/month', planId: 'professional', description: 'For security teams that need continuous monitoring.', features: ['5 users', '50 domains', 'Daily scans', 'Advanced cloud + CVE', 'Slack/Teams alerts', 'Priority support', 'API access'] },
  { name: 'Enterprise', price: '$1,999', period: '/month', planId: 'enterprise', description: 'For MSSPs and large organizations at scale.', features: ['Unlimited users', 'Unlimited domains', 'Hourly scans', 'Custom integrations', 'Dedicated CSM', 'SOC2 reporting', 'SLA guarantee'] },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const subscribe = async (planId: string) => {
    const token = localStorage.getItem('ss_token');
    if (!token) { window.location.href = '/login'; return; }
    setLoading(planId);
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ plan: planId }) });
    const data = await res.json();
    setLoading(null);
    if (data.url) window.location.href = data.url;
    else alert(data.error || 'Checkout failed');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-slate-400 mb-16 max-w-xl mx-auto">Start free, scale as your attack surface grows. No hidden fees.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-8 text-left ${plan.name === 'Professional' ? 'border-emerald-500 bg-slate-900/80 ring-1 ring-emerald-500/20' : 'border-slate-800 bg-slate-900'}`}>
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                <div className="text-3xl font-bold mb-6">{plan.price}<span className="text-base font-normal text-slate-400">{plan.period}</span></div>
                <ul className="space-y-3 text-sm text-slate-300 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span>{f}</li>
                  ))}
                </ul>
                <button onClick={() => subscribe(plan.planId)} disabled={!!loading} className="block text-center w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50">
                  {loading === plan.planId ? 'Loading...' : 'Subscribe'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
