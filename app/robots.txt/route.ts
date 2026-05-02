import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://shadowsurface.com';
  return new NextResponse(
    `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /dashboard\nDisallow: /api/\nSitemap: ${url}/sitemap.xml`,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}
