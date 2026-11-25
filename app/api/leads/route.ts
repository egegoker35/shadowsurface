import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { rateLimitByIP } from '@/lib/middleware/rateLimit';
import { clientIp } from '@/lib/middleware/security';

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);
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
