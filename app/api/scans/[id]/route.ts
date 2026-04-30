import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const scan = await prisma.scan.findFirst({ where: { id: params.id, orgId: user.orgId }, include: { assets: true, cloudAssets: true } });
    if (!scan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ scan });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
