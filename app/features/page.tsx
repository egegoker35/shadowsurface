import Navbar from '@/components/Navbar';

const features = [
  { title: 'Subdomain Discovery', desc: 'Brute-force 300+ wordlist entries combined with Certificate Transparency logs from crt.sh to find every exposed subdomain.' },
  { title: 'Async Port Scanning', desc: 'Concurrent TCP connect scanning across 150 ports with configurable batch sizes. Fast and accurate.' },
  { title: 'Technology Fingerprinting', desc: 'Automatically detect Apache, nginx, IIS, and other server technologies from HTTP response headers.' },
  { title: 'CVE Mapping', desc: 'Match discovered software versions against known CVEs. Get immediate alerts for vulnerable components.' },
  { title: 'Cloud Misconfiguration Detection', desc: 'Scan for publicly accessible AWS S3 buckets, Google Cloud Storage, and Azure Blob containers.' },
  { title: 'Security Header Analysis', desc: 'Check for missing Strict-Transport-Security, CSP, X-Frame-Options, and other critical headers.' },
  { title: 'Risk Scoring', desc: 'Every asset gets an automated risk score from 0 to 100 based on exposed services, CVEs, and findings.' },
  { title: 'Continuous Monitoring', desc: 'Schedule recurring scans and track how your attack surface changes over time.' },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold mb-4">Everything You Need to Secure Your Perimeter</h1>
            <p className="text-slate-400 max-w-2xl mx-auto">ShadowSurface combines reconnaissance, vulnerability detection, and cloud security in one platform.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">&copy; {new Date().getFullYear()} ShadowSurface</footer>
    </div>
  );
}
