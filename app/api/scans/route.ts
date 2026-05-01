import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { ShadowSurfaceEngine } from '@/lib/scanner/engine';
import { rateLimitByUser, rateLimitByIP } from '@/lib/middleware/rateLimit';
import { isBlockedTarget, sanitizeTarget, hasSuspiciousInput, abuseCheck } from '@/lib/middleware/security';
import { z } from 'zod';

const createSchema = z.object({
  target: z.string().min(3).max(128).regex(/^([a-zA-Z0-9][a-zA-Z0-9._-]*\.[a-zA-Z]{2,}|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/),
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
      data: { target, status: 'running', orgId: user.orgId, createdById: user.id },
    });

    // SENKRON SCAN - worker gerekmez
    const engine = new ShadowSurfaceEngine(target);
    const result = await engine.runFullScan(30);

    await prisma.scan.update({
      where: { id: scan.id },
      data: {
        status: 'completed',
        resultJson: result as any,
        statistics: result.statistics as any,
        executiveSummary: result.executiveSummary as any,
        durationSeconds: result.durationSeconds,
      },
    });

    if (result.assets.length > 0) {
      const assetData = result.assets.map((asset) => ({
        domain: asset.domain,
        subdomain: asset.subdomain,
        ip: asset.ip,
        port: asset.port,
        service: asset.service,
        banner: asset.banner,
        technology: asset.technology,
        version: asset.version,
        cves: asset.cves,
        riskScore: asset.riskScore,
        findings: asset.findings as any,
        headers: asset.headers as any,
        sslInfo: asset.sslInfo as any,
        waf: asset.waf,
        scanId: scan.id,
      }));
      await prisma.asset.createMany({ data: assetData });
    }

    if (result.cloudAssets.length > 0) {
      const cloudData = result.cloudAssets.map((ca) => ({
        provider: ca.provider,
        serviceType: ca.serviceType,
        resourceId: ca.resourceId,
        url: ca.url,
        permissions: ca.permissions,
        misconfigurations: ca.misconfigurations as any,
        riskScore: ca.riskScore,
        severity: ca.severity,
        scanId: scan.id,
      }));
      await prisma.cloudAsset.createMany({ data: cloudData });
    }

    return NextResponse.json({ scan: await prisma.scan.findUnique({ where: { id: scan.id } }) });
  } catch (e: any) {
    console.error('[Scan API Error]', e);
    return NextResponse.json({ error: 'Failed to run scan: ' + (e.message || 'Unknown error') }, { status: 500 });
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
