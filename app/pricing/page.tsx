'use client';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { USDT_TRC20_ADDRESS, USDT_ADDRESS_FORMAT_OK } from '@/lib/usdtAddress';
import MarketingFooter from '@/components/landing/MarketingFooter';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    planId: 'free',
    description: 'Explore before you commit.',
    features: [
      '1 user',
      'Dashboard access',
      '1 scan/hour, 2 scans/month',
      'Subdomain scan',
      'Port Scan (top 10 ports)',
      'View scan history',
      'Export reports (read-only)',
    ],
    unavailable: ['CVE Check', 'Cloud Scan', 'Full Scan', 'Bulk Scan', 'API access', 'Team invites'],
    cta: 'Sign Up Free',
    ctaStyle: 'outline',
  },
  {
    name: 'Starter',
    price: '$99',
    period: '/month',
    planId: 'starter',
    description: 'For small teams getting started.',
    features: [
      '1 user',
      '5 scans/hour, 20/month',
      'Subdomain Only scan',
      'Port Scan (top 20 ports)',
      'CVE Check (known vulnerabilities)',
      'Per-asset risk scoring',
    ],
    unavailable: ['Cloud Scan (S3/GCS/Azure)', 'Full combined scan', 'Bulk multi-domain scan', 'Team invites', 'API access'],
    cta: 'Get Started',
    ctaStyle: 'solid',
  },
  {
    name: 'Professional',
    price: '$499',
    period: '/month',
    planId: 'professional',
    description: 'For security teams that need deeper intel.',
    features: [
      '5 users',
      '20 scans/hour, 200/month',
      'Subdomain Only scan',
      'Port Scan (top 50 ports)',
      'Full CVE mapping',
      'Cloud Scan (S3/GCS/Azure)',
      'Full Scan (everything combined)',
      'Report export (print / PDF)',
      'Priority support',
    ],
    unavailable: ['Bulk Scan (multi-domain)', 'API access'],
  },
  {
    name: 'Enterprise',
    price: '$1,999',
    period: '/month',
    planId: 'enterprise',
    description: 'For MSSPs and large orgs that need scale.',
    features: [
      'Unlimited users',
      '100 scans/hour, unlimited/month',
      'All scan types',
      'Port Scan (top 100 ports)',
      'Subdomain Only + CVE + Cloud + Full',
      'Bulk Scan (up to 50 domains)',
      'Full REST API access',
      'Dedicated onboarding',
      'Report export (print / PDF)',
    ],
    unavailable: [],
  },
];

// One accent per tier. The bar, the plan name and the tick marks carry the hue; the body copy
// stays neutral so the cards are still readable side by side.
const PLAN_ACCENT: Record<string, { bar: string; name: string; check: string; card: string; cta: string }> = {
  free: {
    bar: 'bg-cream/25',
    name: 'text-cream/60',
    check: 'text-cream/45',
    card: 'border-cream/12 hover:border-cream/25',
    cta: 'border border-cream/15 text-cream hover:border-cream/35',
  },
  starter: {
    bar: 'bg-steel',
    name: 'text-steel',
    check: 'text-steel',
    card: 'border-cream/12 hover:border-steel/40',
    cta: 'border border-steel/35 bg-steel/10 text-cream hover:bg-steel/20',
  },
  professional: {
    bar: 'bg-jade',
    name: 'text-jade',
    check: 'text-jade',
    card: 'border-jade/50 ring-1 ring-jade/15 hover:border-jade/70',
    cta: 'bg-jade text-ink hover:bg-[#6FC7A5] shadow-lg shadow-jade/20',
  },
  enterprise: {
    bar: 'bg-clay',
    name: 'text-clay',
    check: 'text-clay',
    card: 'border-cream/12 hover:border-clay/40',
    cta: 'border border-clay/35 bg-clay/10 text-cream hover:bg-clay/20',
  },
};

function Tick({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      className={`mt-[3px] h-3 w-3 shrink-0 ${className}`}
    >
      <path d="M2 6.4 4.7 9 10 3.2" />
    </svg>
  );
}

function Cross({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={`mt-[3px] h-2.5 w-2.5 shrink-0 ${className}`}
    >
      <path d="M3 3l6 6M9 3l-6 6" />
    </svg>
  );
}

export default function PricingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [step, setStep] = useState<'form' | 'payment' | 'verify' | 'success'>('form');
  const [form, setForm] = useState({ name: '', email: '', company: '' });
  const [txHash, setTxHash] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

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
    if (res.ok) {
      setTempPassword(data.tempPassword || '');
      setStep('success');
    } else {
      setVerifyError(data.error || 'Verification failed');
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-ink text-cream/85">
      <Navbar />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-5 flex items-center justify-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">
            <span aria-hidden className="h-1.5 w-1.5 bg-jade" />
            <span aria-hidden className="h-1.5 w-1.5 bg-steel" />
            <span aria-hidden className="h-1.5 w-1.5 bg-clay" />
            <span className="ml-1">Plans and limits</span>
          </div>
          <h1 className="mb-4 font-serif text-[2.5rem] font-normal leading-[1.08] tracking-[-0.02em] text-cream sm:text-[3.1rem]">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-dim max-w-2xl mx-auto mb-12">
            {USDT_ADDRESS_FORMAT_OK
              ? 'Pay with crypto. No hidden fees. Cancel anytime.'
              : 'Online checkout is paused while we update the payment wallet. Email us and we will activate your plan manually.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const acc = PLAN_ACCENT[plan.planId];
              return (
              <div key={plan.name} className={`relative overflow-hidden bg-ink2 border ${acc.card} rounded-xl p-5 pt-6 text-left transition-colors flex flex-col h-full`}>
                <span aria-hidden className={`absolute inset-x-0 top-0 h-[2px] ${acc.bar}`} />
                <h3 className={`text-sm font-bold mb-1 uppercase tracking-wider ${acc.name}`}>{plan.name}</h3>
                <div className="text-2xl font-bold mb-1">{plan.price}<span className="text-xs font-normal text-dim">{plan.period}</span></div>
                <p className="text-dim text-xs mb-3 leading-relaxed">{plan.description}</p>
                <ul className="mb-1 space-y-1.5 text-xs text-cream/80">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2"><Tick className={acc.check} /><span>{f}</span></li>
                  ))}
                </ul>
                <div className="mt-auto pt-5">
                  {plan.unavailable.length > 0 && (
                    <ul className="mb-3 space-y-1 text-xs text-faint">
                      {plan.unavailable.map((f) => (
                        <li key={f} className="flex items-start gap-2"><Cross className="text-faint/70" /><span>{f}</span></li>
                      ))}
                    </ul>
                  )}
                  {plan.planId === 'free' ? (
                    <a href="/register" className={`block w-full rounded-lg py-2 text-center text-sm font-semibold transition-colors ${acc.cta}`}>Sign Up Free</a>
                  ) : (
                    <button onClick={() => openModal(plan)} className={`block w-full rounded-lg py-2 text-center text-sm font-semibold transition-colors ${acc.cta}`}>
                      Get Started
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-faint text-xs font-mono uppercase tracking-wider">
            <span>Payment · USDT (TRC20)</span>
            <span className="text-faint">/</span>
            <span>Activation · verified on-chain</span>
            <span className="text-faint">/</span>
            <span>Scope · external surface only</span>
          </div>
          <p className="mt-4 text-center text-[10px] text-faint">We do not perform intrusive or exploitative scanning.</p>
        </div>
      </section>

      {modalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-ink2 border border-cream/15 rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {step === 'form' && (
              <>
                <h2 className="text-xl font-bold mb-1">{selectedPlan.name} Plan</h2>
                <p className="text-dim text-sm mb-6">{selectedPlan.price} / month</p>
                {verifyError && <div className="text-[#E28B7B] bg-[#E28B7B]/10 border border-[#E28B7B]/30 rounded-lg px-3 py-2 text-sm mb-3">{verifyError}</div>}
                <form onSubmit={submitLead} className="space-y-4">
                  <div>
                    <label className="block text-sm text-dim mb-1">Full Name *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-4 py-3 rounded-lg bg-ink border border-cream/15 focus:outline-none focus:ring-2 focus:ring-jade/40 text-cream" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="block text-sm text-dim mb-1">Email *</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full px-4 py-3 rounded-lg bg-ink border border-cream/15 focus:outline-none focus:ring-2 focus:ring-jade/40 text-cream" placeholder="john@company.com" />
                  </div>
                  <div>
                    <label className="block text-sm text-dim mb-1">Company</label>
                    <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-ink border border-cream/15 focus:outline-none focus:ring-2 focus:ring-jade/40 text-cream" placeholder="Acme Inc" />
                  </div>
                  <button type="submit" disabled={formSubmitting} className="w-full py-3 rounded-lg bg-jade hover:bg-[#6FC7A5] text-ink font-semibold disabled:opacity-50 transition-colors">
                    {formSubmitting ? 'Processing...' : 'Continue to Payment'}
                  </button>
                </form>
              </>
            )}

            {step === 'payment' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-jade" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <h2 className="text-xl font-bold">Complete Your Payment</h2>
                  <p className="text-dim text-sm">{selectedPlan.name} — {selectedPlan.price}</p>
                </div>

                <div className="space-y-4">
                  {USDT_ADDRESS_FORMAT_OK ? (
                    <div className="bg-ink border border-cream/12 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">₿</span>
                        <span className="font-semibold text-sm">USDT (TRC20)</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-dim">Address:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-cream font-mono text-xs">{USDT_TRC20_ADDRESS}</span>
                            <button onClick={() => copyText(USDT_TRC20_ADDRESS)} className="text-jade text-xs hover:text-jadeLight">Copy</button>
                          </div>
                        </div>
                        <div className="flex justify-between"><span className="text-dim">Network:</span><span className="text-cream">TRC20 (Tron)</span></div>
                        <div className="flex justify-between"><span className="text-dim">Amount:</span><span className="text-cream">{selectedPlan.price} USDT</span></div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#DDB271]/10 border border-[#DDB271]/30 rounded-xl p-4">
                      <p className="text-[#E5C48D] text-sm">
                        Online checkout is paused while the payment wallet is being reconfigured. Email{' '}
                        <span className="font-bold">egegoker35@gmail.com</span> with the plan you want and your account will be activated manually.
                      </p>
                    </div>
                  )}

                  {USDT_ADDRESS_FORMAT_OK && (
                    <div className="bg-jade/10 border border-jade/30 rounded-xl p-4">
                      <p className="text-jadeLight text-sm text-center">
                        Enter the transaction hash on the next step to activate instantly. If it does not verify, email the hash to <span className="font-bold">egegoker35@gmail.com</span>.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setStep('verify')}
                  disabled={!USDT_ADDRESS_FORMAT_OK}
                  className="mt-4 w-full py-3 rounded-lg bg-jade hover:bg-[#6FC7A5] text-ink font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  I Have Paid — Verify Now
                </button>
              </>
            )}

            {step === 'verify' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-jade" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h2 className="text-xl font-bold">Verify Payment</h2>
                  <p className="text-dim text-sm">Enter your transaction hash (TxID) from TronScan</p>
                </div>
                <form onSubmit={verifyPayment} className="space-y-4">
                  {verifyError && <div className="text-[#E28B7B] bg-[#E28B7B]/10 border border-[#E28B7B]/30 rounded-lg px-3 py-2 text-sm">{verifyError}</div>}
                  <div>
                    <label className="block text-sm text-dim mb-1">Transaction Hash (TxID) *</label>
                    <input value={txHash} onChange={(e) => setTxHash(e.target.value)} required placeholder="abcd1234..." className="w-full px-4 py-3 rounded-lg bg-ink border border-cream/15 focus:outline-none focus:ring-2 focus:ring-jade/40 text-cream font-mono text-sm" />
                  </div>
                  <button type="submit" disabled={verifyLoading} className="w-full py-3 rounded-lg bg-jade hover:bg-[#6FC7A5] text-ink font-semibold disabled:opacity-50 transition-colors">
                    {verifyLoading ? 'Verifying...' : 'Verify & Activate'}
                  </button>
                  <button type="button" onClick={() => setStep('payment')} className="w-full py-2 text-dim text-sm hover:text-cream transition-colors">
                    Back to payment info
                  </button>
                </form>
              </>
            )}

            {step === 'success' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-jade/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-jade" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-2xl font-bold text-jade">Payment Verified!</h2>
                <p className="text-dim text-sm mt-2">Your {selectedPlan?.name} plan is now active.</p>
                {tempPassword && (
                  <div className="mt-4 text-left bg-ink border border-cream/12 rounded-xl p-4">
                    <p className="text-xs text-dim mb-1">One-time password for {form.email}</p>
                    <div className="flex items-center justify-between gap-3">
                      <code className="font-mono text-jadeLight text-sm break-all">{tempPassword}</code>
                      <button onClick={() => copyText(tempPassword)} className="text-jade text-xs shrink-0 hover:text-jadeLight">Copy</button>
                    </div>
                    <p className="text-[11px] text-faint mt-2">Sign in with this password and change it in Settings. It is shown only once.</p>
                  </div>
                )}
                <a href="/login" className="mt-6 inline-block px-6 py-2.5 rounded-lg bg-jade hover:bg-[#6FC7A5] text-ink font-semibold">Go to Dashboard</a>
              </div>
            )}
          </div>
        </div>
      )}

      <MarketingFooter />
    </div>
  );
}
