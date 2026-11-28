import Link from 'next/link';

/**
 * Shared footer for every public page. Keeping one copy means the blog, pricing and
 * legal pages cannot drift away from the landing page's navigation.
 */
export default function MarketingFooter() {
  return (
    <footer className="border-t border-jade/20 px-6 pb-10 pt-12">
      <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-8 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2">
            <span aria-hidden className="grid h-[14px] w-[14px] grid-cols-2 gap-[3px]">
              <span className="bg-jade" />
              <span className="bg-jade/30" />
              <span className="bg-jade/30" />
              <span className="bg-jade" />
            </span>
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-cream">
              ShadowSurface
            </span>
          </div>
          <p className="mt-3 max-w-[15rem] text-[11.5px] leading-relaxed text-faint">
            External attack surface management with an evidence trail behind every finding.
          </p>
        </div>
        <div>
          <div className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
            Product
          </div>
          <ul className="space-y-2 text-[12.5px]">
            <li><Link href="/features" className="text-dim hover:text-jadeLight">Features</Link></li>
            <li><Link href="/pricing" className="text-dim hover:text-jadeLight">Pricing</Link></li>
            <li><Link href="/register" className="text-dim hover:text-jadeLight">Get started</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
            Company
          </div>
          <ul className="space-y-2 text-[12.5px]">
            <li><Link href="/blog" className="text-dim hover:text-jadeLight">Blog</Link></li>
            <li><Link href="/contact" className="text-dim hover:text-jadeLight">Contact</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
            Legal
          </div>
          <ul className="space-y-2 text-[12.5px]">
            <li><Link href="/privacy" className="text-dim hover:text-jadeLight">Privacy</Link></li>
            <li><Link href="/terms" className="text-dim hover:text-jadeLight">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-[1180px] border-t border-cream/10 pt-5 font-mono text-[10.5px] text-faint">
        © {new Date().getFullYear()} ShadowSurface
      </div>
    </footer>
  );
}
