import Iyzipay from 'iyzipay';

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
});

const PLAN_PRICES: Record<string, { price: string; name: string }> = {
  starter: { price: '99.00', name: 'ShadowSurface Starter' },
  professional: { price: '499.00', name: 'ShadowSurface Professional' },
  enterprise: { price: '1999.00', name: 'ShadowSurface Enterprise' },
};

export { iyzipay, PLAN_PRICES };
