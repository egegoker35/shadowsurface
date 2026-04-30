import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { publishScanJob } from '@/lib/redis';
import { rateLimitByUser, rateLimitByIP } from '@/lib/middleware/rateLimit';
import { isBlockedTarget, sanitizeTarget, hasSuspiciousInput, abuseCheck } from '@/lib/middleware/security';
import { z } from 'zod';

const createSchema = z.object({
  target: z.string().min(3).max(128).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]{2,}$/),
});

export async function POST(req: NextRequest) {
  try {
    const abuse = await abuseCheck(req);
    if (abuse) return abuse;

    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!user.verified) {
      return NextResponse.json({ error: 'Email verification required before scanning.' }, { status: 403 });
    }

    // Rate limit: 5 scans per user per hour
    const rl = await rateLimitByUser(user.id, 5, 3600);
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 5 scans per hour.', reset: rl.reset },
        { status: 429, headers: { 'X-RateLimit-Limit': String(rl.limit), 'X-RateLimit-Remaining': String(rl.remaining), 'X-RateLimit-Reset': String(rl.reset) } }
      );
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid target domain format' }, { status: 400 });

    const rawTarget = parsed.data.target;
    if (hasSuspiciousInput(rawTarget)) {
      return NextResponse.json({ error: 'Suspicious input detected' }, { status: 400 });
    }

    const target = sanitizeTarget(rawTarget);
    if (isBlockedTarget(target)) {
      return NextResponse.json({ error: 'Target blocked for security reasons' }, { status: 403 });
    }

    const scan = await prisma.scan.create({
      data: { target, status: 'pending', orgId: user.orgId, createdById: user.id },
    });

    await publishScanJob(scan.id, { target, orgId: user.orgId, userId: user.id });
    return NextResponse.json({ scan });
  } catch (e: any) {
    console.error('[Scan API Error]', e);
    return NextResponse.json({ error: 'Failed to start scan. Please try again.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const scans = await prisma.scan.findMany({
      where: { orgId: user.orgId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json({ scans });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
