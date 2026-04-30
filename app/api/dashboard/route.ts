import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const [scanCount, assetCount, cloudCount, recentScans, highRiskAssets] = await Promise.all([
      prisma.scan.count({ where: { orgId: user.orgId } }),
      prisma.asset.count({ where: { scan: { orgId: user.orgId } } }),
      prisma.cloudAsset.count({ where: { scan: { orgId: user.orgId } } }),
      prisma.scan.findMany({ where: { orgId: user.orgId }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, target: true, status: true, createdAt: true, executiveSummary: true } }),
      prisma.asset.findMany({ where: { scan: { orgId: user.orgId }, riskScore: { gte: 70 } }, orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);
    return NextResponse.json({ scanCount, assetCount, cloudCount, recentScans, highRiskAssets });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
