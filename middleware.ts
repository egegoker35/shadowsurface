import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // Tightened CSP — removed unsafe-eval, kept unsafe-inline for Next.js client hydration
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.openai.com https://apilist.tronscanapi.com https://app.lemonsqueezy.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';");

  // Strip infrastructure-identifying headers added by hosting provider
  response.headers.delete('x-do-app-origin');
  response.headers.delete('x-do-orig-status');
  response.headers.delete('x-do-request-id');
  response.headers.delete('x-powered-by');
  response.headers.delete('server');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
