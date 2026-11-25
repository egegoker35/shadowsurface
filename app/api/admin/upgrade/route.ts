import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin, adminForbidden } from '@/lib/adminAuth';
import { nextPeriodEnd } from '@/lib/plans';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Set a user's plan. Paid plans get one billing period from now, or extend an active one. */
export async function POST(req: NextRequest) {
  try {
    const check = isAdmin(req.headers);
    if (!check.valid) return adminForbidden();

    const { userId, plan } = await req.json();
    if (!userId || !plan) return NextResponse.json({ error: 'userId and plan required' }, { status: 400 });
    if (!['free', 'starter', 'professional', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { orgId: true, org: { select: { plan: true, planExpiresAt: true } } },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const samePlanRenewal = user.org?.plan === plan && !!user.org?.planExpiresAt;
    const planExpiresAt = plan === 'free' ? null : nextPeriodEnd(samePlanRenewal ? user.org!.planExpiresAt : null);
    const planStartedAt = plan === 'free' ? null : samePlanRenewal ? undefined : new Date();

    await prisma.organization.update({
      where: { id: user.orgId },
      data: { plan, planExpiresAt, ...(planStartedAt ? { planStartedAt } : {}) },
    });

    return NextResponse.json({ success: true, plan, planExpiresAt });
  } catch (e: any) {
    console.error('[Admin Upgrade]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
