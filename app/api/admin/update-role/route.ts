import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAdmin(headers: Headers): boolean {
  const auth = headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET?.trim() || '') as any;
    return decoded.role === 'admin';
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req.headers)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { userId, role } = await req.json();
    if (!userId || !role) return NextResponse.json({ error: 'userId and role required' }, { status: 400 });
    if (!['user', 'admin'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    await prisma.user.update({ where: { id: userId }, data: { role } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
