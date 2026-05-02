import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;

const VARIANTS: Record<string, string> = {
  starter: process.env.LEMONSQUEEZY_VARIANT_STARTER || '',
  professional: process.env.LEMONSQUEEZY_VARIANT_PRO || '',
  enterprise: process.env.LEMONSQUEEZY_VARIANT_ENTERPRISE || '',
};

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req.headers);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json();
    const variantId = VARIANTS[plan];
    if (!variantId || !LEMONSQUEEZY_API_KEY || !STORE_ID) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    const appUrl = process.env.APP_URL || 'https://shadowsurface.app';

    const res = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
        'Authorization': `Bearer ${LEMONSQUEEZY_API_KEY}`,
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            checkout_options: {
              embed: false,
              media: false,
              logo: true,
            },
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id,
                plan: plan,
              },
            },
            product_options: {
              enabled_variants: [parseInt(variantId)],
              redirect_url: `${appUrl}/dashboard?payment=success`,
              receipt_link_url: `${appUrl}/dashboard`,
              receipt_button_text: 'Go to Dashboard',
            },
          },
          relationships: {
            store: {
              data: {
                type: 'stores',
                id: STORE_ID,
              },
            },
            variant: {
              data: {
                type: 'variants',
                id: variantId,
              },
            },
          },
        },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.errors?.[0]?.detail || 'Checkout failed' }, { status: 500 });
    }

    return NextResponse.json({ url: data.data.attributes.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 });
  }
}
