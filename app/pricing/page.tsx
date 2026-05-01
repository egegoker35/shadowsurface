'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

const plans = [
  { name: 'Starter', price: '$99', period: '/month', planId: 'starter', description: 'For small teams getting started with attack surface visibility.', features: ['1 user', '5 domains', 'Weekly scans', 'Basic cloud checks', 'Email alerts', 'Community support'] },
  { name: 'Professional', price: '$499', period: '/month', planId: 'professional', description: 'For security teams that need continuous monitoring.', features: ['5 users', '50 domains', 'Daily scans', 'Advanced cloud + CVE', 'Slack/Teams alerts', 'Priority support', 'API access'] },
  { name: 'Enterprise', price: '$1,999', period: '/month', planId: 'enterprise', description: 'For MSSPs and large organizations at scale.', features: ['Unlimited users', 'Unlimited domains', 'Hourly scans', 'Custom integrations', 'Dedicated CSM', 'SOC2 reporting', 'SLA guarantee'] },
];

const hasStripe = !!(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const subscribe = async (planId: string) => {
    if (!hasStripe) {
      setSelectedPlan(planId);
      setModalOpen(true);
      return;
    }
    const token = localStorage.getItem('ss_token');
    if (!token) { window.location.href = '/login'; return; }
    setLoading(planId);
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ plan: planId }) });
    const data = await res.json();
    setLoading(null);
    if (data.url) window.location.href = data.url;
    else alert(data.error || 'Checkout failed');
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, plan: selectedPlan }) });
    setFormSubmitting(false);
    if (res.ok) {
      setFormSuccess(true);
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => { setModalOpen(false); setFormSuccess(false); }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
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
                <button onClick={() => subscribe(plan.planId)} disabled={!!loading} className="block text-center w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 transition-colors">
                  {loading === plan.planId ? 'Loading...' : hasStripe ? 'Subscribe' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {formSuccess ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-xl font-bold text-emerald-400">Request Received!</h2>
                <p className="text-slate-400 text-sm mt-1">We will contact you shortly.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1">Get Started with {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}</h2>
                <p className="text-slate-400 text-sm mb-6">Leave your details and we will contact you for payment.</p>
                <form onSubmit={submitLead} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white" placeholder="john@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Message (optional)</label>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white" placeholder="Tell us about your needs..." />
                  </div>
                  <button type="submit" disabled={formSubmitting} className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 transition-colors">
                    {formSubmitting ? 'Sending...' : 'Submit Request'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
