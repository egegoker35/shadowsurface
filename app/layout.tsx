import './globals.css';
import { ReactNode } from 'react';
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google';

// Typography is part of the product: without an explicit family every visitor gets their
// browser default (serif on Windows), which is why the site rendered differently per machine.
// next/font self-hosts these at build time, so there is no runtime request to Google.
// Three roles: Inter for UI, JetBrains Mono for machine-generated values, Newsreader for
// display headings so the marketing surface reads like a published report.
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });
const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata = {
  title: 'ShadowSurface - Cloud Attack Surface Intelligence Platform',
  description: 'Discover, monitor, and secure your external attack surface with automated subdomain enumeration, port scanning, CVE mapping, and cloud misconfiguration detection.',
  keywords: ['attack surface management', 'EASM', 'cybersecurity', 'cloud security', 'subdomain enumeration', 'port scanning', 'CVE', 'cloud misconfiguration', 'vulnerability scanner', 'external attack surface'],
  authors: [{ name: 'ShadowSurface' }],
  creator: 'ShadowSurface',
  publisher: 'ShadowSurface',
  metadataBase: new URL('https://shadowsurface.app'),
  openGraph: {
    title: 'ShadowSurface - Cloud Attack Surface Intelligence',
    description: 'Discover, monitor, and secure your external attack surface before attackers do. Automated subdomain, port, CVE, and cloud scanning.',
    type: 'website',
    url: 'https://shadowsurface.app',
    siteName: 'ShadowSurface',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShadowSurface - Cloud Attack Surface Intelligence',
    description: 'Discover, monitor, and secure your external attack surface before attackers do.',
  },
  alternates: { canonical: 'https://shadowsurface.app' },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'ShadowSurface',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'Web',
  offers: [
    { '@type': 'Offer', price: '99', priceCurrency: 'USD', priceValidUntil: '2026-12-31', name: 'Starter Plan' },
    { '@type': 'Offer', price: '499', priceCurrency: 'USD', priceValidUntil: '2026-12-31', name: 'Professional Plan' },
    { '@type': 'Offer', price: '1999', priceCurrency: 'USD', priceValidUntil: '2026-12-31', name: 'Enterprise Plan' },
  ],
  description: 'Cloud Attack Surface Intelligence platform with automated subdomain enumeration, port scanning, CVE mapping, and cloud misconfiguration detection.',
  url: 'https://shadowsurface.app',
  logo: 'https://shadowsurface.app/logo.svg',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${sans.variable} ${mono.variable} ${serif.variable} font-sans antialiased text-cream bg-ink`}>
        {children}
      </body>
    </html>
  );
}
