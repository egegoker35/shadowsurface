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

    // Step 1: Test simple queries
    let userCount = 0;
    try { userCount = await prisma.user.count(); } catch (e: any) { return NextResponse.json({ error: 'Prisma user.count failed: ' + e.message }, { status: 500 }); }

    let scanCount = 0;
    try { scanCount = await prisma.scan.count(); } catch (e: any) { return NextResponse.json({ error: 'Prisma scan.count failed: ' + e.message }, { status: 500 }); }

    let users: any[] = [];
    try { users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { org: true } }); } catch (e: any) { return NextResponse.json({ error: 'Prisma user.findMany failed: ' + e.message }, { status: 500 }); }

    let scans: any[] = [];
    try { scans = await prisma.scan.findMany({ orderBy: { createdAt: 'desc' }, take: 10, include: { createdBy: true, org: true } }); } catch (e: any) { return NextResponse.json({ error: 'Prisma scan.findMany failed: ' + e.message }, { status: 500 }); }

    let leads: any[] = [];
    try { leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }); } catch (e: any) { return NextResponse.json({ error: 'Prisma lead.findMany failed: ' + e.message }, { status: 500 }); }

    let orgs: any[] = [];
    try { orgs = await prisma.organization.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }); } catch (e: any) { return NextResponse.json({ error: 'Prisma org.findMany failed: ' + e.message }, { status: 500 }); }

    const totalRevenue = orgs.filter((o: any) => o.plan && o.plan !== 'starter').reduce((sum: number, o: any) => {
      const prices: Record<string, number> = { starter: 0, professional: 499, enterprise: 1999 };
      return sum + (prices[o.plan] || 0);
    }, 0);

    return NextResponse.json({
      stats: { userCount, scanCount, totalRevenue, mrr: totalRevenue, paidCustomers: orgs.filter((o: any) => o.plan && o.plan !== 'starter').length },
      users, scans, leads, organizations: orgs,
    });
  } catch (e: any) {
    console.error('[Admin API Fatal]', e);
    return NextResponse.json({ error: 'Fatal: ' + (e.message || 'Unknown') }, { status: 500 });
  }
}
