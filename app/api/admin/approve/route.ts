import { NextRequest, NextResponse } from 'next/server';
export const runtime = "nodejs";
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { email, plan } = await req.json();
    if (!email || !plan) return NextResponse.json({ error: 'email and plan required' }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      const tempPass = Math.random().toString(36).slice(2, 10);
      const org = await prisma.organization.create({ data: { name: normalizedEmail.split('@')[0], plan } });
      await prisma.user.create({ data: { email: normalizedEmail, passwordHash: await hashPassword(tempPass), verified: true, orgId: org.id } });
    } else {
      await prisma.organization.update({ where: { id: user.orgId }, data: { plan } });
    }

    await prisma.lead.updateMany({ where: { email: normalizedEmail }, data: { status: 'approved' } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
