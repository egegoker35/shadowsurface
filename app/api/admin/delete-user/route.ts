import { NextRequest, NextResponse } from 'next/server';
export const runtime = "nodejs";
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');
    if (!userId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await prisma.scan.deleteMany({ where: { orgId: user.orgId } });
    await prisma.user.delete({ where: { id: userId } });
    await prisma.organization.delete({ where: { id: user.orgId } });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
