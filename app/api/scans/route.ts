import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimitByUser } from '@/lib/middleware/rateLimit';
import { isBlockedTarget, sanitizeTarget, hasSuspiciousInput } from '@/lib/middleware/security';
import { z } from 'zod';
import { configForPlan, VALID_SCAN_TYPES } from '@/lib/plans';
import { startScanExecution } from '@/lib/scanRunner';

const createSchema = z.object({
  target: z.string().min(3).max(512),
  scanType: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
    const plan = org?.plan || 'free';
    const config = configForPlan(plan);

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid target' }, { status: 400 });

    const rawTarget = parsed.data.target.trim();
    const scanType = (parsed.data.scanType || 'full').toLowerCase();

    if (!VALID_SCAN_TYPES.includes(scanType)) {
      return NextResponse.json({ error: 'Invalid scan type' }, { status: 400 });
    }
    if (!config.allowedTypes.includes(scanType)) {
      return NextResponse.json({ error: `${scanType} scan requires ${plan === 'starter' ? 'Professional' : 'Enterprise'} plan. Upgrade at /pricing` }, { status: 403 });
    }

    const targets = rawTarget.split(',').map((t: string) => t.trim()).filter(Boolean);
    if (targets.length > config.bulkDomains) {
      return NextResponse.json({ error: `Bulk scan limited to ${config.bulkDomains} domain(s) on ${plan} plan. Upgrade at /pricing` }, { status: 403 });
    }

    // Validate EVERY target (bulk scans must not bypass security checks on secondary domains)
    for (const t of targets) {
      if (hasSuspiciousInput(t)) return NextResponse.json({ error: 'Suspicious input' }, { status: 400 });
      const st = sanitizeTarget(t);
      if (isBlockedTarget(st)) return NextResponse.json({ error: 'Target blocked' }, { status: 403 });
    }

    const primaryTarget = targets[0];
    const target = sanitizeTarget(primaryTarget);

    // Rate limits run AFTER validation so rejected requests never consume quota.
    const hourRL = await rateLimitByUser(user.id, config.perHour, 3600);
    if (!hourRL.success) {
      return NextResponse.json({ error: `Hourly limit (${config.perHour}/hour). Upgrade at /pricing` }, { status: 429 });
    }

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthCount = await prisma.scan.count({
      where: { orgId: user.orgId, createdAt: { gte: monthAgo } },
    });
    if (monthCount >= config.perMonth) {
      return NextResponse.json({ error: `Monthly limit (${config.perMonth}/month). Upgrade at /pricing` }, { status: 429 });
    }

    const scan = await prisma.scan.create({
      data: { target: rawTarget, scanType, status: 'running', orgId: user.orgId, createdById: user.id },
    });

    startScanExecution({
      scanId: scan.id,
      target,
      scanType,
      orgId: user.orgId,
      portLimit: config.portLimit,
      targets,
    });

    return NextResponse.json({ scanId: scan.id, status: 'running', message: 'Scan started. This may take 5-30 minutes depending on target size.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Scan failed' }, { status: 500 });
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
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
