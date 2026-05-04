import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import { getAuthenticatedUser } from '@/lib/supabase-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function requireSuperadmin(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return { ok: false as const, res: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  }
  const { data: mu } = await supabaseAdmin
    .from('marketplace_users')
    .select('user_type, stripe_customer_id')
    .eq('id', user.id)
    .single();
  if (mu?.user_type !== 'superadmin') {
    return { ok: false as const, res: NextResponse.json({ error: 'No autorizado' }, { status: 403 }) };
  }
  return { ok: true as const, userId: user.id, stripeCustomerId: mu.stripe_customer_id as string | null };
}

/** GET /api/admin/billing — estado actual de la suscripción de agencia */
export async function GET(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if (!auth.ok) return auth.res;

  try {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('status, trial_end, cancel_at_period_end, current_period_end, plan')
      .eq('user_id', auth.userId)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      subscribed: !!sub,
      status: sub?.status ?? null,
      plan: sub?.plan ?? null,
      trial_end: sub?.trial_end ?? null,
      current_period_end: sub?.current_period_end ?? null,
      cancel_at_period_end: sub?.cancel_at_period_end ?? false,
      has_customer: !!auth.stripeCustomerId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST /api/admin/billing — body: { action: 'checkout' | 'portal' } */
export async function POST(req: NextRequest) {
  const auth = await requireSuperadmin(req);
  if (!auth.ok) return auth.res;

  try {
    const { action } = await req.json() as { action: 'checkout' | 'portal' };
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://connectly-teal.vercel.app';
    const billingUrl = `${appUrl}/dashboard/admin/settings/billing`;

    if (action === 'portal') {
      if (!auth.stripeCustomerId) {
        return NextResponse.json({ error: 'Sin suscripción activa' }, { status: 400 });
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: auth.stripeCustomerId,
        return_url: billingUrl,
      });
      return NextResponse.json({ url: session.url });
    }

    // action === 'checkout'
    const priceId = process.env.STRIPE_PRICE_AGENCY;
    if (!priceId) {
      return NextResponse.json(
        { error: 'STRIPE_PRICE_AGENCY no está configurado en las variables de entorno de Vercel.' },
        { status: 500 },
      );
    }

    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(auth.userId);

    let customerId = auth.stripeCustomerId;
    if (!customerId && authUser?.email) {
      const customer = await stripe.customers.create({
        email: authUser.email,
        metadata: { connectly_user_id: auth.userId, role: 'superadmin' },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from('marketplace_users')
        .update({ stripe_customer_id: customerId })
        .eq('id', auth.userId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId ?? undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { user_id: auth.userId, plan: 'agency', role: 'superadmin' },
      },
      success_url: `${billingUrl}?success=true`,
      cancel_url: `${billingUrl}?canceled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error desconocido';
    console.error('[admin/billing POST]', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
