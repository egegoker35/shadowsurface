import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin, adminForbidden } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const check = isAdmin(req.headers);
    if (!check.valid) return adminForbidden();

    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role required' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (targetUser.email === 'egegoker35@gmail.com') {
      return NextResponse.json({ error: 'Protected admin role cannot be changed' }, { status: 403 });
    }

    // Roles the console may assign. Admin promotion stays disabled: the console token is
    // separate from user accounts, so 'admin' here would only create a user that still
    // cannot open the console.
    if (!['user', 'client'].includes(role)) {
      return NextResponse.json({ error: "Role must be 'user' or 'client'" }, { status: 400 });
    }

    await prisma.user.update({ where: { id: userId }, data: { role } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[Admin Update Role]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
