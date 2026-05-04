import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { requireOwnUser } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json() as { user_id: string };
    if (!user_id) return NextResponse.json({ error: 'Falta user_id' }, { status: 400 });

    const auth = await requireOwnUser(req, user_id);
    if (!auth.authorized) return auth.response;

    // Ver si ya tiene una cuenta Connect
    const { data: mu } = await supabaseAdmin
      .from('marketplace_users')
      .select('stripe_connect_id, display_name')
      .eq('id', user_id)
      .single();

    let accountId = mu?.stripe_connect_id as string | null;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'ES',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_profile: {
          mcc: '7372', // software services
          url: 'https://connectly-influence.es',
        },
        metadata: { connectly_user_id: user_id },
      });
      accountId = account.id;

      await supabaseAdmin
        .from('marketplace_users')
        .update({ stripe_connect_id: accountId })
        .eq('id', user_id);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002';
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${appUrl}/api/stripe/connect?user_id=${user_id}`,
      return_url: `${appUrl}/api/stripe/connect/return?user_id=${user_id}`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error('[stripe/connect]', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
