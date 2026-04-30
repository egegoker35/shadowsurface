import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
  await prisma.user.updateMany({ where: { email: record.email }, data: { verified: true } });
  await prisma.verificationToken.delete({ where: { token } });
  return NextResponse.json({ success: true, message: 'Email verified' });
}
