type Faq = { q: string; a: string };

/**
 * Emits FAQPage structured data only.
 *
 * This component used to render a second, visible FAQ block underneath the page's
 * own FAQ, which produced two FAQ sections with different answers on the same page.
 * Structured data is also required to match the content a visitor can actually see,
 * so the caller passes the same questions the page renders.
 */
export default function FAQSchema({ faqs }: { faqs: Faq[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}
