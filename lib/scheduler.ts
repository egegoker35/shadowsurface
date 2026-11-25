const TICK_MS = 60 * 1000;
const FIRST_TICK_MS = 20 * 1000;

let started = false;

/**
 * Starts the in-process scheduled-scan loop.
 *
 * There is no queue worker and no Vercel cron on this deployment, so nothing
 * else would ever execute a due scheduled scan. The loop is idempotent: each
 * job is claimed with a conditional update, so extra instances or a second
 * boot cannot run a job twice.
 */
export function startScheduler(): void {
  if (started) return;
  if (process.env.DISABLE_SCHEDULER === '1') return;
  started = true;

  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const { runDueScheduledScans } = await import('./scheduledScans');
      const results = await runDueScheduledScans();
      const startedCount = results.filter((r) => r.status === 'started').length;
      if (results.length > 0) {
        console.log(`[Scheduler] due=${results.length} started=${startedCount}`);
      }
    } catch (e: any) {
      console.error('[Scheduler] tick failed:', e?.message || e);
    } finally {
      running = false;
    }
  };

  setTimeout(tick, FIRST_TICK_MS).unref?.();
  setInterval(tick, TICK_MS).unref?.();
  console.log('[Scheduler] scheduled-scan loop started');
}
