import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

const INTERVAL_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

function getNextRun(cron: string, from: Date): Date {
  const base = INTERVAL_MS[cron] || INTERVAL_MS.daily;
  return new Date(from.getTime() + base);
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const incoming = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  if (secret && incoming !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const dueJobs = await prisma.scheduledScan.findMany({
    where: { nextRun: { lte: now }, enabled: true },
    orderBy: { nextRun: 'asc' },
  });

  const executed: any[] = [];
  for (const job of dueJobs) {
    try {
      const scan = await prisma.scan.create({
        data: {
          target: job.target,
          scanType: job.scanType,
          status: 'queued',
          orgId: job.orgId,
        },
      });

      await redis.lpush('scan:queue', JSON.stringify({
        scanId: scan.id,
        payload: { target: job.target, isDemo: false },
      }));

      const nextRun = getNextRun(job.cron, now);
      await prisma.scheduledScan.update({
        where: { id: job.id },
        data: {
          nextRun,
          lastRun: now,
          lastScanId: scan.id,
        },
      });

      executed.push({ scheduledScanId: job.id, status: 'queued', scanId: scan.id, nextRun });
    } catch (e: any) {
      console.error(`[ScheduledScans] Job ${job.id} failed:`, e.message);
      executed.push({ scheduledScanId: job.id, status: 'error', error: e.message });
    }
  }

  return NextResponse.json({ executed: executed.length, jobs: executed });
}
