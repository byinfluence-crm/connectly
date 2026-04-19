import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
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
