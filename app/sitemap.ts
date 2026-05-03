import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.APP_URL || 'https://shadowsurface.app';
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/features`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/blog/what-is-attack-surface-management`, lastModified: new Date('2025-04-28'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/top-cloud-misconfigurations-2025`, lastModified: new Date('2025-04-25'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/subdomain-takeover-guide`, lastModified: new Date('2025-04-20'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/blog/cve-priority-matrix`, lastModified: new Date('2025-04-15'), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
