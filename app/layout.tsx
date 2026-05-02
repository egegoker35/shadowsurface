import './globals.css';
import { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Providers from './providers';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

export const metadata = {
  title: 'ShadowSurface - Cloud Attack Surface Intelligence Platform',
  description: 'Discover, monitor, and secure your external attack surface before attackers do.',
  keywords: ['attack surface management', 'EASM', 'cybersecurity', 'cloud security', 'subdomain enumeration', 'port scanning', 'CVE', 'cloud misconfiguration'],
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
  alternates: { canonical: 'https://shadowsurface.com' },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-white text-slate-900 dark:bg-slate-950 dark:text-white transition-colors duration-300">
        <Providers>
          {children}
          <ChatWidget />
        </Providers>
      </body>
    </html>
  );
}
