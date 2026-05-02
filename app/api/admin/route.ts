import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

const PLAN_PRICES: Record<string, number> = {
  starter: 99,
  professional: 499,
  enterprise: 1999,
};

function isAdmin(headers: Headers): boolean {
  const auth = headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  const decoded = verifyToken<{ userId: string; email: string; role?: string }>(token);
  return decoded ? decoded.role === 'admin' || decoded.email === 'egegoker35@gmail.com' : false;
}

export async function GET(req: NextRequest) {
  try {
    if (!isAdmin(req.headers)) {
      return NextResponse.json({ error: 'Forbidden. Admin access only.' }, { status: 403 });
    }

    const [userCount, scanCount, assetCount, cloudCount, users, scans, leads, orgs] = await Promise.all([
      prisma.user.count(),
      prisma.scan.count(),
      prisma.asset.count(),
      prisma.cloudAsset.count(),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { org: true } }),
      prisma.scan.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { createdBy: true, org: true, assets: true, cloudAssets: true } }),
      prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
      prisma.organization.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);

    const paidOrgs = orgs.filter(o => PLAN_PRICES[o.plan]);
    const totalRevenue = paidOrgs.reduce((sum, o) => sum + (PLAN_PRICES[o.plan] || 0), 0);
    const mrr = totalRevenue;

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
