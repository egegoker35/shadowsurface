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
  const [step, setStep] = useState<'form' | 'payment' | 'done'>('form');
  const [form, setForm] = useState({ name: '', email: '', company: '' });
  const [formSubmitting, setFormSubmitting] = useState(false);

  const openModal = (plan: any) => {
    setSelectedPlan(plan);
    setModalOpen(true);
    setStep('form');
    setForm({ name: '', email: '', company: '' });
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, plan: selectedPlan?.planId }),
    });
    setFormSubmitting(false);
    if (res.ok) setStep('payment');
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
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
        </div>
      </section>

      {modalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {step === 'form' && (
              <>
                <h2 className="text-xl font-bold mb-1">{selectedPlan.name} Plan</h2>
                <p className="text-slate-400 text-sm mb-6">{selectedPlan.price} / month</p>
                <form onSubmit={submitLead} className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Full Name *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Email *</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white" placeholder="john@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Company</label>
                    <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white" placeholder="Acme Inc" />
                  </div>
                  <button type="submit" disabled={formSubmitting} className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 transition-colors">
                    {formSubmitting ? 'Processing...' : 'Continue to Payment'}
                  </button>
                </form>
              </>
            )}

            {step === 'payment' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <h2 className="text-xl font-bold">Complete Your Payment</h2>
                  <p className="text-slate-400 text-sm">{selectedPlan.name} — {selectedPlan.price}</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">🏦</span>
                      <span className="font-semibold text-sm">Bank Transfer (Havale/EFT)</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-400">Bank:</span><span className="text-white font-medium">Ziraat Bank / İş Bank</span></div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">IBAN:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-xs">TR00 0000 0000 0000 0000 0000 00</span>
                          <button onClick={() => copyText('TR00 0000 0000 0000 0000 0000 00')} className="text-emerald-400 text-xs hover:text-emerald-300">Copy</button>
                        </div>
                      </div>
                      <div className="flex justify-between"><span className="text-slate-400">Amount:</span><span className="text-white">{selectedPlan.tlPrice} or {selectedPlan.price}</span></div>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">₿</span>
                      <span className="font-semibold text-sm">Crypto (USDT TRC20)</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Address:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-xs">TYourWalletAddressHere</span>
                          <button onClick={() => copyText('TYourWalletAddressHere')} className="text-emerald-400 text-xs hover:text-emerald-300">Copy</button>
                        </div>
                      </div>
                      <div className="flex justify-between"><span className="text-slate-400">Network:</span><span className="text-white">TRC20 (Tron)</span></div>
                    </div>
                  </div>

                  <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-4">
                    <p className="text-emerald-300 text-sm text-center">
                      After payment, send receipt/screenshot to <span className="font-bold">egegoker35@gmail.com</span>
                    </p>
                  </div>
                </div>

                <button onClick={() => setModalOpen(false)} className="mt-6 w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm transition-colors">
                  I have completed the payment
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
