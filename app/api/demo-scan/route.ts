import { NextRequest, NextResponse } from 'next/server';
import { runDemoScan } from '@/lib/scanner/demoScanner';
import { isBlockedTarget, sanitizeTarget, hasSuspiciousInput, abuseCheck } from '@/lib/middleware/security';
import { rateLimitByIP } from '@/lib/middleware/rateLimit';
import { z } from 'zod';

const schema = z.object({
  target: z.string().min(3).max(128).regex(/^([a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]{2,}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/),
});

export async function POST(req: NextRequest) {
  try {
    const abuse = await abuseCheck(req);
    if (abuse) return abuse;

    const rl = await rateLimitByIP(req, 1, 1800);
    if (!rl.success) {
      return NextResponse.json({ error: 'Demo scan limit: 1 per 30 minutes.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid target' }, { status: 400 });

    const rawTarget = parsed.data.target;
    if (hasSuspiciousInput(rawTarget)) return NextResponse.json({ error: 'Suspicious input' }, { status: 400 });

    const target = sanitizeTarget(rawTarget);
    if (isBlockedTarget(target)) return NextResponse.json({ error: 'Target blocked' }, { status: 403 });

    const result = await runDemoScan(target);
    return NextResponse.json({ result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Scan failed' }, { status: 500 });
  }
}
