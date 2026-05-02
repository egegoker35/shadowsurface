import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const items = await prisma.notification.findMany({
      where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50,
    });
    const unread = await prisma.notification.count({ where: { userId: user.id, read: false } });
    return NextResponse.json({ notifications: items, unread });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { id } = body;
    if (id === 'all') {
      await prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } });
    } else if (id) {
      await prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
