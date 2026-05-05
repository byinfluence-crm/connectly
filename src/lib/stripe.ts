import Stripe from 'stripe';

// Lazy proxy — avoids module-level crash when STRIPE_SECRET_KEY is absent at build time
let _stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not configured');
    _stripe = new Stripe(key, { typescript: true });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop: string | symbol) {
    return getStripe()[prop as keyof Stripe];
  },
});

export const PLATFORM_FEE_UGC = 0.20;        // 20% UGC irretornable
export const PLATFORM_FEE_COLLAB = 0.10;     // 10% colaboración influencer
export const ESCROW_RELEASE_DAYS = 7;         // días hasta auto-liberación

export function calcFees(grossCents: number, type: 'ugc' | 'collab') {
  const rate = type === 'ugc' ? PLATFORM_FEE_UGC : PLATFORM_FEE_COLLAB;
  const feeCents = Math.round(grossCents * rate);
  return {
    gross_amount_cents: grossCents,
    platform_fee_cents: feeCents,
    net_amount_cents: grossCents - feeCents,
  };
}
