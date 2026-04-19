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
        const escrowId = session.metadata?.escrow_id;
        if (!escrowId) break;

        // Confirmar escrow con el payment_intent ID
        await supabaseAdmin
          .from('escrow_payments')
          .update({
            stripe_payment_id: session.payment_intent as string,
            held_at: new Date().toISOString(),
          })
          .eq('id', escrowId);

        // Obtener datos del escrow para crear factura
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
