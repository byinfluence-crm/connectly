import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002';

  if (!userId) {
    return NextResponse.redirect(`${appUrl}/dashboard/creator/payouts?error=missing_user`);
  }

  try {
    const { data: mu } = await supabaseAdmin
      .from('marketplace_users')
      .select('stripe_connect_id')
      .eq('id', userId)
      .single();

    if (mu?.stripe_connect_id) {
      const account = await stripe.accounts.retrieve(mu.stripe_connect_id);
      if (account.details_submitted) {
        await supabaseAdmin
          .from('marketplace_users')
          .update({ stripe_connect_onboarded: true })
          .eq('id', userId);
      }
    }
  } catch (err) {
    console.error('[connect/return]', err);
  }

  return NextResponse.redirect(`${appUrl}/dashboard/creator/payouts?onboarded=true`);
}
