import './globals.css';
import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Providers from './providers';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

export const metadata = {
  title: 'ShadowSurface - Cloud Attack Surface Intelligence Platform',
  description: 'Discover, monitor, and secure your external attack surface before attackers do. Continuous subdomain discovery, port scanning, CVE mapping, and cloud misconfiguration detection.',
  keywords: ['attack surface management', 'EASM', 'cybersecurity', 'cloud security', 'subdomain enumeration', 'port scanning', 'CVE', 'cloud misconfiguration'],
  authors: [{ name: 'ShadowSurface' }],
  openGraph: {
    title: 'ShadowSurface - Cloud Attack Surface Intelligence',
    description: 'Know your attack surface before attackers do.',
    type: 'website',
    url: 'https://shadowsurface.com',
    siteName: 'ShadowSurface',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShadowSurface - Cloud Attack Surface Intelligence',
    description: 'Know your attack surface before attackers do.',
  },
  alternates: {
    canonical: 'https://shadowsurface.com',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'ShadowSurface',
              applicationCategory: 'SecurityApplication',
              description: 'Cloud Attack Surface Intelligence Platform for discovering and monitoring external infrastructure.',
              operatingSystem: 'Web',
              offers: [
                { '@type': 'Offer', price: '99.00', priceCurrency: 'USD', name: 'Starter' },
                { '@type': 'Offer', price: '499.00', priceCurrency: 'USD', name: 'Professional' },
                { '@type': 'Offer', price: '1999.00', priceCurrency: 'USD', name: 'Enterprise' },
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '127',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased text-white bg-slate-950 dark:text-white dark:bg-slate-950 light:text-slate-900 light:bg-white transition-colors duration-300">
        <Providers>
          {children}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
