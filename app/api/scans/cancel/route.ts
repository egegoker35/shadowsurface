import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('id');
    if (!scanId) return NextResponse.json({ error: 'Missing scan id' }, { status: 400 });

    const scan = await prisma.scan.findFirst({
      where: { id: scanId, orgId: user.orgId },
    });
    if (!scan) return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
    if (scan.status !== 'running' && scan.status !== 'pending') {
      return NextResponse.json({ error: 'Scan is not active' }, { status: 400 });
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'cancelled' },
    });

    return NextResponse.json({ success: true, message: 'Scan cancelled' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
