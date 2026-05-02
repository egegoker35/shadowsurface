import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { ShadowSurfaceEngine } from '@/lib/scanner/engine';
import { rateLimitByUser } from '@/lib/middleware/rateLimit';
import { isBlockedTarget, sanitizeTarget, hasSuspiciousInput } from '@/lib/middleware/security';
import { z } from 'zod';

const VALID_SCAN_TYPES = ['subdomain', 'port', 'cve', 'cloud', 'full', 'bulk'];

const PLAN_CONFIG: Record<string, { perHour: number; perMonth: number; portLimit: number; allowedTypes: string[]; bulkDomains: number }> = {
  free: { perHour: 0, perMonth: 0, portLimit: 0, allowedTypes: [], bulkDomains: 0 },
  starter: { perHour: 5, perMonth: 20, portLimit: 20, allowedTypes: ['subdomain', 'port', 'cve'], bulkDomains: 1 },
  professional: { perHour: 20, perMonth: 200, portLimit: 50, allowedTypes: ['subdomain', 'port', 'cve', 'cloud', 'full'], bulkDomains: 5 },
  enterprise: { perHour: 100, perMonth: 9999, portLimit: 100, allowedTypes: ['subdomain', 'port', 'cve', 'cloud', 'full', 'bulk'], bulkDomains: 50 },
};

const createSchema = z.object({
  target: z.string().min(3).max(512),
  scanType: z.string().optional(),
});

function runScanWithTimeout(engine: ShadowSurfaceEngine, scanType: string, ms = 1800000, portLimit = 50): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Scan timed out after 30 minutes')), ms);
    engine.runScan(scanType, portLimit).then((result) => {
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
    const plan = org?.plan || 'free';
    if (plan === 'free') {
      return NextResponse.json({ error: 'Please upgrade your plan to start scanning. Visit /pricing' }, { status: 403 });
    }
    const config = PLAN_CONFIG[plan] || PLAN_CONFIG.starter;

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

    const primaryTarget = targets[0];
    if (hasSuspiciousInput(primaryTarget)) return NextResponse.json({ error: 'Suspicious input' }, { status: 400 });

    const target = sanitizeTarget(primaryTarget);
    if (isBlockedTarget(target)) return NextResponse.json({ error: 'Target blocked' }, { status: 403 });

    const scan = await prisma.scan.create({
      data: { target: rawTarget, scanType, status: 'running', orgId: user.orgId, createdById: user.id },
    });

    const engine = new ShadowSurfaceEngine(target);
    runScanWithTimeout(engine, scanType, 1800000, config.portLimit).then(async (result: any) => {
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
      await prisma.notification.create({
        data: { userId: user.id, type: 'scan_complete', title: 'Scan Completed', message: `${target} scan finished with ${result.statistics?.highRiskCount || 0} high-risk findings.`, data: { scanId: scan.id } },
      });
    }).catch(async (err: any) => {
      console.error('[Scan Engine Error]', err?.message || err);
      await prisma.scan.update({ where: { id: scan.id }, data: { status: 'failed' } });
      await prisma.notification.create({
        data: { userId: user.id, type: 'scan_failed', title: 'Scan Failed', message: `${target} scan could not be completed. Target may be unreachable.`, data: { scanId: scan.id } },
      });
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
