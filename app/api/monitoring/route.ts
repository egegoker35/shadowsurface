import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const scans = await prisma.scan.findMany({
      where: { orgId: user.orgId, status: 'completed' },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { assets: { take: 50 }, cloudAssets: { take: 50 } },
    });
    return NextResponse.json({ scans });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
