import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Scan-to-scan comparison ("what changed since last time").
 *
 * Recurring monitoring is only worth paying for if the customer can see the delta: new
 * assets, new findings, resolved findings and new CVEs. When no comparison id is given the
 * previous completed scan of the same target is used automatically, which is what a monthly
 * report actually needs.
 */

type AssetRow = {
  subdomain: string;
  port: number;
  riskScore: number;
  cves: string[];
  findings: unknown;
};

const assetKey = (a: AssetRow) => `${a.subdomain}:${a.port}`;
const findingsOf = (a: AssetRow) => (Array.isArray(a.findings) ? (a.findings as any[]) : []);

function averageRisk(assets: AssetRow[]): number {
  if (assets.length === 0) return 0;
  return Math.round(assets.reduce((sum, a) => sum + (a.riskScore || 0), 0) / assets.length);
}

const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const current = await prisma.scan.findFirst({
      where: { id: params.id, orgId: user.orgId },
      include: { assets: true, cloudAssets: true },
    });
    if (!current) return NextResponse.json({ error: 'Scan not found' }, { status: 404 });

    const compareId = new URL(req.url).searchParams.get('compare');
    const previous = compareId
      ? await prisma.scan.findFirst({
          where: { id: compareId, orgId: user.orgId },
          include: { assets: true, cloudAssets: true },
        })
      : await prisma.scan.findFirst({
          where: {
            orgId: user.orgId,
            target: current.target,
            id: { not: current.id },
            status: 'completed',
            createdAt: { lt: current.createdAt },
          },
          orderBy: { createdAt: 'desc' },
          include: { assets: true, cloudAssets: true },
        });

    if (!previous) {
      return NextResponse.json({
        baseline: false,
        current: { id: current.id, target: current.target, createdAt: current.createdAt },
        message: 'This is the first completed scan of this target, so there is nothing to compare against yet.',
      });
    }

    const before = previous.assets as unknown as AssetRow[];
    const after = current.assets as unknown as AssetRow[];

    const beforeByKey = new Map(before.map((a) => [assetKey(a), a]));
    const afterByKey = new Map(after.map((a) => [assetKey(a), a]));

    const newAssets = after.filter((a) => !beforeByKey.has(assetKey(a)));
    const removedAssets = before.filter((a) => !afterByKey.has(assetKey(a)));

    // Findings are matched on type + text + location. A finding that is merely re-worded must
    // not appear as "new" every month, which is what an id-based comparison would do.
    const flatten = (assets: AssetRow[]) =>
      assets.flatMap((a) =>
        findingsOf(a).map((f) => ({
          key: `${assetKey(a)}|${f.type}|${f.description}`,
          asset: a.subdomain,
          port: a.port,
          type: String(f.type || 'finding'),
          severity: String(f.severity || 'info'),
          description: String(f.description || ''),
        })),
      );

    const beforeFindings = flatten(before);
    const afterFindings = flatten(after);
    const beforeFindingKeys = new Set(beforeFindings.map((f) => f.key));
    const afterFindingKeys = new Set(afterFindings.map((f) => f.key));

    const newFindings = afterFindings.filter((f) => !beforeFindingKeys.has(f.key));
    const resolvedFindings = beforeFindings.filter((f) => !afterFindingKeys.has(f.key));

    const cvePairs = (assets: AssetRow[]) =>
      assets.flatMap((a) =>
        (a.cves || []).map((cve) => ({ key: `${assetKey(a)}|${cve}`, cve, asset: a.subdomain, port: a.port })),
      );

    const beforeCves = cvePairs(before);
    const afterCves = cvePairs(after);
    const beforeCveKeys = new Set(beforeCves.map((c) => c.key));
    const afterCveKeys = new Set(afterCves.map((c) => c.key));

    const newCves = afterCves.filter((c) => !beforeCveKeys.has(c.key));
    const resolvedCves = beforeCves.filter((c) => !afterCveKeys.has(c.key));

    const newCloud = current.cloudAssets.filter(
      (c) => !previous.cloudAssets.some((p) => p.resourceId === c.resourceId),
    );

    const sortBySeverity = <T extends { severity: string }>(list: T[]) =>
      [...list].sort((x, y) => (SEVERITY_RANK[x.severity] ?? 9) - (SEVERITY_RANK[y.severity] ?? 9));

    return NextResponse.json({
      baseline: true,
      current: { id: current.id, target: current.target, createdAt: current.createdAt, risk: averageRisk(after) },
      previous: { id: previous.id, createdAt: previous.createdAt, risk: averageRisk(before) },
      summary: {
        newAssets: newAssets.length,
        removedAssets: removedAssets.length,
        newFindings: newFindings.length,
        resolvedFindings: resolvedFindings.length,
        newCves: newCves.length,
        resolvedCves: resolvedCves.length,
        newCloud: newCloud.length,
        riskBefore: averageRisk(before),
        riskAfter: averageRisk(after),
      },
      newAssets: newAssets.map((a) => ({ subdomain: a.subdomain, port: a.port, riskScore: a.riskScore })),
      removedAssets: removedAssets.map((a) => ({ subdomain: a.subdomain, port: a.port, riskScore: a.riskScore })),
      newFindings: sortBySeverity(newFindings).slice(0, 100),
      resolvedFindings: sortBySeverity(resolvedFindings).slice(0, 100),
      newCves: newCves.slice(0, 100),
      resolvedCves: resolvedCves.slice(0, 100),
      newCloud: newCloud.map((c) => ({
        provider: c.provider,
        serviceType: c.serviceType,
        resourceId: c.resourceId,
        severity: c.severity,
      })),
    });
  } catch (e: any) {
    console.error('[Scan Diff]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
