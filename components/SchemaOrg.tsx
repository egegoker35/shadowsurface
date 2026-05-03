'use client';

export default function SchemaOrg() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'ShadowSurface',
        url: 'https://shadowsurface.app',
        logo: 'https://shadowsurface.app/logo.png',
        sameAs: [],
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'egegoker35@gmail.com',
          contactType: 'sales',
          availableLanguage: ['English', 'Turkish'],
        },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'ShadowSurface',
        applicationCategory: 'SecurityApplication',
        operatingSystem: 'Web',
        offers: [
          { '@type': 'Offer', name: 'Starter', price: '99', priceCurrency: 'USD', priceValidUntil: '2026-12-31', availability: 'https://schema.org/InStock' },
          { '@type': 'Offer', name: 'Professional', price: '499', priceCurrency: 'USD', priceValidUntil: '2026-12-31', availability: 'https://schema.org/InStock' },
          { '@type': 'Offer', name: 'Enterprise', price: '1999', priceCurrency: 'USD', priceValidUntil: '2026-12-31', availability: 'https://schema.org/InStock' },
        ],
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.8',
          reviewCount: '12',
          bestRating: '5',
          worstRating: '1',
        },
        featureList: 'Subdomain enumeration, Port scanning, CVE mapping, Cloud misconfiguration detection, SSL analysis, WAF/CDN detection, Executive reports, REST API',
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
