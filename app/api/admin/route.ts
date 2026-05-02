import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const PLAN_PRICES: Record<string, number> = {
  starter: 99,
  professional: 499,
  enterprise: 1999,
};

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden. Admin access only.' }, { status: 403 });
    }

    const [userCount, scanCount, assetCount, cloudCount, users, scans, leads, orgs] = await Promise.all([
      prisma.user.count(),
      prisma.scan.count(),
      prisma.asset.count(),
      prisma.cloudAsset.count(),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { org: true } }),
      prisma.scan.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { createdBy: true, org: true } }),
      prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.organization.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);

    // Calculate revenue from paid orgs
    const paidOrgs = orgs.filter(o => PLAN_PRICES[o.plan]);
    const totalRevenue = paidOrgs.reduce((sum, o) => sum + (PLAN_PRICES[o.plan] || 0), 0);
    const mrr = totalRevenue; // Monthly recurring

    return NextResponse.json({
      stats: { userCount, scanCount, assetCount, cloudCount, totalRevenue, mrr, paidCustomers: paidOrgs.length },
      users,
      scans,
      leads,
      organizations: orgs,
    });
  } catch (e: any) {
    console.error('[Admin API]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
