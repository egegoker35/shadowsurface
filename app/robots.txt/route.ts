import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_APP_URL || 'https://shadowsurface.app';
  return new NextResponse(
    `User-agent: *\nAllow: /\nDisallow: /dashboard\nDisallow: /api/\nSitemap: ${url}/sitemap.xml`,
    { headers: { 'Content-Type': 'text/plain' } }
  );
}
