import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin, adminForbidden } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const check = isAdmin(req.headers);
    if (!check.valid) return adminForbidden();

    const { userId, plan } = await req.json();
    if (!userId || !plan) return NextResponse.json({ error: 'userId and plan required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await prisma.organization.update({ where: { id: user.orgId }, data: { plan } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[Admin Upgrade]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
