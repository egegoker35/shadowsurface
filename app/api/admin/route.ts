import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function isAdmin(headers: Headers): boolean {
  const auth = headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  try {
    const decoded = verifyToken<{ userId: string; email: string; role?: string }>(token);
    return decoded ? decoded.role === 'admin' || decoded.email === 'egegoker35@gmail.com' : false;
  } catch {
    return false;
  }
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

    const prices: Record<string, number> = { starter: 0, professional: 499, enterprise: 1999 };
    const totalRevenue = orgs.reduce((sum, o) => sum + (prices[o.plan] || 0), 0);

    return NextResponse.json({
      stats: { userCount, scanCount, assetCount, cloudCount, totalRevenue, mrr: totalRevenue, paidCustomers: orgs.filter((o: any) => o.plan && o.plan !== 'starter').length },
      users, scans, leads, organizations: orgs,
    });
  } catch (e: any) {
    console.error('[Admin API]', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
