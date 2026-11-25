import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { isAdmin, adminForbidden } from '@/lib/adminAuth';
import { nextPeriodEnd } from '@/lib/plans';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Activate a lead's plan.
 *
 * Creating an account here used to generate a random password, store only its hash and
 * return nothing, so the new customer had no way to sign in. The temporary password is
 * now generated with a CSPRNG and returned once so the operator can deliver it. A plan
 * activated from a lead also gets a real billing period instead of lasting forever.
 */
export async function POST(req: NextRequest) {
  try {
    const check = isAdmin(req.headers);
    if (!check.valid) return adminForbidden();

    const { email, plan } = await req.json();
    if (!email || !plan) return NextResponse.json({ error: 'email and plan required' }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();
    const period = { planStartedAt: new Date(), planExpiresAt: nextPeriodEnd(null) };
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    let tempPassword: string | null = null;
    if (!user) {
      tempPassword = `Ss-${crypto.randomBytes(9).toString('base64url')}`;
      const org = await prisma.organization.create({ data: { name: normalizedEmail.split('@')[0], plan, ...period } });
      await prisma.user.create({
        data: { email: normalizedEmail, passwordHash: await hashPassword(tempPassword), verified: true, orgId: org.id },
      });
    } else {
      await prisma.organization.update({ where: { id: user.orgId }, data: { plan, ...period } });
    }

    await prisma.lead.updateMany({ where: { email: normalizedEmail }, data: { status: 'approved' } });
    return NextResponse.json({ success: true, created: !user, tempPassword });
  } catch (e: any) {
    console.error('[Admin Approve]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
