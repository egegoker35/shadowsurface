import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [userCount, scanCount, assetCount, cloudCount, recentScans] = await Promise.all([
      prisma.user.count(),
      prisma.scan.count(),
      prisma.asset.count(),
      prisma.cloudAsset.count(),
      prisma.scan.findMany({ orderBy: { createdAt: 'desc' }, take: 20, include: { org: true, createdBy: { select: { email: true } } } }),
    ]);

    return NextResponse.json({ userCount, scanCount, assetCount, cloudCount, recentScans });
  } catch (e: any) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
