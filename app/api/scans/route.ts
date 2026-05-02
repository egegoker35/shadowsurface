import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { ShadowSurfaceEngine } from '@/lib/scanner/engine';
import { rateLimitByUser } from '@/lib/middleware/rateLimit';
import { isBlockedTarget, sanitizeTarget, hasSuspiciousInput } from '@/lib/middleware/security';
import { z } from 'zod';

const createSchema = z.object({
  target: z.string().min(3).max(128).regex(/^([a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]{2,}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/),
});

const PLAN_LIMITS: Record<string, { perHour: number; perMonth: number }> = {
  starter: { perHour: 5, perMonth: 20 },
  professional: { perHour: 20, perMonth: 200 },
  enterprise: { perHour: 100, perMonth: 9999 },
};

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
    const plan = org?.plan || 'starter';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;

    // Hourly limit
    const hourRL = await rateLimitByUser(user.id, limits.perHour, 3600);
    if (!hourRL.success) {
      return NextResponse.json(
        { error: `Hourly limit (${limits.perHour}/hour). Upgrade at /pricing` },
        { status: 429 }
      );
    }

    // Monthly limit
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthCount = await prisma.scan.count({
      where: { orgId: user.orgId, createdAt: { gte: monthAgo } },
    });
    if (monthCount >= limits.perMonth) {
      return NextResponse.json(
        { error: `Monthly limit (${limits.perMonth}/month). Upgrade at /pricing` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid target' }, { status: 400 });

    const rawTarget = parsed.data.target;
    if (hasSuspiciousInput(rawTarget)) return NextResponse.json({ error: 'Suspicious input' }, { status: 400 });

    const target = sanitizeTarget(rawTarget);
    if (isBlockedTarget(target)) return NextResponse.json({ error: 'Target blocked' }, { status: 403 });

    const scan = await prisma.scan.create({
      data: { target, status: 'running', orgId: user.orgId, createdById: user.id },
    });

    const engine = new ShadowSurfaceEngine(target);
    engine.runFullScan(80).then(async (result) => {
      try {
        await prisma.scan.update({
          where: { id: scan.id },
          data: {
            status: 'completed',
            resultJson: JSON.parse(JSON.stringify(result)),
            executiveSummary: result.executiveSummary,
            statistics: result.statistics,
          },
        });
        if (result.assets.length > 0) {
          await prisma.asset.createMany({
            data: result.assets.map((a) => ({
              scanId: scan.id,
              ip: a.ip,
              port: a.port,
              service: a.service,
              technology: a.technology,
              version: a.version,
              riskScore: a.riskScore,
              cves: a.cves,
              findings: a.findings,
              headers: a.headers,
              sslInfo: a.sslInfo,
              waf: a.waf,
            })),
          });
        }
        if (result.cloudAssets.length > 0) {
          await prisma.cloudAsset.createMany({
            data: result.cloudAssets.map((c) => ({
              scanId: scan.id,
              provider: c.provider,
              serviceType: c.serviceType,
              resourceId: c.resourceId,
              url: c.url,
              permissions: c.permissions,
              misconfigurations: c.misconfigurations,
              riskScore: c.riskScore,
              severity: c.severity,
            })),
          });
        }
      } catch {
        await prisma.scan.update({ where: { id: scan.id }, data: { status: 'failed' } });
      }
    }).catch(async () => {
      await prisma.scan.update({ where: { id: scan.id }, data: { status: 'failed' } });
    });

    return NextResponse.json({ scanId: scan.id, status: 'running' });
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
