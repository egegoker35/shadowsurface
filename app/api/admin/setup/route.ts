import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } });
    return NextResponse.json({ success: true, message: 'You are now admin. Refresh the page.' });
  } catch (e: any) {
    console.error('[Admin Setup]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
