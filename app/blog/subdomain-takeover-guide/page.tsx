import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How Subdomain Takeovers Happen | ShadowSurface',
  description: 'Why dangling DNS records are one of the most common attack vectors and how to prevent subdomain takeover vulnerabilities.',
  keywords: ['subdomain takeover', 'dangling DNS', 'DNS security', 'attack vector', 'bug bounty'],
};

export default function BlogPost() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <article className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <p className="text-xs text-slate-500 mb-2">April 20, 2025</p>
        <h1 className="text-3xl font-extrabold mb-6">How Subdomain Takeovers Happen</h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-slate-300 leading-relaxed mb-4">A subdomain takeover occurs when an attacker gains control of a subdomain because the DNS record points to a resource that no longer exists.</p>
          <h2 className="text-xl font-bold mt-8 mb-3">Common Causes</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
            <li>Deleted GitHub Pages, Heroku, or AWS S3 buckets still referenced in DNS.</li>
            <li>Expired cloud services with lingering CNAME records.</li>
            <li>Decommissioned third-party integrations.</li>
          </ul>
          <h2 className="text-xl font-bold mt-8 mb-3">Impact</h2>
          <p className="text-slate-300 leading-relaxed mb-4">Attackers can host phishing pages, steal cookies, or bypass CSP and CORS protections on the parent domain. The damage is often high because users trust subdomains.</p>
          <h2 className="text-xl font-bold mt-8 mb-3">Prevention</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
            <li>Continuously monitor all DNS records.</li>
            <li>Remove CNAMEs before deleting the target resource.</li>
            <li>Use automated tools like ShadowSurface to detect dangling records.</li>
          </ul>
        </div>
      </article>
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
