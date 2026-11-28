import Navbar from '@/components/Navbar';
import MarketingFooter from '@/components/landing/MarketingFooter';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ink text-cream/85">
      <Navbar />
      <div className="max-w-3xl mx-auto pt-32 pb-20 px-4">
        <h1 className="font-serif text-[2.1rem] font-normal leading-[1.12] tracking-[-0.015em] text-cream mb-6">Terms of Service</h1>
        <div className="space-y-6 text-cream/80 leading-relaxed">
          <p>Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-xl font-semibold text-cream mb-2">1. Acceptance of Terms</h2>
            <p>By accessing or using ShadowSurface, you agree to be bound by these Terms of Service. If you do not agree, you may not use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-cream mb-2">2. Use of Service</h2>
            <p>ShadowSurface is an attack surface management platform. You may only scan domains and IP addresses that you own or have explicit written authorization to test. Unauthorized scanning of third-party assets is strictly prohibited.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-cream mb-2">3. Account Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-cream mb-2">4. Payment</h2>
            <p>Payments are processed via USDT (TRC20) cryptocurrency. All sales are final. Plan upgrades are activated after payment verification.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-cream mb-2">5. Limitation of Liability</h2>
            <p>ShadowSurface is provided &quot;as is&quot; without warranties of any kind. We are not liable for damages arising from the use or inability to use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-cream mb-2">6. Contact</h2>
            <p>For legal inquiries, contact <span className="text-jade">egegoker35@gmail.com</span>.</p>
          </section>
        </div>
      </div>
      <MarketingFooter />
    </div>
  );
}
