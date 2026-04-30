import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};
  let status = 200;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (e: any) {
    checks.database = `error: ${e.message}`;
    status = 503;
  }

  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch (e: any) {
    checks.redis = `error: ${e.message}`;
    status = 503;
  }

  // Check worker queue length (alert if > 50)
  try {
    const queueLen = await redis.llen('scan:queue');
    checks.queue = queueLen > 50 ? `warning: ${queueLen} jobs backlog` : `ok: ${queueLen} pending`;
    if (queueLen > 100) status = 503;
  } catch {
    checks.queue = 'unknown';
  }

  return NextResponse.json(
    {
      status: status === 200 ? 'ok' : 'degraded',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}
