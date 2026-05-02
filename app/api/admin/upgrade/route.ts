import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

function isAdmin(headers: Headers): boolean {
  const auth = headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  const decoded = verifyToken<{ userId: string; email: string; role?: string }>(token);
  return decoded ? decoded.role === 'admin' || decoded.email === 'egegoker35@gmail.com' : false;
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req.headers)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { userId, plan } = await req.json();
    if (!userId || !plan) return NextResponse.json({ error: 'userId and plan required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await prisma.organization.update({ where: { id: user.orgId }, data: { plan } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
