import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import pkg from '@/package.json';

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

  return NextResponse.json(
    {
      status: status === 200 ? 'ok' : 'degraded',
      version: pkg.version,
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}
