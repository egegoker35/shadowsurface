import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin, adminForbidden } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Turn domain-ownership enforcement on or off for one organization. Enabled is the
 * correct setting for client workspaces; self-service organizations can stay open.
 */
export async function POST(req: NextRequest) {
  try {
    const check = isAdmin(req.headers);
    if (!check.valid) return adminForbidden();

    const body = await req.json().catch(() => ({}));
    const orgId = String(body?.orgId || '');
    const enabled = Boolean(body?.enabled);
    if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: { requireDomainVerification: enabled },
      select: { id: true, name: true, requireDomainVerification: true },
    });
    return NextResponse.json({ organization: updated });
  } catch (e: any) {
    console.error('[Admin Toggle Verification]', e);
    return NextResponse.json({ error: e.message || 'Failed' }, { status: 500 });
  }
}
