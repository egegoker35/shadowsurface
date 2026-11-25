'use client';

/**
 * Organization structured data only.
 *
 * This component previously emitted a second SoftwareApplication block carrying an
 * aggregateRating of 4.8 from 12 reviews. There are no reviews, and fabricated rating
 * markup violates search-engine structured-data policy. The SoftwareApplication block
 * in the root layout is the single source for product data, so this stays limited to
 * the organization itself.
 */
export default function SchemaOrg() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'ShadowSurface',
        url: 'https://shadowsurface.app',
        logo: 'https://shadowsurface.app/logo.svg',
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'egegoker35@gmail.com',
          contactType: 'sales',
          availableLanguage: ['English', 'Turkish'],
        },
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
