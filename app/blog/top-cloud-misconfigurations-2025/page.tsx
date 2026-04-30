import Navbar from '@/components/Navbar';

export default function BlogPost() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <article className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <p className="text-xs text-slate-500 mb-2">April 25, 2025</p>
        <h1 className="text-3xl font-extrabold mb-6">Top 10 Cloud Misconfigurations in 2025</h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-slate-300 leading-relaxed mb-4">
            Cloud misconfigurations remain the leading cause of data breaches. According to industry reports, over 65% of cloud security incidents are caused by customer misconfigurations rather than cloud provider failures.
          </p>
          <h2 className="text-xl font-bold mt-8 mb-3">1. Public S3 Buckets</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            AWS S3 buckets with overly permissive ACLs or bucket policies are still the #1 finding. Attackers use automated tools to scan for buckets named after company domains. ShadowSurface tests common bucket permutations automatically.
          </p>
          <h2 className="text-xl font-bold mt-8 mb-3">2. Open Database Ports</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            MongoDB, Elasticsearch, and Redis instances exposed to the internet without authentication are trivial to exploit. Default credentials make it even worse.
          </p>
          <h2 className="text-xl font-bold mt-8 mb-3">3. Missing Security Headers</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            Absence of Content-Security-Policy, HSTS, and X-Frame-Options allows clickjacking, XSS, and man-in-the-middle attacks.
          </p>
          <h2 className="text-xl font-bold mt-8 mb-3">4. Overly Permissive IAM Roles</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            IAM roles with wildcard permissions (*:*) or broad resource access create lateral movement opportunities for attackers who breach a single service.
          </p>
          <h2 className="text-xl font-bold mt-8 mb-3">5. Exposed Kubernetes Dashboards</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            Kubernetes dashboards and API servers without proper network policies are frequently found on public IPs, allowing cluster takeover.
          </p>
          <p className="text-slate-300 leading-relaxed mb-4">
            ShadowSurface&rsquo;s cloud scanner continuously probes for these and other misconfigurations across AWS, GCP, and Azure.
          </p>
        </div>
      </article>
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
