import Navbar from '@/components/Navbar';

export default function BlogPost() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <article className="pt-32 pb-20 px-4 max-w-3xl mx-auto">
        <p className="text-xs text-slate-500 mb-2">April 20, 2025</p>
        <h1 className="text-3xl font-extrabold mb-6">How Subdomain Takeovers Happen</h1>
        <div className="prose prose-invert prose-slate max-w-none">
          <p className="text-slate-300 leading-relaxed mb-4">
            A subdomain takeover occurs when a DNS record points to a third-party service (like GitHub Pages, Heroku, or AWS S3) that has been deleted or expired, but the DNS CNAME remains. An attacker can then claim the resource and serve content under your domain.
          </p>
          <h2 className="text-xl font-bold mt-8 mb-3">The Attack Chain</h2>
          <ol className="list-decimal list-inside text-slate-300 space-y-2 mb-4">
            <li>Company creates <code>blog.example.com</code> pointing to <code>company.github.io</code>.</li>
            <li>Company migrates the blog but forgets to remove the CNAME record.</li>
            <li>Attacker notices the dangling CNAME and registers <code>company.github.io</code>.</li>
            <li>Attacker now controls <code>blog.example.com</code> and can serve phishing pages or steal cookies.</li>
          </ol>
          <h2 className="text-xl font-bold mt-8 mb-3">Prevention</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
            <li>Maintain an inventory of all DNS records and their intended targets.</li>
            <li>Before deleting a cloud resource, always remove its DNS entry first.</li>
            <li>Use automated scanning tools that flag dangling CNAMEs.</li>
            <li>Monitor certificate transparency logs for unexpected subdomains.</li>
          </ul>
        </div>
      </article>
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
