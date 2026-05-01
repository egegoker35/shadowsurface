import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-signature');
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (secret && signature) {
      const hash = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(payload);
    const eventName = event.meta?.event_name;

    if (eventName === 'order_created' || eventName === 'subscription_created') {
      const customData = event.meta?.custom_data;
      const userId = customData?.user_id;
      const plan = customData?.plan;

      if (userId && plan) {
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { org: true } });
        if (user) {
          await prisma.organization.update({
            where: { id: user.orgId },
            data: { plan },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (e: any) {
    console.error('[Lemon Squeezy Webhook]', e);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
