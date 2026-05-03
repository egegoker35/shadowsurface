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

    // Only allow demotion: admin -> user
    // Promotion to admin is completely disabled per user directive
    if (role !== 'user') {
      return NextResponse.json({ error: 'Only demotion to user is allowed. Admin promotion is disabled.' }, { status: 403 });
    }
    if (targetUser.role !== 'admin') {
      return NextResponse.json({ error: 'User is not an admin' }, { status: 400 });
    }

    await prisma.user.update({ where: { id: userId }, data: { role } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[Admin Update Role]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
