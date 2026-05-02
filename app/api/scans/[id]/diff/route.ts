import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const compareId = searchParams.get('compare');
    if (!compareId) return NextResponse.json({ error: 'compare id required' }, { status: 400 });

    const [scanA, scanB] = await Promise.all([
      prisma.scan.findFirst({ where: { id: params.id, orgId: user.orgId }, include: { assets: true, cloudAssets: true } }),
      prisma.scan.findFirst({ where: { id: compareId, orgId: user.orgId }, include: { assets: true, cloudAssets: true } }),
    ]);
    if (!scanA || !scanB) return NextResponse.json({ error: 'Scan not found' }, { status: 404 });

    const aKeys = new Set(scanA.assets.map((a) => `${a.subdomain}:${a.port}`));
    const bKeys = new Set(scanB.assets.map((a) => `${a.subdomain}:${a.port}`));
    const newAssets = scanB.assets.filter((a) => !aKeys.has(`${a.subdomain}:${a.port}`));
    const removedAssets = scanA.assets.filter((a) => !bKeys.has(`${a.subdomain}:${a.port}`));

    const aCves = new Set(scanA.assets.flatMap((a) => a.cves));
    const bCves = new Set(scanB.assets.flatMap((a) => a.cves));
    const newCves = Array.from(bCves).filter((c) => !aCves.has(c));

    return NextResponse.json({
      scanA: { id: scanA.id, createdAt: scanA.createdAt },
      scanB: { id: scanB.id, createdAt: scanB.createdAt },
      newAssets, removedAssets, newCves,
      newCloud: scanB.cloudAssets.filter((c) => !scanA.cloudAssets.some((a) => a.resourceId === c.resourceId)),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
