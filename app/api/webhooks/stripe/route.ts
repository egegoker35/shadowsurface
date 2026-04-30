import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig = req.headers.get('stripe-signature') || '';
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
  if (event.type === 'invoice.payment_succeeded') {
    const sub = event.data.object as Stripe.Invoice;
    if (sub.subscription) {
      const stripeSub = await stripe.subscriptions.retrieve(sub.subscription as string);
      const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id;
      const org = await prisma.organization.findFirst({ where: { stripeCustomerId: customerId } });
      if (org) {
        const plan = stripeSub.items.data[0]?.price?.lookup_key || stripeSub.items.data[0]?.price?.id;
        await prisma.organization.update({ where: { id: org.id }, data: { stripeSubscriptionId: stripeSub.id, plan: plan || org.plan } });
      }
    }
  }
  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    await prisma.organization.updateMany({ where: { stripeCustomerId: customerId }, data: { plan: 'starter', stripeSubscriptionId: null } });
  }
  return NextResponse.json({ received: true });
}
