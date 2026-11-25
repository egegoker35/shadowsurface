import { NextResponse } from 'next/server';
import { runDueScheduledScans } from '@/lib/scheduledScans';

export const dynamic = 'force-dynamic';

/**
 * Manual trigger for due scheduled scans.
 *
 * The app also runs these from an in-process loop at boot, so this endpoint is
 * for external schedulers and operators. Jobs are claimed atomically, so
 * calling this concurrently with the loop cannot start a scan twice.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const incoming = req.headers.get('x-cron-secret') || new URL(req.url).searchParams.get('secret');
  if (secret && incoming !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const jobs = await runDueScheduledScans();
    return NextResponse.json({ executed: jobs.filter((j) => j.status === 'started').length, jobs });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Scheduler failed' }, { status: 500 });
  }
}
