export async function register() {
  // Next compiles instrumentation for every runtime; the scheduler is Node-only.
  // The runtime check is replaced at build time, so the edge bundle drops the import.
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startScheduler } = await import('./lib/scheduler');
    startScheduler();
  }
}
