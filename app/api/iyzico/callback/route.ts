import { NextRequest, NextResponse } from 'next/server';
import { iyzipay } from '@/lib/iyzico';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get('token') as string;

    if (!token) {
      return NextResponse.redirect(new URL('/dashboard?payment=failed', req.url));
    }

    const result = await new Promise<any>((resolve, reject) => {
      iyzipay.checkoutForm.retrieve({ token }, (err: any, res: any) => {
        if (err) reject(err);
        else resolve(res);
      });
    });

    if (result.status === 'success' && result.paymentStatus === 'SUCCESS') {
      const conversationId = result.conversationId as string;
      const userId = conversationId.split('-')[0];

      await prisma.user.update({
        where: { id: userId },
        data: {
          org: {
            update: {
              plan: 'paid',
              stripeSubscriptionId: `iyzico_${result.paymentId}`,
            },
          },
        },
      });

      return NextResponse.redirect(new URL('/dashboard?payment=success', req.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard?payment=failed', req.url));
    }
  } catch (e: any) {
    console.error('[Iyzico Callback Error]', e);
    return NextResponse.redirect(new URL('/dashboard?payment=error', req.url));
  }
}
