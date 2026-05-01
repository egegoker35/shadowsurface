import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { iyzipay, PLAN_PRICES } from '@/lib/iyzico';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json();
    const planData = PLAN_PRICES[plan];
    if (!planData) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });

    const appUrl = process.env.APP_URL || 'https://shadowsurface.com';

    const request = {
      locale: 'tr',
      conversationId: `${user.id}-${Date.now()}`,
      price: planData.price,
      paidPrice: planData.price,
      currency: 'TRY',
      installment: '1',
      basketId: `BASKET-${plan}-${Date.now()}`,
      paymentGroup: 'SUBSCRIPTION',
      callbackUrl: `${appUrl}/api/iyzico/callback`,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: user.id,
        name: user.email.split('@')[0],
        surname: 'User',
        gsmNumber: '+905000000000',
        email: user.email,
        identityNumber: '11111111111',
        lastLoginDate: new Date().toISOString(),
        registrationDate: user.createdAt.toISOString(),
        registrationAddress: 'Turkey',
        ip: '85.34.78.112',
        city: 'Istanbul',
        country: 'Turkey',
        zipCode: '34732',
      },
      shippingAddress: {
        contactName: user.email.split('@')[0],
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Turkey',
        zipCode: '34732',
      },
      billingAddress: {
        contactName: user.email.split('@')[0],
        city: 'Istanbul',
        country: 'Turkey',
        address: 'Turkey',
        zipCode: '34732',
      },
      basketItems: [{
        id: plan,
        name: planData.name,
        category1: 'Software',
        itemType: 'VIRTUAL',
        price: planData.price,
      }],
    };

    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutFormInitialize.create(request, (err: any, res: any) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    if (result.status === 'success') {
      return NextResponse.json({ checkoutFormContent: result.checkoutFormContent, token: result.token });
    } else {
      return NextResponse.json({ error: result.errorMessage || 'Payment initialization failed' }, { status: 500 });
    }
  } catch (e: any) {
    console.error('[Iyzico Error]', e);
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
