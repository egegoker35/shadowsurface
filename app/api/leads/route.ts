import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimitByIP } from '@/lib/middleware/rateLimit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const rl = await rateLimitByIP(ip, 5, 3600);
    if (!rl.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const { name, email, plan, message } = await req.json();
    if (!name || !email || !plan) {
      return NextResponse.json({ error: 'Name, email and plan required' }, { status: 400 });
    }
    const lead = await prisma.lead.create({
      data: { name, email: email.toLowerCase().trim(), plan, message: message || '' },
    });
    return NextResponse.json({ success: true, lead });
  } catch (e: any) {
    console.error('[Leads API Error]', e?.message || e);
    return NextResponse.json({ error: e?.message || 'Failed to save' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const adminToken = req.headers.get('x-admin-secret');
    if (adminToken !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ leads });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getUserFromRequest(req.headers);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 });
  }
}
