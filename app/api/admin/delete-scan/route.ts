import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function isAdmin(headers: Headers): boolean {
  const auth = headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  const decoded = verifyToken<{ userId: string; email: string; role?: string }>(token);
  return decoded ? decoded.role === 'admin' || decoded.email === 'egegoker35@gmail.com' : false;
}

export async function DELETE(req: NextRequest) {
  try {
    if (!isAdmin(req.headers)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const scanId = searchParams.get('id');
    if (!scanId) return NextResponse.json({ error: 'id required' }, { status: 400 });

    await prisma.scan.delete({ where: { id: scanId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
