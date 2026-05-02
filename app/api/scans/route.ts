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

// Hard timeout wrapper for scan
function runScanWithTimeout(engine: ShadowSurfaceEngine, ms = 300000, portLimit = 20): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Scan timed out after 5 minutes')), ms);
    engine.runFullScan(portLimit).then((result) => {
      clearTimeout(timer);
      resolve(result);
    }).catch((err: any) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const org = await prisma.organization.findUnique({ where: { id: user.orgId } });
    const plan = org?.plan || 'starter';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;

    const hourRL = await rateLimitByUser(user.id, limits.perHour, 3600);
    if (!hourRL.success) {
      return NextResponse.json({ error: `Hourly limit (${limits.perHour}/hour). Upgrade at /pricing` }, { status: 429 });
    }

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthCount = await prisma.scan.count({
      where: { orgId: user.orgId, createdAt: { gte: monthAgo } },
    });
    if (monthCount >= limits.perMonth) {
      return NextResponse.json({ error: `Monthly limit (${limits.perMonth}/month). Upgrade at /pricing` }, { status: 429 });
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

    // Run scan in background with hard timeout
    const engine = new ShadowSurfaceEngine(target);
    runScanWithTimeout(engine, 300000, 20).then(async (result: any) => {
      try {
        await prisma.scan.update({
          where: { id: scan.id },
          data: {
            status: 'completed',
            resultJson: result as any,
            executiveSummary: result.executiveSummary as any,
            statistics: result.statistics as any,
          },
        });
        if (result.assets?.length > 0) {
          await prisma.asset.createMany({
            data: result.assets.map((a: any) => ({
              scanId: scan.id,
              domain: a.subdomain || a.ip || 'unknown',
              subdomain: a.subdomain || a.ip || 'unknown',
              ip: a.ip,
              port: a.port,
              service: a.service,
              technology: a.technology,
              version: a.version,
              riskScore: a.riskScore,
              cves: a.cves,
              findings: a.findings as any,
              headers: a.headers as any,
              sslInfo: a.sslInfo as any,
              waf: a.waf,
            })),
          });
        }
        if (result.cloudAssets?.length > 0) {
          await prisma.cloudAsset.createMany({
            data: result.cloudAssets.map((c: any) => ({
              scanId: scan.id,
              provider: c.provider,
              serviceType: c.serviceType,
              resourceId: c.resourceId,
              url: c.url,
              permissions: c.permissions as any,
              misconfigurations: c.misconfigurations as any,
              riskScore: c.riskScore,
              severity: c.severity,
            })),
          });
        }
      } catch (e: any) {
        console.error('[Scan Save Error]', e);
        await prisma.scan.update({ where: { id: scan.id }, data: { status: 'failed' } });
      }
    }).catch(async (err: any) => {
      console.error('[Scan Engine Error]', err?.message || err);
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
