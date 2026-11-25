import { prisma } from '@/lib/prisma';
import { configForPlan, effectivePlan } from '@/lib/plans';
import { startScanExecution } from '@/lib/scanRunner';

const INTERVAL_MS: Record<string, number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

export function nextRunFor(cron: string, from: Date): Date {
  return new Date(from.getTime() + (INTERVAL_MS[cron] || INTERVAL_MS.daily));
}

export type ScheduledRunResult = {
  scheduledScanId: string;
  status: 'started' | 'skipped' | 'error';
  scanId?: string;
  nextRun?: string;
  reason?: string;
};

/**
 * Executes every scheduled scan that is due.
 *
 * Scheduling used to depend on a Vercel cron entry, but the product runs on a
 * plain Node server where vercel.json is ignored and no queue worker is
 * deployed, so due jobs were never executed. Each job is claimed with a
 * conditional update, so concurrent ticks or multiple instances cannot run the
 * same job twice, and the scan runs in-process.
 */
export async function runDueScheduledScans(limit = 10): Promise<ScheduledRunResult[]> {
  const now = new Date();
  const due = await prisma.scheduledScan.findMany({
    where: { nextRun: { lte: now }, enabled: true },
    orderBy: { nextRun: 'asc' },
    take: limit,
    include: { org: { include: { users: { orderBy: { createdAt: 'asc' }, take: 1, select: { id: true } } } } },
  });

  const results: ScheduledRunResult[] = [];

  for (const job of due) {
    const nextRun = nextRunFor(job.cron, now);
    const claim = await prisma.scheduledScan.updateMany({
      where: { id: job.id, nextRun: job.nextRun },
      data: { nextRun, lastRun: now },
    });
    if (claim.count !== 1) {
      results.push({ scheduledScanId: job.id, status: 'skipped', reason: 'claimed by another runner' });
      continue;
    }

    const config = configForPlan(effectivePlan(job.org));
    if (!config.allowedTypes.includes(job.scanType)) {
      console.warn(`[ScheduledScans] ${job.id}: ${job.scanType} scan is not included in the ${job.org?.plan} plan`);
      results.push({ scheduledScanId: job.id, status: 'skipped', reason: `scan type not included in plan`, nextRun: nextRun.toISOString() });
      continue;
    }

    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const usedThisMonth = await prisma.scan.count({ where: { orgId: job.orgId, createdAt: { gte: monthAgo } } });
    if (usedThisMonth >= config.perMonth) {
      console.warn(`[ScheduledScans] ${job.id}: monthly scan limit reached (${usedThisMonth}/${config.perMonth})`);
      results.push({ scheduledScanId: job.id, status: 'skipped', reason: 'monthly scan limit reached', nextRun: nextRun.toISOString() });
      continue;
    }

    try {
      const scan = await prisma.scan.create({
        data: {
          target: job.target,
          scanType: job.scanType,
          status: 'running',
          orgId: job.orgId,
          createdById: job.org?.users?.[0]?.id,
        },
      });
      await prisma.scheduledScan.update({ where: { id: job.id }, data: { lastScanId: scan.id } });
      startScanExecution({
        scanId: scan.id,
        target: job.target,
        scanType: job.scanType,
        orgId: job.orgId,
        portLimit: config.portLimit,
      });
      results.push({ scheduledScanId: job.id, status: 'started', scanId: scan.id, nextRun: nextRun.toISOString() });
    } catch (e: any) {
      console.error(`[ScheduledScans] Job ${job.id} failed:`, e?.message || e);
      results.push({ scheduledScanId: job.id, status: 'error', reason: String(e?.message || e), nextRun: nextRun.toISOString() });
    }
  }

  return results;
}
