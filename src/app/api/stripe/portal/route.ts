import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/stripe/portal
 * Abre el Stripe Customer Portal para que el usuario gestione su suscripción.
 * Body: { user_id: string }
 * Devuelve: { url: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { user_id } = await req.json() as { user_id: string };
    if (!user_id) {
      return NextResponse.json({ error: 'Falta user_id' }, { status: 400 });
    }

    const { data: user } = await supabaseAdmin
      .from('marketplace_users')
      .select('stripe_customer_id, user_type')
      .eq('id', user_id)
      .single();

    if (!user?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Este usuario no tiene suscripción activa. Suscríbete primero desde /pricing.' },
        { status: 400 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3777';
    const role = user.user_type === 'brand' ? 'brand' : 'creator';

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${appUrl}/dashboard/${role}/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[stripe/portal]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
