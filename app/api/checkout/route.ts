import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { stripe, STRIPE_PLANS } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { plan } = await req.json();
    const priceId = STRIPE_PLANS[plan];
    if (!priceId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    let customerId = user.org.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, name: user.org.name });
      customerId = customer.id;
      const { prisma } = await import('@/lib/prisma');
      await prisma.organization.update({ where: { id: user.orgId }, data: { stripeCustomerId: customerId } });
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/dashboard?success=1`,
      cancel_url: `${process.env.APP_URL}/dashboard?canceled=1`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
