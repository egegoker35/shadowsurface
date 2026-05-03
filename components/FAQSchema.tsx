'use client';

const faqs = [
  { question: 'What is ShadowSurface?', answer: 'ShadowSurface is a Cloud Attack Surface Intelligence (EASM) platform that discovers subdomains, open ports, CVEs, cloud misconfigurations, and SSL issues across your external infrastructure.' },
  { question: 'How does the demo scan work?', answer: 'You can run a free demo scan on any domain without signing up. It performs subdomain enumeration, port scanning, and basic header analysis with results shown instantly.' },
  { question: 'What scan types are available?', answer: 'Subdomain Only, Port Scan, CVE Check, Cloud Scan (S3/GCS/Azure), Full Scan, and Bulk Scan (Enterprise). Each plan unlocks different scan capabilities.' },
  { question: 'Is payment only via crypto?', answer: 'Currently we accept USDT (TRC20) payments with automatic verification via TronScan API. Payment is processed instantly after blockchain confirmation.' },
  { question: 'Can I cancel my subscription?', answer: 'Since we use crypto payments, there are no recurring subscriptions. Each payment is a one-time monthly upgrade that you can renew or let expire.' },
  { question: 'Is scanning intrusive or exploitative?', answer: 'No. ShadowSurface only performs reconnaissance-level scanning: DNS enumeration, TCP connect scans, HTTP header analysis, and public cloud bucket checks. We never exploit vulnerabilities.' },
];

export default function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <section className="py-20 border-t border-slate-800/50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((f, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-2">{f.question}</h3>
                <p className="text-slate-400 text-sm">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
