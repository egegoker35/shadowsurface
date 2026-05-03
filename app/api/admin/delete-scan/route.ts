import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin, adminForbidden } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(req: NextRequest) {
  try {
    const check = isAdmin(req.headers);
    if (!check.valid) return adminForbidden();

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('id');
    if (!scanId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.scan.delete({ where: { id: scanId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[Admin Delete Scan]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
