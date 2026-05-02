import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const admin = await getUserFromRequest(req.headers);
    if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { email, plan } = await req.json();
    if (!email || !plan) return NextResponse.json({ error: 'email and plan required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      const { hashPassword } = await import('@/lib/auth');
      const tempPass = Math.random().toString(36).slice(2, 10);
      const org = await prisma.organization.create({ data: { name: email.split('@')[0], plan } });
      await prisma.user.create({ data: { email: email.toLowerCase().trim(), passwordHash: await hashPassword(tempPass), verified: true, orgId: org.id } });
    } else {
      await prisma.organization.update({ where: { id: user.orgId }, data: { plan } });
    }

    await prisma.lead.updateMany({ where: { email: email.toLowerCase().trim() }, data: { status: 'approved' } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
