import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | ShadowSurface - Attack Surface Management & Cloud Security',
  description: 'Read the latest insights on attack surface management, cloud security misconfigurations, subdomain takeovers, and CVE prioritization.',
  keywords: ['attack surface management blog', 'cloud security blog', 'subdomain takeover', 'CVE prioritization', 'cybersecurity insights'],
};

const posts = [
  { slug: 'what-is-attack-surface-management', title: 'What Is Attack Surface Management?', date: '2025-04-28', excerpt: 'A complete guide to understanding your external attack surface and why continuous monitoring matters.' },
  { slug: 'top-cloud-misconfigurations-2025', title: 'Top 10 Cloud Misconfigurations in 2025', date: '2025-04-25', excerpt: 'Public S3 buckets, open databases, and exposed APIs — how attackers find your weakest links.' },
  { slug: 'subdomain-takeover-guide', title: 'How Subdomain Takeovers Happen', date: '2025-04-20', excerpt: 'Why dangling DNS records are one of the most common attack vectors and how to prevent them.' },
  { slug: 'cve-priority-matrix', title: 'Prioritizing CVEs: Not All Vulnerabilities Are Equal', date: '2025-04-15', excerpt: 'How to build a risk-based approach to vulnerability management instead of chasing every CVE.' },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-8 text-center">Blog</h1>
          <div className="space-y-6">
            {posts.map((post) => (
              <article key={post.slug} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                <p className="text-xs text-slate-500 mb-2">{post.date}</p>
                <h2 className="text-xl font-semibold mb-2"><Link href={`/blog/${post.slug}`} className="hover:text-emerald-400">{post.title}</Link></h2>
                <p className="text-sm text-slate-400">{post.excerpt}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
