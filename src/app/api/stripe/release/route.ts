import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stripe, ESCROW_RELEASE_DAYS } from '@/lib/stripe';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Llamado por Vercel Cron (GET) o manualmente por admin (POST con escrow_id)
export async function GET(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  return releaseEligible();
}

export async function POST(req: NextRequest) {
  const cronSecret = req.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { escrow_id } = await req.json() as { escrow_id?: string };
  if (escrow_id) return releaseSingle(escrow_id);
  return releaseEligible();
}

async function releaseEligible() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - ESCROW_RELEASE_DAYS);

  const { data: escrows } = await supabaseAdmin
    .from('escrow_payments')
    .select('id, payee_user_id, net_amount_cents')
    .eq('status', 'held')
    .not('stripe_payment_id', 'is', null)
    .lt('held_at', cutoff.toISOString());

  if (!escrows?.length) return NextResponse.json({ released: 0 });

  let released = 0;
  const errors: string[] = [];

  for (const escrow of escrows) {
    try {
      await releaseSingleEscrow(escrow.id, escrow.payee_user_id, escrow.net_amount_cents);
      released++;
    } catch (err) {
      errors.push(`${escrow.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ released, errors });
}

async function releaseSingle(escrowId: string) {
  const { data: escrow } = await supabaseAdmin
    .from('escrow_payments')
    .select('id, payee_user_id, net_amount_cents, status')
    .eq('id', escrowId)
    .single();

  if (!escrow) return NextResponse.json({ error: 'Escrow no encontrado' }, { status: 404 });
  if (escrow.status !== 'held') return NextResponse.json({ error: 'El escrow no está en estado held' }, { status: 400 });

  await releaseSingleEscrow(escrow.id, escrow.payee_user_id, escrow.net_amount_cents);
  return NextResponse.json({ released: 1 });
}

async function releaseSingleEscrow(
  escrowId: string,
  payeeUserId: string,
  netCents: number,
) {
  // Obtener la cuenta Connect del creador
  const { data: mu } = await supabaseAdmin
    .from('marketplace_users')
    .select('stripe_connect_id, stripe_connect_onboarded, display_name')
    .eq('id', payeeUserId)
    .single();

  if (!mu?.stripe_connect_id || !mu.stripe_connect_onboarded) {
    // Sin cuenta Connect: marcar como released y dejar saldo pendiente de transferencia manual
    await supabaseAdmin
      .from('escrow_payments')
      .update({ status: 'released', released_at: new Date().toISOString(), transfer_reference: 'manual_pending' })
      .eq('id', escrowId);

    await createPayoutInvoice(escrowId, payeeUserId, netCents);
    return;
  }

  // Crear transferencia Stripe
  const transfer = await stripe.transfers.create({
    amount: netCents,
    currency: 'eur',
    destination: mu.stripe_connect_id,
    metadata: { escrow_id: escrowId, connectly_user_id: payeeUserId },
  });

  await supabaseAdmin
    .from('escrow_payments')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
      transfer_reference: transfer.id,
    })
    .eq('id', escrowId);

  await createPayoutInvoice(escrowId, payeeUserId, netCents);
}

async function createPayoutInvoice(escrowId: string, userId: string, netCents: number) {
  // Número de factura correlativo
  const year = new Date().getFullYear();
  const { data: last } = await supabaseAdmin
    .from('invoices')
    .select('invoice_number')
    .ilike('invoice_number', `CNX-${year}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastSeq = last ? parseInt(last.invoice_number.split('-')[2] ?? '0') : 0;
  const invoiceNum = `CNX-${year}-${String(lastSeq + 1).padStart(4, '0')}`;

  await supabaseAdmin.from('invoices').insert({
    invoice_number: invoiceNum,
    user_id: userId,
    escrow_id: escrowId,
    type: 'payout',
    amount_cents: netCents,
    tax_rate: 0, // el creador recibe neto — IVA se gestiona por su cuenta
    tax_amount_cents: 0,
    total_cents: netCents,
  });
}
