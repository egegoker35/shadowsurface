import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getUserFromRequest(req.headers);
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('id');
    if (!scanId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.scan.delete({ where: { id: scanId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
