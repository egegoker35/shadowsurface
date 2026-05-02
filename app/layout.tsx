import './globals.css';
import { ReactNode } from 'react';
import dynamic from 'next/dynamic';

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
    <html lang="en">
      <body className="antialiased text-white bg-slate-950">
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
