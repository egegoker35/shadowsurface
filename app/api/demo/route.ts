import { NextRequest, NextResponse } from 'next/server';
import { runDemoScan } from '@/lib/scanner/demoScanner';
import { rateLimitByIP } from '@/lib/middleware/rateLimit';
import { isBlockedTarget, sanitizeTarget, hasSuspiciousInput } from '@/lib/middleware/security';
import { z } from 'zod';

const schema = z.object({
  target: z.string().min(3).max(128).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]{2,}$/),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    const rl = await rateLimitByIP(ip, 3, 1800);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Demo rate limit: 3 scans per 30 minutes per IP.', reset: rl.reset },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid target domain format' }, { status: 400 });

    const rawTarget = parsed.data.target;
    if (hasSuspiciousInput(rawTarget)) return NextResponse.json({ error: 'Suspicious input detected' }, { status: 400 });

    const target = sanitizeTarget(rawTarget);
    if (isBlockedTarget(target)) return NextResponse.json({ error: 'Target blocked for security' }, { status: 403 });

    const result = await runDemoScan(target);
    return NextResponse.json({ status: 'completed', result });
  } catch (e: any) {
    console.error('[Demo API Error]', e);
    return NextResponse.json({ error: 'Scan request failed. Please try again.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const scanId = req.nextUrl.searchParams.get('scanId');
    if (!scanId) return NextResponse.json({ error: 'Missing scanId' }, { status: 400 });
    return NextResponse.json({ status: 'completed', scanId });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
