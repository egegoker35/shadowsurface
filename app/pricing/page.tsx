'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    planId: 'free',
    description: 'Explore the platform before committing.',
    features: [
      '1 user',
      'Dashboard access',
      'View scan history',
      'Export reports (read-only)',
    ],
    unavailable: ['Scan execution', 'Cloud misconfiguration scan', 'Full combined scan', 'Bulk multi-domain scan', 'API access', 'Team invites'],
    cta: 'Sign Up Free',
    ctaStyle: 'outline',
  },
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    planId: 'starter',
    description: 'For small teams getting started with attack surface visibility.',
    features: [
      '1 user',
      '5 scans/hour, 20/month',
      'Subdomain enumeration',
      'Port scan (top 20 ports)',
      'Known CVE checks (limited)',
      'Email alerts',
    ],
    unavailable: ['Cloud misconfiguration scan', 'Full combined scan', 'Bulk multi-domain scan', 'API access'],
    cta: 'Get Started',
    ctaStyle: 'solid',
  },
  {
    name: 'Professional',
    price: '$499',
    period: '/month',
    planId: 'professional',
    description: 'For security teams that need continuous monitoring and deeper intel.',
    features: [
      '5 users',
      '20 scans/hour, 200/month',
      'Subdomain enumeration',
      'Port scan (top 50 ports)',
      'Full CVE mapping',
      'Cloud misconfiguration scan (S3/GCS/Azure)',
      'Full combined scan',
      'Slack/Teams alerts',
      'Priority support',
    ],
    unavailable: ['Bulk multi-domain scan (up to 50)', 'API access', 'Custom integrations'],
  },
  {
    name: 'Enterprise',
    price: '$1,999',
    period: '/month',
    planId: 'enterprise',
    description: 'For MSSPs and large organizations that need scale and automation.',
    features: [
      'Unlimited users',
      '100 scans/hour, unlimited/month',
      'All scan types included',
      'Port scan (top 100 ports)',
      'Full CVE + cloud + SSL + WAF',
      'Bulk multi-domain scan (up to 50)',
      'API access',
      'Custom integrations',
      'Dedicated CSM',
      'SOC2 reporting',
      'SLA guarantee',
    ],
    unavailable: [],
  },
];

export default function PricingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [step, setStep] = useState<'form' | 'payment' | 'verify' | 'success'>('form');
  const [form, setForm] = useState({ name: '', email: '', company: '' });
  const [txHash, setTxHash] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const openModal = (plan: any) => {
    setSelectedPlan(plan);
    setModalOpen(true);
    setStep('form');
    setForm({ name: '', email: '', company: '' });
    setVerifyError('');
  };

  const submitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setVerifyError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plan: selectedPlan?.planId }),
      });
      setFormSubmitting(false);
      if (res.ok) {
        setStep('payment');
      } else {
        const data = await res.json().catch(() => ({}));
        setVerifyError(data.error || 'Failed to submit. Please try again.');
      }
    } catch {
      setFormSubmitting(false);
      setVerifyError('Network error. Please try again.');
    }
  };

  const verifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyLoading(true);
    setVerifyError('');
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txHash, email: form.email, plan: selectedPlan?.planId }),
    });
    const data = await res.json();
    setVerifyLoading(false);
    if (res.ok) setStep('success');
    else setVerifyError(data.error || 'Verification failed');
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12">Pay with crypto. No hidden fees. Cancel anytime.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className={`bg-slate-900 border ${plan.name === 'Professional' ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-slate-800'} rounded-2xl p-8 text-left hover:border-slate-700 transition-colors`}>
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                <div className="text-3xl font-bold mb-6">{plan.price}<span className="text-base font-normal text-slate-400">{plan.period}</span></div>
                <ul className="space-y-3 text-sm text-slate-300 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span>{f}</li>
                  ))}
                </ul>
                {plan.unavailable.length > 0 && (
                  <ul className="space-y-2 text-sm text-slate-500 mb-6">
                    {plan.unavailable.map((f) => (
                      <li key={f} className="flex items-center gap-2"><span className="text-slate-600">&#10007;</span>{f}</li>
                    ))}
                  </ul>
                )}
                {plan.unavailable.length === 0 && <div className="mb-6" />}
                {plan.planId === 'free' ? (
                  <a href="/register" className="block text-center w-full py-2.5 rounded-lg font-semibold transition-colors bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">Sign Up Free</a>
                ) : (
                  <button onClick={() => openModal(plan)} className={`block text-center w-full py-2.5 rounded-lg font-semibold transition-colors ${plan.name === 'Professional' ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
                    Get Started
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center gap-6 text-slate-500 text-sm">
            <div className="flex items-center gap-2"><span className="text-lg">₿</span> USDT (TRC20)</div>
            <div className="flex items-center gap-2"><span className="text-lg">⚡</span> Instant</div>
            <div className="flex items-center gap-2"><span className="text-lg">🔒</span> Secure</div>
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
                {verifyError && <div className="text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2 text-sm mb-3">{verifyError}</div>}
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
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">₿</span>
                      <span className="font-semibold text-sm">USDT (TRC20)</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Address:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-xs">THZzRBItyb8bhGczJgSFVNGjjt6x4MC3PL</span>
                          <button onClick={() => copyText('THZzRBItyb8bhGczJgSFVNGjjt6x4MC3PL')} className="text-emerald-400 text-xs hover:text-emerald-300">Copy</button>
                        </div>
                      </div>
                      <div className="flex justify-between"><span className="text-slate-400">Network:</span><span className="text-white">TRC20 (Tron)</span></div>
                      <div className="flex justify-between"><span className="text-slate-400">Amount:</span><span className="text-white">{selectedPlan.price} USDT</span></div>
                    </div>
                  </div>

                  <div className="bg-emerald-900/20 border border-emerald-800 rounded-xl p-4">
                    <p className="text-emerald-300 text-sm text-center">
                      After payment, send receipt/tx hash to <span className="font-bold">egegoker35@gmail.com</span>
                    </p>
                  </div>
                </div>

                <button onClick={() => setStep('verify')} className="mt-4 w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors">
                  I Have Paid — Verify Now
                </button>
              </>
            )}

            {step === 'verify' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h2 className="text-xl font-bold">Verify Payment</h2>
                  <p className="text-slate-400 text-sm">Enter your transaction hash (TxID) from TronScan</p>
                </div>
                <form onSubmit={verifyPayment} className="space-y-4">
                  {verifyError && <div className="text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2 text-sm">{verifyError}</div>}
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Transaction Hash (TxID) *</label>
                    <input value={txHash} onChange={(e) => setTxHash(e.target.value)} required placeholder="abcd1234..." className="w-full px-4 py-3 rounded-lg bg-slate-950 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white font-mono text-sm" />
                  </div>
                  <button type="submit" disabled={verifyLoading} className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-50 transition-colors">
                    {verifyLoading ? 'Verifying...' : 'Verify & Activate'}
                  </button>
                  <button type="button" onClick={() => setStep('payment')} className="w-full py-2 text-slate-400 text-sm hover:text-white transition-colors">
                    Back to payment info
                  </button>
                </form>
              </>
            )}

            {step === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-emerald-400">Payment Verified!</h2>
                <p className="text-slate-400 text-sm mt-2">Your {selectedPlan?.name} plan is now active.</p>
                <a href="/login" className="mt-6 inline-block px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">Go to Dashboard</a>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
