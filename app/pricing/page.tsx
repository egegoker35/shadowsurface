'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

const plans = [
  { name: 'Starter', price: '$99', tlPrice: '3.300 ₺', period: '/month', planId: 'starter', description: 'For small teams getting started with attack surface visibility.', features: ['1 user', '5 domains', 'Weekly scans', 'Basic cloud checks', 'Email alerts', 'Community support'] },
  { name: 'Professional', price: '$499', tlPrice: '16.500 ₺', period: '/month', planId: 'professional', description: 'For security teams that need continuous monitoring.', features: ['5 users', '50 domains', 'Daily scans', 'Advanced cloud + CVE', 'Slack/Teams alerts', 'Priority support', 'API access'] },
  { name: 'Enterprise', price: '$1,999', tlPrice: '66.000 ₺', period: '/month', planId: 'enterprise', description: 'For MSSPs and large organizations at scale.', features: ['Unlimited users', 'Unlimited domains', 'Hourly scans', 'Custom integrations', 'Dedicated CSM', 'SOC2 reporting', 'SLA guarantee'] },
];

export default function PricingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const openModal = (plan: any) => {
    setSelectedPlan(plan);
    setModalOpen(true);
    setFormSuccess(false);
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, plan: selectedPlan.planId }) });
    setFormSubmitting(false);
    if (res.ok) {
      setFormSuccess(true);
      setForm({ name: '', email: '', message: '' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-slate-400 mb-16 max-w-xl mx-auto">Start free, scale as your attack surface grows. Pay with Papara, bank transfer, or crypto.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-8 text-left ${plan.name === 'Professional' ? 'border-emerald-500 bg-slate-900/80 ring-1 ring-emerald-500/20' : 'border-slate-800 bg-slate-900'}`}>
                <h3 className="text-lg font-semibold mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                <div className="text-3xl font-bold mb-1">{plan.price}<span className="text-base font-normal text-slate-400">{plan.period}</span></div>
                <div className="text-sm text-slate-500 mb-6">~ {plan.tlPrice}</div>
                <ul className="space-y-3 text-sm text-slate-300 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span>{f}</li>
                  ))}
                </ul>
                <button onClick={() => openModal(plan)} className="block text-center w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors">
                  Get Started
                </button>
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className="mt-16 flex justify-center gap-6 text-slate-500 text-sm">
            <div className="flex items-center gap-2"><span className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-lg">💳</span> Papara</div>
            <div className="flex items-center gap-2"><span className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-lg">🏦</span> Bank Transfer</div>
            <div className="flex items-center gap-2"><span className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-lg">₿</span> Crypto</div>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {modalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {formSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-xl font-bold text-emerald-400">Request Received!</h2>
                <p className="text-slate-400 text-sm mt-2">We will contact you within 24 hours with payment details.</p>
                <button onClick={() => setModalOpen(false)} className="mt-6 px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm">Close</button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-1">{selectedPlan.name} Plan</h2>
                <p className="text-slate-400 text-sm mb-1">{selectedPlan.price} / month (~{selectedPlan.tlPrice})</p>
                <p className="text-slate-500 text-xs mb-6">Choose your payment method after submitting.</p>

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
                    <label className="block text-sm text-slate-400 mb-1">Notes (optional)</label>
                    <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={2} className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white" placeholder="Company name, questions..." />
                  </div>
                  <button type="submit" disabled={formSubmitting} className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 transition-colors">
                    {formSubmitting ? 'Sending...' : 'Submit Order'}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 text-center">Payment methods: Papara, Bank Transfer (Havale/EFT), USDT/BTC</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
