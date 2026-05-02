import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [scanCount, assetCount, cloudCount, highRiskAssets, scans, org] = await Promise.all([
      prisma.scan.count({ where: { orgId: user.orgId } }),
      prisma.asset.count({ where: { scan: { orgId: user.orgId } } }),
      prisma.cloudAsset.count({ where: { scan: { orgId: user.orgId } } }),
      prisma.asset.findMany({
        where: { scan: { orgId: user.orgId }, riskScore: { gte: 70 } },
        orderBy: { riskScore: 'desc' },
        take: 5,
        include: { scan: true },
      }),
      prisma.scan.findMany({ where: { orgId: user.orgId }, orderBy: { createdAt: 'desc' }, take: 10 }),
      prisma.organization.findUnique({ where: { id: user.orgId } }),
    ]);

    return NextResponse.json({ scanCount, assetCount, cloudCount, highRiskAssets, scans, plan: org?.plan || 'starter' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
