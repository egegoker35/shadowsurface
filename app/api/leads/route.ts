import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
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
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (token !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ leads });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
