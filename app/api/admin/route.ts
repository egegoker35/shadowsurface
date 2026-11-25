import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin, adminForbidden } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PAGE_SIZE = 25;

function paging(req: NextRequest) {
  const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') || 1) || 1);
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  return { page, q, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
}

function pageCount(total: number) {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

/**
 * Admin data endpoint.
 *
 * Each section is fetched on its own so the UI can paginate and search, and every total
 * comes from a count query rather than the length of the array being displayed. The
 * previous version returned ten rows per table and the UI labelled them "All Users".
 */
export async function GET(req: NextRequest) {
  try {
    const check = isAdmin(req.headers);
    if (!check.valid) return adminForbidden();

    const section = req.nextUrl.searchParams.get('section') || 'overview';
    const { page, q, skip, take } = paging(req);
    const now = new Date();
    const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Full detail for one scan, loaded only when the console opens a row. The list
    // query stays light; assets and their findings are far too large for a page of rows.
    if (section === 'scan') {
      const id = req.nextUrl.searchParams.get('id');
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
      const scan = await prisma.scan.findUnique({
        where: { id },
        include: {
          assets: true,
          cloudAssets: true,
          createdBy: { select: { email: true } },
          org: { select: { plan: true } },
        },
      });
      if (!scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
      return NextResponse.json({ scan });
    }

    if (section === 'users') {
      const where = q ? { email: { contains: q, mode: 'insensitive' as const } } : {};
      const [rows, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          select: {
            id: true,
            email: true,
            createdAt: true,
            role: true,
            verified: true,
            org: { select: { plan: true, planExpiresAt: true, planStartedAt: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);
      return NextResponse.json({ users: rows, total, page, pages: pageCount(total), pageSize: take });
    }

    if (section === 'scans') {
      const status = req.nextUrl.searchParams.get('status') || '';
      const where: any = {};
      if (q) where.OR = [{ target: { contains: q, mode: 'insensitive' } }];
      if (status) where.status = status;
      const [rows, total] = await Promise.all([
        prisma.scan.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take,
          select: {
            id: true,
            target: true,
            status: true,
            scanType: true,
            createdAt: true,
            durationSeconds: true,
            executiveSummary: true,
            org: { select: { plan: true } },
            createdBy: { select: { email: true } },
          },
        }),
        prisma.scan.count({ where }),
      ]);
      return NextResponse.json({ scans: rows, total, page, pages: pageCount(total), pageSize: take });
    }

    if (section === 'leads') {
      const where = q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' as const } },
              { name: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {};
      const [rows, total] = await Promise.all([
        prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma.lead.count({ where }),
      ]);
      return NextResponse.json({ leads: rows, total, page, pages: pageCount(total), pageSize: take });
    }

    if (section === 'payments') {
      const where = q
        ? {
            OR: [
              { email: { contains: q, mode: 'insensitive' as const } },
              { txHash: { contains: q } },
            ],
          }
        : {};
      const [rows, total] = await Promise.all([
        prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
        prisma.payment.count({ where }),
      ]);
      return NextResponse.json({ payments: rows, total, page, pages: pageCount(total), pageSize: take });
    }

    if (section === 'revenue') {
      const [byMonth, byPlan, lifetime] = await Promise.all([
        prisma.$queryRaw<Array<{ month: string; amount: number; count: number }>>`
          SELECT to_char(date_trunc('month', "createdAt"), 'YYYY-MM') AS month,
                 SUM(amount)::float AS amount,
                 COUNT(*)::int AS count
          FROM "Payment"
          GROUP BY 1
          ORDER BY 1 DESC
          LIMIT 12
        `,
        prisma.payment.groupBy({ by: ['plan'], _sum: { amount: true }, _count: { _all: true } }),
        prisma.payment.aggregate({ _sum: { amount: true }, _count: { _all: true } }),
      ]);
      return NextResponse.json({
        byMonth,
        byPlan: byPlan.map((p) => ({ plan: p.plan, amount: p._sum.amount || 0, count: p._count._all })),
        lifetime: { amount: lifetime._sum.amount || 0, count: lifetime._count._all },
      });
    }

    // ── overview ─────────────────────────────────────────────────────────
    const [
      users,
      scans,
      payments,
      leads,
      pendingLeads,
      activeScheduled,
      usersByPlan,
      scansByStatus,
      recentScans,
      revenueAgg,
      revenue30d,
      riskRows,
      scans30d,
      expiredPaid,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.scan.count(),
      prisma.payment.count(),
      prisma.lead.count(),
      prisma.lead.count({ where: { status: { in: ['new', 'pending'] } } }),
      prisma.scheduledScan.count({ where: { enabled: true } }),
      prisma.organization.groupBy({ by: ['plan'], _count: { _all: true } }),
      prisma.scan.groupBy({ by: ['status'], _count: { _all: true }, where: { createdAt: { gte: d30 } } }),
      prisma.scan.findMany({
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          target: true,
          status: true,
          scanType: true,
          createdAt: true,
          executiveSummary: true,
          org: { select: { plan: true } },
          createdBy: { select: { email: true } },
        },
      }),
      prisma.payment.aggregate({ _sum: { amount: true } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        _count: { _all: true },
        where: { createdAt: { gte: d30 } },
      }),
      prisma.$queryRaw<Array<{ risk: string; n: number }>>`
        SELECT COALESCE("executiveSummary"->>'overallRisk', 'UNKNOWN') AS risk, COUNT(*)::int AS n
        FROM "Scan"
        WHERE status = 'completed' AND "createdAt" >= ${d30}
        GROUP BY 1
      `,
      prisma.scan.count({ where: { createdAt: { gte: d30 } } }),
      prisma.organization.count({ where: { plan: { not: 'free' }, planExpiresAt: { lt: now } } }),
    ]);

    return NextResponse.json({
      totals: {
        users,
        scans,
        scans30d,
        payments,
        leads,
        pendingLeads,
        activeScheduled,
        revenue: revenueAgg._sum.amount || 0,
        revenue30d: revenue30d._sum.amount || 0,
        payments30d: revenue30d._count._all,
        expiredPaid,
      },
      usersByPlan: usersByPlan.map((u) => ({ plan: u.plan, count: u._count._all })),
      scansByStatus: scansByStatus.map((s) => ({ status: s.status, count: s._count._all })),
      risk30d: riskRows.reduce((acc, r) => ({ ...acc, [r.risk]: r.n }), {} as Record<string, number>),
      recentScans,
    });
  } catch (e: any) {
    console.error('[Admin API]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
