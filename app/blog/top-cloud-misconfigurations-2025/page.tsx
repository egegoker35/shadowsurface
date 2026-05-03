import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top 10 Cloud Misconfigurations in 2025 | ShadowSurface',
  description: 'Public S3 buckets, open databases, exposed APIs — the most common cloud misconfigurations attackers exploit and how to prevent them.',
  keywords: ['cloud misconfiguration', 'S3 bucket', 'exposed database', 'cloud security', 'AWS security', 'GCS security'],
};

export default function BlogPost() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <article className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <p className="text-xs text-slate-500 mb-2">April 25, 2025</p>
        <h1 className="text-3xl font-extrabold mb-6">Top 10 Cloud Misconfigurations in 2025</h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-slate-300 leading-relaxed mb-4">Cloud misconfigurations remain the #1 cause of data breaches. Here are the top 10 mistakes security teams make:</p>
          <ol className="list-decimal list-inside text-slate-300 space-y-3 mb-4">
            <li><strong>Public S3 Buckets:</strong> Accidentally exposing storage to the world.</li>
            <li><strong>Open Databases:</strong> MongoDB, Elasticsearch, and Redis without authentication.</li>
            <li><strong>Overly Permissive IAM:</strong> Wildcard permissions that violate least privilege.</li>
            <li><strong>Unencrypted Storage:</strong> Data at rest without AES-256 or equivalent.</li>
            <li><strong>Exposed APIs:</strong> Internal microservices reachable from the internet.</li>
            <li><strong>Missing MFA:</strong> Root and admin accounts without second-factor.</li>
            <li><strong>Default Credentials:</strong> Factory passwords on cloud appliances.</li>
            <li><strong>Unpatched VMs:</strong> Long-running instances missing critical updates.</li>
            <li><strong>Public Snapshots:</strong> Disk snapshots shared beyond the organization.</li>
            <li><strong>Shadow Resources:</strong> Orphaned assets nobody owns or monitors.</li>
          </ol>
          <p className="text-slate-300 leading-relaxed mb-4">ShadowSurface scans for all of these automatically, alerting you before attackers find them.</p>
        </div>
      </article>
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
