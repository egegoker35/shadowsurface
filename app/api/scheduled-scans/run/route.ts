import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { publishScanJob } from '@/lib/redis';

export const dynamic = 'force-dynamic';

function getNextRun(cron: string): Date {
  const now = new Date();
  switch (cron) {
    case 'daily': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'monthly': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default: return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { scheduledScanId } = body;

    const where: any = { orgId: user.orgId };
    if (scheduledScanId) {
      where.id = scheduledScanId;
    } else {
      where.nextRun = { lte: new Date() };
    }

    const items = await prisma.scheduledScan.findMany({ where, orderBy: { nextRun: 'asc' } });
    if (items.length === 0) {
      return NextResponse.json({ triggered: 0, message: 'No scheduled scans due' });
    }

    const results = [];
    for (const item of items) {
      const scan = await prisma.scan.create({
        data: {
          target: item.target,
          scanType: item.scanType || 'full',
          status: 'running',
          orgId: item.orgId,
          createdById: user.id,
        },
      });

      await publishScanJob(scan.id, { target: item.target, isDemo: false });

      const nextRun = getNextRun(item.cron || 'daily');
      await prisma.scheduledScan.update({
        where: { id: item.id },
        data: { nextRun, lastRun: new Date() },
      });

      results.push({ scheduledScanId: item.id, scanId: scan.id, target: item.target, nextRun });
    }

    return NextResponse.json({ triggered: results.length, results });
  } catch (e: any) {
    console.error('[Scheduled Run Error]', e);
    return NextResponse.json({ error: e.message || 'Failed to run scheduled scans' }, { status: 500 });
  }
}
