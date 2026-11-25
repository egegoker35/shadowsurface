import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdmin, adminForbidden } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Delete a lead with the admin JWT.
 *
 * The admin console used to call DELETE /api/leads, which authenticates with the
 * organization JWT and looks the caller up in the User table. The admin token has no
 * matching user row, so every delete silently failed.
 */
export async function DELETE(req: NextRequest) {
  try {
    const check = isAdmin(req.headers);
    if (!check.valid) return adminForbidden();

    const id = req.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const deleted = await prisma.lead.deleteMany({ where: { id } });
    if (deleted.count === 0) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
