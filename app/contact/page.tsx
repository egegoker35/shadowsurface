import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import MarketingFooter from '@/components/landing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Contact | ShadowSurface',
  description:
    'Talk to the operator behind ShadowSurface about a scan, a retainer or an enterprise deployment.',
};

const EMAIL = 'egegoker35@gmail.com';

const TOPICS = [
  {
    label: 'A scan or a finding',
    body: 'Send the domain and the finding ID from the report. If a result looks wrong, the response that produced it is stored with the scan, so it can be checked rather than argued about.',
  },
  {
    label: 'A retainer',
    body: 'Monthly external surface coverage: scheduled scans, a written report per cycle, and a call to walk through what changed. Scope is agreed in writing before the first scan runs.',
  },
  {
    label: 'Security or abuse',
    body: 'Report a vulnerability in ShadowSurface itself, or a scan you believe was not authorised. Domain ownership is verified with a DNS TXT record before an asset enters a workspace.',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-ink text-cream/85">
      <Navbar />

      <section className="px-6 pb-16 pt-24 sm:pt-28">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">
            <span className="text-jade">Contact</span>
            <span aria-hidden className="h-px w-5 bg-jade/40" />
            <span>Direct line</span>
          </div>

          <h1 className="mt-5 max-w-3xl font-serif text-[2.3rem] font-normal leading-[1.08] tracking-[-0.02em] text-cream sm:text-[3rem]">
            Talk to the person who runs the scans.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-[1.75] text-dim">
            ShadowSurface is operated directly, not through a sales queue. Every message reaches the
            same inbox, and the reply comes from whoever reads the scan output.
          </p>

          <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <dl className="border-t border-cream/12">
                {TOPICS.map((t) => (
                  <div key={t.label} className="grid gap-x-8 gap-y-2 border-b border-cream/12 py-6 sm:grid-cols-[190px_1fr]">
                    <dt className="text-[13.5px] font-medium text-cream">{t.label}</dt>
                    <dd className="text-[13px] leading-[1.75] text-dim">{t.body}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 border-l-2 border-clay/60 pl-4">
                <p className="text-[12.5px] leading-relaxed text-faint">
                  Only domains you can prove control of are scanned. Verification is a TXT record
                  published on the domain itself, and it is re-checked before scheduled scans run.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="border border-cream/12 bg-ink2 p-6">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">Email</p>
                <a
                  href={`mailto:${EMAIL}`}
                  className="mt-2 block break-all font-mono text-[15px] text-jade underline decoration-jade/40 underline-offset-4 transition-colors hover:text-jadeLight"
                >
                  {EMAIL}
                </a>
                <div className="mt-5 space-y-2 border-t border-cream/10 pt-5 text-[12.5px] leading-relaxed text-dim">
                  <p>Include the domain, the plan you are considering and any deadline you are working to.</p>
                  <p className="text-faint">
                    If your organisation needs an agreement signed before a scan, say so in the first
                    message and the scope document is sent first.
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/pricing"
                    className="border border-jade/40 px-4 py-2 text-[12.5px] font-medium text-cream transition-colors hover:border-jade"
                  >
                    Plans and limits
                  </Link>
                  <Link
                    href="/register"
                    className="bg-jade px-4 py-2 text-[12.5px] font-semibold text-ink transition-colors hover:bg-[#6FC7A5]"
                  >
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
