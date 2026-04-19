import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function generateInvoiceNumber(): Promise<string> {
  const { data } = await supabaseAdmin.rpc('nextval', { seq: 'invoice_seq' });
  const seq = String(data ?? 1).padStart(4, '0');
  return `CNX-${new Date().getFullYear()}-${seq}`;
}

/**
 * Determina el plan (free/starter/pro) a partir del price_id de la suscripción.
 * Usa env vars para mapear, para que el Stripe plan_id sea configurable.
 */
function planFromPriceId(priceId: string | null | undefined): 'free' | 'starter' | 'pro' {
  if (!priceId) return 'free';
  const map: Record<string, 'starter' | 'pro'> = {
    [process.env.STRIPE_PRICE_BRAND_STARTER ?? '']: 'starter',
    [process.env.STRIPE_PRICE_BRAND_PRO ?? '']: 'pro',
    [process.env.STRIPE_PRICE_CREATOR_STARTER ?? '']: 'starter',
    [process.env.STRIPE_PRICE_CREATOR_PRO ?? '']: 'pro',
  };
  return map[priceId] ?? 'free';
}

/** Sincroniza una subscription de Stripe con nuestra tabla subscriptions + marketplace_users.plan */
async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const userId = sub.metadata?.user_id;
  if (!userId) {
    console.warn('[webhook] subscription sin user_id en metadata:', sub.id);
    return;
  }

  const item = sub.items.data[0];
  const priceId = item?.price.id;
  const plan = planFromPriceId(priceId);
  const isActive = sub.status === 'active' || sub.status === 'trialing';

  // En Stripe SDK v18+ los períodos viven en items.data[n].current_period_*
  const periodStart = item?.current_period_start ?? null;
  const periodEnd = item?.current_period_end ?? null;

  // Upsert de la fila en subscriptions
  await supabaseAdmin.from('subscriptions').upsert({
    user_id: userId,
    plan,
    stripe_subscription_id: sub.id,
    stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    stripe_price_id: priceId ?? null,
    status: sub.status as 'active' | 'past_due' | 'canceled' | 'trialing',
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
    cancel_at_period_end: sub.cancel_at_period_end ?? false,
    canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'stripe_subscription_id' });

  // Actualizar marketplace_users.plan
  const effectivePlan = isActive ? plan : 'free';
  await supabaseAdmin
    .from('marketplace_users')
    .update({ plan: effectivePlan, stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id })
    .eq('id', userId);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Sin firma' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] Firma inválida:', err);
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Modo subscription: Stripe se encarga de crear customer.subscription.created
        // Solo tenemos que verificar si existe fresh subscription y sincronizarla
        if (session.mode === 'subscription' && session.subscription) {
          const subId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await syncSubscription(sub);
          break;
        }

        // Modo payment: es un escrow de colaboración/UGC
        const escrowId = session.metadata?.escrow_id;
        if (!escrowId) break;

        await supabaseAdmin
          .from('escrow_payments')
          .update({
            stripe_payment_id: session.payment_intent as string,
            held_at: new Date().toISOString(),
          })
          .eq('id', escrowId);

        const { data: escrow } = await supabaseAdmin
          .from('escrow_payments')
          .select('*')
          .eq('id', escrowId)
          .single();

        if (escrow) {
          const invoiceNum = await generateInvoiceNumber();
          const taxAmount = Math.round(escrow.gross_amount_cents * 0.21);
          await supabaseAdmin.from('invoices').insert({
            invoice_number: invoiceNum,
            user_id: escrow.payer_user_id,
            escrow_id: escrowId,
            type: 'charge',
            amount_cents: escrow.gross_amount_cents,
            tax_rate: 21.00,
            tax_amount_cents: taxAmount,
            total_cents: escrow.gross_amount_cents + taxAmount,
          });
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await syncSubscription(sub);
        break;
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        if (account.details_submitted) {
          await supabaseAdmin
            .from('marketplace_users')
            .update({ stripe_connect_onboarded: true })
            .eq('stripe_connect_id', account.id);
        }
        break;
      }

      case 'transfer.created': {
        // Registrar referencia de transferencia cuando Stripe la crea
        const transfer = event.data.object as Stripe.Transfer;
        const escrowId = transfer.metadata?.escrow_id;
        if (escrowId) {
          await supabaseAdmin
            .from('escrow_payments')
            .update({
              transfer_reference: transfer.id,
              status: 'released',
              released_at: new Date().toISOString(),
            })
            .eq('id', escrowId);
        }
        break;
      }
    }
  } catch (err) {
    console.error('[webhook] Error procesando evento:', err);
    // No devolvemos 500 para que Stripe no reintente
  }

  return NextResponse.json({ received: true });
}
