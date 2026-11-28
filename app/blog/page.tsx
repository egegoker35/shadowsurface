import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import MarketingFooter from '@/components/landing/MarketingFooter';

export const metadata: Metadata = {
  title: 'Blog | ShadowSurface - Attack Surface Management & Cloud Security',
  description: 'Read the latest insights on attack surface management, cloud security misconfigurations, subdomain takeovers, and CVE prioritization.',
  keywords: ['attack surface management blog', 'cloud security blog', 'subdomain takeover', 'CVE prioritization', 'cybersecurity insights'],
};

const posts = [
  {
    slug: 'what-is-attack-surface-management',
    title: 'What Is Attack Surface Management?',
    date: '2025-04-28',
    excerpt: 'A complete guide to understanding your external attack surface and why continuous monitoring matters.',
    tag: 'Primer',
    dot: 'bg-jade',
    label: 'text-jadeLight',
  },
  {
    slug: 'top-cloud-misconfigurations-2025',
    title: 'Top 10 Cloud Misconfigurations in 2025',
    date: '2025-04-25',
    excerpt: 'Public S3 buckets, open databases, and exposed APIs — how attackers find your weakest links.',
    tag: 'Cloud',
    dot: 'bg-steel',
    label: 'text-steel',
  },
  {
    slug: 'subdomain-takeover-guide',
    title: 'How Subdomain Takeovers Happen',
    date: '2025-04-20',
    excerpt: 'Why dangling DNS records are one of the most common attack vectors and how to prevent them.',
    tag: 'DNS',
    dot: 'bg-clay',
    label: 'text-clay',
  },
  {
    slug: 'cve-priority-matrix',
    title: 'Prioritizing CVEs: Not All Vulnerabilities Are Equal',
    date: '2025-04-15',
    excerpt: 'How to build a risk-based approach to vulnerability management instead of chasing every CVE.',
    tag: 'Risk',
    dot: 'bg-[#DDB271]',
    label: 'text-[#E5C48D]',
  },
];

function ReadArrow() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="h-3 w-3">
      <path d="M2.5 8h10M9 4.5 12.5 8 9 11.5" />
    </svg>
  );
}

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-ink text-cream/85">
      <Navbar />

      <section className="px-6 pb-20 pt-24 sm:pt-28">
        <div className="mx-auto max-w-[900px]">
          <div className="flex items-center gap-3 font-mono text-[10.5px] uppercase tracking-[0.18em] text-faint">
            <span className="text-jade">Writing</span>
            <span aria-hidden className="h-px w-5 bg-jade/40" />
            <span>{posts.length} notes</span>
          </div>
          <h1 className="mt-5 max-w-2xl font-serif text-[2.4rem] font-normal leading-[1.08] tracking-[-0.02em] text-cream sm:text-[3rem]">
            Field notes on the external surface
          </h1>
          <p className="mt-5 max-w-xl text-[14.5px] leading-[1.75] text-dim">
            Working notes on discovery, fingerprinting and the evidence rules this scanner runs on.
            Each piece is written against the engine, not against a slide deck.
          </p>

          <div className="mt-12 border-t border-cream/12">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group grid gap-x-10 gap-y-3 border-b border-cream/12 py-7 sm:grid-cols-[150px_1fr]"
              >
                <div className="sm:pt-1">
                  <p className="font-mono text-[10.5px] text-faint">{post.date}</p>
                  <p className="mt-2 flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-faint">
                    <span aria-hidden className={`h-1.5 w-1.5 ${post.dot}`} />
                    <span className={post.label}>{post.tag}</span>
                  </p>
                </div>
                <div>
                  <h2 className="font-serif text-[1.45rem] font-normal leading-snug tracking-[-0.01em] text-cream">
                    <Link href={`/blog/${post.slug}`} className="transition-colors group-hover:text-jadeLight">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 max-w-[36rem] text-[13.5px] leading-[1.75] text-dim">{post.excerpt}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-3 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint transition-colors group-hover:text-jadeLight"
                  >
                    Read note
                    <ReadArrow />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
