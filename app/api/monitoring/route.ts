import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const scans = await prisma.scan.findMany({
      where: { orgId: user.orgId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        assets: { select: { riskScore: true } },
        _count: { select: { assets: true, cloudAssets: true } },
      },
    });
    // Totals come from _count so a large scan is never reported as its first page of assets.
    const withCounts = scans.map((s) => ({
      ...s,
      highRiskAssets: s.assets.filter((a) => (a.riskScore || 0) >= 70).length,
      assets: undefined,
    }));
    return NextResponse.json({ scans: withCounts });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
