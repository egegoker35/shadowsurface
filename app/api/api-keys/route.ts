import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const items = await prisma.apiKey.findMany({ where: { orgId: user.orgId }, orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ apiKeys: items.map((k) => ({ ...k, keyHash: undefined, prefix: k.keyHash.slice(0, 8) + '...' })) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { name, permissions } = body;
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });
    const key = 'ss_' + crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(key).digest('hex');
    await prisma.apiKey.create({
      data: { name, keyHash, permissions: permissions || ['scan:read','scan:create'], orgId: user.orgId },
    });
    return NextResponse.json({ apiKey: key, name });
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
    await prisma.apiKey.deleteMany({ where: { id, orgId: user.orgId } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
