import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'What Is Attack Surface Management? | ShadowSurface',
  description: 'A complete guide to Attack Surface Management (ASM). Learn how continuous discovery, monitoring, and prioritization of external assets protects your organization.',
  keywords: ['attack surface management', 'ASM', 'external attack surface', 'asset discovery', 'cybersecurity'],
};

export default function BlogPost() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <article className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <p className="text-xs text-slate-500 mb-2">April 28, 2025</p>
        <h1 className="text-3xl font-extrabold mb-6">What Is Attack Surface Management?</h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-slate-300 leading-relaxed mb-4">
            Attack Surface Management (ASM) is the continuous discovery, inventory, classification, and monitoring of an organization&rsquo;s externally facing digital assets. These assets include websites, subdomains, IP addresses, cloud storage buckets, APIs, and third-party services.
          </p>
          <p className="text-slate-300 leading-relaxed mb-4">
            Unlike traditional vulnerability scanning, which focuses on known systems, ASM starts with reconnaissance. It asks: <em>what does our infrastructure look like from the attacker&rsquo;s perspective?</em> This is critical because modern development practices—CI/CD, shadow IT, and cloud sprawl—mean new assets appear daily.
          </p>
          <h2 className="text-xl font-bold mt-8 mb-3">Why Continuous Monitoring Matters</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            A one-time audit is not enough. Your attack surface changes constantly: developers spin up test environments, marketing registers new domains, and acquisitions bring unknown infrastructure. Continuous monitoring detects these changes as they happen.
          </p>
          <h2 className="text-xl font-bold mt-8 mb-3">Key Components of ASM</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
            <li><strong>Asset Discovery:</strong> Find every subdomain, IP, and cloud resource associated with your organization.</li>
            <li><strong>Classification:</strong> Understand what each asset is, who owns it, and how critical it is.</li>
            <li><strong>Vulnerability Detection:</strong> Identify exposed services, missing patches, and misconfigurations.</li>
            <li><strong>Prioritization:</strong> Focus on high-risk exposures that are actually exploitable.</li>
            <li><strong>Remediation:</strong> Integrate with ticketing systems to close gaps quickly.</li>
          </ul>
          <p className="text-slate-300 leading-relaxed mb-4">
            ShadowSurface automates all of these steps, giving security teams a real-time view of their external perimeter without manual reconnaissance.
          </p>
        </div>
      </article>
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
