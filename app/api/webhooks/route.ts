import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest, isReadOnly } from '@/lib/auth';
import { validateWebhookUrl } from '@/lib/webhookUrl';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const items = await prisma.webhook.findMany({ where: { orgId: user.orgId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ webhooks: items });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (isReadOnly(user)) return NextResponse.json({ error: 'Read-only account' }, { status: 403 });
    const body = await req.json();
    const { name, url, events, secret } = body;
    if (!name || !url) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Stored URLs are fetched by the server on every scan event, so they must point at a
    // public HTTPS endpoint. Without this check a customer could aim delivery at internal
    // services or the cloud metadata endpoint.
    const check = await validateWebhookUrl(url);
    if (!check.ok) return NextResponse.json({ error: `Invalid webhook URL: ${check.reason}` }, { status: 400 });

    const item = await prisma.webhook.create({
      data: { name, url: check.url!, events: events || ['scan.completed'], secret, orgId: user.orgId },
    });
    return NextResponse.json({ webhook: item });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    await prisma.webhook.deleteMany({ where: { id, orgId: user.orgId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
