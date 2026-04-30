import { NextRequest, NextResponse } from 'next/server';
import { publishScanJob, redis } from '@/lib/redis';
import { rateLimitByIP, rateLimitByEndpoint } from '@/lib/middleware/rateLimit';
import { isBlockedTarget, sanitizeTarget, hasSuspiciousInput, abuseCheck, blockIfAbusive } from '@/lib/middleware/security';
import { randomUUID } from 'crypto';
import { z } from 'zod';

const schema = z.object({
  target: z.string().min(3).max(128).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]{2,}$/),
});

export async function POST(req: NextRequest) {
  try {
    const abuse = await abuseCheck(req);
    if (abuse) return abuse;

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // AGGRESSIVE: 1 demo scan per IP per 30 minutes
    const rl = await rateLimitByIP(ip, 1, 1800);
    if (!rl.success) {
      await blockIfAbusive(ip, 2);
      return NextResponse.json(
        { error: 'Demo rate limit: 1 scan per 30 minutes per IP.', reset: rl.reset },
        { status: 429, headers: { 'X-RateLimit-Limit': String(rl.limit), 'X-RateLimit-Remaining': String(rl.remaining), 'X-RateLimit-Reset': String(rl.reset) } }
      );
    }

    // Burst: max 3 POSTs to /api/demo per minute
    const burst = await rateLimitByEndpoint(ip, 'demo-post', 3, 60);
    if (!burst.success) {
      await blockIfAbusive(ip, 1);
      return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
    }

    // QUEUE GUARD: if queue has >5 demo jobs, reject
    const queueLen = await redis.llen('scan:queue');
    if (queueLen > 5) {
      return NextResponse.json(
        { error: 'Scanner is busy. Please try again in a few minutes.' },
        { status: 503 }
      );
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid target domain format' }, { status: 400 });

    const rawTarget = parsed.data.target;
    if (hasSuspiciousInput(rawTarget)) {
      await blockIfAbusive(ip, 1);
      return NextResponse.json({ error: 'Suspicious input detected' }, { status: 400 });
    }

    const target = sanitizeTarget(rawTarget);
    if (isBlockedTarget(target)) {
      return NextResponse.json({ error: 'Target blocked for security' }, { status: 403 });
    }

    const scanId = randomUUID();
    await publishScanJob(scanId, { target, isDemo: true });

    return NextResponse.json({
      scanId,
      status: 'pending',
      message: 'Scan queued. Poll GET /api/demo/status?scanId=',
    });
  } catch (e: any) {
    console.error('[Demo API Error]', e);
    return NextResponse.json({ error: 'Scan request failed. Please try again.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const scanId = req.nextUrl.searchParams.get('scanId');
    if (!scanId) return NextResponse.json({ error: 'Missing scanId' }, { status: 400 });

    const { getDemoResult } = await import('@/lib/redis');
    const result = await getDemoResult(scanId);
    if (result) return NextResponse.json({ status: 'completed', result });

    return NextResponse.json({ status: 'pending', scanId });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
