import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { requireOwnUser } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/**
 * POST /api/stripe/subscribe
 * Body: { plan: 'starter' | 'pro' }
 * Crea una Stripe Checkout Session en modo subscription con trial 7 días.
 * Devuelve: { url: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { plan, user_id } = await req.json() as { plan: 'starter' | 'pro'; user_id: string };

    if (!user_id || !plan) {
      return NextResponse.json({ error: 'Faltan user_id o plan' }, { status: 400 });
    }
    if (plan !== 'starter' && plan !== 'pro') {
      return NextResponse.json({ error: 'Plan inválido' }, { status: 400 });
    }

    const auth = await requireOwnUser(req, user_id);
    if (!auth.authorized) return auth.response;

    // Leer el rol del usuario para elegir el price_id correcto
    const { data: user } = await supabaseAdmin
      .from('marketplace_users')
      .select('id, user_type, stripe_customer_id')
      .eq('id', user_id)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Resolver el price_id según rol + plan
    const priceEnvKey = user.user_type === 'brand'
      ? (plan === 'starter' ? 'STRIPE_PRICE_BRAND_STARTER' : 'STRIPE_PRICE_BRAND_PRO')
      : (plan === 'starter' ? 'STRIPE_PRICE_CREATOR_STARTER' : 'STRIPE_PRICE_CREATOR_PRO');
    const priceId = process.env[priceEnvKey];

    if (!priceId) {
      return NextResponse.json({ error: `${priceEnvKey} no configurado en el servidor` }, { status: 500 });
    }

    // Obtener email del auth.user
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(user_id);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3777';

    // Crear/reutilizar customer de Stripe
    let customerId = user.stripe_customer_id;
    if (!customerId && authUser?.email) {
      const customer = await stripe.customers.create({
        email: authUser.email,
        metadata: { connectly_user_id: user_id },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from('marketplace_users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user_id);
    }

    // Crear Checkout Session modo subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_id,
          plan,
          role: user.user_type,
        },
      },
      success_url: `${appUrl}/dashboard/${user.user_type === 'brand' ? 'brand' : 'creator'}/settings/billing?success=true`,
      cancel_url: `${appUrl}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[stripe/subscribe]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
